// src/features/editor/components/FloatingFormatBar.tsx
import React, { useRef, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Highlighter,
  Code,
  Link,
  Quote,
  Info,
  ChevronDown,
  MessageSquarePlus,
} from 'lucide-react';
import { cn } from '../../../lib/utils/cn';
import {
  HIGHLIGHT_COLORS,
  HighlightColorConfig,
} from '../../../lib/markdown/highlightColors';

export interface FloatingFormatAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  prefix: string;
  suffix: string;
  placeholder?: string;
  isBlock?: boolean;
}

const BASE_FORMAT_ACTIONS: FloatingFormatAction[] = [
  {
    id: 'bold',
    label: 'Bold (⌘B)',
    icon: Bold,
    prefix: '**',
    suffix: '**',
  },
  {
    id: 'italic',
    label: 'Italic (⌘I)',
    icon: Italic,
    prefix: '*',
    suffix: '*',
  },
  {
    id: 'strikethrough',
    label: 'Strikethrough',
    icon: Strikethrough,
    prefix: '~~',
    suffix: '~~',
  },
  {
    id: 'code',
    label: 'Inline Code',
    icon: Code,
    prefix: '`',
    suffix: '`',
  },
  {
    id: 'link',
    label: 'Link',
    icon: Link,
    prefix: '[',
    suffix: '](url)',
  },
  {
    id: 'quote',
    label: 'Quote',
    icon: Quote,
    prefix: '> ',
    suffix: '',
    isBlock: true,
  },
  {
    id: 'callout',
    label: 'Note Callout',
    icon: Info,
    prefix: '> [!NOTE]\n> ',
    suffix: '',
    isBlock: true,
  },
];

interface FloatingFormatBarProps {
  position: { top: number; left: number };
  onApplyFormat: (action: FloatingFormatAction) => void;
  onCommentSelection?: () => void;
  overlappingCommentCount?: number;
  onClose: () => void;
}

export function FloatingFormatBar({
  position,
  onApplyFormat,
  onCommentSelection,
  overlappingCommentCount = 0,
  onClose,
}: FloatingFormatBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [selectedColor, setSelectedColor] = useState<HighlightColorConfig>(
    HIGHLIGHT_COLORS[0]
  );
  const [showColorPalette, setShowColorPalette] = useState(false);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  // Position nicely above the selection, avoiding going offscreen
  const safeTop = Math.max(12, position.top - 46);
  const safeLeft = Math.max(16, Math.min(position.left, window.innerWidth - 340));

  const handleSelectColor = (color: HighlightColorConfig) => {
    setSelectedColor(color);
    setShowColorPalette(false);
    onApplyFormat({
      id: `highlight-${color.id}`,
      label: `Highlight (${color.label})`,
      icon: Highlighter,
      prefix: color.prefix,
      suffix: '==',
    });
  };

  const handleQuickHighlight = () => {
    onApplyFormat({
      id: `highlight-${selectedColor.id}`,
      label: `Highlight (${selectedColor.label})`,
      icon: Highlighter,
      prefix: selectedColor.prefix,
      suffix: '==',
    });
  };

  return (
    <div
      ref={barRef}
      style={{
        top: `${safeTop}px`,
        left: `${safeLeft}px`,
      }}
      className="fixed z-50 flex flex-col items-center select-none animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="flex items-center gap-0.5 rounded-lg border border-border/80 bg-popover/95 p-1 shadow-xl backdrop-blur-md">
        {/* Bold, Italic, Strikethrough */}
        {BASE_FORMAT_ACTIONS.slice(0, 3).map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              title={action.label}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onApplyFormat(action);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md text-foreground/80 hover:bg-muted hover:text-foreground active:scale-95 transition-all"
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}

        {/* Multi-Color Highlighter Button Group */}
        <div className="relative flex items-center bg-muted/60 rounded-md p-0.5 mx-0.5">
          <button
            type="button"
            title={`Highlight: ${selectedColor.label} (Click to apply)`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleQuickHighlight();
            }}
            className="flex h-6 items-center gap-1 px-1.5 rounded text-foreground/90 hover:bg-background/80 active:scale-95 transition-all"
          >
            <Highlighter className="h-3.5 w-3.5" />
            <span
              className={cn(
                'h-2 w-2 rounded-full ring-1 ring-border shadow-xs shrink-0',
                selectedColor.dotColor
              )}
            />
          </button>

          <button
            type="button"
            title="Choose highlight color (5 colors)"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowColorPalette((prev) => !prev);
            }}
            className="flex h-6 w-4 items-center justify-center rounded text-muted-foreground hover:bg-background/80 hover:text-foreground active:scale-95 transition-all"
          >
            <ChevronDown
              className={cn(
                'h-3 w-3 transition-transform duration-150',
                showColorPalette && 'rotate-180'
              )}
            />
          </button>

          {/* Color Palette Popover */}
          {showColorPalette && (
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 flex items-center gap-1.5 p-1.5 rounded-lg border border-border/90 bg-popover/98 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-1 z-50"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={`${c.label} (${c.prefix}...==)`}
                  onClick={() => handleSelectColor(c)}
                  className={cn(
                    'group relative flex h-6 w-6 items-center justify-center rounded-full transition-transform hover:scale-115 active:scale-90',
                    selectedColor.id === c.id && 'ring-2 ring-foreground/60 ring-offset-1 ring-offset-popover'
                  )}
                >
                  <span
                    className={cn(
                      'h-4 w-4 rounded-full shadow-xs transition-shadow group-hover:shadow-md',
                      c.dotColor
                    )}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Code, Link, Quote, Callout */}
        {BASE_FORMAT_ACTIONS.slice(3).map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              title={action.label}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onApplyFormat(action);
              }}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md text-foreground/80 hover:bg-muted hover:text-foreground active:scale-95 transition-all',
                action.id === 'callout' && 'text-blue-500 hover:text-blue-600'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}

        {onCommentSelection && (
          <>
            <div className="mx-0.5 h-4 w-px bg-border/70" />
            <button
              type="button"
              title={
                overlappingCommentCount > 0
                  ? `View / Reply to Comment Thread (${overlappingCommentCount})`
                  : 'Comment on Selected Text'
              }
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCommentSelection();
              }}
              className={cn(
                'relative flex h-7 items-center justify-center gap-1 rounded-md px-1.5 active:scale-95 transition-all',
                overlappingCommentCount > 0
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25'
                  : 'text-primary hover:bg-primary/10'
              )}
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              {overlappingCommentCount > 0 && (
                <span className="text-[10px] font-mono font-bold">
                  {overlappingCommentCount}
                </span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
