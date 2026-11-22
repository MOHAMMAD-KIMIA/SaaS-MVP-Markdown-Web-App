import React, { useState } from 'react';
import { useOfflineSyncStore } from '../../stores/offlineSyncStore';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Database,
  Cpu,
  RotateCw,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../app/components/ui/dialog';

export function OfflineSyncStatus() {
  const {
    isOnline,
    swActive,
    swRegistered,
    isSyncing,
    pendingCount,
    syncQueue,
    lastSyncTime,
    lastSyncStatus,
    lastErrorMessage,
    triggerSync,
    removeQueueItem,
    clearAllQueue,
  } = useOfflineSyncStore();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Compact Status Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-all border ${
          !isOnline
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            : isSyncing
            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 animate-pulse'
            : pendingCount > 0
            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
        }`}
        title={`Network & Sync Status: ${isOnline ? 'Online' : 'Offline'} (${pendingCount} changes queued in IndexedDB)`}
      >
        {!isOnline ? (
          <>
            <WifiOff className="h-3 w-3 text-amber-500 shrink-0" />
            <span>Offline</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white dark:text-black font-bold text-[10px]">
                {pendingCount}
              </span>
            )}
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="h-3 w-3 text-indigo-500 animate-spin shrink-0" />
            <span>Syncing...</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <Cloud className="h-3 w-3 text-blue-500 shrink-0" />
            <span>Sync Queued</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-500 text-white font-bold text-[10px]">
              {pendingCount}
            </span>
          </>
        ) : (
          <>
            <Cloud className="h-3 w-3 text-emerald-500 shrink-0" />
            <span>Synced</span>
          </>
        )}
      </button>

      {/* Detailed Sync Manager Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md sm:max-w-lg bg-card text-foreground border border-border shadow-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-lg font-bold">
              <Database className="h-5 w-5 text-indigo-500" />
              <span>Offline Sync & IndexedDB Manager</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Monitor network status, service worker background sync, and offline change queues.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2 text-xs">
            {/* Network & SW Status Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* Network Status */}
              <div className={`p-3 rounded-lg border ${
                isOnline ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-muted-foreground">Network</span>
                  {isOnline ? (
                    <Wifi className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <div className="mt-1 font-bold text-sm">
                  {isOnline ? (
                    <span className="text-emerald-600 dark:text-emerald-400">Connected</span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">Offline Mode</span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {isOnline ? 'Direct backend connection active' : 'Changes buffered locally in IndexedDB'}
                </p>
              </div>

              {/* Service Worker Status */}
              <div className="p-3 rounded-lg border bg-card/60 border-border">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-muted-foreground">Service Worker</span>
                  <Cpu className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="mt-1 font-bold text-sm">
                  {swActive ? (
                    <span className="text-indigo-600 dark:text-indigo-400">Active & Syncing</span>
                  ) : swRegistered ? (
                    <span className="text-blue-500">Registered</span>
                  ) : (
                    <span className="text-muted-foreground">Standard Web Engine</span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Background sync & offline app shell enabled
                </p>
              </div>
            </div>

            {/* Sync Queue Summary Banner */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/60">
              <div>
                <div className="font-semibold text-foreground flex items-center space-x-1.5">
                  <span>Pending Queue ({pendingCount} items)</span>
                  {lastSyncTime && (
                    <span className="text-[10px] font-normal text-muted-foreground">
                      (Last sync: {lastSyncTime})
                    </span>
                  )}
                </div>
                {lastErrorMessage && (
                  <p className="text-[11px] text-red-500 mt-0.5 flex items-center space-x-1">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span>{lastErrorMessage}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={triggerSync}
                  disabled={isSyncing || !isOnline}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-medium text-xs hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
                >
                  <RotateCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
            </div>

            {/* Queue Item List */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="font-semibold text-muted-foreground text-[11px]">IndexedDB Queue Details</span>
                {pendingCount > 0 && (
                  <button
                    onClick={clearAllQueue}
                    className="text-[11px] text-red-500 hover:underline flex items-center space-x-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {pendingCount === 0 ? (
                <div className="p-6 rounded-lg border border-dashed border-border/80 text-center text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                  <p className="font-semibold text-xs text-foreground">All changes synchronized!</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Your document edits are completely saved and up to date.
                  </p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-border/60 rounded-lg p-2 bg-background">
                  {syncQueue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded bg-card border border-border/40 hover:border-border transition-colors text-[11px]"
                    >
                      <div className="flex items-center space-x-2 truncate mr-2">
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono font-bold text-[9px] uppercase ${
                            item.action === 'CREATE'
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : item.action === 'UPDATE'
                              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                              : 'bg-red-500/20 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {item.action}
                        </span>

                        <div className="truncate">
                          <p className="font-semibold truncate text-foreground">
                            Doc ID: {item.docId}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {new Date(item.timestamp).toLocaleTimeString()} • Status: {item.status}
                          </p>
                          {item.lastError && (
                            <p className="text-[10px] text-red-500 truncate">{item.lastError}</p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => removeQueueItem(item.id)}
                        className="p-1 text-muted-foreground hover:text-red-500 rounded hover:bg-muted shrink-0"
                        title="Remove queue item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
