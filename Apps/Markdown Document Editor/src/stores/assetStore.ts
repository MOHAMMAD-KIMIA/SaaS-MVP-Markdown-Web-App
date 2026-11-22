// src/stores/assetStore.ts
import { create } from 'zustand';
import { generateId } from '../lib/utils/ids';
import { getCurrentTimestamp } from '../lib/utils/dates';
import { loadFromLocalStorage, saveToLocalStorage } from '../lib/storage/localStorage';

export const ASSET_URI_PREFIX = 'markora-asset://';

export interface LocalAsset {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  sizeBytes: number;
  width: number;
  height: number;
  createdAt: string;
}

interface AssetStore {
  assets: LocalAsset[];
  isLoaded: boolean;
  loadFromStorage: () => Promise<void>;
  addAssetFromFile: (file: File) => Promise<LocalAsset>;
  deleteAsset: (id: string) => Promise<void>;
  deleteUnusedAssets: (usedIds: Set<string>) => Promise<number>;
  getAssetById: (id: string) => LocalAsset | undefined;
}

const DB_NAME = 'markora-assets-db';
const DB_VERSION = 1;
const STORE_NAME = 'assets';
const FALLBACK_KEY = 'markora-assets-fallback';

function openAssetDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open asset DB'));
  });
}

async function idbGetAllAssets(): Promise<LocalAsset[]> {
  try {
    const db = await openAssetDb();
    return await new Promise<LocalAsset[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as LocalAsset[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return loadFromLocalStorage<LocalAsset[]>(FALLBACK_KEY, []);
  }
}

async function idbPutAsset(asset: LocalAsset): Promise<void> {
  try {
    const db = await openAssetDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(asset);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const existing = loadFromLocalStorage<LocalAsset[]>(FALLBACK_KEY, []);
    saveToLocalStorage(FALLBACK_KEY, [asset, ...existing.filter((a) => a.id !== asset.id)]);
  }
}

async function idbDeleteAsset(id: string): Promise<void> {
  try {
    const db = await openAssetDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const existing = loadFromLocalStorage<LocalAsset[]>(FALLBACK_KEY, []);
    saveToLocalStorage(
      FALLBACK_KEY,
      existing.filter((a) => a.id !== id)
    );
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

function measureImageDimensions(
  dataUrl: string
): Promise<{ width: number; height: number; normalizedDataUrl: string; sizeBytes: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1920;
      let width = img.naturalWidth || 640;
      let height = img.naturalHeight || 480;

      // Downscale only very large screenshots/photos to keep storage fast and responsive
      if (width > maxDim || height > maxDim) {
        const scale = Math.min(maxDim / width, maxDim / height);
        const targetW = Math.round(width * scale);
        const targetH = Math.round(height * scale);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, targetW, targetH);
            const resized = canvas.toDataURL('image/webp', 0.88);
            const approxBytes = Math.round((resized.length * 3) / 4);
            resolve({
              width: targetW,
              height: targetH,
              normalizedDataUrl: resized,
              sizeBytes: approxBytes,
            });
            return;
          }
        } catch {
          // fallback to original dataUrl
        }
      }

      const approxBytes = Math.round((dataUrl.length * 3) / 4);
      resolve({ width, height, normalizedDataUrl: dataUrl, sizeBytes: approxBytes });
    };
    img.onerror = () => {
      resolve({
        width: 0,
        height: 0,
        normalizedDataUrl: dataUrl,
        sizeBytes: Math.round((dataUrl.length * 3) / 4),
      });
    };
    img.src = dataUrl;
  });
}

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: [],
  isLoaded: false,

  loadFromStorage: async () => {
    const loaded = await idbGetAllAssets();
    loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    set({ assets: loaded, isLoaded: true });
  },

  addAssetFromFile: async (file: File) => {
    const rawDataUrl = await readFileAsDataUrl(file);
    const { width, height, normalizedDataUrl, sizeBytes } =
      await measureImageDimensions(rawDataUrl);

    const id = `img_${generateId().replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`;
    const cleanName =
      (file.name || `screenshot-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.png`).trim();

    const asset: LocalAsset = {
      id,
      name: cleanName,
      mimeType: file.type || 'image/png',
      dataUrl: normalizedDataUrl,
      sizeBytes: sizeBytes || file.size || 0,
      width,
      height,
      createdAt: getCurrentTimestamp(),
    };

    await idbPutAsset(asset);
    set((state) => ({
      assets: [asset, ...state.assets],
    }));
    return asset;
  },

  deleteAsset: async (id: string) => {
    await idbDeleteAsset(id);
    set((state) => ({
      assets: state.assets.filter((a) => a.id !== id),
    }));
  },

  deleteUnusedAssets: async (usedIds: Set<string>) => {
    const toDelete = get().assets.filter((a) => !usedIds.has(a.id));
    for (const asset of toDelete) {
      await idbDeleteAsset(asset.id);
    }
    set((state) => ({
      assets: state.assets.filter((a) => usedIds.has(a.id)),
    }));
    return toDelete.length;
  },

  getAssetById: (id: string) => {
    return get().assets.find((a) => a.id === id);
  },
}));

/**
 * Extracts all markora-asset://<id> IDs referenced across workspace documents.
 */
export function extractUsedAssetIds(documents: Array<{ content: string }>): Set<string> {
  const used = new Set<string>();
  const regex = /markora-asset:\/\/([a-zA-Z0-9_-]+)/g;
  for (const doc of documents) {
    if (!doc.content) continue;
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(doc.content)) !== null) {
      used.add(m[1]);
    }
  }
  return used;
}

export function extractWidthFromImageTitle(title?: string): number | undefined {
  if (!title) return undefined;
  const match = title.match(/\bwidth\s*=\s*(\d{2,4})\b/i);
  if (match) {
    const parsed = parseInt(match[1], 10);
    if (!Number.isNaN(parsed) && parsed >= 40 && parsed <= 2400) {
      return parsed;
    }
  }
  return undefined;
}
