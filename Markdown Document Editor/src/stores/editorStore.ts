import { create } from 'zustand';
import { EditorMode, TextSelection } from '../types/common.types';
import { loadFromLocalStorage, saveToLocalStorage } from '../lib/storage/localStorage';

interface EditorStore {
  editorMode: EditorMode;
  selection: TextSelection | null;
  focusMode: boolean;

  // Actions
  setEditorMode: (mode: EditorMode) => void;
  setSelection: (selection: TextSelection | null) => void;
  toggleFocusMode: () => void;
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

const STORAGE_KEY = 'markora-editor-settings';

export const useEditorStore = create<EditorStore>((set, get) => ({
  editorMode: 'split',
  selection: null,
  focusMode: false,

  setEditorMode: (mode: EditorMode) => {
    set({ editorMode: mode });
    get().saveToStorage();
  },

  setSelection: (selection: TextSelection | null) => {
    set({ selection });
  },

  toggleFocusMode: () => {
    set((state) => ({ focusMode: !state.focusMode }));
  },

  saveToStorage: () => {
    const { editorMode, focusMode } = get();
    saveToLocalStorage(STORAGE_KEY, { editorMode, focusMode });
  },

  loadFromStorage: () => {
    const settings = loadFromLocalStorage(STORAGE_KEY, {
      editorMode: 'split' as EditorMode,
      focusMode: false,
    });
    set(settings);
  },
}));
