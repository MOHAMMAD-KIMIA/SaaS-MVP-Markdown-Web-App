/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  FileText,
  FolderOpen,
  Save,
  Download,
  Settings as SettingsIcon,
  LogOut,
  Scissors,
  Copy,
  Clipboard,
  Search,
  Terminal,
  Columns,
  Eye,
  Edit3,
  Maximize2,
  Sun,
  Moon,
  Coffee,
  Table,
  GitBranch,
  Hash,
  Link as LinkIcon,
  Code,
  CheckSquare,
  Minus,
  LayoutDashboard,
  Globe,
  ShieldCheck,
  Users,
  BookOpen,
  Keyboard,
  Info,
  Sparkles,
  HardDrive,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Highlighter,
  BookA,
  FileUp,
  Archive,
  Wand2,
  MessageSquare,
  ChevronsDownUp,
  ListTree,
  Presentation,
  AlignVerticalJustifyCenter,
  Network,
  Image as ImageIcon,
} from 'lucide-react';
import { desktop } from '../../lib/desktop/bridge';
import { useDocumentStore } from '../../stores/documentStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore, AppView } from '../../stores/uiStore';
import { exportToHtml } from '../../features/export/utils/exportHtml';
import { buildExportHtml } from '../../features/export/utils/buildExportHtml';
import { OfflineSyncStatus } from '../offline/OfflineSyncStatus';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '../../app/components/ui/dropdown-menu';

interface DesktopMenuBarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

type MenuActionItem =
  | {
      type: 'separator';
    }
  | {
      type?: 'item';
      label: string;
      shortcut?: string;
      icon?: React.ComponentType<{ className?: string }>;
      action: () => void;
    };

