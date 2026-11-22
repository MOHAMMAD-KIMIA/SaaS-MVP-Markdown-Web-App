// src/features/graph/components/KnowledgeGraphModal.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Network,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  FolderOpen,
  Tag,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  ExternalLink,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../app/components/ui/dialog';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import { useUIStore } from '../../../stores/uiStore';
import { useDocumentStore } from '../../../stores/documentStore';
import { buildKnowledgeGraph, GraphNode } from '../../../lib/markdown/knowledgeGraph';
import { desktop } from '../../../lib/desktop/bridge';
import { cn } from '../../../lib/utils/cn';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 580;

type ConnectionFilter = 'all' | 'connected' | 'orphans';

export function KnowledgeGraphModal() {
  const isOpen = useUIStore((s) => s.isKnowledgeGraphOpen);
  const closeKnowledgeGraph = useUIStore((s) => s.closeKnowledgeGraph);
  const { documents, activeDocumentId, openDocument, createDocument } = useDocumentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('__all__');
  const [selectedTag, setSelectedTag] = useState<string>('__all__');
  const [connectionFilter, setConnectionFilter] = useState<ConnectionFilter>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Interactive positions, pan & zoom
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragStateRef = useRef<{
    type: 'node' | 'pan';
    nodeId?: string;
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const graph = useMemo(
    () => buildKnowledgeGraph(documents, CANVAS_WIDTH, CANVAS_HEIGHT),
    [documents]
  );

  // Reset layout positions & active selection when opened or documents graph structure updates
  useEffect(() => {
    if (!isOpen) return;
    const initial: Record<string, { x: number; y: number }> = {};
    for (const node of graph.nodes) {
      initial[node.id] = { x: node.x, y: node.y };
    }
    setNodePositions(initial);
    if (activeDocumentId && graph.nodes.some((n) => n.id === `doc:${activeDocumentId}`)) {
      setSelectedNodeId(`doc:${activeDocumentId}`);
    } else {
      setSelectedNodeId(graph.nodes[0]?.id || null);
    }
  }, [isOpen, graph.nodes, activeDocumentId]);

  const filteredNodes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return graph.nodes.filter((node) => {
      if (q && !node.title.toLowerCase().includes(q) && !node.tags.some((t) => t.toLowerCase().includes(q))) {
        return false;
      }
      if (selectedFolder !== '__all__' && node.folder !== selectedFolder) {
        return false;
      }
      if (selectedTag !== '__all__' && !node.tags.includes(selectedTag)) {
        return false;
      }
      if (connectionFilter === 'orphans' && !node.isOrphan) {
        return false;
      }
      if (connectionFilter === 'connected' && node.isOrphan) {
        return false;
      }
      return true;
    });
  }, [graph.nodes, searchQuery, selectedFolder, selectedTag, connectionFilter]);

  const visibleNodeIds = useMemo(
    () => new Set(filteredNodes.map((n) => n.id)),
    [filteredNodes]
  );

  const filteredEdges = useMemo(
    () =>
      graph.edges.filter(
        (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
      ),
    [graph.edges, visibleNodeIds]
  );

  const focusNodeId = hoveredNodeId || selectedNodeId;
  const neighborIds = useMemo(() => {
    const set = new Set<string>();
    if (!focusNodeId) return set;
    set.add(focusNodeId);
    for (const edge of filteredEdges) {
      if (edge.source === focusNodeId) set.add(edge.target);
      if (edge.target === focusNodeId) set.add(edge.source);
    }
    return set;
  }, [focusNodeId, filteredEdges]);

  const selectedNode: GraphNode | undefined = useMemo(
    () => graph.nodes.find((n) => n.id === selectedNodeId),
    [graph.nodes, selectedNodeId]
  );

  const selectedNodeLinks = useMemo(() => {
    if (!selectedNode) return { inbound: [] as GraphNode[], outbound: [] as GraphNode[] };
    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
    const inbound: GraphNode[] = [];
    const outbound: GraphNode[] = [];
    for (const edge of graph.edges) {
      if (edge.target === selectedNode.id) {
        const src = nodeMap.get(edge.source);
        if (src) inbound.push(src);
      }
      if (edge.source === selectedNode.id) {
        const dst = nodeMap.get(edge.target);
        if (dst) outbound.push(dst);
      }
    }
    return { inbound, outbound };
  }, [selectedNode, graph.nodes, graph.edges]);

  const handleOpenGraphNode = (node: GraphNode) => {
    if (node.exists && node.documentId) {
      openDocument(node.documentId);
      closeKnowledgeGraph();
      desktop.showNotification('Opened Note', `Switched to "${node.title}"`);
    } else {
      const newId = createDocument(node.title, `# ${node.title}\n\n`);
      openDocument(newId);
      closeKnowledgeGraph();
      desktop.showNotification('Created Note', `Created "${node.title}" from WikiLink`);
    }
  };

  const handlePointerDownNode = (e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    const pos = nodePositions[nodeId] || { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
    dragStateRef.current = {
      type: 'node',
      nodeId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originX: pos.x,
      originY: pos.y,
      moved: false,
    };
  };

  const handlePointerDownCanvas = (e: React.PointerEvent) => {
    dragStateRef.current = {
      type: 'pan',
      startClientX: e.clientX,
      startClientY: e.clientY,
      originX: pan.x,
      originY: pan.y,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragStateRef.current;
    if (!drag) return;

    const dx = e.clientX - drag.startClientX;
    const dy = e.clientY - drag.startClientY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      drag.moved = true;
    }

    if (drag.type === 'node' && drag.nodeId) {
      const svgRect = svgRef.current?.getBoundingClientRect();
      const scaleX = svgRect ? CANVAS_WIDTH / svgRect.width : 1;
      const scaleY = svgRect ? CANVAS_HEIGHT / svgRect.height : 1;
      const deltaX = (dx * scaleX) / zoom;
      const deltaY = (dy * scaleY) / zoom;

      setNodePositions((prev) => ({
        ...prev,
        [drag.nodeId!]: {
          x: Math.max(30, Math.min(CANVAS_WIDTH - 30, drag.originX + deltaX)),
          y: Math.max(30, Math.min(CANVAS_HEIGHT - 30, drag.originY + deltaY)),
        },
      }));
    } else if (drag.type === 'pan') {
      setPan({ x: drag.originX + dx, y: drag.originY + dy });
    }
  };

  const handlePointerUp = () => {
    dragStateRef.current = null;
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    const resetPos: Record<string, { x: number; y: number }> = {};
    for (const n of graph.nodes) {
      resetPos[n.id] = { x: n.x, y: n.y };
    }
    setNodePositions(resetPos);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeKnowledgeGraph()}>
      <DialogContent className="max-w-6xl w-[95vw] h-[86vh] p-0 flex flex-col overflow-hidden gap-0">
        <DialogHeader className="px-5 py-3.5 border-b border-border shrink-0 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/40 text-primary shrink-0">
              <Network className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold tracking-tight">
                Knowledge Graph
              </DialogTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
                <span>{filteredNodes.length} notes</span>
                <span aria-hidden="true">·</span>
                <span>{filteredEdges.length} links</span>
                <span aria-hidden="true">·</span>
                <span>{graph.orphanCount} orphan{graph.orphanCount === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Filter & Navigation Bar */}
        <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter notes or tags..."
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-1 p-0.5 rounded-lg border border-border bg-muted/50">
            {(['all', 'connected', 'orphans'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setConnectionFilter(mode)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0',
                  connectionFilter === mode
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {mode === 'all' ? 'All' : mode === 'connected' ? 'Connected' : `Orphans (${graph.orphanCount})`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              aria-label="Filter by folder"
              className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="__all__">All folders</option>
              {graph.folders.map((folder) => (
                <option key={folder} value={folder}>
                  {folder}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              aria-label="Filter by tag"
              className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="__all__">All tags</option>
              {graph.tags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setZoom((z) => Math.max(0.45, Number((z - 0.15).toFixed(2))))}
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-mono tabular-nums text-muted-foreground w-11 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setZoom((z) => Math.min(2.4, Number((z + 0.15).toFixed(2))))}
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 px-2.5 text-xs gap-1"
              onClick={handleResetView}
              title="Reset Graph Layout"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </Button>
          </div>
        </div>

        {/* Main Graph Canvas + Inspector */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          <div
            className="flex-1 min-h-0 relative bg-background overflow-hidden select-none cursor-grab active:cursor-grabbing"
            onPointerDown={handlePointerDownCanvas}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY < 0 ? 0.1 : -0.1;
              setZoom((z) => Math.max(0.45, Math.min(2.4, Number((z + delta).toFixed(2)))));
            }}
          >
            {filteredNodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Network className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-foreground">No matching notes in graph</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Clear your folder, tag, or search filters—or link documents using{' '}
                  <code className="font-mono text-primary">[[Note Title]]</code> syntax.
                </p>
              </div>
            ) : (
              <svg
                ref={svgRef}
                viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
                className="w-full h-full"
              >
                <defs>
                  <marker
                    id="kg-arrow"
                    viewBox="0 0 10 10"
                    refX="19"
                    refY="5"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" className="fill-muted-foreground/50" />
                  </marker>
                  <marker
                    id="kg-arrow-active"
                    viewBox="0 0 10 10"
                    refX="19"
                    refY="5"
                    markerWidth="5.5"
                    markerHeight="5.5"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" className="fill-primary" />
                  </marker>
                </defs>

                <g
                  transform={`translate(${pan.x + (CANVAS_WIDTH * (1 - zoom)) / 2}, ${pan.y + (CANVAS_HEIGHT * (1 - zoom)) / 2}) scale(${zoom})`}
                >
                  {/* Edges */}
                  {filteredEdges.map((edge) => {
                    const src = nodePositions[edge.source];
                    const dst = nodePositions[edge.target];
                    if (!src || !dst) return null;
                    const isFocused =
                      focusNodeId === edge.source || focusNodeId === edge.target;
                    const isDimmed = Boolean(focusNodeId) && !isFocused;

                    return (
                      <line
                        key={edge.id}
                        x1={src.x}
                        y1={src.y}
                        x2={dst.x}
                        y2={dst.y}
                        strokeWidth={isFocused ? 2 : 1.25}
                        markerEnd={isFocused ? 'url(#kg-arrow-active)' : 'url(#kg-arrow)'}
                        className={cn(
                          'transition-opacity duration-150',
                          isFocused
                            ? 'stroke-primary opacity-90'
                            : isDimmed
                              ? 'stroke-border opacity-20'
                              : 'stroke-muted-foreground/40 opacity-75'
                        )}
                      />
                    );
                  })}

                  {/* Nodes */}
                  {filteredNodes.map((node) => {
                    const pos = nodePositions[node.id] || { x: node.x, y: node.y };
                    const isActiveDoc = node.documentId === activeDocumentId;
                    const isSelected = selectedNodeId === node.id;
                    const isNeighbor = neighborIds.has(node.id);
                    const isDimmed = Boolean(focusNodeId) && !isNeighbor;

                    const degree = node.inboundCount + node.outboundCount;
                    const radius = Math.min(20, 9 + degree * 1.8);

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onPointerDown={(e) => handlePointerDownNode(e, node.id)}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNodeId(node.id);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleOpenGraphNode(node);
                        }}
                        className={cn(
                          'cursor-pointer transition-opacity duration-150',
                          isDimmed && 'opacity-25'
                        )}
                      >
                        {isSelected && (
                          <circle
                            r={radius + 5}
                            className="fill-none stroke-primary/50"
                            strokeWidth={2}
                          />
                        )}
                        <circle
                          r={radius}
                          strokeWidth={node.exists ? 2 : 1.5}
                          strokeDasharray={node.exists ? undefined : '3 2'}
                          className={cn(
                            'transition-colors',
                            !node.exists
                              ? 'fill-muted stroke-muted-foreground/60'
                              : isActiveDoc
                                ? 'fill-primary stroke-primary-foreground/60'
                                : node.isOrphan
                                  ? 'fill-amber-500/85 stroke-amber-700 dark:stroke-amber-300'
                                  : 'fill-indigo-500/85 stroke-indigo-700 dark:stroke-indigo-300'
                          )}
                        />
                        <text
                          y={radius + 14}
                          textAnchor="middle"
                          className={cn(
                            'text-[11px] font-medium pointer-events-none select-none fill-foreground',
                            isSelected && 'font-semibold fill-primary'
                          )}
                        >
                          {node.title.length > 22
                            ? `${node.title.slice(0, 21)}…`
                            : node.title}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            )}

            {/* Compact Legend */}
            <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background/90 backdrop-blur-xs px-3 py-1.5 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                Active
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                Connected
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Orphan
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border border-dashed border-muted-foreground bg-muted" />
                Uncreated
              </span>
              <span className="hidden sm:inline text-muted-foreground/70">
                Click to inspect · Double-click to open · Drag nodes
              </span>
            </div>
          </div>

          {/* Right Node Inspector */}
          <aside className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border bg-muted/10 p-4 flex flex-col justify-between gap-4 overflow-y-auto shrink-0 max-h-[34vh] lg:max-h-none">
            {selectedNode ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{selectedNode.folder}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {selectedNode.exists ? `${selectedNode.wordCount} words` : 'Not created'}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground break-words">
                    {selectedNode.title}
                  </h3>
                  {selectedNode.isOrphan && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 pt-0.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>Orphan note (no inbound or outbound WikiLinks)</span>
                    </div>
                  )}
                  {selectedNode.tags.length > 0 && (
                    <div className="text-xs text-muted-foreground pt-1">
                      {selectedNode.tags.map((t) => `#${t}`).join(' · ')}
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => handleOpenGraphNode(selectedNode)}
                >
                  {selectedNode.exists ? (
                    <>
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Open Document</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create &amp; Open Note</span>
                    </>
                  )}
                </Button>

                <div className="space-y-2 border-t border-border pt-3">
                  <div className="flex items-center justify-between text-xs font-medium text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                      Outbound Links
                    </span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {selectedNodeLinks.outbound.length}
                    </span>
                  </div>
                  {selectedNodeLinks.outbound.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No outgoing WikiLinks.</p>
                  ) : (
                    <div className="space-y-1">
                      {selectedNodeLinks.outbound.map((target) => (
                        <button
                          key={target.id}
                          type="button"
                          onClick={() => handleOpenGraphNode(target)}
                          className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border border-border/60 bg-background hover:bg-muted text-left text-xs transition-colors"
                        >
                          <span className="flex items-center gap-1.5 min-w-0">
                            <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{target.title}</span>
                          </span>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {target.exists ? 'Open' : 'Create'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t border-border pt-3">
                  <div className="flex items-center justify-between text-xs font-medium text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <ArrowDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
                      Backlinks
                    </span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {selectedNodeLinks.inbound.length}
                    </span>
                  </div>
                  {selectedNodeLinks.inbound.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No notes link to this document yet.</p>
                  ) : (
                    <div className="space-y-1">
                      {selectedNodeLinks.inbound.map((src) => (
                        <button
                          key={src.id}
                          type="button"
                          onClick={() => handleOpenGraphNode(src)}
                          className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border border-border/60 bg-background hover:bg-muted text-left text-xs transition-colors"
                        >
                          <span className="flex items-center gap-1.5 min-w-0">
                            <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{src.title}</span>
                          </span>
                          <span className="text-[11px] text-muted-foreground shrink-0">Open</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Select any node in the graph to inspect its connections.
              </div>
            )}
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
