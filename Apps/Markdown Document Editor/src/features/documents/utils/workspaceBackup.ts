// src/features/documents/utils/workspaceBackup.ts
import JSZip from 'jszip';
import type { AppSettings, Document, Version } from '../../../types/common.types';
import { useDocumentStore } from '../../../stores/documentStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useSpellCheckStore } from '../../../stores/spellCheckStore';
import { useHistoryStore } from '../../../stores/historyStore';
import { downloadBlob, sanitizeFilename } from '../../export/utils/exportUtils';
import { generateId } from '../../../lib/utils/ids';
import { getCurrentTimestamp } from '../../../lib/utils/dates';

export interface WorkspaceBackupPayload {
  version: 1;
  app: 'Markora';
  exportedAt: string;
  activeDocumentId: string | null;
  documents: Document[];
  settings?: AppSettings;
  customDictionary: string[];
  versions: Version[];
}

export interface BackupInspectionResult {
  fileName: string;
  sourceType: 'zip' | 'json';
  documentCount: number;
  dictionaryWordCount: number;
  versionCount: number;
  hasSettings: boolean;
  exportedAt: string;
  payload: WorkspaceBackupPayload;
}

function getDateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function buildWorkspaceBackupPayload(): WorkspaceBackupPayload {
  const docState = useDocumentStore.getState();
  const settingsState = useSettingsStore.getState();
  const dictState = useSpellCheckStore.getState();
  const historyState = useHistoryStore.getState();

  const settingsSnapshot: AppSettings = {
    page: settingsState.page,
    headerFooter: settingsState.headerFooter,
    typography: settingsState.typography,
    theme: settingsState.theme,
    autoSave: settingsState.autoSave,
    editor: settingsState.editor,
  };

  return {
    version: 1,
    app: 'Markora',
    exportedAt: new Date().toISOString(),
    activeDocumentId: docState.activeDocumentId,
    documents: docState.documents,
    settings: settingsSnapshot,
    customDictionary: dictState.userDictionary,
    versions: historyState.versions,
  };
}

export async function downloadWorkspaceZipBackup(): Promise<{
  fileName: string;
  documentCount: number;
}> {
  const payload = buildWorkspaceBackupPayload();
  const zip = new JSZip();

  // 1. Complete JSON workspace snapshot
  zip.file('markora-workspace.json', JSON.stringify(payload, null, 2));

  // 2. Individual readable .md files in documents/ folder
  const docsFolder = zip.folder('documents');
  const usedNames = new Map<string, number>();

  if (docsFolder) {
    for (const doc of payload.documents) {
      const base = sanitizeFilename(doc.title || 'Untitled');
      const count = usedNames.get(base) || 0;
      usedNames.set(base, count + 1);
      const uniqueName = count === 0 ? `${base}.md` : `${base}-${count + 1}.md`;
      docsFolder.file(uniqueName, doc.content || '');
    }
  }

  // 3. Custom dictionary backup
  zip.file(
    'dictionary/custom-dictionary.json',
    JSON.stringify(payload.customDictionary, null, 2)
  );

  // 4. Manifest README
  zip.file(
    'README.txt',
    [
      'Markora Workspace Backup',
      `Exported: ${payload.exportedAt}`,
      `Documents: ${payload.documents.length}`,
      `Custom Dictionary Words: ${payload.customDictionary.length}`,
      `Version Snapshots: ${payload.versions.length}`,
      '',
      'You can restore this .zip file directly inside Markora via File > Workspace Backup & Restore.',
    ].join('\n')
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  const fileName = `markora-workspace-backup-${getDateStamp()}.zip`;

  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = fileName;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { fileName, documentCount: payload.documents.length };
}

export function downloadWorkspaceJsonBackup(): {
  fileName: string;
  documentCount: number;
} {
  const payload = buildWorkspaceBackupPayload();
  const fileName = `markora-workspace-backup-${getDateStamp()}.json`;
  downloadBlob(
    JSON.stringify(payload, null, 2),
    fileName,
    'application/json;charset=utf-8'
  );
  return { fileName, documentCount: payload.documents.length };
}

function normalizeParsedPayload(raw: unknown): WorkspaceBackupPayload {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid backup structure.');
  }

  const obj = raw as Partial<WorkspaceBackupPayload>;
  const documents = Array.isArray(obj.documents)
    ? obj.documents.filter(
        (d): d is Document =>
          Boolean(d && typeof d === 'object' && typeof d.content === 'string')
      )
    : [];

  const customDictionary = Array.isArray(obj.customDictionary)
    ? obj.customDictionary.filter((w): w is string => typeof w === 'string')
    : [];

  const versions = Array.isArray(obj.versions)
    ? obj.versions.filter(
        (v): v is Version =>
          Boolean(v && typeof v === 'object' && typeof v.documentId === 'string')
      )
    : [];

  return {
    version: 1,
    app: 'Markora',
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
    activeDocumentId: typeof obj.activeDocumentId === 'string' ? obj.activeDocumentId : null,
    documents,
    settings: obj.settings,
    customDictionary,
    versions,
  };
}

