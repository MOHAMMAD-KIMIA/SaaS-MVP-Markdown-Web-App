// src/features/editor/components/SlashCommandMenu.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  List,
  ListOrdered,
  Quote,
  Table,
  Code2,
  Sigma,
  Network,
  Minus,
  Info,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  Flame,
  Calendar,
  Link,
  Sparkles,
  Highlighter,
} from 'lucide-react';
import { cn } from '../../../lib/utils/cn';

export interface SlashCommand {
  id: string;
  category: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  keywords: string[];
  snippet: string;
  // Offset to place cursor relative to the end of snippet or from insertion start
  cursorOffset?: number;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  // Structure & Headings
  {
    id: 'h1',
    category: 'Basic Blocks',
    label: 'Heading 1',
    description: 'Large section header',
    icon: Heading1,
    iconColor: 'text-indigo-500',
    keywords: ['heading', 'header', 'h1', 'title', 'large'],
    snippet: '# ',
  },
  {
    id: 'h2',
    category: 'Basic Blocks',
    label: 'Heading 2',
    description: 'Medium section header',
    icon: Heading2,
    iconColor: 'text-indigo-500',
    keywords: ['heading', 'header', 'h2', 'subtitle', 'medium'],
    snippet: '## ',
  },
  {
    id: 'h3',
    category: 'Basic Blocks',
    label: 'Heading 3',
    description: 'Small subsection header',
    icon: Heading3,
    iconColor: 'text-indigo-500',
    keywords: ['heading', 'header', 'h3', 'small'],
    snippet: '### ',
  },
  {
    id: 'task-list',
    category: 'Lists & Tasks',
    label: 'To-do List',
    description: 'Interactive checklist item',
    icon: CheckSquare,
    iconColor: 'text-emerald-500',
    keywords: ['todo', 'task', 'check', 'box', 'list', 'checkbox'],
    snippet: '- [ ] ',
  },
  {
    id: 'bullet-list',
    category: 'Lists & Tasks',
    label: 'Bulleted List',
    description: 'Create a simple bullet list',
    icon: List,
    iconColor: 'text-emerald-500',
    keywords: ['bullet', 'list', 'unordered', 'item'],
    snippet: '- ',
  },
  {
    id: 'numbered-list',
    category: 'Lists & Tasks',
    label: 'Numbered List',
    description: 'Create an ordered sequential list',
    icon: ListOrdered,
    iconColor: 'text-emerald-500',
    keywords: ['numbered', 'order', 'list', 'seq', 'ol'],
    snippet: '1. ',
  },

  // Callouts
  {
    id: 'callout-note',
    category: 'Callout Boxes',
    label: 'Note Callout',
    description: 'Blue informational callout block',
    icon: Info,
    iconColor: 'text-blue-500',
    keywords: ['callout', 'note', 'info', 'blue', 'admonition'],
    snippet: '> [!NOTE]\n> ',
  },
  {
    id: 'callout-tip',
    category: 'Callout Boxes',
    label: 'Tip Callout',
    description: 'Green helpful tip or advice block',
    icon: Lightbulb,
    iconColor: 'text-emerald-500',
    keywords: ['callout', 'tip', 'hint', 'idea', 'green'],
    snippet: '> [!TIP]\n> ',
  },
  {
    id: 'callout-warning',
    category: 'Callout Boxes',
    label: 'Warning Callout',
    description: 'Amber alert for critical notices',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    keywords: ['callout', 'warning', 'warn', 'alert', 'amber', 'yellow'],
    snippet: '> [!WARNING]\n> ',
  },
  {
    id: 'callout-important',
    category: 'Callout Boxes',
    label: 'Important Callout',
    description: 'Purple highlight for priority info',
    icon: AlertCircle,
    iconColor: 'text-purple-500',
    keywords: ['callout', 'important', 'priority', 'purple'],
    snippet: '> [!IMPORTANT]\n> ',
  },
  {
    id: 'callout-caution',
    category: 'Callout Boxes',
    label: 'Caution / Danger',
    description: 'Red warning for negative outcomes or risks',
    icon: Flame,
    iconColor: 'text-rose-500',
    keywords: ['callout', 'caution', 'danger', 'error', 'red'],
    snippet: '> [!CAUTION]\n> ',
  },

