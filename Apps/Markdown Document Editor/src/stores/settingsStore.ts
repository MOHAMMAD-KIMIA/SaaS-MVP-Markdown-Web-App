import { create } from 'zustand';
import { AppSettings, PageSize, Orientation, Alignment, ThemeMode, AutoSaveSettings, EditorSettings, ExportStyleSettings } from '../types/common.types';
import { loadFromLocalStorage, saveToLocalStorage } from '../lib/storage/localStorage';

interface SettingsStore extends AppSettings {
  // Actions
  updatePageSize: (pageSize: PageSize) => void;
  updateOrientation: (orientation: Orientation) => void;
  updateMargins: (margins: { top: number; right: number; bottom: number; left: number }) => void;
  updatePadding: (padding: { top: number; right: number; bottom: number; left: number }) => void;
  updateHeaderEnabled: (enabled: boolean) => void;
  updateFooterEnabled: (enabled: boolean) => void;
  updateHeaderText: (text: string) => void;
  updateFooterText: (text: string) => void;
  updateHeaderAlignment: (alignment: Alignment) => void;
  updateFooterAlignment: (alignment: Alignment) => void;
  updatePageNumbers: (config: {
    pageNumberEnabled?: boolean;
    pageNumberFormat?: string;
    pageNumberPosition?: 'header' | 'footer';
    pageNumberAlignment?: Alignment;
  }) => void;
  updateFontFamily: (fontFamily: string) => void;
  updateFontSize: (fontSize: number) => void;
  updateLineHeight: (lineHeight: number) => void;
  updateTheme: (theme: ThemeMode) => void;
  updateAutoSave: (autoSave: Partial<AutoSaveSettings>) => void;
  updateEditorSettings: (editor: Partial<EditorSettings>) => void;
  updateExportStyle: (exportStyle: Partial<ExportStyleSettings>) => void;
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

const STORAGE_KEY = 'markora-settings';

const defaultSettings: AppSettings = {
  page: {
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 72, right: 72, bottom: 72, left: 72 },
    padding: { top: 24, right: 24, bottom: 24, left: 24 },
  },
  headerFooter: {
    headerEnabled: false,
    footerEnabled: false,
    headerText: '',
    footerText: 'Page {{page}} of {{total}}',
    headerAlignment: 'center',
    footerAlignment: 'center',
    pageNumberEnabled: false,
    pageNumberFormat: 'Page {{page}} of {{total}}',
    pageNumberPosition: 'footer',
    pageNumberAlignment: 'center',
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
    spellCheck: true,
  },
  exportStyle: {
    themePreset: 'default',
    customCss: '',
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

  updatePadding: (padding) => {
    set((state) => ({
      page: { ...state.page, padding },
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

  updatePageNumbers: (config) => {
    set((state) => ({
      headerFooter: { ...state.headerFooter, ...config },
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

  updateExportStyle: (exportStyle: Partial<ExportStyleSettings>) => {
    set((state) => ({
      exportStyle: {
        themePreset: state.exportStyle?.themePreset || 'default',
        customCss: state.exportStyle?.customCss || '',
        ...exportStyle,
      },
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
      exportStyle: settings.exportStyle,
    });
  },

  loadFromStorage: () => {
    const stored = loadFromLocalStorage<Partial<AppSettings>>(STORAGE_KEY, defaultSettings);
    set({
      ...defaultSettings,
      ...stored,
      page: {
        ...defaultSettings.page,
        ...(stored.page || {}),
        margins: {
          ...defaultSettings.page.margins,
          ...(stored.page?.margins || {}),
        },
        padding: {
          ...(defaultSettings.page.padding || { top: 24, right: 24, bottom: 24, left: 24 }),
          ...(stored.page?.padding || {}),
        },
      },
      headerFooter: {
        ...defaultSettings.headerFooter,
        ...(stored.headerFooter || {}),
      },
      autoSave: {
        ...defaultSettings.autoSave,
        ...(stored.autoSave || {}),
      },
      editor: {
        ...defaultSettings.editor,
        ...(stored.editor || {}),
      },
      exportStyle: {
        themePreset: defaultSettings.exportStyle?.themePreset || 'default',
        customCss: defaultSettings.exportStyle?.customCss || '',
        ...(stored.exportStyle || {}),
      },
    });
  },
}));
