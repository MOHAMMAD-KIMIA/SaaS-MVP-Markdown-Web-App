import { useDocumentStore } from '../../stores/documentStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { desktop } from '../desktop/bridge';

export interface ShortcutContext {
  onNavigate?: (view: 'editor' | 'dashboard' | 'publishing' | 'account' | 'documentation') => void;
}

export interface ShortcutDefinition {
  id: string;
  label: string;
  keys: string[]; // e.g. ['ctrl+n', 'meta+n']
  category: 'File' | 'View' | 'Editor' | 'Navigation';
  description: string;
  execute: (context?: ShortcutContext) => void | Promise<void>;
}

export const SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'new-document',
    label: 'New Document',
    keys: ['ctrl+n', 'meta+n'],
    category: 'File',
    description: 'Create a new untitled markdown document',
    execute: (context) => {
      const createDocument = useDocumentStore.getState().createDocument;
      createDocument('Untitled Document');
      if (context?.onNavigate) {
        context.onNavigate('editor');
      }
      desktop.showNotification('New Document', 'Created a new document.');
    },
  },
  {
    id: 'save-document',
    label: 'Manual Save',
    keys: ['ctrl+s', 'meta+s'],
    category: 'File',
    description: 'Save current document state to storage',
    execute: () => {
      const saveToStorage = useDocumentStore.getState().saveToStorage;
      saveToStorage(true, true);
      desktop.showNotification('Synced', 'Editor state synced and formatted.');
    },
  },
  {
    id: 'format-document',
    label: 'Format Markdown',
    keys: ['alt+shift+f', 'ctrl+alt+f', 'meta+alt+f'],
    category: 'Editor',
    description: 'Clean up list indentation and standardize header spacing',
    execute: () => {
      const formatActiveDocument = useDocumentStore.getState().formatActiveDocument;
      formatActiveDocument();
      desktop.showNotification('Formatted', 'Markdown syntax standardized and cleaned up.');
    },
  },
  {
    id: 'toggle-app-nav',
    label: 'Toggle Workspace Navigation',
    keys: ['ctrl+shift+b', 'meta+shift+b'],
    category: 'View',
    description: 'Collapse or expand the left workspace navigation bar',
    execute: () => {
      useUIStore.getState().toggleAppNav();
    },
  },
  {
    id: 'toggle-left-sidebar',
    label: 'Toggle Document Sidebar',
    keys: ['ctrl+b', 'meta+b'],
    category: 'View',
    description: 'Toggle the document list sidebar in the Pro Editor',
    execute: () => {
      useUIStore.getState().toggleLeftSidebar();
    },
  },
  {
    id: 'toggle-focus-mode',
    label: 'Toggle Focus Mode',
    keys: ['ctrl+shift+f', 'meta+shift+f', 'f11'],
    category: 'View',
    description: 'Toggle distraction-free focus mode',
    execute: () => {
      const toggleFocusMode = useEditorStore.getState().toggleFocusMode;
      toggleFocusMode();
      const currentFocus = useEditorStore.getState().focusMode;
      desktop.showNotification('Focus Mode', currentFocus ? 'Focus mode enabled.' : 'Focus mode disabled.');
    },
  },
  {
    id: 'open-disk-file',
    label: 'Open from Disk',
    keys: ['ctrl+o', 'meta+o'],
    category: 'File',
    description: 'Open a markdown file from local disk',
    execute: async (context) => {
      const res = await desktop.openFile();
      if (!res.canceled && res.content !== undefined) {
        const createDocument = useDocumentStore.getState().createDocument;
        const title = res.filePath ? res.filePath.split(/[\\/]/).pop()?.replace(/\.md$/i, '') || 'Imported File' : 'Imported File';
        createDocument(title, res.content);
        if (context?.onNavigate) {
          context.onNavigate('editor');
        }
        desktop.showNotification('File Opened', `Loaded ${title} from disk.`);
      }
    },
  },
  {
    id: 'export-options',
    label: 'Export Options',
    keys: ['ctrl+e', 'meta+e'],
    category: 'File',
    description: 'Open document export modal',
    execute: () => {
      useUIStore.getState().openExportModal();
    },
  },
  {
    id: 'find-replace',
    label: 'Find and Replace',
    keys: ['ctrl+f', 'meta+f'],
    category: 'Editor',
    description: 'Open search and replace panel',
    execute: (context) => {
      if (context?.onNavigate) {
        context.onNavigate('editor');
      }
      useUIStore.getState().openSearchPanel();
    },
  },
  {
    id: 'toggle-command-palette',
    label: 'Command Palette',
    keys: ['ctrl+shift+p', 'meta+shift+p'],
    category: 'Navigation',
    description: 'Open global command palette',
    execute: () => {
      const { isCommandPaletteOpen, openCommandPalette, closeCommandPalette } = useUIStore.getState();
      if (isCommandPaletteOpen) {
        closeCommandPalette();
      } else {
        openCommandPalette();
      }
    },
  },
  {
    id: 'zoom-in',
    label: 'Zoom In',
    keys: ['ctrl+=', 'meta+=', 'ctrl++', 'meta++'],
    category: 'View',
    description: 'Increase editor typography size',
    execute: () => {
      const s = useSettingsStore.getState();
      s.updateFontSize(Math.min(32, s.typography.fontSize + 2));
    },
  },
  {
    id: 'zoom-out',
    label: 'Zoom Out',
    keys: ['ctrl+-', 'meta+-'],
    category: 'View',
    description: 'Decrease editor typography size',
    execute: () => {
      const s = useSettingsStore.getState();
      s.updateFontSize(Math.max(10, s.typography.fontSize - 2));
    },
  },
  {
    id: 'zoom-reset',
    label: 'Reset Zoom',
    keys: ['ctrl+0', 'meta+0'],
    category: 'View',
    description: 'Reset typography size to default (16px)',
    execute: () => {
      useSettingsStore.getState().updateFontSize(16);
    },
  },
];

export function handleShortcutEvent(e: KeyboardEvent, context?: ShortcutContext): boolean {
  const hasMod = e.ctrlKey || e.metaKey;
  const isShift = e.shiftKey;
  const keyName = e.key.toLowerCase();

  if (!['control', 'meta', 'shift', 'alt'].includes(keyName)) {
    for (const shortcut of SHORTCUTS) {
      for (const keyCombo of shortcut.keys) {
        const comboParts = keyCombo.split('+');
        const comboHasMod = comboParts.includes('ctrl') || comboParts.includes('meta');
        const comboHasShift = comboParts.includes('shift');
        const comboKey = comboParts[comboParts.length - 1];

        if (hasMod === comboHasMod && isShift === comboHasShift && keyName === comboKey) {
          e.preventDefault();
          shortcut.execute(context);
          return true;
        }
      }
    }
  }

  return false;
}
