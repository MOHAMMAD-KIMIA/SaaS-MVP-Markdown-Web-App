import { useEffect } from 'react';
import { EditorPage } from '../pages/EditorPage';
import { useDocumentStore } from '../stores/documentStore';
import { useEditorStore } from '../stores/editorStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useHistoryStore } from '../stores/historyStore';

export default function App() {
  const loadDocuments = useDocumentStore((state) => state.loadFromStorage);
  const loadEditor = useEditorStore((state) => state.loadFromStorage);
  const loadSettings = useSettingsStore((state) => state.loadFromStorage);
  const loadHistory = useHistoryStore((state) => state.loadFromStorage);

  useEffect(() => {
    loadDocuments();
    loadEditor();
    loadSettings();
    loadHistory();
  }, [loadDocuments, loadEditor, loadSettings, loadHistory]);

  return <EditorPage />;
}