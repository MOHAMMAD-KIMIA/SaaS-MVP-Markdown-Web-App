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
  Sigma,
  Diff,
  AlignLeft,
  AlignRight,
  ScissorsLineDashed,
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
  editorDirection = 'rtl',
}: EditorToolbarProps) {
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
      <div className="flex items-center gap-1 border-b bg-background px-3 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={dropdownTriggerClassName}
            onMouseDown={handleMouseDown}
          >
            <Heading1 className="h-4 w-4" />
            <span>Heading</span>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" sideOffset={6}>
            {headingActions.map((action) => (
              <DropdownMenuItem key={action.id} onSelect={action.action}>
                {action.icon}
                <span>{action.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {toolbarButtons.map((item, index) =>
          item === 'separator' ? (
            <Separator
              key={`sep-${index}`}
              orientation="vertical"
              className="mx-1 h-6"
            />
          ) : (
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
          )
        )}

        <Separator orientation="vertical" className="mx-1 h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger
            className={dropdownTriggerClassName}
            onMouseDown={handleMouseDown}
          >
            <DirectionIcon className="h-4 w-4" />
            <span>{editorDirection.toUpperCase()}</span>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" sideOffset={6}>
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

          <DropdownMenuContent align="start" sideOffset={6}>
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
