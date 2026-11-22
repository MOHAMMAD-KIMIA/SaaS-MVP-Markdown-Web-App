import { useEffect, useRef } from 'react';
import { useDocumentStore } from '../stores/documentStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useHistoryStore } from '../stores/historyStore';

export function useAutoSave() {
  const autoSave = useSettingsStore((state) => state.autoSave);
  const createVersion = useHistoryStore((state) => state.createVersion);
  
  const lastSavedContentRef = useRef<Record<string, string>>({});
  const lastVersionTimeRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!autoSave?.enabled) return;

    if (autoSave.interval === 'keystroke') {
      // Keystroke saving is handled synchronously in updateDocumentContent
      return;
    }

    const intervalSeconds = typeof autoSave.interval === 'number' ? autoSave.interval : 30;
    const intervalMs = intervalSeconds * 1000;

    const timer = setInterval(() => {
      let hasChanges = false;
      const now = Date.now();
      const { documents, saveToStorage } = useDocumentStore.getState();

      documents.forEach((doc) => {
        const lastContent = lastSavedContentRef.current[doc.id];
        if (lastContent !== doc.content) {
          hasChanges = true;
          lastSavedContentRef.current[doc.id] = doc.content;

          // Create a history version snapshot at most once every 2 minutes per document
          const lastTime = lastVersionTimeRef.current[doc.id] || 0;
          if (now - lastTime > 120000 && doc.content.trim().length > 0) {
            createVersion(doc.id, doc.content, `Auto-saved (${intervalSeconds}s interval)`);
            lastVersionTimeRef.current[doc.id] = now;
          }
        }
      });

      if (hasChanges) {
        saveToStorage(true);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoSave?.enabled, autoSave?.interval, createVersion]);

  // Ensure immediate save when window is closing or hidden to prevent data loss
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (useSettingsStore.getState().autoSave?.enabled) {
        useDocumentStore.getState().saveToStorage(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && useSettingsStore.getState().autoSave?.enabled) {
        useDocumentStore.getState().saveToStorage(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
