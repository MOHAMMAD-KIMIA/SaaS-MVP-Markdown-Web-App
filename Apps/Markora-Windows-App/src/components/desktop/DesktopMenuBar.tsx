/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, FolderOpen, Save, Download, Settings as SettingsIcon, LogOut, 
  Scissors, Copy, Clipboard, Search, Terminal, Columns, Eye, Edit3, Maximize2, 
  Sun, Moon, Coffee, Table, GitBranch, Hash, Link as LinkIcon, Code, CheckSquare, 
  Minus, LayoutDashboard, Globe, ShieldCheck, Users, HelpCircle, BookOpen, Keyboard, Info,
  Sparkles, HardDrive, PanelLeft, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { desktop } from '../../lib/desktop/bridge';
import { useDocumentStore } from '../../stores/documentStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { exportToHtml } from '../../features/export/utils/exportHtml';
import { buildExportHtml } from '../../features/export/utils/buildExportHtml';
import { OfflineSyncStatus } from '../offline/OfflineSyncStatus';

interface DesktopMenuBarProps {
  currentView: 'editor' | 'dashboard' | 'publishing' | 'account' | 'documentation';
  onNavigate: (view: 'editor' | 'dashboard' | 'publishing' | 'account' | 'documentation') => void;
}

export function DesktopMenuBar({ currentView, onNavigate }: DesktopMenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const createDocument = useDocumentStore((state) => state.createDocument);
  const activeDocumentId = useDocumentStore((state) => state.activeDocumentId);
  const documents = useDocumentStore((state) => state.documents);
  const updateDocumentContent = useDocumentStore((state) => state.updateDocumentContent);

  const settings = useSettingsStore((state) => state);
  const updateTheme = useSettingsStore((state) => state.updateTheme);

  const setEditorMode = useEditorStore((state) => state.setEditorMode);
  const toggleFocusMode = useEditorStore((state) => state.toggleFocusMode);
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
      )
    }));
  };

  const handleOpenDiskFile = async () => {
    setOpenMenu(null);
    onNavigate('editor');
    const res = await desktop.openFile();
    if (!res.canceled && res.content !== undefined) {
      const newId = createDocument(res.fileName || 'Imported Document');
      updateDocumentContent(newId, res.content);
      useDocumentStore.setState((state) => ({
        documents: state.documents.map((doc) =>
          doc.id === newId ? { ...doc, isDirty: false } : doc
        )
      }));
      desktop.showNotification('File Opened', `Successfully loaded ${res.fileName} from disk.`);
    }
  };

  const handleSaveDiskFile = async () => {
    setOpenMenu(null);
    if (!activeDoc) return;
    const res = await desktop.saveFile(content, undefined, `${activeDoc.title}.md`);
    if (!res.canceled) {
      markDocClean();
      desktop.showNotification('Saved to Disk', `Document saved to ${res.filePath || activeDoc.title}`);
    }
  };

  const handleExportHtml = async () => {
    setOpenMenu(null);
    if (!activeDoc) return;
    await exportToHtml(activeDoc, settings);
    desktop.showNotification('Export Complete', `Exported ${activeDoc.title}.html to local disk.`);
  };

  const handleExportPdf = async () => {
    setOpenMenu(null);
    if (!activeDoc) return;
    const html = await buildExportHtml(activeDoc, settings);
    await desktop.exportPdf(html, `${activeDoc.title}.pdf`);
    desktop.showNotification('PDF Generated', `Sent document to PDF printer / file stream.`);
  };

  const triggerEditorAction = (actionId: string, data?: any) => {
    setOpenMenu(null);
    onNavigate('editor');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('editor-action', { detail: { actionId, data } }));
    }, 10);
  };

  const menuItems = [
    {
      id: 'file',
      label: 'File',
      items: [
        { label: 'New Document', shortcut: 'Ctrl+N', icon: FileText, action: () => { setOpenMenu(null); onNavigate('editor'); createDocument('Untitled Document'); } },
        { label: 'New from Template...', shortcut: '', icon: FileText, action: () => { setOpenMenu(null); useUIStore.getState().openTemplatePicker(); } },
        { label: 'Open from Disk...', shortcut: 'Ctrl+O', icon: FolderOpen, action: handleOpenDiskFile },
        { label: 'Save to Disk...', shortcut: 'Ctrl+S', icon: HardDrive, action: handleSaveDiskFile },
        { label: 'Save As...', shortcut: 'Ctrl+Shift+S', icon: Save, action: handleSaveDiskFile },
        { type: 'separator' },
        { label: 'Version History...', shortcut: '', icon: Sparkles, action: () => { setOpenMenu(null); useUIStore.getState().openHistoryPanel(); } },
        { type: 'separator' },
        { label: 'Export as Standalone HTML...', shortcut: '', icon: Globe, action: handleExportHtml },
        { label: 'Export as PDF Document...', shortcut: 'Ctrl+P', icon: Download, action: handleExportPdf },
        { label: 'Export Options Dialog...', shortcut: 'Ctrl+E', icon: Download, action: () => { setOpenMenu(null); useUIStore.getState().openExportModal(); } },
        { type: 'separator' },
        { label: 'Desktop Preferences...', shortcut: 'Ctrl+,', icon: SettingsIcon, action: () => { setOpenMenu(null); toggleSettingsSidebar(); } },
        { label: 'Exit Markora Desktop', shortcut: 'Alt+F4', icon: LogOut, action: () => desktop.closeWindow() }
      ]
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', action: () => { setOpenMenu(null); document.execCommand('undo'); } },
        { label: 'Redo', shortcut: 'Ctrl+Y', action: () => { setOpenMenu(null); document.execCommand('redo'); } },
        { type: 'separator' },
        { label: 'Cut', shortcut: 'Ctrl+X', icon: Scissors, action: () => { setOpenMenu(null); document.execCommand('cut'); } },
        { label: 'Copy', shortcut: 'Ctrl+C', icon: Copy, action: () => { setOpenMenu(null); document.execCommand('copy'); } },
        { label: 'Paste', shortcut: 'Ctrl+V', icon: Clipboard, action: () => { setOpenMenu(null); document.execCommand('paste'); } },
        { type: 'separator' },
        { label: 'Find and Replace...', shortcut: 'Ctrl+F', icon: Search, action: () => { setOpenMenu(null); onNavigate('editor'); useUIStore.getState().openSearchPanel(); } },
        { label: 'Open Command Palette', shortcut: 'Ctrl+K', icon: Terminal, action: () => { setOpenMenu(null); useUIStore.getState().openCommandPalette(); } }
      ]
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { label: 'Split Editor & Preview', shortcut: '', icon: Columns, action: () => { setOpenMenu(null); setEditorMode('split'); onNavigate('editor'); } },
        { label: 'Live Preview Only', shortcut: '', icon: Eye, action: () => { setOpenMenu(null); setEditorMode('preview'); onNavigate('editor'); } },
        { label: 'Editor Only Mode', shortcut: '', icon: Edit3, action: () => { setOpenMenu(null); setEditorMode('markdown'); onNavigate('editor'); } },
        { type: 'separator' },
        { label: 'Toggle Workspace Navigation', shortcut: 'Ctrl+Shift+B', icon: PanelLeft, action: () => { setOpenMenu(null); toggleAppNav(); } },
        { label: 'Toggle Document Sidebar', shortcut: 'Ctrl+B', icon: Columns, action: () => { setOpenMenu(null); useUIStore.getState().toggleLeftSidebar(); } },
        { label: 'Toggle Focus Mode', shortcut: 'F11', icon: Maximize2, action: () => { setOpenMenu(null); toggleFocusMode(); } },
        { type: 'separator' },
        { label: 'Zoom In', shortcut: 'Ctrl+=', icon: Eye, action: () => { setOpenMenu(null); const s = useSettingsStore.getState(); s.updateFontSize(Math.min(32, s.typography.fontSize + 2)); } },
        { label: 'Zoom Out', shortcut: 'Ctrl+-', icon: Eye, action: () => { setOpenMenu(null); const s = useSettingsStore.getState(); s.updateFontSize(Math.max(10, s.typography.fontSize - 2)); } },
        { label: 'Reset Zoom', shortcut: 'Ctrl+0', icon: Eye, action: () => { setOpenMenu(null); useSettingsStore.getState().updateFontSize(16); } },
        { type: 'separator' },
        { label: 'Theme: Light Canvas', icon: Sun, action: () => { setOpenMenu(null); updateTheme('light'); } },
        { label: 'Theme: Dark Twilight', icon: Moon, action: () => { setOpenMenu(null); updateTheme('dark'); } },
        { label: 'Theme: Warm Sepia', icon: Coffee, action: () => { setOpenMenu(null); updateTheme('sepia'); } }
      ]
    },
    {
      id: 'insert',
      label: 'Insert',
      items: [
        { label: 'Markdown Table (3x3)', icon: Table, action: () => triggerEditorAction('table') },
        { label: 'Mermaid Diagram (Flowchart)', icon: GitBranch, action: () => triggerEditorAction('mermaid') },
        { label: 'LaTeX Math Formula', icon: Hash, action: () => triggerEditorAction('mathBlock') },
        { label: 'Wiki-style Link [[Page]]', icon: LinkIcon, action: () => triggerEditorAction('link') },
        { label: 'Fenced Code Block', icon: Code, action: () => triggerEditorAction('codeBlock') },
        { label: 'Interactive Task List', icon: CheckSquare, action: () => triggerEditorAction('taskList') },
        { label: 'Horizontal Divider', icon: Minus, action: () => triggerEditorAction('horizontalRule') }
      ]
    },
    {
      id: 'saas',
      label: 'SaaS Suite',
      items: [
        { label: 'Markora Pro Editor Workspace', icon: Edit3, action: () => { setOpenMenu(null); onNavigate('editor'); } },
        { label: 'SaaS Analytics Dashboard', icon: LayoutDashboard, action: () => { setOpenMenu(null); onNavigate('dashboard'); } },
        { label: 'Cloud Publishing Hub', icon: Globe, action: () => { setOpenMenu(null); onNavigate('publishing'); } },
        { label: 'Team Collaboration Workspace', icon: Users, action: () => { setOpenMenu(null); onNavigate('dashboard'); } },
        { type: 'separator' },
        { label: 'Account & Pro License Activation', icon: ShieldCheck, action: () => { setOpenMenu(null); onNavigate('account'); } }
      ]
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        { label: 'Markora Documentation', icon: BookOpen, action: () => { setOpenMenu(null); onNavigate('documentation'); } },
        { label: 'Keyboard Shortcuts Guide', icon: Keyboard, action: () => { setOpenMenu(null); onNavigate('documentation'); } },
        { type: 'separator' },
        { label: 'About Markora Desktop v2.0', icon: Info, action: () => { setOpenMenu(null); desktop.showNotification('About Markora Desktop v2.0', 'Native Windows Desktop Edition\nBuilt with React 19, TypeScript, Tailwind CSS, and Electron/Tauri Hybrid Bridge.\n\n© 2026 Markora SaaS Suite.'); } }
      ]
    }
  ];

  return (
    <nav className="h-8 bg-background text-foreground border-b border-border flex items-center px-2 select-none text-xs z-40 relative shadow-sm">
      <div className="flex items-center space-x-0.5">
        <button
          onClick={() => toggleAppNav()}
          title={isAppNavOpen ? "Collapse Workspace Navigation (Ctrl+Shift+B)" : "Expand Workspace Navigation (Ctrl+Shift+B)"}
          className="p-1 mr-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
        >
          {isAppNavOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4 text-primary" />}
        </button>
        {menuItems.map((menu) => (
          <div key={menu.id} className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === menu.id ? null : menu.id)}
              onMouseEnter={() => { if (openMenu !== null) setOpenMenu(menu.id); }}
              className={`px-3 py-1 rounded transition-colors flex items-center space-x-1 ${
                openMenu === menu.id ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted hover:text-foreground'
              }`}
            >
              <span>{menu.label}</span>
            </button>

            {openMenu === menu.id && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setOpenMenu(null)} 
                />
                <div className="absolute left-0 top-full mt-1 w-64 bg-popover/95 backdrop-blur-md border border-border rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-popover-foreground">
                  {menu.items.map((item, idx) => {
                    if (item.type === 'separator') {
                      return <div key={idx} className="h-px bg-border my-1 mx-2" />;
                    }
                    const Icon = item.icon || Sparkles;
                    return (
                      <button
                        key={idx}
                        onClick={item.action}
                        className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-primary hover:text-primary-foreground transition-colors group"
                      >
                        <div className="flex items-center space-x-2.5 overflow-hidden">
                          <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.shortcut && (
                          <span className="text-[10px] font-mono text-muted-foreground group-hover:text-primary-foreground/80 shrink-0 ml-3">
                            {item.shortcut}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="ml-auto flex items-center space-x-3 text-muted-foreground pr-2">
        <OfflineSyncStatus />
        <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-muted text-[10px] text-foreground font-mono">
          <span>Ctrl+K</span>
          <span className="text-muted-foreground">Palette</span>
        </span>
      </div>
    </nav>
  );
}