  // Embeds & Advanced
  {
    id: 'table',
    category: 'Tables & Code',
    label: 'Table',
    description: 'Formatted markdown data table',
    icon: Table,
    iconColor: 'text-cyan-500',
    keywords: ['table', 'grid', 'columns', 'rows'],
    snippet: '| Header 1 | Header 2 |\n| -------- | -------- |\n| Item 1   | Item 2   |\n',
  },
  {
    id: 'code-block',
    category: 'Tables & Code',
    label: 'Code Block',
    description: 'Syntax highlighted code container',
    icon: Code2,
    iconColor: 'text-orange-500',
    keywords: ['code', 'snippet', 'pre', 'typescript', 'python', 'javascript'],
    snippet: '```typescript\n\n```',
    cursorOffset: -4, // Inside the code block
  },
  {
    id: 'math',
    category: 'Tables & Code',
    label: 'Math Equation',
    description: 'KaTeX / LaTeX mathematical formula',
    icon: Sigma,
    iconColor: 'text-pink-500',
    keywords: ['math', 'katex', 'latex', 'formula', 'equation'],
    snippet: '$$\n\n$$',
    cursorOffset: -3,
  },
  {
    id: 'mermaid',
    category: 'Tables & Code',
    label: 'Mermaid Diagram',
    description: 'Render interactive charts and flowcharts',
    icon: Network,
    iconColor: 'text-violet-500',
    keywords: ['mermaid', 'diagram', 'chart', 'flowchart', 'graph'],
    snippet: '```mermaid\ngraph TD\n  A[Start] --> B[Process]\n  B --> C[Finish]\n```\n',
  },
  {
    id: 'quote',
    category: 'Basic Blocks',
    label: 'Quote',
    description: 'Capture a citation or quote',
    icon: Quote,
    iconColor: 'text-slate-500',
    keywords: ['quote', 'blockquote', 'cite'],
    snippet: '> ',
  },
  {
    id: 'divider',
    category: 'Basic Blocks',
    label: 'Divider',
    description: 'Horizontal divider line',
    icon: Minus,
    iconColor: 'text-muted-foreground',
    keywords: ['divider', 'hr', 'line', 'separator'],
    snippet: '\n---\n',
  },
  {
    id: 'wikilink',
    category: 'Links',
    label: 'Link to Note',
    description: 'Bi-directional link to another note [[',
    icon: Link,
    iconColor: 'text-purple-500',
    keywords: ['link', 'wikilink', 'internal', 'note', 'page', 'reference'],
    snippet: '[[',
  },
  {
    id: 'date',
    category: 'Utilities',
    label: 'Today’s Date',
    description: 'Insert today’s ISO date (YYYY-MM-DD)',
    icon: Calendar,
    iconColor: 'text-blue-500',
    keywords: ['date', 'today', 'now', 'time', 'calendar'],
    snippet: new Date().toISOString().split('T')[0] + ' ',
  },

