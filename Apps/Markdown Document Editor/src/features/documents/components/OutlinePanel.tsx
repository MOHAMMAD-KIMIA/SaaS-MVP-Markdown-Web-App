import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  GripVertical,
  ListTree,
  Search,
  X,
} from 'lucide-react';
import { useDocumentStore } from '../../../stores/documentStore';
import { useEditorStore } from '../../../stores/editorStore';
import {
  findActiveHeadingId,
  type OutlineHeading,
  parseMarkdownOutline,
  reorderOutlineSection,
} from '../../../lib/markdown/outline';
import { Input } from '../../../app/components/ui/input';
import { ScrollArea } from '../../../app/components/ui/scroll-area';
import { cn } from '../../../lib/utils/cn';
import { desktop } from '../../../lib/desktop/bridge';

interface OutlinePanelProps {
  className?: string;
  onJumpToHeading?: () => void;
}

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-primary text-primary-foreground',
  2: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  3: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  4: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  5: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  6: 'bg-muted text-muted-foreground',
};

const MINIMAP_BAR_HEIGHTS: Record<number, string> = {
  1: 'h-5',
  2: 'h-4',
  3: 'h-3',
  4: 'h-2.5',
  5: 'h-2',
  6: 'h-1.5',
};

export function OutlinePanel({ className, onJumpToHeading }: OutlinePanelProps) {
  const activeDocumentId = useDocumentStore((s) => s.activeDocumentId);
  const documents = useDocumentStore((s) => s.documents);
  const updateDocumentContent = useDocumentStore((s) => s.updateDocumentContent);
  const cursorOffset = useEditorStore((s) => s.cursorOffset);

  const activeDoc = documents.find((d) => d.id === activeDocumentId);
  const content = activeDoc?.content || '';

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const [filterText, setFilterText] = useState('');
  const [isMinimapOpen, setIsMinimapOpen] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    position: 'before' | 'after';
  } | null>(null);

  const headings = useMemo(() => parseMarkdownOutline(content), [content]);
  const activeHeadingId = useMemo(
    () => findActiveHeadingId(headings, cursorOffset),
    [headings, cursorOffset]
  );

  // Determine which headings are hidden due to an ancestor being collapsed
  const visibleHeadings = useMemo(() => {
    const query = filterText.trim().toLowerCase();
    if (query) {
      return headings.filter((h) => h.title.toLowerCase().includes(query));
    }

    const byId = new Map(headings.map((h) => [h.id, h]));
    return headings.filter((h) => {
      let pid = h.parentId;
      while (pid) {
        if (collapsedIds.has(pid)) return false;
        pid = byId.get(pid)?.parentId ?? null;
      }
      return true;
    });
  }, [headings, collapsedIds, filterText]);

  const collapsibleIds = useMemo(
    () => headings.filter((h) => h.hasChildren).map((h) => h.id),
    [headings]
  );

  const areAllCollapsed =
    collapsibleIds.length > 0 && collapsibleIds.every((id) => collapsedIds.has(id));

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
    onJumpToHeading?.();
  };

  const handleDragStart = (e: React.DragEvent, headingId: string) => {
    setDraggedId(headingId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', headingId);
  };

  const handleDragOver = (e: React.DragEvent, targetHeadingId: string) => {
    if (!draggedId || draggedId === targetHeadingId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isAfter = e.clientY - rect.top > rect.height / 2;
    setDropTarget({ id: targetHeadingId, position: isAfter ? 'after' : 'before' });
  };

  const handleDrop = (e: React.DragEvent, targetHeadingId: string) => {
    e.preventDefault();
    const sourceId = draggedId || e.dataTransfer.getData('text/plain');
    const position = dropTarget?.id === targetHeadingId ? dropTarget.position : 'after';

    setDraggedId(null);
    setDropTarget(null);

    if (!activeDoc || !sourceId || sourceId === targetHeadingId) return;

    const reordered = reorderOutlineSection(
      content,
      headings,
      sourceId,
      targetHeadingId,
      position
    );

    if (reordered === null) {
      desktop.showNotification(
        'Cannot Reorder',
        'A parent section cannot be dropped inside its own subsection.'
      );
      return;
    }

    updateDocumentContent(activeDoc.id, reordered);
  };

  if (!activeDoc) {
    return (
      <div className={cn('p-4 text-xs text-muted-foreground text-center', className)}>
        Select a document to view its outline and heading minimap.
      </div>
    );
  }

  const docLen = Math.max(1, content.length);

  return (
    <div className={cn('flex flex-col h-full min-h-0 overflow-hidden', className)}>
      {/* Header & Search */}
      <div className="border-b px-2.5 py-2 space-y-2 shrink-0 bg-muted/20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <ListTree className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs font-semibold text-foreground truncate">
              Document Outline
            </span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground tabular-nums">
              {headings.length}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsMinimapOpen((v) => !v)}
              title={isMinimapOpen ? 'Hide Heading Minimap' : 'Show Heading Minimap'}
              className={cn(
                'px-1.5 py-1 rounded text-[10px] font-medium transition-colors',
                isMinimapOpen
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              Map
            </button>
            {collapsibleIds.length > 0 && (
              <button
                type="button"
                onClick={handleToggleCollapseAll}
                title={areAllCollapsed ? 'Expand all sections' : 'Collapse all sections'}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {areAllCollapsed ? (
                  <ChevronsUpDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronsDownUp className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {headings.length > 0 && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter headings..."
              className="h-7 pl-8 pr-7 text-xs bg-background"
            />
            {filterText && (
              <button
                type="button"
                onClick={() => setFilterText('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"
                title="Clear filter"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Heading Minimap Strip */}
      {isMinimapOpen && headings.length > 0 && (
        <div className="border-b px-3 py-2 shrink-0 bg-muted/10 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="font-medium uppercase tracking-wider">Heading Minimap</span>
            <span className="tabular-nums">
              {Math.round((cursorOffset / docLen) * 100)}%
            </span>
          </div>
          <div
            className="relative h-7 w-full rounded-md bg-muted/60 border border-border/50 px-1.5 flex items-end gap-[2px] overflow-hidden"
            title="Click any bar to jump to that heading"
          >
            {headings.map((h) => {
              const isActive = h.id === activeHeadingId;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => handleJumpTo(h)}
                  title={`H${h.level}: ${h.title}`}
                  className={cn(
                    'flex-1 min-w-[3px] max-w-[16px] rounded-t-xs transition-all hover:opacity-100',
                    MINIMAP_BAR_HEIGHTS[h.level] || 'h-2',
                    isActive
                      ? 'bg-primary opacity-100 shadow-xs'
                      : h.level === 1
                        ? 'bg-foreground/50 opacity-75 hover:bg-primary/80'
                        : h.level === 2
                          ? 'bg-foreground/35 opacity-70 hover:bg-primary/70'
                          : 'bg-foreground/25 opacity-60 hover:bg-primary/60'
                  )}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Collapsible Outline List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-0.5">
          {headings.length === 0 ? (
            <div className="py-10 px-3 text-center space-y-2">
              <ListTree className="h-7 w-7 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-medium text-foreground/80">No headings yet</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Add Markdown headings (<code className="font-mono"># Title</code>,{' '}
                <code className="font-mono">## Section</code>) to navigate and reorder sections.
              </p>
            </div>
          ) : visibleHeadings.length === 0 ? (
            <div className="py-8 px-3 text-center text-xs text-muted-foreground">
              No headings match &ldquo;{filterText}&rdquo;.
            </div>
          ) : (
            visibleHeadings.map((heading) => {
              const isActive = heading.id === activeHeadingId;
              const isCollapsed = collapsedIds.has(heading.id);
              const isDragging = draggedId === heading.id;
              const isDropBefore =
                dropTarget?.id === heading.id && dropTarget.position === 'before';
              const isDropAfter =
                dropTarget?.id === heading.id && dropTarget.position === 'after';

              const indentPx = Math.max(0, heading.level - 1) * 10;

              return (
                <div
                  key={heading.id}
                  draggable={!filterText.trim()}
                  onDragStart={(e) => handleDragStart(e, heading.id)}
                  onDragOver={(e) => handleDragOver(e, heading.id)}
                  onDragLeave={() => {
                    if (dropTarget?.id === heading.id) setDropTarget(null);
                  }}
                  onDrop={(e) => handleDrop(e, heading.id)}
                  onDragEnd={() => {
                    setDraggedId(null);
                    setDropTarget(null);
                  }}
                  onClick={() => handleJumpTo(heading)}
                  style={{ paddingLeft: `${6 + indentPx}px` }}
                  className={cn(
                    'group relative flex items-center gap-1 pr-1.5 py-1.5 rounded-md text-xs cursor-pointer select-none transition-colors border border-transparent',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold border-primary/20'
                      : 'text-foreground/85 hover:bg-muted/80 hover:text-foreground',
                    isDragging && 'opacity-40',
                    isDropBefore && 'border-t-2 border-t-primary rounded-t-none',
                    isDropAfter && 'border-b-2 border-b-primary rounded-b-none'
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary" />
                  )}

                  {!filterText.trim() && (
                    <span
                      className="text-muted-foreground/40 group-hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
                      title="Drag to reorder section"
                    >
                      <GripVertical className="h-3 w-3" />
                    </span>
                  )}

                  {heading.hasChildren && !filterText.trim() ? (
                    <button
                      type="button"
                      onClick={(e) => handleToggleCollapse(heading.id, e)}
                      className="p-0.5 rounded hover:bg-background/80 text-muted-foreground shrink-0"
                      title={isCollapsed ? 'Expand subsections' : 'Collapse subsections'}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  ) : (
                    <span className="w-4 shrink-0" />
                  )}

                  <span
                    className={cn(
                      'rounded px-1 py-0.5 text-[9px] font-mono font-bold leading-none shrink-0',
                      LEVEL_COLORS[heading.level]
                    )}
                  >
                    H{heading.level}
                  </span>

                  <span className="truncate flex-1" title={heading.title}>
                    {heading.title}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {headings.length > 1 && !filterText.trim() && (
        <div className="border-t px-3 py-1.5 text-[10px] text-muted-foreground shrink-0 bg-muted/10 flex items-center justify-between">
          <span>Click to jump • Drag to reorder sections</span>
        </div>
      )}
    </div>
  );
}
