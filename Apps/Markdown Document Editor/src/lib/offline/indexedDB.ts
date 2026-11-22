/**
 * IndexedDB Database Engine for Markora Offline Synchronization
 * Handles persistent storing of pending changes (Sync Queue) and Offline Document Cache.
 */

export interface SyncQueueItem {
  id: string;
  docId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: {
    title?: string;
    content?: string;
    updatedAt?: string;
    version?: number;
    [key: string]: any;
  };
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  attempts: number;
  lastError?: string;
}

export interface OfflineDocItem {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  version: number;
  isDirty?: boolean;
}

const DB_NAME = 'MarkoraOfflineDB';
const DB_VERSION = 1;
const QUEUE_STORE = 'syncQueue';
const DOCS_STORE = 'offlineDocs';

class MarkoraIDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('indexedDB' in window)) {
        reject(new Error('IndexedDB is not supported in this environment'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        // Sync Queue Store
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          const queueStore = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
          queueStore.createIndex('docId', 'docId', { unique: false });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Offline Docs Cache Store
        if (!db.objectStoreNames.contains(DOCS_STORE)) {
          const docsStore = db.createObjectStore(DOCS_STORE, { keyPath: 'id' });
          docsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // --- SYNC QUEUE METHODS ---

  async enqueueSyncItem(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'status' | 'attempts'>): Promise<SyncQueueItem> {
    const db = await this.getDB();
    const queueItem: SyncQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      status: 'pending',
      attempts: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.add(queueItem);

      req.onsuccess = () => resolve(queueItem);
      req.onerror = () => reject(req.error);
    });
  }

  async getPendingQueue(): Promise<SyncQueueItem[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readonly');
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.getAll();

      req.onsuccess = () => {
        const items: SyncQueueItem[] = req.result || [];
        // Filter pending or failed items, sorted by timestamp
        const pending = items
          .filter((item) => item.status === 'pending' || item.status === 'failed' || item.status === 'syncing')
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        resolve(pending);
      };

      req.onerror = () => reject(req.error);
    });
  }

  async updateQueueItemStatus(id: string, status: SyncQueueItem['status'], error?: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item: SyncQueueItem = getReq.result;
        if (item) {
          item.status = status;
          if (status === 'syncing') {
            item.attempts += 1;
          }
          if (error) {
            item.lastError = error;
          }
          store.put(item);
        }
        resolve();
      };

      getReq.onerror = () => reject(getReq.error);
    });
  }

  async removeQueueItem(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clearSyncedItems(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.getAll();

      req.onsuccess = () => {
        const items: SyncQueueItem[] = req.result || [];
        items.forEach((item) => {
          if (item.status === 'synced') {
            store.delete(item.id);
          }
        });
        resolve();
      };

      req.onerror = () => reject(req.error);
    });
  }

  // --- OFFLINE DOCS CACHE METHODS ---

  async saveOfflineDoc(doc: OfflineDocItem): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DOCS_STORE, 'readwrite');
      const store = tx.objectStore(DOCS_STORE);
      const req = store.put(doc);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getOfflineDocs(): Promise<OfflineDocItem[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DOCS_STORE, 'readonly');
      const store = tx.objectStore(DOCS_STORE);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteOfflineDoc(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DOCS_STORE, 'readwrite');
      const store = tx.objectStore(DOCS_STORE);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const markoraIDB = new MarkoraIDB();
