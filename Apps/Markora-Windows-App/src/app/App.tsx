import { useEffect, useState } from 'react';
import { EditorPage } from '../pages/EditorPage';
import { useDocumentStore } from '../stores/documentStore';
import { useEditorStore } from '../stores/editorStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useHistoryStore } from '../stores/historyStore';
import { WindowsTitlebar } from '../components/desktop/WindowsTitlebar';
import { DesktopMenuBar } from '../components/desktop/DesktopMenuBar';
import { DesktopAppNav } from '../components/desktop/DesktopAppNav';
import { DesktopDashboard } from '../components/desktop/views/DesktopDashboard';
import { DesktopPublishing } from '../components/desktop/views/DesktopPublishing';
import { DesktopAccount } from '../components/desktop/views/DesktopAccount';
import { DesktopDocumentation } from '../components/desktop/views/DesktopDocumentation';
import { CommandPalette } from '../features/command-palette/components/CommandPalette';
import { ExportModal } from '../features/export/components/ExportModal';
import { TemplatePickerModal } from '../features/templates/components/TemplatePickerModal';
import { HistoryPanel } from '../features/history/components/HistoryPanel';
import { SearchReplacePanel } from '../features/search/components/SearchReplacePanel';
import { useAutoSave } from '../hooks/useAutoSave';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { initializeOfflineSync } from '../lib/offline/syncManager';

export default function App() {
  useAutoSave();
  const [currentView, setCurrentView] = useState<'editor' | 'dashboard' | 'publishing' | 'account' | 'documentation'>('editor');
  useKeyboardShortcuts({ onNavigate: setCurrentView });

  const loadDocuments = useDocumentStore((state) => state.loadFromStorage);
  const loadEditor = useEditorStore((state) => state.loadFromStorage);
  const loadSettings = useSettingsStore((state) => state.loadFromStorage);
  const loadHistory = useHistoryStore((state) => state.loadFromStorage);
  const theme = useSettingsStore((state) => state.theme);
  const focusMode = useEditorStore((state) => state.focusMode);

  useEffect(() => {
    loadDocuments();
    loadEditor();
    loadSettings();
    loadHistory();
    initializeOfflineSync();
  }, [loadDocuments, loadEditor, loadSettings, loadHistory]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'sepia');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'sepia') {
      root.classList.add('sepia');
    } else {
      root.classList.add('light');
    }
  }, [theme]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground font-sans overflow-hidden select-none">
      {!focusMode && <WindowsTitlebar />}
      {!focusMode && <DesktopMenuBar currentView={currentView} onNavigate={setCurrentView} />}
      
      <div className="flex-1 flex overflow-hidden">
        {!focusMode && <DesktopAppNav currentView={currentView} onNavigate={setCurrentView} />}
        
        <main className="flex-1 overflow-y-auto bg-background text-foreground relative flex flex-col">
          {currentView === 'editor' && <div className="flex-1 flex flex-col overflow-hidden bg-background"><EditorPage /></div>}
          {currentView === 'dashboard' && <DesktopDashboard onNavigate={setCurrentView} />}
          {currentView === 'publishing' && <DesktopPublishing />}
          {currentView === 'account' && <DesktopAccount />}
          {currentView === 'documentation' && <DesktopDocumentation onNavigate={setCurrentView} />}
        </main>
      </div>

      {currentView !== 'editor' && (
        <>
          <SearchReplacePanel />
          <CommandPalette />
          <ExportModal />
          <TemplatePickerModal />
          <HistoryPanel />
        </>
      )}
    </div>
  );
}
