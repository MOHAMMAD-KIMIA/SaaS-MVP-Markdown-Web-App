import { create } from 'zustand';
import { markoraIDB, SyncQueueItem } from '../lib/offline/indexedDB';

interface OfflineSyncStore {
  isOnline: boolean;
  swRegistered: boolean;
  swActive: boolean;
  isSyncing: boolean;
  pendingCount: number;
  syncQueue: SyncQueueItem[];
  lastSyncTime: string | null;
  lastSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastErrorMessage: string | null;

  // Actions
  setOnline: (online: boolean) => void;
  setSWStatus: (registered: boolean, active: boolean) => void;
  refreshSyncQueue: () => Promise<void>;
  enqueueChange: (docId: string, action: 'CREATE' | 'UPDATE' | 'DELETE', payload: any) => Promise<SyncQueueItem>;
  triggerSync: () => Promise<void>;
  removeQueueItem: (id: string) => Promise<void>;
  clearAllQueue: () => Promise<void>;
}

export const useOfflineSyncStore = create<OfflineSyncStore>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  swRegistered: false,
  swActive: false,
  isSyncing: false,
  pendingCount: 0,
  syncQueue: [],
  lastSyncTime: null,
  lastSyncStatus: 'idle',
  lastErrorMessage: null,

  setOnline: (online: boolean) => {
    set({ isOnline: online });
    if (online) {
      // Auto-trigger sync when back online
      get().triggerSync();
    }
  },

  setSWStatus: (registered: boolean, active: boolean) => {
    set({ swRegistered: registered, swActive: active });
  },

  refreshSyncQueue: async () => {
    try {
      const items = await markoraIDB.getPendingQueue();
      set({
        syncQueue: items,
        pendingCount: items.length,
      });
    } catch (err) {
      console.warn('Failed to fetch IndexedDB sync queue:', err);
    }
  },

  enqueueChange: async (docId: string, action: 'CREATE' | 'UPDATE' | 'DELETE', payload: any) => {
    const item = await markoraIDB.enqueueSyncItem({
      docId,
      action,
      payload,
    });

    await get().refreshSyncQueue();

    // Also cache snapshot in IndexedDB
    if (action === 'CREATE' || action === 'UPDATE') {
      await markoraIDB.saveOfflineDoc({
        id: docId,
        title: payload.title || 'Untitled',
        content: payload.content || '',
        updatedAt: payload.updatedAt || new Date().toISOString(),
        version: payload.version || 1,
        isDirty: true,
      });
    } else if (action === 'DELETE') {
      await markoraIDB.deleteOfflineDoc(docId);
    }

    // Request Service Worker sync tag or direct trigger if online
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      if ('SyncManager' in window && navigator.onLine) {
        try {
          const reg = await navigator.serviceWorker.ready;
          // @ts-ignore (Background Sync API)
          await reg.sync.register('sync-document-changes');
        } catch (e) {
          // Fallback to postMessage
          get().triggerSync();
        }
      } else if (navigator.onLine) {
        get().triggerSync();
      }
    } else if (navigator.onLine) {
      get().triggerSync();
    }

    return item;
  },

  triggerSync: async () => {
    const { isSyncing, refreshSyncQueue } = get();
    if (isSyncing) return;

    set({ isSyncing: true, lastSyncStatus: 'syncing', lastErrorMessage: null });

    try {
      const pending = await markoraIDB.getPendingQueue();

      if (pending.length === 0) {
        set({
          isSyncing: false,
          lastSyncStatus: 'success',
          lastSyncTime: new Date().toLocaleTimeString(),
        });
        return;
      }

      // If Service Worker is ready, post TRIGGER_SYNC message
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'TRIGGER_SYNC' });
      }

      // Execute direct fallback sync process
      let syncedCount = 0;
      for (const item of pending) {
        try {
          await markoraIDB.updateQueueItemStatus(item.id, 'syncing');

          // POST request to /api/sync or backend endpoint
          const res = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              syncId: item.id,
              docId: item.docId,
              action: item.action,
              payload: item.payload,
              clientTimestamp: item.timestamp,
            }),
          });

          if (res.ok || res.status === 200 || res.status === 201) {
            syncedCount++;
            await markoraIDB.removeQueueItem(item.id);
          } else {
            await markoraIDB.updateQueueItemStatus(
              item.id,
              'failed',
              `HTTP ${res.status}: ${res.statusText}`
            );
          }
        } catch (itemErr: any) {
          await markoraIDB.updateQueueItemStatus(
            item.id,
            'failed',
            itemErr?.message || 'Network error during sync'
          );
        }
      }

      await refreshSyncQueue();

      set({
        isSyncing: false,
        lastSyncStatus: 'success',
        lastSyncTime: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      set({
        isSyncing: false,
        lastSyncStatus: 'error',
        lastErrorMessage: err?.message || 'Sync failed',
      });
    }
  },

  removeQueueItem: async (id: string) => {
    await markoraIDB.removeQueueItem(id);
    await get().refreshSyncQueue();
  },

  clearAllQueue: async () => {
    const queue = await markoraIDB.getPendingQueue();
    for (const item of queue) {
      await markoraIDB.removeQueueItem(item.id);
    }
    await get().refreshSyncQueue();
  },
}));
