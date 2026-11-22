// src/features/history/components/HistoryPanel.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Clock,
  RotateCcw,
  Plus,
  Trash2,
  Columns2,
  AlignJustify,
  Check,
  History,
} from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import { ScrollArea } from '../../../app/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../app/components/ui/dialog';
import { useUIStore } from '../../../stores/uiStore';
import { useHistoryStore } from '../../../stores/historyStore';
import { useDocumentStore } from '../../../stores/documentStore';
import { formatDate, formatRelativeTime } from '../../../lib/utils/dates';
import {
  applyDiffHunkRestore,
  computeSideBySideDiff,
  computeWordDiff,
  DiffHunk,
  DiffRow,
  groupDiffHunks,
} from '../../../lib/markdown/diff';
import { desktop } from '../../../lib/desktop/bridge';
import { cn } from '../../../lib/utils/cn';

function WordHighlightedText({
  text,
  compareWith,
  side,
}: {
  text: string;
  compareWith: string;
  side: 'old' | 'new';
}) {
  const { oldSegments, newSegments } = useMemo(
    () => computeWordDiff(side === 'old' ? text : compareWith, side === 'new' ? text : compareWith),
    [text, compareWith, side]
  );

  const segments = side === 'old' ? oldSegments : newSegments;
  return (
    <>
      {segments.map((seg, i) => (
        <span
          key={i}
          className={cn(
            seg.type === 'removed' &&
              'bg-rose-500/25 text-rose-900 dark:text-rose-200 rounded-2xs px-0.5 line-through decoration-rose-500/60',
            seg.type === 'added' &&
              'bg-emerald-500/25 text-emerald-900 dark:text-emerald-200 rounded-2xs px-0.5 font-medium'
          )}
        >
          {seg.text}
        </span>
      ))}
    </>
  );
}

