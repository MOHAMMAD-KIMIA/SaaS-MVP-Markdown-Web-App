import React from 'react';
import { useDocumentStore } from '../../../stores/documentStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useUIStore } from '../../../stores/uiStore';
import { useEditorStore } from '../../../stores/editorStore';
import { useSpellCheckStore } from '../../../stores/spellCheckStore';
import { FileText, Type, Hash, Clock, Wand2, Check, CircleDot, Target, BookA, BookOpen, ChevronsDownUp, AlignVerticalJustifyCenter, Maximize2 } from 'lucide-react';
import { desktop } from '../../../lib/desktop/bridge';
import { OfflineSyncStatus } from '../../../components/offline/OfflineSyncStatus';
import { findCodeBlockRegions } from '../../../lib/editor/codeFolding';
import { analyzeReadability } from '../../../lib/markdown/readability';

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
  const readability = React.useMemo(() => analyzeReadability(content), [content]);

  // Active file name
  const rawTitle = activeDoc?.title || 'Untitled';
  const fileName = rawTitle.toLowerCase().endsWith('.md') ? rawTitle : `${rawTitle}.md`;

  // Calculate word count and character count
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;

  // Goal progress
  const dailyGoal = activeDoc?.dailyWordGoal;
  const goalPercentage = dailyGoal && dailyGoal > 0 ? Math.min(100, Math.round((words / dailyGoal) * 100)) : 0;

  // Calculate line and column numbers
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

  return (
    <footer className="flex items-center justify-between border-t border-border bg-card/80 px-2 sm:px-4 py-1.5 text-xs text-muted-foreground select-none shrink-0 min-w-0 w-full backdrop-blur transition-colors overflow-x-auto no-scrollbar">
      <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
        {/* Active File Name */}
        <div className="flex items-center space-x-1.5 font-medium text-foreground shrink-0 max-w-[120px] sm:max-w-[220px] truncate" title={`Active file: ${fileName}`}>
          <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate font-semibold text-xs tracking-tight">{fileName}</span>
        </div>

        <div className="h-3 w-px bg-border/60 shrink-0" />

        {/* Word Count */}
        <div className="flex items-center space-x-1 text-foreground/90 font-medium shrink-0" title="Total Word Count">
          <Type className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span>{words.toLocaleString()} {words === 1 ? 'word' : 'words'}</span>
        </div>

        {/* Character Count */}
        <div className="hidden md:flex items-center space-x-1 shrink-0" title="Total Character Count">
          <Hash className="h-3.5 w-3.5 opacity-70 shrink-0" />
          <span>{chars.toLocaleString()} chars</span>
        </div>

        {/* Daily Goal Badge if set */}
        {dailyGoal !== undefined && dailyGoal > 0 && (
          <div className="hidden md:flex items-center space-x-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0 font-medium" title={`Daily Word Goal: ${words} of ${dailyGoal} words`}>
            <Target className="h-3 w-3 shrink-0" />
            <span>Goal: {words}/{dailyGoal} ({goalPercentage}%)</span>
          </div>
        )}

        {/* Reading & Speaking Time */}
        <div
          className="hidden lg:flex items-center space-x-1.5 shrink-0 opacity-85 tabular-nums"
          title={`Estimated Reading (${readability.readingMinutes} min) & Speaking (${readability.speakingMinutes} min) Time`}
        >
          <Clock className="h-3.5 w-3.5 opacity-70 shrink-0" />
          <span>
            {words === 0
              ? '0 min read'
              : `~${readability.readingMinutes}m read · ~${readability.speakingMinutes}m speak`}
          </span>
        </div>

        {/* Readability & Writing Style Button */}
        <button
          type="button"
          onClick={toggleReadability}
          className={`flex items-center space-x-1 rounded px-2 py-0.5 font-medium transition-colors border tabular-nums shrink-0 ${
            isReadabilityOpen
              ? 'bg-primary/15 text-primary border-primary/30'
              : 'text-foreground/80 border-transparent hover:bg-muted hover:text-foreground hover:border-border/60'
          }`}
          title={`Readability & Style Insights · ${readability.gradeLabel} (Flesch Ease ${readability.fleschEase}/100)`}
        >
          <BookOpen className="h-3 w-3 text-primary shrink-0" />
          <span>Grade {readability.fkGrade}</span>
          {readability.passiveHints.length + readability.repeatedWordHints.length > 0 && (
            <span className="ml-0.5 text-[10px] font-mono text-amber-600 dark:text-amber-400">
              ({readability.passiveHints.length + readability.repeatedWordHints.length})
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
        <OfflineSyncStatus />

        <button
          onClick={openDictionaryPage}
          className="flex items-center space-x-1 rounded px-2 py-0.5 font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors border border-transparent hover:border-border/60"
          title={`Open Spell Checker Dictionary (${userDictCount} custom word${userDictCount === 1 ? '' : 's'})`}
        >
          <BookA className="h-3 w-3 text-primary shrink-0" />
          <span>Dictionary</span>
          {isSpellCheckEnabled && lastErrorCount > 0 && (
            <span className="ml-0.5 px-1 rounded bg-red-500/15 text-red-600 dark:text-red-400 font-mono text-[10px]">
              {lastErrorCount}
            </span>
          )}
        </button>

        {codeBlockCount > 0 && (
          <button
            onClick={handleToggleFoldAll}
            className="flex items-center space-x-1 rounded px-2 py-0.5 font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors border border-transparent hover:border-border/60"
            title={`Fold or unfold all ${codeBlockCount} fenced code block${codeBlockCount === 1 ? '' : 's'} (Ctrl+Shift+[ / ])`}
          >
            <ChevronsDownUp className="h-3 w-3 text-primary shrink-0" />
            <span>Code ({codeBlockCount})</span>
          </button>
        )}

        <button
          onClick={toggleTypewriterMode}
          className={`flex items-center space-x-1 rounded px-2 py-0.5 font-medium transition-colors border ${
            typewriterMode
              ? 'bg-primary/15 text-primary border-primary/30'
              : 'text-foreground/80 border-transparent hover:bg-muted hover:text-foreground hover:border-border/60'
          }`}
          title="Typewriter Scrolling: Keep cursor vertically centered while writing"
        >
          <AlignVerticalJustifyCenter className="h-3 w-3 shrink-0" />
          <span className="hidden md:inline">Typewriter</span>
        </button>

        <button
          onClick={toggleFocusMode}
          className={`flex items-center space-x-1 rounded px-2 py-0.5 font-medium transition-colors border ${
            focusMode
              ? 'bg-primary/15 text-primary border-primary/30'
              : 'text-foreground/80 border-transparent hover:bg-muted hover:text-foreground hover:border-border/60'
          }`}
          title="Focus Mode (F11): Hide sidebars and dim surrounding paragraphs"
        >
          <Maximize2 className="h-3 w-3 shrink-0" />
          <span className="hidden md:inline">{focusMode ? 'Focused' : 'Focus'}</span>
        </button>

        <button
          onClick={handleFormat}
          className="flex items-center space-x-1 rounded px-2 py-0.5 font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors border border-transparent hover:border-border/60"
          title="Format Markdown (Alt+Shift+F): Clean up list indentation and standardize header spacing"
        >
          <Wand2 className="h-3 w-3 text-primary shrink-0" />
          <span>Format</span>
        </button>

        <div className="flex items-center space-x-1 font-mono text-[11px] bg-muted/50 px-2 py-0.5 rounded border border-border/40 shrink-0" title="Current Cursor Position">
          <span>Ln {lineNum}, Col {colNum}</span>
          {selLen > 0 && <span className="opacity-75 font-sans font-normal text-[10px] ml-1">({selLen} selected)</span>}
        </div>

        <div className="hidden sm:flex items-center space-x-1.5 shrink-0 text-[11px]">
          {activeDoc?.isDirty ? (
            <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-medium" title="Unsaved changes">
              <CircleDot className="h-3 w-3 shrink-0" />
              <span>Modified</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium" title={`Last synced: ${lastSyncedAt || 'Just now'}`}>
              <Check className="h-3 w-3" />
              <span>Saved {lastSyncedAt ? `at ${lastSyncedAt}` : ''}</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
