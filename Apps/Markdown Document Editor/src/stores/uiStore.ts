import { create } from 'zustand';

export type AppView =
  | 'editor'
  | 'dashboard'
  | 'publishing'
  | 'account'
  | 'documentation'
  | 'dictionary';

interface UIStore {
  currentView: AppView;
  isAppNavOpen: boolean;
  isLeftSidebarOpen: boolean;
  isSettingsSidebarOpen: boolean;
  isCommandPaletteOpen: boolean;
  isSearchPanelOpen: boolean;
  isExportModalOpen: boolean;
  isTemplatePickerOpen: boolean;
  isHistoryPanelOpen: boolean;
  isDriveModalOpen: boolean;
  isCalendarModalOpen: boolean;
  isTableBuilderOpen: boolean;
  isImportBackupModalOpen: boolean;
  isPresentationOpen: boolean;
  isKnowledgeGraphOpen: boolean;
  isAssetManagerOpen: boolean;
  isReadabilityOpen: boolean;
  importBackupInitialTab: 'import' | 'backup';
  leftSidebarTab: 'documents' | 'outline' | 'backlinks' | 'comments';

  // Actions
  setCurrentView: (view: AppView) => void;
  setLeftSidebarTab: (tab: 'documents' | 'outline' | 'backlinks' | 'comments') => void;
  openOutlinePanel: () => void;
  openCommentsPanel: () => void;
  openDictionaryPage: () => void;
  toggleAppNav: () => void;
  toggleLeftSidebar: () => void;
  toggleSettingsSidebar: () => void;
  openSettingsSidebar: () => void;
  closeSettingsSidebar: () => void;
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
  openDriveModal: () => void;
  closeDriveModal: () => void;
  openCalendarModal: () => void;
  closeCalendarModal: () => void;
  openTableBuilder: () => void;
  closeTableBuilder: () => void;
  openImportBackupModal: (tab?: 'import' | 'backup') => void;
  closeImportBackupModal: () => void;
  openPresentation: () => void;
  closePresentation: () => void;
  openKnowledgeGraph: () => void;
  closeKnowledgeGraph: () => void;
  openAssetManager: () => void;
  closeAssetManager: () => void;
  openReadability: () => void;
  closeReadability: () => void;
  toggleReadability: () => void;
  closeAllModals: () => void;
}

const isWideDesktop = () => (typeof window !== 'undefined' ? window.innerWidth >= 1280 : true);

export const useUIStore = create<UIStore>((set) => ({
  currentView: 'editor',
  isAppNavOpen: isWideDesktop(),
  isLeftSidebarOpen: isWideDesktop(),
  isSettingsSidebarOpen: false,
  isCommandPaletteOpen: false,
  isSearchPanelOpen: false,
  isExportModalOpen: false,
  isTemplatePickerOpen: false,
  isHistoryPanelOpen: false,
  isDriveModalOpen: false,
  isCalendarModalOpen: false,
  isTableBuilderOpen: false,
  isImportBackupModalOpen: false,
  isPresentationOpen: false,
  isKnowledgeGraphOpen: false,
  isAssetManagerOpen: false,
  isReadabilityOpen: false,
  importBackupInitialTab: 'import',
  leftSidebarTab: 'documents',

  setCurrentView: (view) => set({ currentView: view }),
  setLeftSidebarTab: (tab) => set({ leftSidebarTab: tab }),
  openOutlinePanel: () =>
    set({
      currentView: 'editor',
      isLeftSidebarOpen: true,
      leftSidebarTab: 'outline',
    }),
  openCommentsPanel: () =>
    set({
      currentView: 'editor',
      isLeftSidebarOpen: true,
      leftSidebarTab: 'comments',
    }),
  openDictionaryPage: () => set({ currentView: 'dictionary' }),

  toggleAppNav: () =>
    set((state) => ({ isAppNavOpen: !state.isAppNavOpen })),

  toggleLeftSidebar: () =>
    set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),

  toggleSettingsSidebar: () =>
    set((state) => ({ isSettingsSidebarOpen: !state.isSettingsSidebarOpen })),
  openSettingsSidebar: () => set({ isSettingsSidebarOpen: true }),
  closeSettingsSidebar: () => set({ isSettingsSidebarOpen: false }),

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

  openDriveModal: () => set({ isDriveModalOpen: true }),
  closeDriveModal: () => set({ isDriveModalOpen: false }),

  openCalendarModal: () => set({ isCalendarModalOpen: true }),
  closeCalendarModal: () => set({ isCalendarModalOpen: false }),

  openTableBuilder: () => set({ isTableBuilderOpen: true }),
  closeTableBuilder: () => set({ isTableBuilderOpen: false }),

  openImportBackupModal: (tab = 'import') =>
    set({ isImportBackupModalOpen: true, importBackupInitialTab: tab }),
  closeImportBackupModal: () => set({ isImportBackupModalOpen: false }),

  openPresentation: () => set({ isPresentationOpen: true }),
  closePresentation: () => set({ isPresentationOpen: false }),

  openKnowledgeGraph: () => set({ isKnowledgeGraphOpen: true }),
  closeKnowledgeGraph: () => set({ isKnowledgeGraphOpen: false }),

  openAssetManager: () => set({ isAssetManagerOpen: true }),
  closeAssetManager: () => set({ isAssetManagerOpen: false }),

  openReadability: () => set({ isReadabilityOpen: true }),
  closeReadability: () => set({ isReadabilityOpen: false }),
  toggleReadability: () => set((state) => ({ isReadabilityOpen: !state.isReadabilityOpen })),

  closeAllModals: () =>
    set({
      isCommandPaletteOpen: false,
      isSearchPanelOpen: false,
      isExportModalOpen: false,
      isTemplatePickerOpen: false,
      isHistoryPanelOpen: false,
      isDriveModalOpen: false,
      isCalendarModalOpen: false,
      isTableBuilderOpen: false,
      isImportBackupModalOpen: false,
      isPresentationOpen: false,
      isKnowledgeGraphOpen: false,
      isAssetManagerOpen: false,
      isReadabilityOpen: false,
    }),
}));