export async function inspectWorkspaceBackupFile(
  file: File
): Promise<BackupInspectionResult> {
  const lower = file.name.toLowerCase();

  if (lower.endsWith('.json')) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const payload = normalizeParsedPayload(parsed);
    return {
      fileName: file.name,
      sourceType: 'json',
      documentCount: payload.documents.length,
      dictionaryWordCount: payload.customDictionary.length,
      versionCount: payload.versions.length,
      hasSettings: Boolean(payload.settings),
      exportedAt: payload.exportedAt,
      payload,
    };
  }

  if (lower.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const jsonEntry =
      zip.file('markora-workspace.json') ||
      zip.file(/workspace.*\.json$/i)[0];

    if (jsonEntry) {
      const jsonText = await jsonEntry.async('string');
      const payload = normalizeParsedPayload(JSON.parse(jsonText));
      return {
        fileName: file.name,
        sourceType: 'zip',
        documentCount: payload.documents.length,
        dictionaryWordCount: payload.customDictionary.length,
        versionCount: payload.versions.length,
        hasSettings: Boolean(payload.settings),
        exportedAt: payload.exportedAt,
        payload,
      };
    }

    // Fallback: import any .md / .txt files found in the zip archive
    const markdownFiles = zip.file(/\.(md|markdown|txt)$/i);
    if (markdownFiles.length === 0) {
      throw new Error('No Markora backup manifest or Markdown files found inside this ZIP archive.');
    }

    const now = getCurrentTimestamp();
    const documents: Document[] = await Promise.all(
      markdownFiles.map(async (entry) => {
        const content = await entry.async('string');
        const baseName = entry.name.split('/').pop() || entry.name;
        const title = baseName.replace(/\.(md|markdown|txt)$/i, '') || 'Restored Note';
        return {
          id: generateId(),
          title,
          content,
          createdAt: now,
          updatedAt: now,
          version: 1,
          isDirty: false,
        };
      })
    );

    const payload: WorkspaceBackupPayload = {
      version: 1,
      app: 'Markora',
      exportedAt: now,
      activeDocumentId: documents[0]?.id || null,
      documents,
      customDictionary: [],
      versions: [],
    };

    return {
      fileName: file.name,
      sourceType: 'zip',
      documentCount: payload.documents.length,
      dictionaryWordCount: 0,
      versionCount: 0,
      hasSettings: false,
      exportedAt: payload.exportedAt,
      payload,
    };
  }

  throw new Error('Unsupported backup file. Please select a .zip or .json Markora backup.');
}

export function applyWorkspaceRestore(
  payload: WorkspaceBackupPayload,
  mode: 'merge' | 'replace'
): { documentsRestored: number; dictionaryWordsAdded: number } {
  const docStore = useDocumentStore.getState();
  const dictStore = useSpellCheckStore.getState();
  const historyStore = useHistoryStore.getState();
  const settingsStore = useSettingsStore.getState();

  const documentsRestored = docStore.restoreDocuments(
    payload.documents,
    payload.activeDocumentId,
    mode
  );

  // Restore custom dictionary words
  let dictionaryWordsAdded = 0;
  if (mode === 'replace') {
    dictStore.clearUserDictionary();
  }
  if (payload.customDictionary.length > 0) {
    dictionaryWordsAdded = dictStore.addWordsBulk(payload.customDictionary);
  }

  // Restore version snapshots
  if (payload.versions.length > 0) {
    if (mode === 'replace') {
      useHistoryStore.setState({ versions: payload.versions });
    } else {
      const existingIds = new Set(historyStore.versions.map((v) => v.id));
      const newVersions = payload.versions.filter((v) => !existingIds.has(v.id));
      useHistoryStore.setState({ versions: [...historyStore.versions, ...newVersions] });
    }
    useHistoryStore.getState().saveToStorage();
  }

  // Restore settings if replacing workspace
  if (mode === 'replace' && payload.settings) {
    const s = payload.settings;
    if (s.page) {
      settingsStore.updatePageSize(s.page.pageSize);
      settingsStore.updateOrientation(s.page.orientation);
      settingsStore.updateMargins(s.page.margins);
      if (s.page.padding) settingsStore.updatePadding(s.page.padding);
    }
    if (s.headerFooter) {
      settingsStore.updateHeaderEnabled(s.headerFooter.headerEnabled);
      settingsStore.updateHeaderText(s.headerFooter.headerText);
      settingsStore.updateHeaderAlignment(s.headerFooter.headerAlignment);
      settingsStore.updateFooterEnabled(s.headerFooter.footerEnabled);
      settingsStore.updateFooterText(s.headerFooter.footerText);
      settingsStore.updateFooterAlignment(s.headerFooter.footerAlignment);
      settingsStore.updatePageNumbers({
        pageNumberEnabled: s.headerFooter.pageNumberEnabled,
        pageNumberFormat: s.headerFooter.pageNumberFormat,
        pageNumberPosition: s.headerFooter.pageNumberPosition,
        pageNumberAlignment: s.headerFooter.pageNumberAlignment,
      });
    }
    if (s.typography) {
      settingsStore.updateFontFamily(s.typography.fontFamily);
      settingsStore.updateFontSize(s.typography.fontSize);
      settingsStore.updateLineHeight(s.typography.lineHeight);
    }
    if (s.theme) settingsStore.updateTheme(s.theme);
    if (s.autoSave) settingsStore.updateAutoSave(s.autoSave);
    if (s.editor) settingsStore.updateEditorSettings(s.editor);
  }

  return { documentsRestored, dictionaryWordsAdded };
}
