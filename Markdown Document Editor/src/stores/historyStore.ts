import { create } from 'zustand';
import { Version } from '../types/common.types';
import { generateId } from '../lib/utils/ids';
import { getCurrentTimestamp } from '../lib/utils/dates';
import { loadFromLocalStorage, saveToLocalStorage } from '../lib/storage/localStorage';

interface HistoryStore {
  versions: Version[];

  // Actions
  createVersion: (documentId: string, content: string, label?: string) => void;
  getVersionsForDocument: (documentId: string) => Version[];
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

const STORAGE_KEY = 'markora-history';

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  versions: [],

  createVersion: (documentId: string, content: string, label?: string) => {
    const newVersion: Version = {
      id: generateId(),
      documentId,
      content,
      createdAt: getCurrentTimestamp(),
      label,
    };

    set((state) => ({
      versions: [...state.versions, newVersion],
    }));
    get().saveToStorage();
  },

  getVersionsForDocument: (documentId: string) => {
    return get().versions.filter((v) => v.documentId === documentId);
  },

  saveToStorage: () => {
    const { versions } = get();
    saveToLocalStorage(STORAGE_KEY, versions);
  },

  loadFromStorage: () => {
    const versions = loadFromLocalStorage<Version[]>(STORAGE_KEY, []);
    set({ versions });
  },
}));
