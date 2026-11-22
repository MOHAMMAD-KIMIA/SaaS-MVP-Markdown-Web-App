import { useEffect } from 'react';
import { EditorPage } from '../pages/EditorPage';
import { useDocumentStore } from '../stores/documentStore';
import { useEditorStore } from '../stores/editorStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useHistoryStore } from '../stores/historyStore';
import { useUIStore } from '../stores/uiStore';
import { useSpellCheckStore } from '../stores/spellCheckStore';
import { useCommentStore } from '../stores/commentStore';
import { useAssetStore } from '../stores/assetStore';
import { DesktopMenuBar } from '../components/desktop/DesktopMenuBar';
import { DesktopAppNav } from '../components/desktop/DesktopAppNav';
import { DesktopDashboard } from '../components/desktop/views/DesktopDashboard';
import { DesktopPublishing } from '../components/desktop/views/DesktopPublishing';
import { DesktopAccount } from '../components/desktop/views/DesktopAccount';
import { DesktopDocumentation } from '../components/desktop/views/DesktopDocumentation';
import { DesktopDictionary } from '../components/desktop/views/DesktopDictionary';
import { SettingsSidebar } from '../features/settings/components/SettingsSidebar';
import { CommandPalette } from '../features/command-palette/components/CommandPalette';
import { ExportModal } from '../features/export/components/ExportModal';
import { ImportBackupModal } from '../features/documents/components/ImportBackupModal';
import { TemplatePickerModal } from '../features/templates/components/TemplatePickerModal';
import { HistoryPanel } from '../features/history/components/HistoryPanel';
import { SearchReplacePanel } from '../features/search/components/SearchReplacePanel';
import { KnowledgeGraphModal } from '../features/graph/components/KnowledgeGraphModal';
import { AssetManagerModal } from '../features/assets/components/AssetManagerModal';
import { useAutoSave } from '../hooks/useAutoSave';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { initializeOfflineSync } from '../lib/offline/syncManager';
import { cn } from '../lib/utils/cn';

export default function App() {
  useAutoSave();
  const currentView = useUIStore((state) => state.currentView);
  const setCurrentView = useUIStore((state) => state.setCurrentView);
  useKeyboardShortcuts({ onNavigate: setCurrentView });

  const loadDocuments = useDocumentStore((state) => state.loadFromStorage);
  const loadEditor = useEditorStore((state) => state.loadFromStorage);
  const loadSettings = useSettingsStore((state) => state.loadFromStorage);
  const loadHistory = useHistoryStore((state) => state.loadFromStorage);
  const loadSpellCheck = useSpellCheckStore((state) => state.loadFromStorage);
  const loadComments = useCommentStore((state) => state.loadFromStorage);
  const loadAssets = useAssetStore((state) => state.loadFromStorage);
  const theme = useSettingsStore((state) => state.theme);
  const focusMode = useEditorStore((state) => state.focusMode);
  const zenMode = useEditorStore((state) => state.zenMode);
  const hideAppChrome = focusMode || zenMode;

  useEffect(() => {
    loadDocuments();
    loadEditor();
    loadSettings();
    loadHistory();
    loadSpellCheck();
    loadComments();
    loadAssets();
    initializeOfflineSync();
  }, [loadDocuments, loadEditor, loadSettings, loadHistory, loadSpellCheck, loadComments, loadAssets]);

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
      {!hideAppChrome && <DesktopMenuBar currentView={currentView} onNavigate={setCurrentView} />}
      
      <div className="flex-1 flex min-w-0 overflow-hidden relative">
        {!hideAppChrome && <DesktopAppNav currentView={currentView} onNavigate={setCurrentView} />}
        
        <main
          className={cn(
            'flex-1 min-w-0 bg-background text-foreground relative flex flex-col',
            currentView === 'editor' ? 'overflow-hidden' : 'overflow-y-auto'
          )}
        >
          {currentView === 'editor' && (
            <div className="flex-1 min-w-0 w-full flex flex-col overflow-hidden bg-background">
              <EditorPage />
            </div>
          )}
          {currentView === 'dictionary' && <DesktopDictionary onNavigate={setCurrentView} />}
          {currentView === 'dashboard' && <DesktopDashboard onNavigate={setCurrentView} />}
          {currentView === 'publishing' && <DesktopPublishing />}
          {currentView === 'account' && <DesktopAccount />}
          {currentView === 'documentation' && <DesktopDocumentation onNavigate={setCurrentView} />}
        </main>

        {currentView !== 'editor' && <SettingsSidebar />}
      </div>

      {currentView !== 'editor' && (
        <>
          <SearchReplacePanel />
          <CommandPalette />
          <ExportModal />
          <ImportBackupModal />
          <TemplatePickerModal />
          <HistoryPanel />
          <KnowledgeGraphModal />
          <AssetManagerModal />
        </>
      )}
    </div>
  );
}