export function HistoryPanel() {
  const { isHistoryPanelOpen, closeHistoryPanel } = useUIStore();
  const { versions, createVersion, deleteVersion } = useHistoryStore();
  const { getActiveDocument, updateDocumentContent } = useDocumentStore();

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [changesOnly, setChangesOnly] = useState(false);
  const [snapshotLabel, setSnapshotLabel] = useState('');

  const activeDoc = getActiveDocument();
  const documentVersions = useMemo(
    () => (activeDoc ? versions.filter((v) => v.documentId === activeDoc.id).slice().reverse() : []),
    [activeDoc, versions]
  );

  useEffect(() => {
    if (!isHistoryPanelOpen) return;
    if (
      !selectedVersionId ||
      !documentVersions.some((v) => v.id === selectedVersionId)
    ) {
      setSelectedVersionId(documentVersions[0]?.id || null);
    }
  }, [isHistoryPanelOpen, documentVersions, selectedVersionId]);

  const selectedVersion = useMemo(
    () => documentVersions.find((v) => v.id === selectedVersionId) || null,
    [documentVersions, selectedVersionId]
  );

  const currentContent = activeDoc?.content || '';
  const diffRows = useMemo(() => {
    if (!selectedVersion) return [] as DiffRow[];
    return computeSideBySideDiff(selectedVersion.content, currentContent);
  }, [selectedVersion, currentContent]);

  const hunks = useMemo(() => groupDiffHunks(diffRows), [diffRows]);

  const diffStats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const r of diffRows) {
      if (r.kind === 'added') added++;
      else if (r.kind === 'removed') removed++;
      else if (r.kind === 'modified') {
        added++;
        removed++;
      }
    }
    return { added, removed, hunksCount: hunks.length };
  }, [diffRows, hunks.length]);

  const hunkLookupByRow = useMemo(() => {
    const map = new Map<DiffRow, DiffHunk>();
    for (const h of hunks) {
      if (h.rows[0]) {
        map.set(h.rows[0], h);
      }
    }
    return map;
  }, [hunks]);

  const displayRows = useMemo(
    () => (changesOnly ? diffRows.filter((r) => r.kind !== 'equal') : diffRows),
    [diffRows, changesOnly]
  );

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoc) return;
    const label = snapshotLabel.trim() || `Manual snapshot (${formatDate(new Date().toISOString(), 'p')})`;
    createVersion(activeDoc.id, activeDoc.content, label);
    setSnapshotLabel('');
    desktop.showNotification('Snapshot Saved', `Saved "${label}" to Version History.`);
  };

  const handleRestoreSection = (hunk: DiffHunk) => {
    if (!activeDoc) return;
    const nextText = applyDiffHunkRestore(activeDoc.content, hunk);
    updateDocumentContent(activeDoc.id, nextText);
    desktop.showNotification(
      'Section Restored',
      `Applied snapshot section #${hunk.index + 1} into your current draft.`
    );
  };

  const handleConfirmRestore = () => {
    if (!activeDoc || !confirmRestoreId) return;
    const version = versions.find((v) => v.id === confirmRestoreId);
    if (!version) return;

    // Save current draft automatically before full overwrite so nothing is lost
    if (activeDoc.content !== version.content) {
      createVersion(activeDoc.id, activeDoc.content, 'Before full restore');
    }
    updateDocumentContent(activeDoc.id, version.content);
    setConfirmRestoreId(null);
    closeHistoryPanel();
    desktop.showNotification('Version Restored', 'Replaced current draft with selected snapshot.');
  };

  return (
    <>
      <Dialog open={isHistoryPanelOpen} onOpenChange={(open) => !open && closeHistoryPanel()}>
        <DialogContent className="max-w-6xl w-[95vw] h-[86vh] p-0 flex flex-col overflow-hidden gap-0">
          <DialogHeader className="px-5 py-3.5 border-b border-border shrink-0 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/40 text-primary shrink-0">
                <History className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold tracking-tight">
                  Version History &amp; Diff Preview
                </DialogTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
                  <span className="truncate max-w-[260px]">{activeDoc?.title || 'Untitled'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{documentVersions.length} snapshot{documentVersions.length === 1 ? '' : 's'}</span>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
            {/* Left Snapshot Timeline */}
            <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-border bg-muted/15 flex flex-col shrink-0 max-h-[32vh] md:max-h-none">
              <form onSubmit={handleCreateSnapshot} className="p-3 border-b border-border space-y-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Input
                    value={snapshotLabel}
                    onChange={(e) => setSnapshotLabel(e.target.value)}
                    placeholder="Snapshot label (optional)..."
                    className="h-8 text-xs"
                  />
                  <Button type="submit" size="sm" className="h-8 px-2.5 shrink-0 gap-1" disabled={!activeDoc}>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Save</span>
                  </Button>
                </div>
              </form>

              <ScrollArea className="flex-1 min-h-0">
                {documentVersions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <Clock className="h-9 w-9 text-muted-foreground/40 mb-2.5" />
                    <p className="text-xs font-medium text-foreground">No snapshots yet</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Save a manual snapshot above or enable timed auto-save in settings.
                    </p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1.5">
                    {documentVersions.map((version) => {
                      const isSelected = selectedVersion?.id === version.id;
                      const words = version.content.trim()
                        ? version.content.trim().split(/\s+/).length
                        : 0;

                      return (
                        <div
                          key={version.id}
                          onClick={() => setSelectedVersionId(version.id)}
                          className={cn(
                            'group rounded-lg border px-3 py-2.5 cursor-pointer transition-colors space-y-1',
                            isSelected
                              ? 'bg-background border-primary/50 shadow-2xs'
                              : 'border-border/60 bg-transparent hover:bg-muted/50'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-foreground line-clamp-1">
                              {version.label || 'Auto-saved snapshot'}
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteVersion(version.id);
                              }}
                              title="Delete snapshot"
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums">
                            <span>{formatRelativeTime(version.createdAt)}</span>
                            <span aria-hidden="true">·</span>
                            <span>{words} words</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </aside>

            {/* Right Diff Viewer */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-background">
              {selectedVersion ? (
                <>
                  {/* Diff Toolbar */}
                  <div className="px-4 py-2.5 border-b border-border bg-muted/10 flex flex-wrap items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-3 text-xs tabular-nums">
                      <span className="font-medium text-foreground">
                        Comparing Snapshot vs Current Draft
                      </span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        +{diffStats.added}
                      </span>
                      <span className="font-mono text-rose-600 dark:text-rose-400">
                        -{diffStats.removed}
                      </span>
                      <span className="text-muted-foreground">
                        {diffStats.hunksCount} section{diffStats.hunksCount === 1 ? '' : 's'} changed
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-0.5 p-0.5 rounded-lg border border-border bg-muted/50">
                        <button
                          type="button"
                          onClick={() => setViewMode('split')}
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors',
                            viewMode === 'split'
                              ? 'bg-background text-foreground shadow-2xs'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <Columns2 className="h-3 w-3" />
                          <span>Side-by-Side</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('unified')}
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors',
                            viewMode === 'unified'
                              ? 'bg-background text-foreground shadow-2xs'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <AlignJustify className="h-3 w-3" />
                          <span>Inline</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setChangesOnly((v) => !v)}
                        className={cn(
                          'px-2.5 py-1 text-xs font-medium rounded-md border transition-colors',
                          changesOnly
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {changesOnly ? 'Showing Changes Only' : 'Changes Only'}
                      </button>

                      <Button
                        type="button"
                        size="sm"
                        className="h-7 px-3 text-xs gap-1.5"
                        disabled={diffStats.hunksCount === 0}
                        onClick={() => setConfirmRestoreId(selectedVersion.id)}
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Restore Full Snapshot</span>
                      </Button>
                    </div>
                  </div>

                  {/* Diff Content */}
                  <div className="flex-1 min-h-0 overflow-auto font-mono text-xs">
                    {diffStats.hunksCount === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center font-sans">
                        <Check className="h-9 w-9 text-emerald-500 mb-2.5" />
                        <p className="text-sm font-medium text-foreground">
                          Identical to Current Draft
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          There are no differences between this snapshot and your active document.
                        </p>
                      </div>
                    ) : viewMode === 'split' ? (
                      <div className="min-w-[680px]">
                        <div className="grid grid-cols-2 border-b border-border bg-muted/30 text-[11px] font-sans font-semibold text-muted-foreground sticky top-0 z-10">
                          <div className="px-3 py-1.5 border-r border-border">
                            Snapshot ({formatDate(selectedVersion.createdAt, 'PPp')})
                          </div>
                          <div className="px-3 py-1.5">Current Draft (Live)</div>
                        </div>

                        {displayRows.map((row, idx) => {
                          const hunk = hunkLookupByRow.get(row);
                          return (
                            <React.Fragment key={idx}>
                              {hunk && (
                                <div className="flex items-center justify-between px-3 py-1 bg-muted/60 border-y border-border font-sans text-[11px]">
                                  <span className="text-muted-foreground tabular-nums">
                                    Section #{hunk.index + 1} · Snapshot lines {hunk.oldStartLine + 1}–{Math.max(hunk.oldStartLine + 1, hunk.oldEndLine)} · Current lines {hunk.newStartLine + 1}–{Math.max(hunk.newStartLine + 1, hunk.newEndLine)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRestoreSection(hunk)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                    <span>Restore Section</span>
                                  </button>
                                </div>
                              )}

                              <div className="grid grid-cols-2 border-b border-border/40 leading-5">
                                {/* Left: Snapshot (Old) */}
                                <div
                                  className={cn(
                                    'flex items-start border-r border-border/60 min-w-0',
                                    (row.kind === 'removed' || row.kind === 'modified') &&
                                      'bg-rose-500/10',
                                    row.kind === 'added' && 'bg-muted/20 opacity-50'
                                  )}
                                >
                                  <span className="w-10 shrink-0 select-none text-right pr-2 py-0.5 text-[10px] text-muted-foreground/70 tabular-nums border-r border-border/40">
                                    {row.oldLineNum ?? ''}
                                  </span>
                                  <pre className="flex-1 px-2.5 py-0.5 whitespace-pre-wrap break-words font-mono">
                                    {row.kind === 'modified' ? (
                                      <WordHighlightedText
                                        text={row.oldText}
                                        compareWith={row.newText}
                                        side="old"
                                      />
                                    ) : (
                                      row.oldText || (row.kind === 'removed' ? ' ' : '')
                                    )}
                                  </pre>
                                </div>

                                {/* Right: Current (New) */}
                                <div
                                  className={cn(
                                    'flex items-start min-w-0',
                                    (row.kind === 'added' || row.kind === 'modified') &&
                                      'bg-emerald-500/10',
                                    row.kind === 'removed' && 'bg-muted/20 opacity-50'
                                  )}
                                >
                                  <span className="w-10 shrink-0 select-none text-right pr-2 py-0.5 text-[10px] text-muted-foreground/70 tabular-nums border-r border-border/40">
                                    {row.newLineNum ?? ''}
                                  </span>
                                  <pre className="flex-1 px-2.5 py-0.5 whitespace-pre-wrap break-words font-mono">
                                    {row.kind === 'modified' ? (
                                      <WordHighlightedText
                                        text={row.newText}
                                        compareWith={row.oldText}
                                        side="new"
                                      />
                                    ) : (
                                      row.newText || (row.kind === 'added' ? ' ' : '')
                                    )}
                                  </pre>
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    ) : (
                      /* Unified Inline View */
                      <div>
                        {displayRows.map((row, idx) => {
                          const hunk = hunkLookupByRow.get(row);
                          return (
                            <React.Fragment key={idx}>
                              {hunk && (
                                <div className="flex items-center justify-between px-3 py-1 bg-muted/60 border-y border-border font-sans text-[11px]">
                                  <span className="text-muted-foreground tabular-nums">
                                    Section #{hunk.index + 1} · +{hunk.addedCount} / -{hunk.removedCount}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRestoreSection(hunk)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                    <span>Restore Section</span>
                                  </button>
                                </div>
                              )}

                              {row.kind === 'equal' && (
                                <div className="flex items-start border-b border-border/30 leading-5">
                                  <span className="w-10 shrink-0 text-right pr-2 py-0.5 text-[10px] text-muted-foreground/60 tabular-nums border-r border-border/40">
                                    {row.newLineNum}
                                  </span>
                                  <pre className="flex-1 px-3 py-0.5 whitespace-pre-wrap break-words font-mono text-foreground/80">
                                    {row.newText}
                                  </pre>
                                </div>
                              )}

                              {(row.kind === 'removed' || row.kind === 'modified') && (
                                <div className="flex items-start border-b border-border/30 leading-5 bg-rose-500/10">
                                  <span className="w-10 shrink-0 text-right pr-2 py-0.5 text-[10px] text-rose-600 dark:text-rose-400 tabular-nums border-r border-border/40">
                                    -{row.oldLineNum}
                                  </span>
                                  <pre className="flex-1 px-3 py-0.5 whitespace-pre-wrap break-words font-mono">
                                    {row.kind === 'modified' ? (
                                      <WordHighlightedText
                                        text={row.oldText}
                                        compareWith={row.newText}
                                        side="old"
                                      />
                                    ) : (
                                      row.oldText
                                    )}
                                  </pre>
                                </div>
                              )}

                              {(row.kind === 'added' || row.kind === 'modified') && (
                                <div className="flex items-start border-b border-border/30 leading-5 bg-emerald-500/10">
                                  <span className="w-10 shrink-0 text-right pr-2 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 tabular-nums border-r border-border/40">
                                    +{row.newLineNum}
                                  </span>
                                  <pre className="flex-1 px-3 py-0.5 whitespace-pre-wrap break-words font-mono">
                                    {row.kind === 'modified' ? (
                                      <WordHighlightedText
                                        text={row.newText}
                                        compareWith={row.oldText}
                                        side="new"
                                      />
                                    ) : (
                                      row.newText
                                    )}
                                  </pre>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <History className="h-10 w-10 text-muted-foreground/35 mb-3" />
                  <p className="text-sm font-medium text-foreground">
                    Select or Save a Snapshot
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Save a snapshot anytime on the left to compare line-by-line and word-level diffs or selectively restore individual sections.
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmRestoreId !== null} onOpenChange={() => setConfirmRestoreId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Full Snapshot</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            This will replace your current document with the selected snapshot. A backup snapshot of your current draft will be saved automatically before restoring.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRestoreId(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRestore}>Restore Snapshot</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
