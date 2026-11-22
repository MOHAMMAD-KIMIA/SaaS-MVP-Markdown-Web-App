import React from 'react';
import { useDocumentStore } from '../../../stores/documentStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useUIStore } from '../../../stores/uiStore';
import { useEditorStore } from '../../../stores/editorStore';
import { useSpellCheckStore } from '../../../stores/spellCheckStore';
import {
  FileText,
  Wand2,
  Check,
  CircleDot,
  Target,
  BookA,
  BookOpen,
  ChevronsDownUp,
  AlignVerticalJustifyCenter,
  Maximize2,
  SlidersHorizontal,
  ChevronUp,
  Expand,
  ListTree,
} from 'lucide-react';
import { desktop } from '../../../lib/desktop/bridge';
import { OfflineSyncStatus } from '../../../components/offline/OfflineSyncStatus';
import { findCodeBlockRegions } from '../../../lib/editor/codeFolding';
import { parseMarkdownOutline } from '../../../lib/markdown/outline';
import { analyzeReadability } from '../../../lib/markdown/readability';
import { toggleZenModeWithFullscreen } from '../../../lib/editor/zenFullscreen';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../app/components/ui/dropdown-menu';
import { cn } from '../../../lib/utils/cn';

interface EditorStatusBarProps {
  cursorPosition?: {
    start: number;
    end: number;
    timestamp?: number;
  } | null;
}

