// src/features/editor/components/TableOfContentsSidebar.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  ListTree,
  Search,
  X,
} from 'lucide-react';
import { useUIStore } from '../../../stores/uiStore';
import { useDocumentStore } from '../../../stores/documentStore';
import { useEditorStore } from '../../../stores/editorStore';
import {
  buildMarkdownToc,
  findActiveHeadingId,
  type OutlineHeading,
  parseMarkdownOutline,
} from '../../../lib/markdown/outline';
import { ScrollArea } from '../../../app/components/ui/scroll-area';
import { Input } from '../../../app/components/ui/input';
import { copyToClipboard } from '../../../lib/utils/clipboard';
import { desktop } from '../../../lib/desktop/bridge';
import { cn } from '../../../lib/utils/cn';

interface TableOfContentsSidebarProps {
  activePreviewHeadingIndex?: number | null;
}

type DepthFilter = 6 | 3 | 2;

const LEVEL_BADGE_STYLES: Record<number, string> = {
  1: 'bg-primary text-primary-foreground',
  2: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  3: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  4: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  5: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  6: 'bg-muted text-muted-foreground',
};

export function TableOfContentsSidebar({
  activePreviewHeadingIndex = null,
}: TableOfContentsSidebarProps) {
  const isOpen = useUIStore((s) => s.isTableOfContentsOpen);
  const closeTableOfContents = useUIStore((s) => s.closeTableOfContents);
  const activeDoc = useDocumentStore((s) => s.getActiveDocument());
  const cursorOffset = useEditorStore((s) => s.cursorOffset);
  const editorMode = useEditorStore((s) => s.editorMode);

  const [filterText, setFilterText] = useState('');
  const [maxDepth, setMaxDepth] = useState<DepthFilter>(6);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const [copiedToc, setCopiedToc] = useState(false);

  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  const content = activeDoc?.content || '';
  const headings = useMemo(() => parseMarkdownOutline(content), [content]);

  // Reset collapsed state & search when switching active document
  useEffect(() => {
    setCollapsedIds(new Set());
    setFilterText('');
  }, [activeDoc?.id]);

  // Close on Escape on narrow overlay viewports when no modal is open
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (window.innerWidth >= 1280) return;
      const ui = useUIStore.getState();
      if (
        ui.isCommandPaletteOpen ||
        ui.isSearchPanelOpen ||
        ui.isExportModalOpen ||
        ui.isTemplatePickerOpen ||
        ui.isHistoryPanelOpen ||
        ui.isTableBuilderOpen ||
        ui.isImportBackupModalOpen ||
        ui.isKnowledgeGraphOpen ||
        ui.isAssetManagerOpen ||
        ui.isPresentationOpen
      ) {
        return;
      }
      closeTableOfContents();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeTableOfContents]);

  const activeHeadingId = useMemo(() => {
    if (headings.length === 0) return null;
    if (editorMode === 'preview' && activePreviewHeadingIndex !== null) {
      return headings[activePreviewHeadingIndex]?.id ?? headings[0]?.id ?? null;
    }
    const byCursor = findActiveHeadingId(headings, cursorOffset);
    if (byCursor) return byCursor;
    if (activePreviewHeadingIndex !== null) {
      return headings[activePreviewHeadingIndex]?.id ?? null;
    }
    return headings[0]?.id ?? null;
  }, [headings, editorMode, activePreviewHeadingIndex, cursorOffset]);

  // Auto-keep active TOC entry visible when navigating
  useEffect(() => {
    if (!isOpen || !activeHeadingId) return;
    activeItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, activeHeadingId]);

  const minLevel = useMemo(() => {
    if (headings.length === 0) return 1;
    return Math.min(...headings.map((h) => h.level));
  }, [headings]);

  const hasDeepHeadings = useMemo(
    () => headings.some((h) => h.level > 2),
    [headings]
  );

  const visibleHeadings = useMemo(() => {
    const query = filterText.trim().toLowerCase();
    const depthFiltered = headings.filter((h) => h.level <= maxDepth);

    if (query) {
      return depthFiltered.filter((h) => h.title.toLowerCase().includes(query));
    }

    const byId = new Map(headings.map((h) => [h.id, h]));
    return depthFiltered.filter((h) => {
      let pid = h.parentId;
      while (pid) {
        if (collapsedIds.has(pid)) return false;
        pid = byId.get(pid)?.parentId ?? null;
      }
      return true;
    });
  }, [headings, maxDepth, filterText, collapsedIds]);

  const collapsibleIds = useMemo(
    () =>
      headings
        .filter((h) => h.hasChildren && h.level < maxDepth)
        .map((h) => h.id),
    [headings, maxDepth]
  );

  const areAllCollapsed =
    collapsibleIds.length > 0 && collapsibleIds.every((id) => collapsedIds.has(id));

  if (!isOpen) return null;

  const handleToggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleCollapseAll = () => {
    if (areAllCollapsed) {
      setCollapsedIds(new Set());
    } else {
      setCollapsedIds(new Set(collapsibleIds));
    }
  };

  const handleCopyToc = async () => {
    const markdownToc = buildMarkdownToc(headings);
    if (!markdownToc) return;
    const ok = await copyToClipboard(markdownToc);
    if (ok) {
      setCopiedToc(true);
      setTimeout(() => setCopiedToc(false), 1800);
      desktop.showNotification(
        'Table of Contents Copied',
        `Copied ${headings.length} heading link${headings.length === 1 ? '' : 's'} as Markdown.`
      );
    }
  };

  const handleJumpTo = (heading: OutlineHeading) => {
    window.dispatchEvent(
      new CustomEvent('editor-jump-range', {
        detail: {
          start: heading.startOffset,
          end: heading.startOffset,
        },
      })
    );
    window.dispatchEvent(
      new CustomEvent('preview-jump-heading', {
        detail: {
          ordinal: heading.ordinal,
          slug: heading.slug,
          title: heading.title,
        },
      })
    );
    if (window.innerWidth < 1280) {
      closeTableOfContents();
    }
  };

  const activeHeading = headings.find((h) => h.id === activeHeadingId) || null;

  return (
    <>
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs z-30 xl:hidden"
        onClick={closeTableOfContents}
      />
      <aside
        aria-label="Table of Contents"
        className="absolute xl:relative inset-y-0 right-0 z-40 xl:z-auto flex h-full w-72 max-w-[88vw] flex-col border-l border-border bg-background shrink-0 overflow-hidden shadow-2xl xl:shadow-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-muted/20 shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ListTree className="h-4 w-4 text-primary shrink-0" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground truncate">
              Table of Contents
            </h2>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground tabular-nums shrink-0">
              {headings.length}
            </span>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {headings.length > 0 && (
              <button
                type="button"
                onClick={handleCopyToc}
                title="Copy Markdown Table of Contents"
                aria-label="Copy Markdown Table of Contents"
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {copiedToc ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            )}

            {collapsibleIds.length > 0 && (
              <button
                type="button"
                onClick={handleToggleCollapseAll}
                title={areAllCollapsed ? 'Expand all sections' : 'Collapse all sections'}
                aria-label={areAllCollapsed ? 'Expand all sections' : 'Collapse all sections'}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {areAllCollapsed ? (
                  <ChevronsUpDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronsDownUp className="h-3.5 w-3.5" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={closeTableOfContents}
              aria-label="Close Table of Contents"
              title="Close Table of Contents (Alt+T)"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search & Depth Filter */}
        {headings.length > 0 && (
          <div className="border-b border-border/70 px-3 py-2 space-y-2 shrink-0 bg-muted/10">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Jump to section..."
                aria-label="Filter table of contents"
                className="h-7 pl-8 pr-7 text-xs bg-background"
              />
              {filterText && (
                <button
                  type="button"
                  onClick={() => setFilterText('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"
                  title="Clear filter"
                  aria-label="Clear filter"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {hasDeepHeadings && (
              <div className="flex items-center justify-between gap-1 text-[10px]">
                <span className="text-muted-foreground font-medium">Depth</span>
                <div className="inline-flex items-center gap-0.5 rounded-md bg-muted/80 p-0.5 border border-border/50">
                  {([
                    { value: 2 as DepthFilter, label: 'H1–H2' },
                    { value: 3 as DepthFilter, label: 'H1–H3' },
                    { value: 6 as DepthFilter, label: 'All' },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMaxDepth(opt.value)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
                        maxDepth === opt.value
                          ? 'bg-background text-foreground shadow-2xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Heading Tree */}
        <ScrollArea className="flex-1 min-h-0">
          <nav aria-label="Document headings" className="p-2 space-y-0.5">
            {!activeDoc ? (
              <div className="py-10 px-3 text-center text-xs text-muted-foreground">
                Open or create a document to view its Table of Contents.
              </div>
            ) : headings.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-2.5">
                <ListTree className="h-7 w-7 text-muted-foreground/40 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground/85">
                    No headers detected
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Add Markdown headers like <code className="font-mono text-foreground/80"># Title</code> or{' '}
                    <code className="font-mono text-foreground/80">## Section</code> to build a live Table of Contents.
                  </p>
                </div>
              </div>
            ) : visibleHeadings.length === 0 ? (
              <div className="py-8 px-3 text-center text-xs text-muted-foreground">
                {filterText.trim()
                  ? `No headers match "${filterText.trim()}".`
                  : 'No headers at the selected depth level.'}
              </div>
            ) : (
              visibleHeadings.map((heading) => {
                const isActive = heading.id === activeHeadingId;
                const isCollapsed = collapsedIds.has(heading.id);
                const depth = Math.max(0, heading.level - minLevel);
                const indentPx = depth * 12;
                const canCollapse =
                  heading.hasChildren &&
                  heading.level < maxDepth &&
                  !filterText.trim();

                return (
                  <div
                    key={heading.id}
                    className={cn(
                      'group relative flex items-center rounded-md transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted/80'
                    )}
                    style={{ paddingLeft: `${indentPx}px` }}
                  >
                    {depth > 0 && (
                      <span
                        aria-hidden="true"
                        className="absolute top-0 bottom-0 w-px bg-border/50"
                        style={{ left: `${indentPx - 6}px` }}
                      />
                    )}

                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary"
                      />
                    )}

                    {canCollapse ? (
                      <button
                        type="button"
                        onClick={(e) => handleToggleCollapse(heading.id, e)}
                        title={isCollapsed ? 'Expand subsections' : 'Collapse subsections'}
                        aria-label={isCollapsed ? `Expand ${heading.title}` : `Collapse ${heading.title}`}
                        className="ml-1 p-0.5 rounded hover:bg-background/80 text-muted-foreground shrink-0"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    ) : (
                      <span
                        className={cn(
                          'ml-1.5 rounded px-1 py-0.5 text-[9px] font-mono font-bold leading-none shrink-0',
                          LEVEL_BADGE_STYLES[heading.level]
                        )}
                      >
                        H{heading.level}
                      </span>
                    )}

                    <button
                      ref={isActive ? activeItemRef : undefined}
                      type="button"
                      onClick={() => handleJumpTo(heading)}
                      aria-current={isActive ? 'location' : undefined}
                      className={cn(
                        'flex-1 min-w-0 flex items-center gap-1.5 px-1.5 py-1.5 text-left text-xs transition-colors',
                        isActive
                          ? 'text-primary font-semibold'
                          : heading.level === 1
                            ? 'text-foreground font-medium'
                            : heading.level === 2
                              ? 'text-foreground/90'
                              : 'text-muted-foreground group-hover:text-foreground'
                      )}
                      title={`Line ${heading.lineIndex + 1}: ${heading.title}`}
                    >
                      <span className="truncate flex-1">{heading.title}</span>
                    </button>
                  </div>
                );
              })
            )}
          </nav>
        </ScrollArea>

        {/* Active Section Footer */}
        {headings.length > 0 && (
          <div className="border-t border-border/70 px-3 py-1.5 text-[10px] text-muted-foreground shrink-0 bg-muted/10 flex items-center justify-between gap-2">
            <span className="truncate">
              {activeHeading ? `Section: ${activeHeading.title}` : 'Click any header to jump'}
            </span>
            <span className="font-mono tabular-nums shrink-0">
              {headings.length} {headings.length === 1 ? 'header' : 'headers'}
            </span>
          </div>
        )}
      </aside>
    </>
  );
}
