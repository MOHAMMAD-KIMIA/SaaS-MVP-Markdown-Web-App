// src/stores/spellCheckStore.ts
import { create } from 'zustand';
import {
  loadUserDictionary,
  saveUserDictionary,
} from '../lib/spellcheck/dictionary';

interface SpellCheckStore {
  userDictionary: string[];
  ignoredWords: string[];
  lastErrorCount: number;

  // Actions
  loadFromStorage: () => void;
  addWord: (word: string) => boolean;
  addWordsBulk: (words: string[]) => number;
  removeWord: (word: string) => void;
  clearUserDictionary: () => void;
  ignoreWord: (word: string) => void;
  unignoreWord: (word: string) => void;
  clearIgnoredWords: () => void;
  setLastErrorCount: (count: number) => void;
}

const normalizeWord = (word: string): string =>
  word.trim().toLowerCase().replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, '');

export const useSpellCheckStore = create<SpellCheckStore>((set, get) => ({
  userDictionary: Array.from(loadUserDictionary()).sort((a, b) => a.localeCompare(b)),
  ignoredWords: [],
  lastErrorCount: 0,

  loadFromStorage: () => {
    const loaded = Array.from(loadUserDictionary()).sort((a, b) => a.localeCompare(b));
    set({ userDictionary: loaded });
  },

  addWord: (rawWord: string) => {
    const normalized = normalizeWord(rawWord);
    if (!normalized || normalized.length < 2) return false;

    const current = get().userDictionary;
    if (current.includes(normalized)) return false;

    const next = [...current, normalized].sort((a, b) => a.localeCompare(b));
    saveUserDictionary(next);
    set({ userDictionary: next });
    return true;
  },

  addWordsBulk: (rawWords: string[]) => {
    const currentSet = new Set(get().userDictionary);
    let added = 0;

    for (const raw of rawWords) {
      const normalized = normalizeWord(raw);
      if (normalized && normalized.length >= 2 && !currentSet.has(normalized)) {
        currentSet.add(normalized);
        added++;
      }
    }

    if (added > 0) {
      const next = Array.from(currentSet).sort((a, b) => a.localeCompare(b));
      saveUserDictionary(next);
      set({ userDictionary: next });
    }
    return added;
  },

  removeWord: (rawWord: string) => {
    const normalized = rawWord.trim().toLowerCase();
    const next = get().userDictionary.filter((w) => w !== normalized);
    saveUserDictionary(next);
    set({ userDictionary: next });
  },

  clearUserDictionary: () => {
    saveUserDictionary([]);
    set({ userDictionary: [] });
  },

  ignoreWord: (rawWord: string) => {
    const normalized = rawWord.trim().toLowerCase();
    if (!normalized) return;
    const current = get().ignoredWords;
    if (current.includes(normalized)) return;
    set({ ignoredWords: [...current, normalized].sort((a, b) => a.localeCompare(b)) });
  },

  unignoreWord: (rawWord: string) => {
    const normalized = rawWord.trim().toLowerCase();
    set({
      ignoredWords: get().ignoredWords.filter((w) => w !== normalized),
    });
  },

  clearIgnoredWords: () => set({ ignoredWords: [] }),

  setLastErrorCount: (count: number) => set({ lastErrorCount: count }),
}));
