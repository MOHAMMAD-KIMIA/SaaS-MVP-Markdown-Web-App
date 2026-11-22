import { create } from 'zustand';
import { EditorMode, TextSelection } from '../types/common.types';
import { loadFromLocalStorage, saveToLocalStorage } from '../lib/storage/localStorage';

interface EditorStore {
  editorMode: EditorMode;
  selection: TextSelection | null;
  cursorOffset: number;
  focusMode: boolean;
  focusDimming: boolean;
  typewriterMode: boolean;
  showStyleHighlights: boolean;

  // Actions
  setEditorMode: (mode: EditorMode) => void;
  setSelection: (selection: TextSelection | null) => void;
  setCursorOffset: (offset: number) => void;
  setFocusMode: (enabled: boolean) => void;
  toggleFocusMode: () => void;
  toggleFocusDimming: () => void;
  toggleTypewriterMode: () => void;
  setTypewriterMode: (enabled: boolean) => void;
  toggleStyleHighlights: () => void;
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

const STORAGE_KEY = 'markora-editor-settings';

export const useEditorStore = create<EditorStore>((set, get) => ({
  editorMode: 'split',
  selection: null,
  cursorOffset: 0,
  focusMode: false,
  focusDimming: true,
  typewriterMode: false,
  showStyleHighlights: false,

  setEditorMode: (mode: EditorMode) => {
    set({ editorMode: mode });
    get().saveToStorage();
  },

  setSelection: (selection: TextSelection | null) => {
    set({ selection, cursorOffset: selection ? selection.start : get().cursorOffset });
  },

  setCursorOffset: (offset: number) => {
    set({ cursorOffset: offset });
  },

  setFocusMode: (enabled: boolean) => {
    set({ focusMode: enabled });
    get().saveToStorage();
  },

  toggleFocusMode: () => {
    set((state) => ({ focusMode: !state.focusMode }));
    get().saveToStorage();
  },

  toggleFocusDimming: () => {
    set((state) => ({ focusDimming: !state.focusDimming }));
    get().saveToStorage();
  },

  toggleTypewriterMode: () => {
    set((state) => ({ typewriterMode: !state.typewriterMode }));
    get().saveToStorage();
  },

  setTypewriterMode: (enabled: boolean) => {
    set({ typewriterMode: enabled });
    get().saveToStorage();
  },

  toggleStyleHighlights: () => {
    set((state) => ({ showStyleHighlights: !state.showStyleHighlights }));
    get().saveToStorage();
  },

  saveToStorage: () => {
    const { editorMode, focusMode, focusDimming, typewriterMode, showStyleHighlights } = get();
    saveToLocalStorage(STORAGE_KEY, {
      editorMode,
      focusMode,
      focusDimming,
      typewriterMode,
      showStyleHighlights,
    });
  },

  loadFromStorage: () => {
    const settings = loadFromLocalStorage<{
      editorMode?: EditorMode;
      focusMode?: boolean;
      focusDimming?: boolean;
      typewriterMode?: boolean;
      showStyleHighlights?: boolean;
    }>(STORAGE_KEY, {
      editorMode: 'split',
      focusMode: false,
      focusDimming: true,
      typewriterMode: false,
      showStyleHighlights: false,
    });
    set({
      editorMode: settings.editorMode || 'split',
      focusMode: Boolean(settings.focusMode),
      focusDimming: settings.focusDimming !== undefined ? Boolean(settings.focusDimming) : true,
      typewriterMode: Boolean(settings.typewriterMode),
      showStyleHighlights: Boolean(settings.showStyleHighlights),
    });
  },
}));
