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
import { toggleZenModeWithFullscreen } from '../../../lib/editor/zenFullscreen';
import { commands } from '../data/commands';

export function CommandPalette() {
  const { isCommandPaletteOpen, closeCommandPalette, openExportModal, openTemplatePicker, openHistoryPanel, openSearchPanel, openTableBuilder, openMermaidBuilder, openImportBackupModal, openCommentsPanel, openOutlinePanel, toggleTableOfContents, openPresentation, openKnowledgeGraph, openAssetManager, toggleReadability } = useUIStore();
  const { setEditorMode, toggleFocusMode, toggleTypewriterMode } = useEditorStore();

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
      case 'toggle-toc':
        toggleTableOfContents();
        break;
      case 'open-outline':
        openOutlinePanel();
        break;
      case 'knowledge-graph':
        openKnowledgeGraph();
        break;
      case 'readability-insights':
        toggleReadability();
        break;
      case 'asset-manager':
        openAssetManager();
        break;
      case 'start-presentation':
        openPresentation();
        break;
      case 'open-comments':
        openCommentsPanel();
        break;
      case 'fold-code':
        window.dispatchEvent(new CustomEvent('editor-fold-code', { detail: { mode: 'fold-all' } }));
        break;
      case 'unfold-code':
        window.dispatchEvent(new CustomEvent('editor-fold-code', { detail: { mode: 'unfold-all' } }));
        break;
      case 'focus-mode':
        toggleFocusMode();
        break;
      case 'zen-mode':
        toggleZenModeWithFullscreen();
        break;
      case 'typewriter-mode':
        toggleTypewriterMode();
        break;
      case 'insert-heading':
        window.dispatchEvent(new CustomEvent('editor-action', { detail: { actionId: 'heading', data: 2 } }));
        break;
      case 'insert-link':
        window.dispatchEvent(new CustomEvent('editor-action', { detail: { actionId: 'link' } }));
        break;
      case 'insert-image':
        window.dispatchEvent(new CustomEvent('editor-action', { detail: { actionId: 'image' } }));
        break;
      case 'insert-table':
        openTableBuilder();
        break;
      case 'format-tables':
        window.dispatchEvent(new CustomEvent('editor-action', { detail: { actionId: 'formatTables' } }));
        break;
      case 'import-documents':
        openImportBackupModal('import');
        break;
      case 'workspace-backup':
        openImportBackupModal('backup');
        break;
      case 'insert-code-block':
        window.dispatchEvent(new CustomEvent('editor-action', { detail: { actionId: 'codeBlock' } }));
        break;
      case 'mermaid-studio':
        openMermaidBuilder();
        break;
      case 'format-bold':
        window.dispatchEvent(new CustomEvent('editor-action', { detail: { actionId: 'bold' } }));
        break;
      case 'format-italic':
        window.dispatchEvent(new CustomEvent('editor-action', { detail: { actionId: 'italic' } }));
        break;
      case 'format-code':
        window.dispatchEvent(new CustomEvent('editor-action', { detail: { actionId: 'inlineCode' } }));
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