export function DesktopMenuBar({ currentView: _currentView, onNavigate }: DesktopMenuBarProps) {
  const createDocument = useDocumentStore((state) => state.createDocument);
  const activeDocumentId = useDocumentStore((state) => state.activeDocumentId);
  const documents = useDocumentStore((state) => state.documents);
  const updateDocumentContent = useDocumentStore((state) => state.updateDocumentContent);

  const settings = useSettingsStore((state) => state);
  const updateTheme = useSettingsStore((state) => state.updateTheme);

  const setEditorMode = useEditorStore((state) => state.setEditorMode);
  const toggleFocusMode = useEditorStore((state) => state.toggleFocusMode);
  const toggleTypewriterMode = useEditorStore((state) => state.toggleTypewriterMode);
  const toggleSettingsSidebar = useUIStore((state) => state.toggleSettingsSidebar);
  const isAppNavOpen = useUIStore((state) => state.isAppNavOpen);
  const toggleAppNav = useUIStore((state) => state.toggleAppNav);

  const activeDoc = documents.find((d) => d.id === activeDocumentId);
  const content = activeDoc ? activeDoc.content : '';

  const markDocClean = () => {
    if (!activeDoc) return;
    useDocumentStore.setState((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === activeDoc.id ? { ...doc, isDirty: false } : doc
      ),
    }));
  };

  const handleOpenDiskFile = async () => {
    onNavigate('editor');
    const res = await desktop.openFile();
    if (!res.canceled && res.content !== undefined) {
      const newId = createDocument(res.fileName || 'Imported Document');
      updateDocumentContent(newId, res.content);
      useDocumentStore.setState((state) => ({
        documents: state.documents.map((doc) =>
          doc.id === newId ? { ...doc, isDirty: false } : doc
        ),
      }));
      desktop.showNotification('File Opened', `Successfully loaded ${res.fileName} from disk.`);
    }
  };

  const handleSaveDiskFile = async () => {
    if (!activeDoc) return;
    const res = await desktop.saveFile(content, undefined, `${activeDoc.title}.md`);
    if (!res.canceled) {
      markDocClean();
      desktop.showNotification('Saved to Disk', `Document saved to ${res.filePath || activeDoc.title}`);
    }
  };

  const handleExportHtml = async () => {
    if (!activeDoc) return;
    await exportToHtml(activeDoc, settings);
    desktop.showNotification('Export Complete', `Exported ${activeDoc.title}.html to local disk.`);
  };

  const handleExportPdf = async () => {
    if (!activeDoc) return;
    const html = await buildExportHtml(activeDoc, settings);
    await desktop.exportPdf(html, `${activeDoc.title}.pdf`);
    desktop.showNotification('PDF Generated', `Sent document to PDF printer / file stream.`);
  };

  const triggerEditorAction = (actionId: string, data?: unknown) => {
    onNavigate('editor');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('editor-action', { detail: { actionId, data } }));
    }, 10);
  };

  const menuItems: { id: string; label: string; items: MenuActionItem[] }[] = [
    {
      id: 'file',
      label: 'File',
      items: [
        {
          label: 'New Document',
          shortcut: 'Ctrl+N',
          icon: FileText,
          action: () => {
            onNavigate('editor');
            createDocument('Untitled Document');
          },
        },
        {
          label: 'New from Template...',
          icon: FileText,
          action: () => useUIStore.getState().openTemplatePicker(),
        },
        {
          label: 'Open from Disk...',
          shortcut: 'Ctrl+O',
          icon: FolderOpen,
          action: handleOpenDiskFile,
        },
        {
          label: 'Save to Disk...',
          shortcut: 'Ctrl+S',
          icon: HardDrive,
          action: handleSaveDiskFile,
        },
        {
          label: 'Save As...',
          shortcut: 'Ctrl+Shift+S',
          icon: Save,
          action: handleSaveDiskFile,
        },
        {
          label: 'Import Document (.md, .txt, .html, .docx)...',
          icon: FileUp,
          action: () => useUIStore.getState().openImportBackupModal('import'),
        },
        {
          label: 'Workspace Backup & Restore (.zip)...',
          icon: Archive,
          action: () => useUIStore.getState().openImportBackupModal('backup'),
        },
        { type: 'separator' },
        {
          label: 'Version History...',
          icon: Sparkles,
          action: () => useUIStore.getState().openHistoryPanel(),
        },
        { type: 'separator' },
        {
          label: 'Export as Standalone HTML...',
          icon: Globe,
          action: handleExportHtml,
        },
        {
          label: 'Export as PDF Document...',
          shortcut: 'Ctrl+P',
          icon: Download,
          action: handleExportPdf,
        },
        {
          label: 'Export Options Dialog...',
          shortcut: 'Ctrl+E',
          icon: Download,
          action: () => useUIStore.getState().openExportModal(),
        },
        { type: 'separator' },
        {
          label: 'Desktop Preferences...',
          shortcut: 'Ctrl+,',
          icon: SettingsIcon,
          action: () => toggleSettingsSidebar(),
        },
        {
          label: 'Exit Markora Desktop',
          shortcut: 'Alt+F4',
          icon: LogOut,
          action: () => desktop.closeWindow(),
        },
      ],
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', action: () => document.execCommand('undo') },
        { label: 'Redo', shortcut: 'Ctrl+Y', action: () => document.execCommand('redo') },
        { type: 'separator' },
        { label: 'Cut', shortcut: 'Ctrl+X', icon: Scissors, action: () => document.execCommand('cut') },
        { label: 'Copy', shortcut: 'Ctrl+C', icon: Copy, action: () => document.execCommand('copy') },
        { label: 'Paste', shortcut: 'Ctrl+V', icon: Clipboard, action: () => document.execCommand('paste') },
        { type: 'separator' },
        {
          label: 'Find and Replace...',
          shortcut: 'Ctrl+F',
          icon: Search,
          action: () => {
            onNavigate('editor');
            useUIStore.getState().openSearchPanel();
          },
        },
        {
          label: 'Open Command Palette',
          shortcut: 'Ctrl+K',
          icon: Terminal,
          action: () => useUIStore.getState().openCommandPalette(),
        },
        { type: 'separator' },
        {
          label: 'Review Comments & Notes...',
          icon: MessageSquare,
          action: () => useUIStore.getState().openCommentsPanel(),
        },
        {
          label: 'My Dictionary...',
          icon: BookA,
          action: () => onNavigate('dictionary'),
        },
      ],
    },
    {
      id: 'view',
      label: 'View',
      items: [
        {
          label: 'Split Editor & Preview',
          icon: Columns,
          action: () => {
            setEditorMode('split');
            onNavigate('editor');
          },
        },
        {
          label: 'Live Preview Only',
          icon: Eye,
          action: () => {
            setEditorMode('preview');
            onNavigate('editor');
          },
        },
        {
          label: 'Editor Only Mode',
          icon: Edit3,
          action: () => {
            setEditorMode('markdown');
            onNavigate('editor');
          },
        },
        { type: 'separator' },
        {
          label: 'Toggle Workspace Navigation',
          shortcut: 'Ctrl+Shift+B',
          icon: PanelLeft,
          action: () => toggleAppNav(),
        },
        {
          label: 'Toggle Document Sidebar',
          shortcut: 'Ctrl+B',
          icon: Columns,
          action: () => useUIStore.getState().toggleLeftSidebar(),
        },
        {
          label: 'Document Outline & Minimap',
          icon: ListTree,
          action: () => useUIStore.getState().openOutlinePanel(),
        },
        {
          label: 'Interactive Knowledge Graph...',
          icon: Network,
          action: () => useUIStore.getState().openKnowledgeGraph(),
        },
        {
          label: 'Readability & Writing Style Insights',
          icon: BookOpen,
          action: () => {
            onNavigate('editor');
            useUIStore.getState().toggleReadability();
          },
        },
        {
          label: 'Present Slide Deck (--- Slides)',
          shortcut: 'Alt+P',
          icon: Presentation,
          action: () => {
            onNavigate('editor');
            useUIStore.getState().openPresentation();
          },
        },
        {
          label: 'Toggle Focus Mode (Dim Paragraphs)',
          shortcut: 'F11',
          icon: Maximize2,
          action: () => toggleFocusMode(),
        },
        {
          label: 'Toggle Typewriter Scrolling',
          icon: AlignVerticalJustifyCenter,
          action: () => toggleTypewriterMode(),
        },
        {
          label: 'Toggle Fold All Code Blocks',
          shortcut: 'Ctrl+Shift+[',
          icon: ChevronsDownUp,
          action: () => {
            onNavigate('editor');
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('editor-fold-code', { detail: { mode: 'toggle-all' } }));
            }, 10);
          },
        },
        { type: 'separator' },
        {
          label: 'Zoom In',
          shortcut: 'Ctrl+=',
          icon: Eye,
          action: () => {
            const s = useSettingsStore.getState();
            s.updateFontSize(Math.min(32, s.typography.fontSize + 2));
          },
        },
        {
          label: 'Zoom Out',
          shortcut: 'Ctrl+-',
          icon: Eye,
          action: () => {
            const s = useSettingsStore.getState();
            s.updateFontSize(Math.max(10, s.typography.fontSize - 2));
          },
        },
        {
          label: 'Reset Zoom',
          shortcut: 'Ctrl+0',
          icon: Eye,
          action: () => useSettingsStore.getState().updateFontSize(16),
        },
        { type: 'separator' },
        { label: 'Theme: Light Canvas', icon: Sun, action: () => updateTheme('light') },
        { label: 'Theme: Dark Twilight', icon: Moon, action: () => updateTheme('dark') },
        { label: 'Theme: Warm Sepia', icon: Coffee, action: () => updateTheme('sepia') },
      ],
    },
    {
      id: 'insert',
      label: 'Insert',
      items: [
        { label: 'Visual Table Builder...', icon: Table, action: () => triggerEditorAction('openTableBuilder') },
        { label: 'Format Markdown Tables', icon: Wand2, action: () => triggerEditorAction('formatTables') },
        { label: 'Quick Markdown Table (3x3)', icon: Table, action: () => triggerEditorAction('table') },
        { type: 'separator' },
        { label: 'Mermaid Diagram (Flowchart)', icon: GitBranch, action: () => triggerEditorAction('mermaid') },
        { label: 'LaTeX Math Formula', icon: Hash, action: () => triggerEditorAction('mathBlock') },
        { label: 'Highlight Text ==text==', icon: Highlighter, action: () => triggerEditorAction('highlight') },
        { label: 'Wiki-style Link [[Page]]', icon: LinkIcon, action: () => triggerEditorAction('link') },
        { label: 'Fenced Code Block', icon: Code, action: () => triggerEditorAction('codeBlock') },
        { label: 'Interactive Task List', icon: CheckSquare, action: () => triggerEditorAction('taskList') },
        { label: 'Upload & Embed Image...', icon: ImageIcon, action: () => triggerEditorAction('uploadImage') },
        { label: 'Local Asset Manager...', icon: ImageIcon, action: () => useUIStore.getState().openAssetManager() },
        { label: 'Horizontal Divider', icon: Minus, action: () => triggerEditorAction('horizontalRule') },
      ],
    },
    {
      id: 'saas',
      label: 'SaaS Suite',
      items: [
        { label: 'Markora Pro Editor Workspace', icon: Edit3, action: () => onNavigate('editor') },
        { label: 'My Dictionary & Custom Words', icon: BookA, action: () => onNavigate('dictionary') },
        { label: 'SaaS Analytics Dashboard', icon: LayoutDashboard, action: () => onNavigate('dashboard') },
        { label: 'Cloud Publishing Hub', icon: Globe, action: () => onNavigate('publishing') },
        { label: 'Team Collaboration Workspace', icon: Users, action: () => onNavigate('dashboard') },
        { type: 'separator' },
        { label: 'Account & Pro License Activation', icon: ShieldCheck, action: () => onNavigate('account') },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        { label: 'Markora Documentation', icon: BookOpen, action: () => onNavigate('documentation') },
        { label: 'Keyboard Shortcuts Guide', icon: Keyboard, action: () => onNavigate('documentation') },
        { type: 'separator' },
        {
          label: 'About Markora Desktop v2.0',
          icon: Info,
          action: () =>
            desktop.showNotification(
              'About Markora Desktop v2.0',
              'Native Windows Desktop Edition\nBuilt with React 19, TypeScript, Tailwind CSS, and Electron/Tauri Hybrid Bridge.\n\n© 2026 Markora SaaS Suite.'
            ),
        },
      ],
    },
  ];

  return (
    <nav className="min-h-8 bg-background text-foreground border-b border-border flex flex-wrap items-center justify-between px-2 py-0.5 select-none text-xs z-40 relative shadow-sm">
      <div className="flex flex-wrap items-center gap-0.5">
        <button
          type="button"
          onClick={() => toggleAppNav()}
          title={
            isAppNavOpen
              ? 'Collapse Workspace Navigation (Ctrl+Shift+B)'
              : 'Expand Workspace Navigation (Ctrl+Shift+B)'
          }
          className="p-1 mr-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center shrink-0"
        >
          {isAppNavOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeftOpen className="w-4 h-4 text-primary" />
          )}
        </button>

        {menuItems.map((menu) => (
          <DropdownMenu key={menu.id} modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="px-2 py-1 text-xs font-normal rounded transition-colors cursor-pointer outline-none hover:bg-muted hover:text-foreground data-[state=open]:bg-primary data-[state=open]:text-primary-foreground data-[state=open]:font-medium"
              >
                {menu.label}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              sideOffset={4}
              className="z-[9999] w-60 sm:w-64 bg-popover text-popover-foreground border border-border rounded-lg shadow-2xl p-1.5"
            >
              {menu.items.map((item, idx) => {
                if (item.type === 'separator') {
                  return <DropdownMenuSeparator key={idx} className="my-1" />;
                }
                const Icon = item.icon || Sparkles;
                return (
                  <DropdownMenuItem
                    key={idx}
                    onSelect={item.action}
                    className="px-2.5 py-1.5 text-xs rounded-md cursor-pointer flex items-center justify-between gap-2 focus:bg-primary focus:text-primary-foreground group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Icon className="w-4 h-4 shrink-0 opacity-75 group-focus:opacity-100" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.shortcut && (
                      <DropdownMenuShortcut className="text-[10px] font-mono opacity-75">
                        {item.shortcut}
                      </DropdownMenuShortcut>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </div>

      <div className="ml-auto flex items-center space-x-2 sm:space-x-3 text-muted-foreground pr-2 shrink-0">
        <OfflineSyncStatus />
        <span className="hidden sm:flex items-center space-x-1 px-2 py-0.5 rounded bg-muted text-[10px] text-foreground font-mono">
          <span>Ctrl+K</span>
          <span className="text-muted-foreground">Palette</span>
        </span>
      </div>
    </nav>
  );
}
