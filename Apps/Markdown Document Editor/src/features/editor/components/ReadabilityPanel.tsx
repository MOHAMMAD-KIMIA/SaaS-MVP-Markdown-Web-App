// src/features/editor/components/ReadabilityPanel.tsx
import React, { useMemo } from 'react';
import {
  X,
  BookOpen,
  Clock,
  Mic,
  Highlighter,
  Repeat,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useUIStore } from '../../../stores/uiStore';
import { useDocumentStore } from '../../../stores/documentStore';
import { useEditorStore } from '../../../stores/editorStore';
import { analyzeReadability } from '../../../lib/markdown/readability';
import { ScrollArea } from '../../../app/components/ui/scroll-area';
import { Switch } from '../../../app/components/ui/switch';
import { cn } from '../../../lib/utils/cn';

function formatSpeakingDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0s';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins === 0) return `${secs}s`;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export function ReadabilityPanel() {
  const isOpen = useUIStore((s) => s.isReadabilityOpen);
  const closeReadability = useUIStore((s) => s.closeReadability);
  const activeDoc = useDocumentStore((s) => s.getActiveDocument());
  const showStyleHighlights = useEditorStore((s) => s.showStyleHighlights);
  const toggleStyleHighlights = useEditorStore((s) => s.toggleStyleHighlights);

  const report = useMemo(
    () => analyzeReadability(activeDoc?.content || ''),
    [activeDoc?.content]
  );

  if (!isOpen) return null;

  const jumpToRange = (start: number, end: number) => {
    window.dispatchEvent(
      new CustomEvent('editor-jump-range', { detail: { start, end } })
    );
  };

  return (
    <aside className="w-80 max-w-[88vw] border-l border-border bg-background flex flex-col shrink-0 h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold tracking-tight truncate">
            Writing &amp; Readability
          </span>
        </div>
        <button
          type="button"
          onClick={closeReadability}
          aria-label="Close readability panel"
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-5">
          {/* Core Readability Metrics */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-lg border border-border bg-card p-3 space-y-0.5">
              <div className="text-[11px] text-muted-foreground">Reading Level</div>
              <div className="text-lg font-semibold tabular-nums text-foreground">
                Grade {report.fkGrade}
              </div>
              <div className="text-[11px] text-primary font-medium">
                {report.gradeLabel}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-3 space-y-0.5">
              <div className="text-[11px] text-muted-foreground">Flesch Ease</div>
              <div className="text-lg font-semibold tabular-nums text-foreground">
                {report.fleschEase}
                <span className="text-xs font-normal text-muted-foreground"> / 100</span>
              </div>
              <div className="text-[11px] text-muted-foreground tabular-nums">
                {report.avgWordsPerSentence} words / sent.
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-3 space-y-0.5">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Reading Time</span>
              </div>
              <div className="text-base font-semibold tabular-nums text-foreground">
                {report.wordCount === 0 ? '0 min' : `~${report.readingMinutes} min`}
              </div>
              <div className="text-[11px] text-muted-foreground tabular-nums">
                {report.wordCount.toLocaleString()} prose words
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-3 space-y-0.5">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Mic className="h-3 w-3" />
                <span>Speaking Time</span>
              </div>
              <div className="text-base font-semibold tabular-nums text-foreground">
                {formatSpeakingDuration(report.speakingSecondsTotal)}
              </div>
              <div className="text-[11px] text-muted-foreground tabular-nums">
                ~135 words/min
              </div>
            </div>
          </div>

          {/* Highlight Toggle */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Highlighter className="h-3.5 w-3.5 text-primary" />
                <span>Highlight Hints in Editor</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Underline passive voice and repeated words inline.
              </p>
            </div>
            <Switch
              checked={showStyleHighlights}
              onCheckedChange={toggleStyleHighlights}
              aria-label="Toggle inline style highlights"
            />
          </div>

          {/* Passive Voice Hints */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span className="inline-flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-sky-500" />
                <span>Passive Voice Hints</span>
              </span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {report.passiveHints.length}
              </span>
            </div>

            {report.passiveHints.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No passive voice phrases detected in your prose.
              </p>
            ) : (
              <div className="space-y-1.5">
                {report.passiveHints.map((hint) => (
                  <button
                    key={hint.id}
                    type="button"
                    onClick={() => jumpToRange(hint.start, hint.end)}
                    className="group w-full flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 text-left hover:border-sky-500/50 hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">
                        “{hint.phrase}”
                      </div>
                      <div className="text-[11px] text-muted-foreground tabular-nums">
                        Line {hint.line} · Consider active verb
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Repeated Words */}
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Repeat className="h-3.5 w-3.5 text-amber-500" />
                <span>Repeated Words</span>
              </span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {report.repeatedWordHints.length}
              </span>
            </div>

            {report.repeatedWordHints.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No consecutive duplicates or overused nearby words found.
              </p>
            ) : (
              <div className="space-y-1.5">
                {report.repeatedWordHints.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => jumpToRange(item.start, item.end)}
                    className={cn(
                      'group w-full flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 text-left hover:border-amber-500/50 hover:bg-muted/40 transition-colors'
                    )}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">
                        {item.kind === 'consecutive'
                          ? `Duplicate: “${item.word} ${item.word}”`
                          : `Repeated nearby: “${item.word}”`}
                      </div>
                      <div className="text-[11px] text-muted-foreground tabular-nums">
                        Line {item.line} · {item.kind === 'consecutive' ? 'Immediate repeat' : '3+ uses in paragraph'}
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
