// src/features/editor/components/SpellCheckContextMenu.tsx
import React, { useEffect, useRef } from 'react';
import { SpellCheck, Plus, EyeOff, Check } from 'lucide-react';
import { SpellError } from '../../../lib/spellcheck/spellChecker';

interface SpellCheckContextMenuProps {
  error: SpellError;
  position: { x: number; y: number };
  onApplySuggestion: (error: SpellError, suggestion: string) => void;
  onAddToDictionary: (word: string) => void;
  onIgnoreWord: (word: string) => void;
  onClose: () => void;
}

export function SpellCheckContextMenu({
  error,
  position,
  onApplySuggestion,
  onAddToDictionary,
  onIgnoreWord,
  onClose,
}: SpellCheckContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onClose]);

  // Viewport boundary adjustments
  const menuWidth = 220;
  const menuHeight = 240;
  const safeLeft = Math.max(12, Math.min(position.x, window.innerWidth - menuWidth - 16));
  const safeTop = Math.max(12, Math.min(position.y, window.innerHeight - menuHeight - 16));

  return (
    <div
      ref={menuRef}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        top: `${safeTop}px`,
        left: `${safeLeft}px`,
      }}
      className="fixed z-50 w-56 rounded-lg border border-border/80 bg-popover/95 p-1.5 text-popover-foreground shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/50 mb-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <SpellCheck className="h-3.5 w-3.5 text-red-500" />
          <span>Spelling</span>
        </div>
        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 font-medium">
          {error.word}
        </span>
      </div>

      {/* Suggested Corrections */}
      <div className="space-y-0.5 mb-1">
        {error.suggestions.length > 0 ? (
          error.suggestions.map((suggestion, idx) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onApplySuggestion(error, suggestion)}
              className="flex w-full items-center justify-between px-2 py-1.5 text-sm font-medium rounded-md text-foreground hover:bg-accent hover:text-accent-foreground active:scale-98 transition-colors text-left"
            >
              <span>{suggestion}</span>
              {idx === 0 && (
                <span className="text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded">
                  Best match
                </span>
              )}
            </button>
          ))
        ) : (
          <div className="px-2 py-2 text-xs text-muted-foreground italic">
            No suggestions found
          </div>
        )}
      </div>

      <div className="my-1 border-t border-border/50" />

      {/* Actions */}
      <button
        type="button"
        onClick={() => onAddToDictionary(error.word)}
        className="flex w-full items-center gap-2 px-2 py-1.5 text-xs text-foreground/80 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors text-left"
      >
        <Plus className="h-3.5 w-3.5 text-emerald-500" />
        <span>Add &quot;{error.word}&quot; to Dictionary</span>
      </button>

      <button
        type="button"
        onClick={() => onIgnoreWord(error.word)}
        className="flex w-full items-center gap-2 px-2 py-1.5 text-xs text-foreground/80 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors text-left"
      >
        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Ignore for now</span>
      </button>
    </div>
  );
}
