/**
 * Markora Service Worker & Offline Sync Manager
 * Registers service worker, sets up online/offline event listeners,
 * and maintains real-time synchronization between IndexedDB queue and backend.
 */

import { useOfflineSyncStore } from '../../stores/offlineSyncStore';

const BROADCAST_CHANNEL_NAME = 'markora-offline-sync';

export function initializeOfflineSync() {
  if (typeof window === 'undefined') return;

  const syncStore = useOfflineSyncStore.getState();

  // 1. Initial Sync Queue Load
  syncStore.refreshSyncQueue();

  // 2. Window Network Event Listeners
  const handleOnline = () => {
    console.log('[SyncManager] App is ONLINE');
    useOfflineSyncStore.getState().setOnline(true);
  };

  const handleOffline = () => {
    console.log('[SyncManager] App is OFFLINE');
    useOfflineSyncStore.getState().setOnline(false);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // 3. BroadcastChannel Listener for Service Worker Sync Events
  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    channel.onmessage = (event) => {
      const { type } = event.data || {};
      if (type === 'SYNC_COMPLETED' || type === 'SYNC_STARTED' || type === 'SYNC_FAILED') {
        useOfflineSyncStore.getState().refreshSyncQueue();
      }
    };
  }

  // 4. Service Worker Registration
  if ('serviceWorker' in navigator) {
    const registerSW = async () => {
      try {
        const hadController = !!navigator.serviceWorker.controller;

        // Purge any legacy v1 cache that cached dev modules
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames
              .filter((name) => name === 'markora-cache-v1')
              .map((name) => caches.delete(name))
          );
        }

        if (hadController) {
          navigator.serviceWorker.addEventListener(
            'controllerchange',
            () => {
              if (!sessionStorage.getItem('markora-sw-refreshed-v2')) {
                sessionStorage.setItem('markora-sw-refreshed-v2', '1');
                window.location.reload();
              }
            },
            { once: true }
          );
        }

        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        await registration.update().catch(() => {});

        console.log('[SyncManager] ServiceWorker registered with scope:', registration.scope);

        const active = !!registration.active;
        useOfflineSyncStore.getState().setSWStatus(true, active);

        // Listen for service worker state changes
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'activated') {
                useOfflineSyncStore.getState().setSWStatus(true, true);
              }
            };
          }
        });

        // Listen for messages directly from Service Worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SYNC_COMPLETED') {
            useOfflineSyncStore.getState().refreshSyncQueue();
          }
        });

        // Register Background Sync if supported
        if ('SyncManager' in window && navigator.onLine) {
          try {
            // @ts-ignore
            await registration.sync.register('sync-document-changes');
          } catch {
            // Background sync not supported or blocked
          }
        }
      } catch (error) {
        console.warn('[SyncManager] ServiceWorker registration failed:', error);
        useOfflineSyncStore.getState().setSWStatus(false, false);
      }
    };

    if (document.readyState === 'complete') {
      void registerSW();
    } else {
      window.addEventListener('load', () => {
        void registerSW();
      });
    }
  }
}
