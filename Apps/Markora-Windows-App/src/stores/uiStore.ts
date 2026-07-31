import { create } from 'zustand';

interface UIStore {
  isAppNavOpen: boolean;
  isLeftSidebarOpen: boolean;
  isSettingsSidebarOpen: boolean;
  isCommandPaletteOpen: boolean;
  isSearchPanelOpen: boolean;
  isExportModalOpen: boolean;
  isTemplatePickerOpen: boolean;
  isHistoryPanelOpen: boolean;

  // Actions
  toggleAppNav: () => void;
  toggleLeftSidebar: () => void;
  toggleSettingsSidebar: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  openSearchPanel: () => void;
  closeSearchPanel: () => void;
  openExportModal: () => void;
  closeExportModal: () => void;
  openTemplatePicker: () => void;
  closeTemplatePicker: () => void;
  openHistoryPanel: () => void;
  closeHistoryPanel: () => void;
  closeAllModals: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isAppNavOpen: true,
  isLeftSidebarOpen: true,
  isSettingsSidebarOpen: false,
  isCommandPaletteOpen: false,
  isSearchPanelOpen: false,
  isExportModalOpen: false,
  isTemplatePickerOpen: false,
  isHistoryPanelOpen: false,

  toggleAppNav: () =>
    set((state) => ({ isAppNavOpen: !state.isAppNavOpen })),

  toggleLeftSidebar: () =>
    set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),

  toggleSettingsSidebar: () =>
    set((state) => ({ isSettingsSidebarOpen: !state.isSettingsSidebarOpen })),

  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),

  openSearchPanel: () => set({ isSearchPanelOpen: true }),
  closeSearchPanel: () => set({ isSearchPanelOpen: false }),

  openExportModal: () => set({ isExportModalOpen: true }),
  closeExportModal: () => set({ isExportModalOpen: false }),

  openTemplatePicker: () => set({ isTemplatePickerOpen: true }),
  closeTemplatePicker: () => set({ isTemplatePickerOpen: false }),

  openHistoryPanel: () => set({ isHistoryPanelOpen: true }),
  closeHistoryPanel: () => set({ isHistoryPanelOpen: false }),

  closeAllModals: () =>
    set({
      isCommandPaletteOpen: false,
      isSearchPanelOpen: false,
      isExportModalOpen: false,
      isTemplatePickerOpen: false,
      isHistoryPanelOpen: false,
    }),
}));
