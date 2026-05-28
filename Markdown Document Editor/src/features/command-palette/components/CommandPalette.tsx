import { useEffect, useState } from 'react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../../app/components/ui/command';
import { useUIStore } from '../../../stores/uiStore';
import { useEditorStore } from '../../../stores/editorStore';
import { commands } from '../data/commands';

export function CommandPalette() {
  const { isCommandPaletteOpen, closeCommandPalette, openExportModal, openTemplatePicker, openHistoryPanel, openSearchPanel } = useUIStore();
  const { setEditorMode, toggleFocusMode } = useEditorStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const { openCommandPalette, closeCommandPalette, isCommandPaletteOpen } = useUIStore.getState();
        if (isCommandPaletteOpen) {
          closeCommandPalette();
        } else {
          openCommandPalette();
        }
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleCommand = (commandId: string) => {
    switch (commandId) {
      case 'mode-markdown':
        setEditorMode('markdown');
        break;
      case 'mode-preview':
        setEditorMode('preview');
        break;
      case 'mode-split':
        setEditorMode('split');
        break;
      case 'export-html':
      case 'export-pdf':
        openExportModal();
        break;
      case 'templates':
        openTemplatePicker();
        break;
      case 'history':
        openHistoryPanel();
        break;
      case 'search':
        openSearchPanel();
        break;
      case 'focus-mode':
        toggleFocusMode();
        break;
    }
    closeCommandPalette();
  };

  const groupedCommands = commands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, typeof commands>);

  return (
    <CommandDialog open={isCommandPaletteOpen} onOpenChange={closeCommandPalette}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
          <CommandGroup key={category} heading={category}>
            {categoryCommands.map((cmd) => (
              <CommandItem
                key={cmd.id}
                onSelect={() => handleCommand(cmd.id)}
              >
                <span>{cmd.label}</span>
                {cmd.shortcut && (
                  <span className="ml-auto text-xs text-muted-foreground">{cmd.shortcut}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
