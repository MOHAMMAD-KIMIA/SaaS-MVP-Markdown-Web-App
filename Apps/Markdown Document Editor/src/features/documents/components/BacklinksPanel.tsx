// src/features/documents/components/BacklinksPanel.tsx
import React, { useMemo } from 'react';
import {
  Link2,
  FileText,
  ArrowRight,
  Network,
} from 'lucide-react';
import { useDocumentStore } from '../../../stores/documentStore';
import { useUIStore } from '../../../stores/uiStore';
import { cn } from '../../../lib/utils/cn';
import { formatRelativeTime } from '../../../lib/utils/dates';

interface BacklinkReference {
  documentId: string;
  documentTitle: string;
  updatedAt: string;
  excerpt: string;
  highlightTerm: string;
}

interface BacklinksPanelProps {
  onSelectDocument?: (id: string) => void;
  className?: string;
}

export function BacklinksPanel({ onSelectDocument, className }: BacklinksPanelProps) {
  const { documents, activeDocumentId, openDocument } = useDocumentStore();
  const activeDoc = documents.find((d) => d.id === activeDocumentId);

  const backlinks = useMemo(() => {
    if (!activeDoc || !activeDoc.title) return [];

    const activeTitle = activeDoc.title.trim();
    if (!activeTitle) return [];

    const titleLower = activeTitle.toLowerCase();
    const wikiPattern = new RegExp(`\\[\\[${escapeRegex(activeTitle)}\\]\\]`, 'i');

    const results: BacklinkReference[] = [];

    documents.forEach((doc) => {
      if (doc.id === activeDoc.id) return; // Don't link to self

      const content = doc.content || '';
      const contentLower = content.toLowerCase();

      // Check for exact [[Title]] link or plain title mention
      const hasWikiLink = wikiPattern.test(content);
      const plainIndex = contentLower.indexOf(titleLower);

      if (hasWikiLink || plainIndex !== -1) {
        // Extract excerpt around mention
        let mentionStart = plainIndex !== -1 ? plainIndex : 0;
        if (hasWikiLink) {
          const match = content.match(wikiPattern);
          if (match && match.index !== undefined) {
            mentionStart = match.index;
          }
        }

        const snippetStart = Math.max(0, mentionStart - 45);
        const snippetEnd = Math.min(
          content.length,
          mentionStart + activeTitle.length + 55
        );
        let excerpt = content.substring(snippetStart, snippetEnd).trim();

        if (snippetStart > 0) excerpt = '...' + excerpt;
        if (snippetEnd < content.length) excerpt = excerpt + '...';

        results.push({
          documentId: doc.id,
          documentTitle: doc.title,
          updatedAt: doc.updatedAt,
          excerpt: excerpt.replace(/\n+/g, ' '),
          highlightTerm: activeTitle,
        });
      }
    });

    return results;
  }, [documents, activeDoc]);

  const handleOpenDoc = (id: string) => {
    openDocument(id);
    onSelectDocument?.(id);
  };

  if (!activeDoc) return null;

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      <div className="flex items-center justify-between border-b px-4 py-3 shrink-0 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Link2 className="h-3.5 w-3.5" />
          </div>
          <span className="font-semibold text-sm">Linked References</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => useUIStore.getState().openKnowledgeGraph()}
            title="Open Interactive Knowledge Graph"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Network className="h-3 w-3 text-primary" />
            <span>Graph</span>
          </button>
          <span className="rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 font-mono text-xs px-2 py-0.5 font-medium tabular-nums">
            {backlinks.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
        {backlinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
              <Link2 className="h-5 w-5 opacity-40" />
            </div>
            <p className="font-medium text-xs text-foreground">No references found</p>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px]">
              Use <code className="text-purple-600 dark:text-purple-400 font-mono">[[{activeDoc.title}]]</code> in other notes to create bi-directional links.
            </p>
          </div>
        ) : (
          backlinks.map((link) => (
            <div
              key={link.documentId}
              onClick={() => handleOpenDoc(link.documentId)}
              className="group cursor-pointer rounded-lg border border-border/70 bg-card p-3 hover:border-purple-500/40 hover:bg-muted/40 transition-all shadow-2xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{link.documentTitle}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>

              <div className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed bg-muted/30 p-2 rounded border border-border/30 font-mono">
                {renderHighlightedExcerpt(link.excerpt, link.highlightTerm)}
              </div>

              <div className="text-[10px] text-muted-foreground/80 flex items-center gap-1">
                <span>Updated {formatRelativeTime(link.updatedAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderHighlightedExcerpt(excerpt: string, term: string) {
  if (!term) return excerpt;
  const parts = excerpt.split(new RegExp(`(${escapeRegex(term)})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <mark
        key={i}
        className="bg-purple-200 dark:bg-purple-900/60 text-purple-900 dark:text-purple-100 font-semibold px-0.5 rounded-2xs"
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
