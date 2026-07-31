import React from 'react';
import { useDocumentStore } from '../../../stores/documentStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { FileText, Type, Hash, Clock, Wand2, Check, CircleDot, Target } from 'lucide-react';
import { desktop } from '../../../lib/desktop/bridge';

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
  const activeDoc = getActiveDocument();

  const content = activeDoc?.content || '';

  // Active file name
  const rawTitle = activeDoc?.title || 'Untitled';
  const fileName = rawTitle.toLowerCase().endsWith('.md') ? rawTitle : `${rawTitle}.md`;

  // Calculate word count and character count
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  // Goal progress
  const dailyGoal = activeDoc?.dailyWordGoal;
  const goalPercentage = dailyGoal && dailyGoal > 0 ? Math.min(100, Math.round((words / dailyGoal) * 100)) : 0;

  // Calculate line and column numbers
  let lineNum = 1;
  let colNum = 1;
  if (cursorPosition && typeof cursorPosition.start === 'number') {
    const safeStart = Math.min(cursorPosition.start, content.length);
    const linesUpToCursor = content.slice(0, safeStart).split(/\r?\n/);
    lineNum = linesUpToCursor.length;
    colNum = (linesUpToCursor[linesUpToCursor.length - 1]?.length || 0) + 1;
  }

  const handleFormat = () => {
    formatActiveDocument();
    desktop.showNotification('Formatted', 'Markdown syntax standardized and cleaned up.');
  };

  return (
    <footer className="flex items-center justify-between border-t border-border bg-card/80 px-4 py-1.5 text-xs text-muted-foreground select-none shrink-0 backdrop-blur transition-colors">
      <div className="flex items-center space-x-3 sm:space-x-5 overflow-hidden">
        {/* Active File Name */}
        <div className="flex items-center space-x-1.5 font-medium text-foreground shrink-0 max-w-[160px] sm:max-w-[220px] truncate" title={`Active file: ${fileName}`}>
          <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate font-semibold text-xs tracking-tight">{fileName}</span>
        </div>

        <div className="h-3 w-px bg-border/60 shrink-0" />

        {/* Word Count */}
        <div className="flex items-center space-x-1.5 text-foreground/90 font-medium shrink-0" title="Total Word Count">
          <Type className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span>{words.toLocaleString()} {words === 1 ? 'word' : 'words'}</span>
        </div>

        {/* Character Count */}
        <div className="flex items-center space-x-1.5 shrink-0" title="Total Character Count">
          <Hash className="h-3.5 w-3.5 opacity-70 shrink-0" />
          <span>{chars.toLocaleString()} {chars === 1 ? 'character' : 'characters'}</span>
        </div>

        {/* Daily Goal Badge if set */}
        {dailyGoal !== undefined && dailyGoal > 0 && (
          <div className="hidden sm:flex items-center space-x-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0 font-medium" title={`Daily Word Goal: ${words} of ${dailyGoal} words`}>
            <Target className="h-3 w-3 shrink-0" />
            <span>Goal: {words}/{dailyGoal} ({goalPercentage}%)</span>
          </div>
        )}

        {/* Reading Time */}
        <div className="hidden lg:flex items-center space-x-1.5 shrink-0 opacity-80" title="Estimated Reading Time">
          <Clock className="h-3.5 w-3.5 opacity-70 shrink-0" />
          <span>~{readingTime} min read</span>
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
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
