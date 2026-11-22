// src/lib/markdown/knowledgeGraph.ts
import type { Document } from '../../types/common.types';
import { parseFrontmatter } from './frontmatter';

export interface GraphNode {
  id: string;
  documentId?: string;
  title: string;
  exists: boolean;
  tags: string[];
  folder: string;
  inboundCount: number;
  outboundCount: number;
  isOrphan: boolean;
  wordCount: number;
  updatedAt?: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  count: number;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  folders: string[];
  tags: string[];
  orphanCount: number;
}

function normalizeTitleKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeSlugKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '');
}

/**
 * Extracts [[WikiLink]] target titles outside fenced code blocks and inline code.
 */
export function extractWikiLinkTargets(markdown: string): string[] {
  if (!markdown) return [];
  const withoutCode = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
    .replace(/`[^`\r\n]+`/g, '');

  const targets: string[] = [];
  const regex = /\[\[([^\]]+)\]\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(withoutCode)) !== null) {
    const raw = match[1].split('|')[0].split('#')[0].trim();
    if (raw) targets.push(raw);
  }
  return targets;
}

export function buildKnowledgeGraph(
  documents: Document[],
  width = 860,
  height = 560
): KnowledgeGraphData {
  const nodesMap = new Map<string, GraphNode>();
  const keyToNodeId = new Map<string, string>();
  const edgesMap = new Map<string, GraphEdge>();

  const foldersSet = new Set<string>();
  const tagsSet = new Set<string>();

  // 1. Register all existing workspace documents
  for (const doc of documents) {
    const fm = parseFrontmatter(doc.content || '');
    const folder = fm.folder || doc.folderId || 'Workspace';
    const tags = fm.tags;
    const wordCount = fm.body.trim() ? fm.body.trim().split(/\s+/).length : 0;

    foldersSet.add(folder);
    tags.forEach((t) => tagsSet.add(t));

    const nodeId = `doc:${doc.id}`;
    nodesMap.set(nodeId, {
      id: nodeId,
      documentId: doc.id,
      title: doc.title || 'Untitled Document',
      exists: true,
      tags,
      folder,
      inboundCount: 0,
      outboundCount: 0,
      isOrphan: true,
      wordCount,
      updatedAt: doc.updatedAt,
      x: width / 2,
      y: height / 2,
    });

    keyToNodeId.set(normalizeTitleKey(doc.title), nodeId);
    const slug = normalizeSlugKey(doc.title);
    if (slug) keyToNodeId.set(slug, nodeId);
  }

  // 2. Extract WikiLink edges and unresolved target nodes
  for (const doc of documents) {
    const sourceId = `doc:${doc.id}`;
    const targets = extractWikiLinkTargets(doc.content || '');

    for (const rawTarget of targets) {
      const titleKey = normalizeTitleKey(rawTarget);
      const slugKey = normalizeSlugKey(rawTarget);
      let targetId = keyToNodeId.get(titleKey) || keyToNodeId.get(slugKey);

      if (!targetId) {
        targetId = `missing:${slugKey || titleKey}`;
        if (!nodesMap.has(targetId)) {
          nodesMap.set(targetId, {
            id: targetId,
            title: rawTarget,
            exists: false,
            tags: [],
            folder: 'Uncreated',
            inboundCount: 0,
            outboundCount: 0,
            isOrphan: false,
            wordCount: 0,
            x: width / 2,
            y: height / 2,
          });
          keyToNodeId.set(titleKey, targetId);
          if (slugKey) keyToNodeId.set(slugKey, targetId);
        }
      }

      if (targetId === sourceId) continue;

      const edgeId = `${sourceId}->${targetId}`;
      const existingEdge = edgesMap.get(edgeId);
      if (existingEdge) {
        existingEdge.count += 1;
      } else {
        edgesMap.set(edgeId, {
          id: edgeId,
          source: sourceId,
          target: targetId,
          count: 1,
        });
      }
    }
  }

  // 3. Tally degree counts & orphan status
  for (const edge of edgesMap.values()) {
    const src = nodesMap.get(edge.source);
    const dst = nodesMap.get(edge.target);
    if (src) src.outboundCount += 1;
    if (dst) dst.inboundCount += 1;
  }

  const nodes = Array.from(nodesMap.values()).map((node) => ({
    ...node,
    isOrphan: node.exists && node.inboundCount === 0 && node.outboundCount === 0,
  }));

  const edges = Array.from(edgesMap.values());

  // 4. Deterministic circular init + lightweight force-directed layout
  const cx = width / 2;
  const cy = height / 2;
  const initRadius = Math.min(width, height) * 0.34;
  nodes.forEach((node, idx) => {
    const angle = (idx / Math.max(1, nodes.length)) * Math.PI * 2 - Math.PI / 2;
    const jitter = node.isOrphan ? 1.12 : 0.85;
    node.x = cx + Math.cos(angle) * initRadius * jitter;
    node.y = cy + Math.sin(angle) * initRadius * jitter;
  });

  if (nodes.length > 1) {
    const nodeIndex = new Map<string, number>();
    nodes.forEach((n, i) => nodeIndex.set(n.id, i));
    const vx = new Float64Array(nodes.length);
    const vy = new Float64Array(nodes.length);

    const iterations = 120;
    const repulsion = 3600;
    const springLength = 135;
    const springStrength = 0.045;
    const centerGravity = 0.018;

    for (let iter = 0; iter < iterations; iter++) {
      // Repulsion between all pairs
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distSq = Math.max(64, dx * dx + dy * dy);
          const dist = Math.sqrt(distSq);
          const force = repulsion / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          vx[i] += fx;
          vy[i] += fy;
          vx[j] -= fx;
          vy[j] -= fy;
        }
      }

      // Spring attraction along edges
      for (const edge of edges) {
        const si = nodeIndex.get(edge.source);
        const ti = nodeIndex.get(edge.target);
        if (si === undefined || ti === undefined) continue;
        const dx = nodes[ti].x - nodes[si].x;
        const dy = nodes[ti].y - nodes[si].y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const delta = dist - springLength;
        const force = delta * springStrength;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        vx[si] += fx;
        vy[si] += fy;
        vx[ti] -= fx;
        vy[ti] -= fy;
      }

      // Gravity toward center & damping
      for (let i = 0; i < nodes.length; i++) {
        vx[i] = (vx[i] + (cx - nodes[i].x) * centerGravity) * 0.78;
        vy[i] = (vy[i] + (cy - nodes[i].y) * centerGravity) * 0.78;
        nodes[i].x = Math.max(56, Math.min(width - 56, nodes[i].x + vx[i]));
        nodes[i].y = Math.max(56, Math.min(height - 56, nodes[i].y + vy[i]));
      }
    }
  }

  return {
    nodes,
    edges,
    folders: Array.from(foldersSet).sort((a, b) => a.localeCompare(b)),
    tags: Array.from(tagsSet).sort((a, b) => a.localeCompare(b)),
    orphanCount: nodes.filter((n) => n.isOrphan).length,
  };
}
