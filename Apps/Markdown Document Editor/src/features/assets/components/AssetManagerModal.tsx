// src/features/assets/components/AssetManagerModal.tsx
import React, { useMemo, useRef, useState } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Plus,
  FolderCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../app/components/ui/dialog';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import { useUIStore } from '../../../stores/uiStore';
import { useDocumentStore } from '../../../stores/documentStore';
import {
  ASSET_URI_PREFIX,
  extractUsedAssetIds,
  LocalAsset,
  useAssetStore,
} from '../../../stores/assetStore';
import { copyToClipboard } from '../../../lib/utils/clipboard';
import { formatRelativeTime } from '../../../lib/utils/dates';
import { desktop } from '../../../lib/desktop/bridge';
import { cn } from '../../../lib/utils/cn';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function AssetManagerModal() {
  const isOpen = useUIStore((s) => s.isAssetManagerOpen);
  const closeAssetManager = useUIStore((s) => s.closeAssetManager);
  const documents = useDocumentStore((s) => s.documents);
  const openDocument = useDocumentStore((s) => s.openDocument);
  const { assets, addAssetFromFile, deleteAsset, deleteUnusedAssets } = useAssetStore();

  const [filter, setFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const usedIds = useMemo(() => extractUsedAssetIds(documents), [documents]);

  const usageByAssetId = useMemo(() => {
    const map = new Map<string, Array<{ id: string; title: string }>>();
    for (const doc of documents) {
      if (!doc.content) continue;
      for (const asset of assets) {
        if (doc.content.includes(`${ASSET_URI_PREFIX}${asset.id}`)) {
          const list = map.get(asset.id) || [];
          list.push({ id: doc.id, title: doc.title || 'Untitled' });
          map.set(asset.id, list);
        }
      }
    }
    return map;
  }, [documents, assets]);

  const counts = useMemo(() => {
    let used = 0;
    let unused = 0;
    let totalBytes = 0;
    for (const a of assets) {
      totalBytes += a.sizeBytes;
      if (usedIds.has(a.id)) used++;
      else unused++;
    }
    return { total: assets.length, used, unused, totalBytes };
  }, [assets, usedIds]);

  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((asset) => {
      const isUsed = usedIds.has(asset.id);
      if (filter === 'used' && !isUsed) return false;
      if (filter === 'unused' && isUsed) return false;
      if (q && !asset.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [assets, filter, search, usedIds]);

  const handleUploadFiles = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    for (const file of imageFiles) {
      await addAssetFromFile(file);
    }
    desktop.showNotification(
      'Images Saved',
      `Added ${imageFiles.length} image${imageFiles.length === 1 ? '' : 's'} to Local Assets.`
    );
  };

  const handleInsertAsset = (asset: LocalAsset) => {
    const markdown = `![${asset.name.replace(/\.[^.]+$/, '')}](${ASSET_URI_PREFIX}${asset.id})`;
    window.dispatchEvent(
      new CustomEvent('editor-insert-raw', { detail: { text: markdown } })
    );
    closeAssetManager();
    desktop.showNotification('Inserted Image', `Embedded "${asset.name}" into active document.`);
  };

  const handleCopyMarkdown = async (asset: LocalAsset) => {
    const markdown = `![${asset.name.replace(/\.[^.]+$/, '')}](${ASSET_URI_PREFIX}${asset.id})`;
    const ok = await copyToClipboard(markdown);
    if (ok) {
      setCopiedId(asset.id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const handlePurgeUnused = async () => {
    const removed = await deleteUnusedAssets(usedIds);
    desktop.showNotification(
      'Unused Assets Cleaned',
      `Removed ${removed} unreferenced image${removed === 1 ? '' : 's'}.`
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeAssetManager()}>
      <DialogContent className="max-w-4xl w-[94vw] h-[82vh] p-0 flex flex-col overflow-hidden gap-0">
        <DialogHeader className="px-5 py-3.5 border-b border-border shrink-0 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/40 text-primary shrink-0">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold tracking-tight">
                Local Asset Manager
              </DialogTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
                <span>{counts.total} image{counts.total === 1 ? '' : 's'}</span>
                <span aria-hidden="true">·</span>
                <span>{counts.used} in use</span>
                <span aria-hidden="true">·</span>
                <span>{counts.unused} unused</span>
                <span aria-hidden="true">·</span>
                <span>{formatBytes(counts.totalBytes)}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Controls & Upload */}
        <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg border border-border bg-muted/50">
              {(['all', 'used', 'unused'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
                    filter === tab
                      ? 'bg-background text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab === 'all'
                    ? `All (${counts.total})`
                    : tab === 'used'
                      ? `Used (${counts.used})`
                      : `Unused (${counts.unused})`}
                </button>
              ))}
            </div>

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by filename..."
              className="h-8 w-44 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            {counts.unused > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handlePurgeUnused}
                className="h-8 text-xs text-destructive hover:bg-destructive/10 gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Clean Up Unused ({counts.unused})</span>
              </Button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleUploadFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Image</span>
            </Button>
          </div>
        </div>

        {/* Asset Grid / Drop Zone */}
        <div
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes('Files')) {
              e.preventDefault();
              setIsDragging(true);
            }
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.length) {
              handleUploadFiles(e.dataTransfer.files);
            }
          }}
          className={cn(
            'flex-1 min-h-0 overflow-y-auto p-4 transition-colors',
            isDragging && 'bg-primary/5 ring-2 ring-inset ring-primary'
          )}
        >
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 border border-dashed border-border rounded-xl">
              <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground">
                {assets.length === 0
                  ? 'No local image assets yet'
                  : 'No images match this filter'}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Paste screenshots (Ctrl/Cmd + V) or drag-and-drop images directly into the Markdown editor, or upload files here.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-4 gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Choose Image Files</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredAssets.map((asset) => {
                const refs = usageByAssetId.get(asset.id) || [];
                const isUsed = refs.length > 0;

                return (
                  <div
                    key={asset.id}
                    className="rounded-xl border border-border bg-card overflow-hidden flex flex-col justify-between"
                  >
                    <div className="aspect-video bg-muted/40 border-b border-border flex items-center justify-center overflow-hidden p-2">
                      {asset.dataUrl ? (
                        <img
                          src={asset.dataUrl}
                          alt={asset.name}
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain rounded"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                      )}
                    </div>

                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-foreground truncate" title={asset.name}>
                          {asset.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums">
                          <span>
                            {asset.width && asset.height ? `${asset.width}×${asset.height}` : 'Image'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{formatBytes(asset.sizeBytes)}</span>
                          <span aria-hidden="true">·</span>
                          <span>{formatRelativeTime(asset.createdAt)}</span>
                        </div>

                        <div className="pt-0.5 text-[11px]">
                          {isUsed ? (
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 truncate">
                              <FolderCheck className="h-3 w-3 shrink-0" />
                              <button
                                type="button"
                                onClick={() => {
                                  openDocument(refs[0].id);
                                  closeAssetManager();
                                }}
                                className="truncate hover:underline text-left"
                                title={`Used in: ${refs.map((r) => r.title).join(', ')}`}
                              >
                                Used in {refs[0].title}
                                {refs.length > 1 ? ` +${refs.length - 1}` : ''}
                              </button>
                            </div>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400">
                              Unused in workspace documents
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-border/60">
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          className="h-7 flex-1 text-xs gap-1"
                          onClick={() => handleInsertAsset(asset)}
                        >
                          <Plus className="h-3 w-3" />
                          <span>Insert</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0"
                          onClick={() => handleCopyMarkdown(asset)}
                          title="Copy Markdown image syntax"
                        >
                          {copiedId === asset.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteAsset(asset.id)}
                          title="Delete asset"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