export function EditorStatusBar({ cursorPosition }: EditorStatusBarProps) {
  const { getActiveDocument, formatActiveDocument, lastSyncedAt } = useDocumentStore();
  const { editor } = useSettingsStore();
  const openDictionaryPage = useUIStore((s) => s.openDictionaryPage);
  const isReadabilityOpen = useUIStore((s) => s.isReadabilityOpen);
  const toggleReadability = useUIStore((s) => s.toggleReadability);
  const isTableOfContentsOpen = useUIStore((s) => s.isTableOfContentsOpen);
  const toggleTableOfContents = useUIStore((s) => s.toggleTableOfContents);
  const typewriterMode = useEditorStore((s) => s.typewriterMode);
  const focusMode = useEditorStore((s) => s.focusMode);
  const toggleTypewriterMode = useEditorStore((s) => s.toggleTypewriterMode);
  const toggleFocusMode = useEditorStore((s) => s.toggleFocusMode);
  const lastErrorCount = useSpellCheckStore((s) => s.lastErrorCount);
  const userDictCount = useSpellCheckStore((s) => s.userDictionary.length);
  const isSpellCheckEnabled = editor?.spellCheck ?? true;
  const activeDoc = getActiveDocument();

  const content = activeDoc?.content || '';
  const codeBlockCount = React.useMemo(() => findCodeBlockRegions(content).length, [content]);
  const headingCount = React.useMemo(() => parseMarkdownOutline(content).length, [content]);
  const readability = React.useMemo(() => analyzeReadability(content), [content]);
  const styleHintCount =
    readability.passiveHints.length + readability.repeatedWordHints.length;

  // Active file name
  const rawTitle = activeDoc?.title || 'Untitled';
  const fileName = rawTitle.toLowerCase().endsWith('.md') ? rawTitle : `${rawTitle}.md`;

  // Word & character counts
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;

  // Daily goal progress
  const dailyGoal = activeDoc?.dailyWordGoal;
  const goalPercentage =
    dailyGoal && dailyGoal > 0 ? Math.min(100, Math.round((words / dailyGoal) * 100)) : 0;

  // Cursor line and column
  let lineNum = 1;
  let colNum = 1;
  let selLen = 0;
  if (cursorPosition && typeof cursorPosition.start === 'number') {
    const safeStart = Math.min(cursorPosition.start, content.length);
    const safeEnd = Math.min(cursorPosition.end ?? cursorPosition.start, content.length);
    selLen = Math.abs(safeEnd - safeStart);

    const linesUpToCursor = content.slice(0, safeStart).split(/\r?\n/);
    lineNum = linesUpToCursor.length;
    colNum = (linesUpToCursor[linesUpToCursor.length - 1]?.length || 0) + 1;
  }

  const handleFormat = () => {
    formatActiveDocument();
    desktop.showNotification('Formatted', 'Markdown syntax standardized and cleaned up.');
  };

  const handleToggleFoldAll = () => {
    window.dispatchEvent(new CustomEvent('editor-fold-code', { detail: { mode: 'toggle-all' } }));
  };

  const activeIssueBadge =
    (isSpellCheckEnabled && lastErrorCount > 0) || styleHintCount > 0;

  return (
    <footer className="flex items-center justify-between gap-3 border-t border-border/80 bg-card/70 px-3 sm:px-4 h-8 text-[11px] text-muted-foreground select-none shrink-0 min-w-0 w-full backdrop-blur transition-colors">
      {/* Left: Quiet Document Context */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <div
          className="flex items-center gap-1.5 text-foreground/85 min-w-0 max-w-[130px] sm:max-w-[200px]"
          title={`Active file: ${fileName}`}
        >
          <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="truncate font-medium">{fileName}</span>
        </div>

        <span aria-hidden="true" className="text-border shrink-0">
          ·
        </span>

        <span
          className="tabular-nums text-foreground/80 shrink-0"
          title={`${words.toLocaleString()} words · ${chars.toLocaleString()} characters · ~${readability.readingMinutes}m read · ~${readability.speakingMinutes}m speak`}
        >
          {words.toLocaleString()} {words === 1 ? 'word' : 'words'}
          {words > 0 && (
            <span className="hidden sm:inline text-muted-foreground">
              {' '}
              · ~{readability.readingMinutes}m read
            </span>
          )}
        </span>

        {dailyGoal !== undefined && dailyGoal > 0 && (
          <>
            <span aria-hidden="true" className="hidden md:inline text-border shrink-0">
              ·
            </span>
            <span
              className={cn(
                'hidden md:inline-flex items-center gap-1 tabular-nums shrink-0',
                goalPercentage >= 100 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-primary/90'
              )}
              title={`Daily Word Goal: ${words} of ${dailyGoal} words (${goalPercentage}%)`}
            >
              <Target className="h-3 w-3 shrink-0" />
              <span>
                {words}/{dailyGoal} ({goalPercentage}%)
              </span>
            </span>
          </>
        )}
      </div>

      {/* Right: Minimal Controls + Expandable Writing Tools Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <span
          className="hidden sm:inline font-mono tabular-nums text-muted-foreground/85 px-1"
          title="Current Cursor Position"
        >
          Ln {lineNum}, Col {colNum}
          {selLen > 0 && <span className="opacity-70 ml-1">({selLen} sel)</span>}
        </span>

        {activeDoc?.isDirty ? (
          <span
            className="hidden sm:inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 px-1"
            title="Unsaved changes"
          >
            <CircleDot className="h-3 w-3 shrink-0" />
            <span>Modified</span>
          </span>
        ) : (
          <span
            className="hidden sm:inline-flex items-center gap-1 text-emerald-600/90 dark:text-emerald-400/90 px-1"
            title={`Last synced: ${lastSyncedAt || 'Just now'}`}
          >
            <Check className="h-3 w-3 shrink-0" />
            <span>Saved</span>
          </span>
        )}

        <OfflineSyncStatus compact />

        <button
          type="button"
          onClick={toggleFocusMode}
          className={cn(
            'inline-flex items-center gap-1 h-6 px-2 rounded text-[11px] font-medium transition-colors',
            focusMode
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
          )}
          title="Focus Mode (F11): Hide sidebars and dim surrounding paragraphs"
        >
          <Maximize2 className="h-3 w-3 shrink-0" />
          <span className="hidden sm:inline">{focusMode ? 'Focused' : 'Focus'}</span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'relative inline-flex items-center gap-1 h-6 px-2 rounded text-[11px] font-medium transition-colors border',
                isReadabilityOpen || typewriterMode
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border/60 text-foreground/80 hover:text-foreground hover:bg-muted/80'
              )}
              title="Open Writing Tools, Metrics & Insights"
              aria-label="Writing tools and document metrics"
            >
              <SlidersHorizontal className="h-3 w-3 shrink-0" />
              <span>Tools</span>
              {activeIssueBadge && (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0"
                  aria-hidden="true"
                />
              )}
              <ChevronUp className="h-3 w-3 opacity-60 shrink-0" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="end" sideOffset={8} className="w-64 p-1.5 text-xs">
            {/* Document Stats Summary */}
            <DropdownMenuLabel className="px-2 py-1.5 font-normal">
              <div className="flex items-center justify-between text-[11px] font-medium text-foreground">
                <span className="tabular-nums">
                  {words.toLocaleString()} words · {chars.toLocaleString()} chars
                </span>
                <span className="text-muted-foreground tabular-nums">
                  Ln {lineNum}:{colNum}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                {words === 0
                  ? '0 min read'
                  : `~${readability.readingMinutes}m read · ~${readability.speakingMinutes}m speak`}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Writing Modes */}
            <DropdownMenuItem onSelect={toggleZenModeWithFullscreen} className="justify-between text-xs">
              <span className="flex items-center gap-2">
                <Expand className="h-3.5 w-3.5 text-primary" />
                <span>Zen Mode (Full-Screen)</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">Alt+Z</span>
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={toggleFocusMode} className="justify-between text-xs">
              <span className="flex items-center gap-2">
                <Maximize2 className="h-3.5 w-3.5 text-primary" />
                <span>Focus Mode</span>
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>F11</span>
                {focusMode && <Check className="h-3.5 w-3.5 text-primary" />}
              </span>
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={toggleTypewriterMode} className="justify-between text-xs">
              <span className="flex items-center gap-2">
                <AlignVerticalJustifyCenter className="h-3.5 w-3.5 text-indigo-500" />
                <span>Typewriter Scrolling</span>
              </span>
              {typewriterMode && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Editor Utilities */}
            <DropdownMenuItem onSelect={handleFormat} className="justify-between text-xs">
              <span className="flex items-center gap-2">
                <Wand2 className="h-3.5 w-3.5 text-primary" />
                <span>Format Markdown</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">Alt+Shift+F</span>
            </DropdownMenuItem>

            {codeBlockCount > 0 && (
              <DropdownMenuItem onSelect={handleToggleFoldAll} className="justify-between text-xs">
                <span className="flex items-center gap-2">
                  <ChevronsDownUp className="h-3.5 w-3.5 text-primary" />
                  <span>Fold / Unfold Code Blocks</span>
                </span>
                <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                  {codeBlockCount}
                </span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* Writing Insights & Dictionary */}
            <DropdownMenuItem onSelect={toggleTableOfContents} className="justify-between text-xs">
              <span className="flex items-center gap-2">
                <ListTree className="h-3.5 w-3.5 text-primary" />
                <span>Table of Contents</span>
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground tabular-nums">
                <span>{headingCount}</span>
                {isTableOfContentsOpen && <Check className="h-3.5 w-3.5 text-primary" />}
              </span>
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={toggleReadability} className="justify-between text-xs">
              <span className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span>Readability &amp; Style</span>
              </span>
              <span className="flex items-center gap-1 text-[11px] tabular-nums">
                <span className="text-muted-foreground">Grade {readability.fkGrade}</span>
                {styleHintCount > 0 && (
                  <span className="px-1 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono text-[10px]">
                    {styleHintCount}
                  </span>
                )}
              </span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={openDictionaryPage}
              className="justify-between text-xs"
              title={`${userDictCount} custom word${userDictCount === 1 ? '' : 's'} saved`}
            >
              <span className="flex items-center gap-2">
                <BookA className="h-3.5 w-3.5 text-primary" />
                <span>Spell Check Dictionary</span>
              </span>
              {isSpellCheckEnabled && lastErrorCount > 0 ? (
                <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-600 dark:text-red-400 font-mono text-[10px] leading-none tabular-nums">
                  {lastErrorCount}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {userDictCount} words
                </span>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </footer>
  );
}
