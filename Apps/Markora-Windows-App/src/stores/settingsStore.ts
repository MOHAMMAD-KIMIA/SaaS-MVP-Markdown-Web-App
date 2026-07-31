import { create } from 'zustand';
import { AppSettings, PageSize, Orientation, Alignment, ThemeMode, AutoSaveSettings, EditorSettings } from '../types/common.types';
import { loadFromLocalStorage, saveToLocalStorage } from '../lib/storage/localStorage';

interface SettingsStore extends AppSettings {
  // Actions
  updatePageSize: (pageSize: PageSize) => void;
  updateOrientation: (orientation: Orientation) => void;
  updateMargins: (margins: { top: number; right: number; bottom: number; left: number }) => void;
  updateHeaderEnabled: (enabled: boolean) => void;
  updateFooterEnabled: (enabled: boolean) => void;
  updateHeaderText: (text: string) => void;
  updateFooterText: (text: string) => void;
  updateHeaderAlignment: (alignment: Alignment) => void;
  updateFooterAlignment: (alignment: Alignment) => void;
  updateFontFamily: (fontFamily: string) => void;
  updateFontSize: (fontSize: number) => void;
  updateLineHeight: (lineHeight: number) => void;
  updateTheme: (theme: ThemeMode) => void;
  updateAutoSave: (autoSave: Partial<AutoSaveSettings>) => void;
  updateEditorSettings: (editor: Partial<EditorSettings>) => void;
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

const STORAGE_KEY = 'markora-settings';

const defaultSettings: AppSettings = {
  page: {
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 72, right: 72, bottom: 72, left: 72 },
  },
  headerFooter: {
    headerEnabled: false,
    footerEnabled: false,
    headerText: '',
    footerText: 'Page {{page}} of {{total}}',
    headerAlignment: 'center',
    footerAlignment: 'center',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 16,
    lineHeight: 1.6,
  },
  theme: 'light',
  autoSave: {
    enabled: true,
    interval: 30,
  },
  editor: {
    syntaxHighlighting: true,
    formatOnSave: true,
    defaultTextDirection: 'ltr',
    autoDetectTextDirection: true,
  },
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...defaultSettings,

  updatePageSize: (pageSize: PageSize) => {
    set((state) => ({
      page: { ...state.page, pageSize },
    }));
    get().saveToStorage();
  },

  updateOrientation: (orientation: Orientation) => {
    set((state) => ({
      page: { ...state.page, orientation },
    }));
    get().saveToStorage();
  },

  updateMargins: (margins) => {
    set((state) => ({
      page: { ...state.page, margins },
    }));
    get().saveToStorage();
  },

  updateHeaderEnabled: (enabled: boolean) => {
    set((state) => ({
      headerFooter: { ...state.headerFooter, headerEnabled: enabled },
    }));
    get().saveToStorage();
  },

  updateFooterEnabled: (enabled: boolean) => {
    set((state) => ({
      headerFooter: { ...state.headerFooter, footerEnabled: enabled },
    }));
    get().saveToStorage();
  },

  updateHeaderText: (text: string) => {
    set((state) => ({
      headerFooter: { ...state.headerFooter, headerText: text },
    }));
    get().saveToStorage();
  },

  updateFooterText: (text: string) => {
    set((state) => ({
      headerFooter: { ...state.headerFooter, footerText: text },
    }));
    get().saveToStorage();
  },

  updateHeaderAlignment: (alignment: Alignment) => {
    set((state) => ({
      headerFooter: { ...state.headerFooter, headerAlignment: alignment },
    }));
    get().saveToStorage();
  },

  updateFooterAlignment: (alignment: Alignment) => {
    set((state) => ({
      headerFooter: { ...state.headerFooter, footerAlignment: alignment },
    }));
    get().saveToStorage();
  },

  updateFontFamily: (fontFamily: string) => {
    set((state) => ({
      typography: { ...state.typography, fontFamily },
    }));
    get().saveToStorage();
  },

  updateFontSize: (fontSize: number) => {
    set((state) => ({
      typography: { ...state.typography, fontSize },
    }));
    get().saveToStorage();
  },

  updateLineHeight: (lineHeight: number) => {
    set((state) => ({
      typography: { ...state.typography, lineHeight },
    }));
    get().saveToStorage();
  },

  updateTheme: (theme: ThemeMode) => {
    set({ theme });
    get().saveToStorage();
  },

  updateAutoSave: (autoSave: Partial<AutoSaveSettings>) => {
    set((state) => ({
      autoSave: { ...state.autoSave, ...autoSave },
    }));
    get().saveToStorage();
  },

  updateEditorSettings: (editor: Partial<EditorSettings>) => {
    set((state) => ({
      editor: { ...state.editor, ...editor },
    }));
    get().saveToStorage();
  },

  saveToStorage: () => {
    const settings = get();
    saveToLocalStorage(STORAGE_KEY, {
      page: settings.page,
      headerFooter: settings.headerFooter,
      typography: settings.typography,
      theme: settings.theme,
      autoSave: settings.autoSave,
      editor: settings.editor,
    });
  },

  loadFromStorage: () => {
    const stored = loadFromLocalStorage<Partial<AppSettings>>(STORAGE_KEY, defaultSettings);
    set({
      ...defaultSettings,
      ...stored,
      autoSave: {
        ...defaultSettings.autoSave,
        ...(stored.autoSave || {}),
      },
      editor: {
        ...defaultSettings.editor,
        ...(stored.editor || {}),
      },
    });
  },
}));
