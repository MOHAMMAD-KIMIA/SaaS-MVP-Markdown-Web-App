'use client';

import * as React from 'react';
import {
  Bold,
  Italic,
  Link,
  Image,
  Code,
  Code2,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Table,
  Minus,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Network,
  AlertCircle,
  Strikethrough,
  Highlighter,
  ChevronDown,
  Check,
  Sigma,
  Diff,
  AlignLeft,
  AlignRight,
  ScissorsLineDashed,
  Wand2,
  Upload,
  FolderOpen,
} from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { Separator } from '../../../app/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../app/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../app/components/ui/tooltip';
import type { TextDirection } from '../../../lib/markdown/textDirection';
import { cn } from '../../../lib/utils/cn';
import {
  HIGHLIGHT_COLORS,
  HighlightColorConfig,
} from '../../../lib/markdown/highlightColors';

interface ToolbarAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface EditorToolbarProps {
  onAction: (action: string, data?: any) => void;
  editorDirection?: TextDirection;
}

export function EditorToolbar({
  onAction,
  editorDirection = 'ltr',
}: EditorToolbarProps) {
  const [activeHighlight, setActiveHighlight] = React.useState<HighlightColorConfig>(
    HIGHLIGHT_COLORS[0]
  );
  const headingActions: ToolbarAction[] = [
    {
      id: 'h1',
      label: 'Heading 1',
      icon: <Heading1 className="h-4 w-4" />,
      action: () => onAction('heading', 1),
    },
    {
      id: 'h2',
      label: 'Heading 2',
      icon: <Heading2 className="h-4 w-4" />,
      action: () => onAction('heading', 2),
    },
    {
      id: 'h3',
      label: 'Heading 3',
      icon: <Heading3 className="h-4 w-4" />,
      action: () => onAction('heading', 3),
    },
    {
      id: 'h4',
      label: 'Heading 4',
      icon: <Heading4 className="h-4 w-4" />,
      action: () => onAction('heading', 4),
    },
    {
      id: 'h5',
      label: 'Heading 5',
      icon: <Heading5 className="h-4 w-4" />,
      action: () => onAction('heading', 5),
    },
    {
      id: 'h6',
      label: 'Heading 6',
      icon: <Heading6 className="h-4 w-4" />,
      action: () => onAction('heading', 6),
    },
  ];

  const customBlockActions: ToolbarAction[] = [
    {
      id: 'note',
      label: 'Note Block',
      icon: <AlertCircle className="h-4 w-4" />,
      action: () => onAction('customBlock', 'note'),
    },
    {
      id: 'tip',
      label: 'Tip Block',
      icon: <AlertCircle className="h-4 w-4" />,
      action: () => onAction('customBlock', 'tip'),
    },
    {
      id: 'warning',
      label: 'Warning Block',
      icon: <AlertCircle className="h-4 w-4" />,
      action: () => onAction('customBlock', 'warning'),
    },
    {
      id: 'danger',
      label: 'Danger Block',
      icon: <AlertCircle className="h-4 w-4" />,
      action: () => onAction('customBlock', 'danger'),
    },
    {
      id: 'collapsible',
      label: 'Collapsible Block',
      icon: <AlertCircle className="h-4 w-4" />,
      action: () => onAction('customBlock', 'collapsible'),
    },
    {
      id: 'block',
      label: 'Custom Block',
      icon: <AlertCircle className="h-4 w-4" />,
      action: () => onAction('customBlock', 'block'),
    },
  ];

  const toolbarButtons: (ToolbarAction | 'separator')[] = [
    {
      id: 'bold',
      label: 'Bold',
      icon: <Bold className="h-4 w-4" />,
      shortcut: '⌘B',
      action: () => onAction('bold'),
    },
    {
      id: 'italic',
      label: 'Italic',
      icon: <Italic className="h-4 w-4" />,
      shortcut: '⌘I',
      action: () => onAction('italic'),
    },
    {
      id: 'strikethrough',
      label: 'Strikethrough',
      icon: <Strikethrough className="h-4 w-4" />,
      action: () => onAction('strikethrough'),
    },
    {
      id: 'highlight',
      label: 'Highlight (==text==)',
      icon: <Highlighter className="h-4 w-4 text-amber-500" />,
      action: () => onAction('highlight'),
    },
    'separator',
    {
      id: 'link',
      label: 'Insert Link',
      icon: <Link className="h-4 w-4" />,
      shortcut: '⌘K',
      action: () => onAction('link'),
    },
    {
      id: 'image',
      label: 'Insert Image',
      icon: <Image className="h-4 w-4" />,
      action: () => onAction('image'),
    },
    'separator',
    {
      id: 'code',
      label: 'Inline Code',
      icon: <Code className="h-4 w-4" />,
      action: () => onAction('inlineCode'),
    },
    {
      id: 'codeblock',
      label: 'Code Block',
      icon: <Code2 className="h-4 w-4" />,
      action: () => onAction('codeBlock'),
    },
    'separator',
    {
      id: 'inlineMath',
      label: 'Inline Math',
      icon: <Diff className="h-4 w-4" />,
      action: () => onAction('inlineMath'),
    },
    {
      id: 'mathBlock',
      label: 'Math Block',
      icon: <Sigma className="h-4 w-4" />,
      action: () => onAction('mathBlock'),
    },
    'separator',
    {
      id: 'quote',
      label: 'Blockquote',
      icon: <Quote className="h-4 w-4" />,
      action: () => onAction('blockquote'),
    },
    {
      id: 'bulletlist',
      label: 'Bullet List',
      icon: <List className="h-4 w-4" />,
      action: () => onAction('bulletList'),
    },
    {
      id: 'numberedlist',
      label: 'Numbered List',
      icon: <ListOrdered className="h-4 w-4" />,
      action: () => onAction('numberedList'),
    },
    {
      id: 'tasklist',
      label: 'Task List',
      icon: <CheckSquare className="h-4 w-4" />,
      action: () => onAction('taskList'),
    },
    'separator',
    {
      id: 'table',
      label: 'Insert Table',
      icon: <Table className="h-4 w-4" />,
      action: () => onAction('table'),
    },
    {
      id: 'hr',
      label: 'Horizontal Rule',
      icon: <Minus className="h-4 w-4" />,
      action: () => onAction('horizontalRule'),
    },
    {
      id: 'pageBreak',
      label: 'Page Break',
      icon: <ScissorsLineDashed className="h-4 w-4" />,
      action: () => onAction('pageBreak'),
    },
    {
      id: 'mermaid',
      label: 'Mermaid Diagram',
      icon: <Network className="h-4 w-4" />,
      action: () => onAction('mermaid'),
    },
  ];

  const directionActions: ToolbarAction[] = [
    {
      id: 'rtl',
      label: 'Right to Left / RTL',
      icon: <AlignRight className="h-4 w-4" />,
      action: () => onAction('setDirection', 'rtl'),
    },
    {
      id: 'ltr',
      label: 'Left to Right / LTR',
      icon: <AlignLeft className="h-4 w-4" />,
      action: () => onAction('setDirection', 'ltr'),
    },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const dropdownTriggerClassName =
    'inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9';

  const DirectionIcon = editorDirection === 'rtl' ? AlignRight : AlignLeft;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 border-b bg-background px-2 sm:px-3 py-1.5 overflow-x-auto no-scrollbar whitespace-nowrap shrink-0 min-w-0 w-full">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={dropdownTriggerClassName}
            onMouseDown={handleMouseDown}
          >
            <Heading1 className="h-4 w-4" />
            <span>Heading</span>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            sideOffset={6}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {headingActions.map((action) => (
              <DropdownMenuItem key={action.id} onSelect={action.action}>
                {action.icon}
                <span>{action.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {toolbarButtons.map((item, index) => {
          if (item === 'separator') {
            return (
              <Separator
                key={`sep-${index}`}
                orientation="vertical"
                className="mx-1 h-6"
              />
            );
          }

          if (item.id === 'highlight') {
            return (
              <div
                key="highlight-selector"
                className="inline-flex items-center rounded-md border border-border/60 bg-muted/30 p-0.5 shadow-2xs"
              >
                {/* 1-click apply active highlight color */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onAction('highlight', activeHighlight.id)}
                      onMouseDown={handleMouseDown}
                      className="inline-flex h-7 items-center gap-1 rounded px-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <div className="relative flex items-center justify-center">
                        <Highlighter className="h-4 w-4" />
                        <span
                          className={cn(
                            'absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-1 ring-background shadow-xs',
                            activeHighlight.dotColor
                          )}
                        />
                      </div>
                      <span className="text-xs hidden md:inline font-medium">
                        {activeHighlight.label}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Highlight: {activeHighlight.label} ({activeHighlight.prefix}...==)</p>
                    <p className="text-xs text-muted-foreground">Class: .{activeHighlight.className}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Dropdown for 4 distinct pre-defined colors */}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger
                        className="inline-flex h-7 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        onMouseDown={handleMouseDown}
                      >
                        <ChevronDown className="h-3 w-3 opacity-70" />
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Choose highlight color (4 colors)</p>
                    </TooltipContent>
                  </Tooltip>

                  <DropdownMenuContent
                    align="start"
                    sideOffset={6}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                    className="w-64 p-2"
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b mb-2">
                      <span className="text-xs font-semibold text-foreground">
                        Highlight Color
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        ==text==
                      </span>
                    </div>

                    {/* Quick-palette swatches row for the 4 colors */}
                    <div className="grid grid-cols-4 gap-1.5 pb-2 mb-2 border-b">
                      {HIGHLIGHT_COLORS.map((c) => (
                        <button
                          key={`swatch-${c.id}`}
                          type="button"
                          title={`${c.label} (.${c.className})`}
                          onClick={() => {
                            setActiveHighlight(c);
                            onAction('highlight', c.id);
                          }}
                          className={cn(
                            'flex flex-col items-center justify-center gap-1 p-1.5 rounded-md border transition-all hover:scale-105 active:scale-95',
                            activeHighlight.id === c.id
                              ? 'border-foreground/40 bg-accent ring-1 ring-foreground/30'
                              : 'border-transparent hover:bg-muted'
                          )}
                        >
                          <span
                            className={cn(
                              'h-5 w-5 rounded-full shadow-xs ring-1 ring-black/10 dark:ring-white/10 shrink-0',
                              c.dotColor
                            )}
                          />
                          <span className="text-[11px] font-medium text-foreground/80">
                            {c.label}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Detailed list with CSS class tags and syntax preview */}
                    <div className="space-y-0.5">
                      {HIGHLIGHT_COLORS.map((c) => (
                        <DropdownMenuItem
                          key={c.id}
                          onSelect={() => {
                            setActiveHighlight(c);
                            onAction('highlight', c.id);
                          }}
                          className="flex items-center justify-between gap-2 py-1.5 px-2 cursor-pointer rounded-md"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={cn(
                                'h-3.5 w-3.5 rounded-full ring-1 ring-black/10 dark:ring-white/10 shrink-0',
                                c.dotColor
                              )}
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-medium leading-none text-foreground">
                                {c.label}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground mt-0.5">
                                .{c.className}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-muted/80 text-foreground/70">
                              {c.prefix}...==
                            </span>
                            {activeHighlight.id === c.id && (
                              <Check className="h-3.5 w-3.5 text-foreground" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          }

          if (item.id === 'image') {
            return (
              <div
                key="image-selector"
                className="inline-flex items-center rounded-md border border-border/60 bg-muted/30 p-0.5 shadow-2xs"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onAction('uploadImage')}
                      onMouseDown={handleMouseDown}
                      className="inline-flex h-7 items-center gap-1 rounded px-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                      aria-label="Upload or Embed Image"
                    >
                      <Image className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload &amp; Embed Local Image (or paste / drag-and-drop)</p>
                  </TooltipContent>
                </Tooltip>

                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger
                        className="inline-flex h-7 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        onMouseDown={handleMouseDown}
                        aria-label="Image and Asset options"
                      >
                        <ChevronDown className="h-3 w-3 opacity-70" />
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Image &amp; Local Asset Manager</p>
                    </TooltipContent>
                  </Tooltip>

                  <DropdownMenuContent
                    align="start"
                    sideOffset={6}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                    className="w-56"
                  >
                    <DropdownMenuItem onSelect={() => onAction('uploadImage')}>
                      <Upload className="h-4 w-4 text-primary" />
                      <span>Upload Image File...</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onAction('openAssetManager')}>
                      <FolderOpen className="h-4 w-4 text-indigo-500" />
                      <span>Local Asset Manager...</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onAction('image')}>
                      <Image className="h-4 w-4 text-muted-foreground" />
                      <span>Insert Markdown Syntax</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          }

          if (item.id === 'table') {
            return (
              <div
                key="table-selector"
                className="inline-flex items-center rounded-md border border-border/60 bg-muted/30 p-0.5 shadow-2xs"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onAction('openTableBuilder')}
                      onMouseDown={handleMouseDown}
                      className="inline-flex h-7 items-center gap-1 rounded px-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                      aria-label="Visual Table Builder"
                    >
                      <Table className="h-4 w-4 text-primary" />
                      <span className="text-xs hidden lg:inline font-medium">Table</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Visual Table Builder (Insert or edit table at cursor)</p>
                  </TooltipContent>
                </Tooltip>

                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger
                        className="inline-flex h-7 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        onMouseDown={handleMouseDown}
                        aria-label="Table options"
                      >
                        <ChevronDown className="h-3 w-3 opacity-70" />
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Table Builder &amp; Formatter</p>
                    </TooltipContent>
                  </Tooltip>

                  <DropdownMenuContent
                    align="start"
                    sideOffset={6}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                    className="w-56"
                  >
                    <DropdownMenuItem onSelect={() => onAction('openTableBuilder')}>
                      <Table className="h-4 w-4 text-primary" />
                      <span>Visual Table Builder...</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onAction('formatTables')}>
                      <Wand2 className="h-4 w-4 text-emerald-500" />
                      <span>Format Markdown Tables</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onAction('table')}>
                      <Table className="h-4 w-4 text-muted-foreground" />
                      <span>Quick Insert Raw Table</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          }

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={item.action}
                  onMouseDown={handleMouseDown}
                >
                  {item.icon}
                </Button>
              </TooltipTrigger>

              <TooltipContent>
                <p>{item.label}</p>
                {item.shortcut && (
                  <p className="text-xs text-muted-foreground">
                    {item.shortcut}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}

        <Separator orientation="vertical" className="mx-1 h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger
            className={dropdownTriggerClassName}
            onMouseDown={handleMouseDown}
          >
            <DirectionIcon className="h-4 w-4" />
            <span>{editorDirection.toUpperCase()}</span>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            sideOffset={6}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {directionActions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                className={
                  editorDirection === action.id
                    ? 'bg-accent text-accent-foreground'
                    : undefined
                }
                onSelect={action.action}
              >
                {action.icon}
                <span>{action.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger
            className={dropdownTriggerClassName}
            onMouseDown={handleMouseDown}
          >
            <AlertCircle className="h-4 w-4" />
            <span>Block</span>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            sideOffset={6}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {customBlockActions.map((action) => (
              <DropdownMenuItem key={action.id} onSelect={action.action}>
                {action.icon}
                <span>{action.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}