  // Multi-Color Highlights
  {
    id: 'highlight-yellow',
    category: 'Highlights',
    label: 'Highlight (Yellow)',
    description: 'Classic yellow highlight ==text== (.highlight-yellow)',
    icon: Highlighter,
    iconColor: 'text-amber-500',
    keywords: ['highlight', 'yellow', 'mark', 'hl', 'amber'],
    snippet: '==',
  },
  {
    id: 'highlight-green',
    category: 'Highlights',
    label: 'Highlight (Green)',
    description: 'Emerald green highlight ==green:text== (.highlight-green)',
    icon: Highlighter,
    iconColor: 'text-emerald-500',
    keywords: ['highlight', 'green', 'emerald', 'takeaway', 'hl'],
    snippet: '==green:',
  },
  {
    id: 'highlight-blue',
    category: 'Highlights',
    label: 'Highlight (Blue)',
    description: 'Sky blue highlight ==blue:text== (.highlight-blue)',
    icon: Highlighter,
    iconColor: 'text-sky-500',
    keywords: ['highlight', 'blue', 'sky', 'info', 'note', 'hl'],
    snippet: '==blue:',
  },
  {
    id: 'highlight-pink',
    category: 'Highlights',
    label: 'Highlight (Pink)',
    description: 'Rose pink highlight ==pink:text== (.highlight-pink)',
    icon: Highlighter,
    iconColor: 'text-rose-500',
    keywords: ['highlight', 'pink', 'rose', 'attention', 'red', 'hl'],
    snippet: '==pink:',
  },
  {
    id: 'highlight-purple',
    category: 'Highlights',
    label: 'Highlight (Purple)',
    description: 'Purple highlight for ideas & insights',
    icon: Highlighter,
    iconColor: 'text-purple-500',
    keywords: ['highlight', 'purple', 'violet', 'idea', 'hl'],
    snippet: '==purple:',
  },
];

interface SlashCommandMenuProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
}

export function SlashCommandMenu({
  query,
  position,
  onSelect,
  onClose,
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SLASH_COMMANDS;

    return SLASH_COMMANDS.filter((cmd) => {
      if (cmd.label.toLowerCase().includes(q)) return true;
      if (cmd.description.toLowerCase().includes(q)) return true;
      return cmd.keywords.some((k) => k.toLowerCase().includes(q));
    });
  }, [query]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keep selected item visible in scroll
  useEffect(() => {
    if (itemsContainerRef.current) {
      const activeElement = itemsContainerRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement | null;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredCommands.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex(
          (prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length
        );
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          onSelect(selected);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [filteredCommands, selectedIndex, onSelect, onClose]);

  // Handle outside click / right-click
  useEffect(() => {
    const handleOutsidePointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleOutsidePointer);
    window.addEventListener('contextmenu', handleOutsidePointer);
    return () => {
      window.removeEventListener('mousedown', handleOutsidePointer);
      window.removeEventListener('contextmenu', handleOutsidePointer);
    };
  }, [onClose]);

  if (filteredCommands.length === 0) {
    return (
      <div
        ref={menuRef}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        className="fixed z-50 w-72 rounded-xl border border-border bg-popover/95 p-3 text-xs text-muted-foreground shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
      >
        No matching commands for &ldquo;/{query}&rdquo;
      </div>
    );
  }

  const safeTop = Math.max(56, Math.min(position.top, window.innerHeight - 340));
  const safeLeft = Math.max(16, Math.min(position.left, window.innerWidth - 340));

  return (
    <div
      ref={menuRef}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        top: `${safeTop}px`,
        left: `${safeLeft}px`,
      }}
      className="fixed z-50 w-72 sm:w-80 rounded-xl border border-border bg-popover/95 shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-100 select-none flex flex-col"
    >
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>Quick Commands</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] opacity-70">
          <span>&uarr;&darr; navigate</span>
          <span>&bull;</span>
          <span>&crarr; insert</span>
        </div>
      </div>

      <div
        ref={itemsContainerRef}
        className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 no-scrollbar"
      >
        {filteredCommands.map((cmd, idx) => {
          const isSelected = idx === selectedIndex;
          const Icon = cmd.icon;

          return (
            <button
              key={cmd.id}
              data-index={idx}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(cmd);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(cmd);
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={cn(
                'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-foreground hover:bg-muted/70'
              )}
            >
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/50 bg-background/80',
                  isSelected && 'border-transparent bg-white/20 text-white'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4',
                    isSelected ? 'text-white' : cmd.iconColor || 'text-foreground'
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="truncate font-semibold text-xs tracking-tight">
                  {cmd.label}
                </div>
                <div
                  className={cn(
                    'truncate text-[11px] opacity-80',
                    isSelected ? 'text-white/80' : 'text-muted-foreground'
                  )}
                >
                  {cmd.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
