/**
 * Markora Service Worker
 * Handles offline caching, background synchronization, and IndexedDB sync processing.
 */

const CACHE_NAME = 'markora-cache-v2';
const SYNC_TAG = 'sync-document-changes';
const BROADCAST_CHANNEL_NAME = 'markora-offline-sync';

// Static assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/logo.svg',
];

const syncChannel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel(BROADCAST_CHANNEL_NAME) 
  : null;

function broadcast(type, payload = {}) {
  const message = { type, payload, timestamp: new Date().toISOString() };
  if (syncChannel) {
    syncChannel.postMessage(message);
  }
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
    clients.forEach((client) => client.postMessage(message));
  });
}

// Service Worker Installation
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial error:', err);
      });
    })
  );
});

// Service Worker Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      }),
      self.clients.claim(),
    ])
  );
});

function shouldBypassCache(url, request) {
  if (request.method !== 'GET') return true;
  if (url.origin !== self.location.origin) return true;

  // Never cache Vite dev server modules, optimized deps, or API routes
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/@fs/') ||
    url.pathname.startsWith('/@id/') ||
    url.searchParams.has('v') ||
    url.searchParams.has('t')
  ) {
    return true;
  }

  return false;
}

// Fetch Intercept (Network-first for live freshness, offline cache fallback)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle /api/sync endpoint cleanly
  if (url.pathname === '/api/sync') {
    if (event.request.method === 'POST') {
      event.respondWith(
        fetch(event.request).catch(async () => {
          return new Response(
            JSON.stringify({
              status: 'queued_offline',
              message: 'Server unreachable. Operation queued in IndexedDB.',
              syncedAt: new Date().toISOString(),
            }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
      );
      return;
    }
  }

  // Bypass service worker caching for Vite dev modules & API calls
  if (shouldBypassCache(url, event.request)) {
    return;
  }

  // Navigation requests (HTML fallback)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Network-first for static assets so latest builds are always served when online
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        return new Response('Offline Content Unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      })
  );
});

// Background Sync Listener
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(processIndexedDBSyncQueue());
  }
});

// Message Event Listener
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'TRIGGER_SYNC') {
    processIndexedDBSyncQueue().then((result) => {
      broadcast('SYNC_COMPLETED', result);
    });
  } else if (event.data.type === 'PING') {
    event.ports?.[0]?.postMessage({ status: 'PONG', active: true });
  }
});

// Process IndexedDB Queue inside Service Worker
async function processIndexedDBSyncQueue() {
  broadcast('SYNC_STARTED');

  return new Promise((resolve) => {
    const dbRequest = indexedDB.open('MarkoraOfflineDB', 1);

    dbRequest.onerror = () => {
      broadcast('SYNC_FAILED', { error: 'Failed to open IndexedDB in Service Worker' });
      resolve({ success: false, syncedCount: 0 });
    };

    dbRequest.onsuccess = async () => {
      const db = dbRequest.result;

      if (!db.objectStoreNames.contains('syncQueue')) {
        broadcast('SYNC_COMPLETED', { success: true, syncedCount: 0 });
        resolve({ success: true, syncedCount: 0 });
        return;
      }

      const tx = db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');
      const getAllReq = store.getAll();

      getAllReq.onsuccess = async () => {
        const queue = getAllReq.result || [];
        const pendingItems = queue.filter(
          (item) => item.status === 'pending' || item.status === 'failed' || item.status === 'syncing'
        );

        if (pendingItems.length === 0) {
          broadcast('SYNC_COMPLETED', { success: true, syncedCount: 0 });
          resolve({ success: true, syncedCount: 0 });
          return;
        }

        let syncedCount = 0;

        for (const item of pendingItems) {
          try {
            // Attempt synchronization POST
            const syncResponse = await fetch('/api/sync', {
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

            if (syncResponse.ok || syncResponse.status === 200 || syncResponse.status === 201) {
              syncedCount++;
              // Remove synced item from queue
              const deleteTx = db.transaction('syncQueue', 'readwrite');
              deleteTx.objectStore('syncQueue').delete(item.id);
            } else {
              // Update status to failed
              const updateTx = db.transaction('syncQueue', 'readwrite');
              item.status = 'failed';
              item.lastError = `Server returned ${syncResponse.status}`;
              updateTx.objectStore('syncQueue').put(item);
            }
          } catch (err) {
            // Network or server error during sync
            const updateTx = db.transaction('syncQueue', 'readwrite');
            item.status = 'failed';
            item.lastError = err instanceof Error ? err.message : 'Network error during sync';
            updateTx.objectStore('syncQueue').put(item);
          }
        }

        broadcast('SYNC_COMPLETED', {
          success: true,
          syncedCount,
          remaining: pendingItems.length - syncedCount,
        });

        resolve({ success: true, syncedCount });
      };
    };
  });
}
