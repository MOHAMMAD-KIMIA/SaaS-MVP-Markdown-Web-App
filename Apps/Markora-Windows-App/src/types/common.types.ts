export type EditorMode = 'markdown' | 'preview' | 'split';

export type ThemeMode = 'light' | 'dark' | 'sepia';

export type PageSize = 'A4' | 'Letter' | 'Legal';

export type Orientation = 'portrait' | 'landscape';

export type Alignment = 'left' | 'center' | 'right';

export interface Document {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  isDirty?: boolean;
  dailyWordGoal?: number;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
}

export interface Workspace {
  id: string;
  name: string;
  documents: Document[];
  folders: Folder[];
}

export interface PageSettings {
  pageSize: PageSize;
  orientation: Orientation;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface HeaderFooterSettings {
  headerEnabled: boolean;
  footerEnabled: boolean;
  headerText: string;
  footerText: string;
  headerAlignment: Alignment;
  footerAlignment: Alignment;
}

export interface TypographySettings {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
}

export type AutoSaveInterval = 'keystroke' | 5 | 10 | 30 | 60 | 120 | 300 | 600;

export interface AutoSaveSettings {
  enabled: boolean;
  interval: AutoSaveInterval;
}

import { TextDirection } from '../lib/markdown/textDirection';

export interface EditorSettings {
  syntaxHighlighting: boolean;
  formatOnSave: boolean;
  defaultTextDirection?: TextDirection;
  autoDetectTextDirection?: boolean;
}

export interface AppSettings {
  page: PageSettings;
  headerFooter: HeaderFooterSettings;
  typography: TypographySettings;
  theme: ThemeMode;
  autoSave: AutoSaveSettings;
  editor: EditorSettings;
}

export interface Version {
  id: string;
  documentId: string;
  content: string;
  createdAt: string;
  label?: string;
}

export interface Comment {
  id: string;
  documentId: string;
  range?: {
    start: number;
    end: number;
  };
  blockId?: string;
  text: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TextSelection {
  start: number;
  end: number;
}

export interface Command {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  action: () => void;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
}

export interface ToolbarAction {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  handler: () => void;
}
