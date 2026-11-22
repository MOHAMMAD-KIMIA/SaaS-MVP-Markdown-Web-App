import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Download,
  FileCode2,
  FileSpreadsheet,
  FileText,
  FileUp,
  FolderArchive,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../app/components/ui/dialog';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../app/components/ui/tabs';
import { Card } from '../../../app/components/ui/card';
import { useUIStore } from '../../../stores/uiStore';
import { useDocumentStore } from '../../../stores/documentStore';
import { useSpellCheckStore } from '../../../stores/spellCheckStore';
import { useHistoryStore } from '../../../stores/historyStore';
import {
  parseImportedFile,
  type ImportedDocumentItem,
} from '../utils/documentImport';
import {
  applyWorkspaceRestore,
  downloadWorkspaceJsonBackup,
  downloadWorkspaceZipBackup,
  inspectWorkspaceBackupFile,
  type BackupInspectionResult,
} from '../utils/workspaceBackup';
import { desktop } from '../../../lib/desktop/bridge';

const FORMAT_BADGE_STYLES: Record<ImportedDocumentItem['format'], string> = {
  md: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  txt: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  html: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  docx: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
};

export function ImportBackupModal() {
  const isOpen = useUIStore((s) => s.isImportBackupModalOpen);
  const initialTab = useUIStore((s) => s.importBackupInitialTab);
  const closeModal = useUIStore((s) => s.closeImportBackupModal);
  const setCurrentView = useUIStore((s) => s.setCurrentView);

  const importDocuments = useDocumentStore((s) => s.importDocuments);
  const documentCount = useDocumentStore((s) => s.documents.length);
  const customWordCount = useSpellCheckStore((s) => s.userDictionary.length);
  const versionCount = useHistoryStore((s) => s.versions.length);

  const [activeTab, setActiveTab] = useState<'import' | 'backup'>(initialTab);
  const [stagedImports, setStagedImports] = useState<ImportedDocumentItem[]>([]);
  const [isParsingImport, setIsParsingImport] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [isDraggingImport, setIsDraggingImport] = useState(false);

  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [inspectedBackup, setInspectedBackup] =
    useState<BackupInspectionResult | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [isInspectingRestore, setIsInspectingRestore] = useState(false);

  const importInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setImportError(null);
      setBackupNotice(null);
      setBackupError(null);
    }
  }, [isOpen, initialTab]);

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsParsingImport(true);
    setImportError(null);
    const parsedItems: ImportedDocumentItem[] = [];
    const errors: string[] = [];

    for (const file of Array.from(fileList)) {
      try {
        const parsed = await parseImportedFile(file);
        parsedItems.push(parsed);
      } catch (err) {
        errors.push(
          err instanceof Error ? err.message : `Failed to parse "${file.name}".`
        );
      }
    }

    if (parsedItems.length > 0) {
      setStagedImports((prev) => [...prev, ...parsedItems]);
    }
    if (errors.length > 0) {
      setImportError(errors.join(' '));
    }
    setIsParsingImport(false);
  };

  const handleImportDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingImport(false);
    void handleFilesSelected(e.dataTransfer.files);
  };

  const handleConfirmImport = () => {
    if (stagedImports.length === 0) return;

    importDocuments(
      stagedImports.map((item) => ({
        title: item.title,
        content: item.content,
      }))
    );

    const count = stagedImports.length;
    setStagedImports([]);
    setCurrentView('editor');
    closeModal();
    desktop.showNotification(
      'Documents Imported',
      `Imported ${count} document${count === 1 ? '' : 's'} into your workspace.`
    );
  };

  const handleDownloadZip = async () => {
    setIsGeneratingZip(true);
    setBackupError(null);
    setBackupNotice(null);
    try {
      const res = await downloadWorkspaceZipBackup();
      setBackupNotice(
        `Downloaded ${res.fileName} with ${res.documentCount} document${res.documentCount === 1 ? '' : 's'}, custom dictionary & settings.`
      );
    } catch (err) {
      setBackupError(
        err instanceof Error ? err.message : 'Failed to create ZIP backup.'
      );
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const handleDownloadJson = () => {
    setBackupError(null);
    setBackupNotice(null);
    try {
      const res = downloadWorkspaceJsonBackup();
      setBackupNotice(
        `Downloaded ${res.fileName} (${res.documentCount} document${res.documentCount === 1 ? '' : 's'}).`
      );
    } catch (err) {
      setBackupError(
        err instanceof Error ? err.message : 'Failed to create JSON backup.'
      );
    }
  };

  const handleBackupFileSelected = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setIsInspectingRestore(true);
    setBackupError(null);
    setBackupNotice(null);

    try {
      const result = await inspectWorkspaceBackupFile(file);
      setInspectedBackup(result);
    } catch (err) {
      setInspectedBackup(null);
      setBackupError(
        err instanceof Error ? err.message : 'Failed to read backup file.'
      );
    } finally {
      setIsInspectingRestore(false);
    }
  };

  const handleConfirmRestore = () => {
    if (!inspectedBackup) return;

    const result = applyWorkspaceRestore(inspectedBackup.payload, restoreMode);
    setCurrentView('editor');
    setInspectedBackup(null);
    closeModal();
    desktop.showNotification(
      'Workspace Restored',
      `Restored ${result.documentsRestored} document${result.documentsRestored === 1 ? '' : 's'} and ${result.dictionaryWordsAdded} custom word${result.dictionaryWordsAdded === 1 ? '' : 's'}.`
    );
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderArchive className="h-5 w-5 text-primary" />
            <span>Document Import &amp; Workspace Backup</span>
          </DialogTitle>
          <DialogDescription>
            Import Markdown, Text, HTML, or Word (.docx) files, or export and restore full workspace backups (.zip / .json).
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'import' | 'backup')}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import" className="gap-1.5">
              <FileUp className="h-4 w-4" />
              <span>Import Files (.md, .txt, .html, .docx)</span>
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-1.5">
              <Archive className="h-4 w-4" />
              <span>Workspace Backup &amp; Restore</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: MULTI-FORMAT DOCUMENT IMPORT */}
          <TabsContent
            value="import"
            className="flex-1 overflow-y-auto space-y-4 pt-3 pr-1"
          >
            <input
              ref={importInputRef}
              type="file"
              multiple
              accept=".md,.markdown,.txt,.html,.htm,.docx"
              className="hidden"
              onChange={(e) => {
                void handleFilesSelected(e.target.files);
                e.target.value = '';
              }}
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingImport(true);
              }}
              onDragLeave={() => setIsDraggingImport(false)}
              onDrop={handleImportDrop}
              onClick={() => importInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                isDraggingImport
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-semibold">
                {isParsingImport
                  ? 'Converting files to Markdown...'
                  : 'Drop files here or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports <span className="font-mono">.md</span>,{' '}
                <span className="font-mono">.txt</span>,{' '}
                <span className="font-mono">.html</span>, and Word{' '}
                <span className="font-mono">.docx</span> (auto-converted to clean GFM Markdown)
              </p>
            </div>

            {importError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}

            {stagedImports.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    Ready to Import ({stagedImports.length})
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-muted-foreground"
                    onClick={() => setStagedImports([])}
                  >
                    Clear All
                  </Button>
                </div>

                {stagedImports.map((item) => (
                  <Card key={item.id} className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                          FORMAT_BADGE_STYLES[item.format]
                        }`}
                      >
                        .{item.format}
                      </span>
                      <Input
                        value={item.title}
                        onChange={(e) =>
                          setStagedImports((prev) =>
                            prev.map((p) =>
                              p.id === item.id ? { ...p, title: e.target.value } : p
                            )
                          )
                        }
                        className="h-7 text-xs font-medium flex-1"
                        placeholder="Document title"
                      />
                      <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                        {item.wordCount} words
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setStagedImports((prev) =>
                            prev.filter((p) => p.id !== item.id)
                          )
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 font-mono bg-muted/40 rounded px-2 py-1">
                      {item.content.slice(0, 180) || '(Empty file)'}
                    </p>

                    {item.warnings.length > 0 && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400">
                        Note: {item.warnings[0]}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: WORKSPACE BACKUP & RESTORE */}
          <TabsContent
            value="backup"
            className="flex-1 overflow-y-auto space-y-4 pt-3 pr-1"
          >
            {backupNotice && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{backupNotice}</span>
              </div>
            )}

            {backupError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{backupError}</span>
              </div>
            )}

            {/* Create Backup */}
            <Card className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Archive className="h-4 w-4 text-primary" />
                    <span>Export Full Workspace Backup</span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Includes all documents as <span className="font-mono">.md</span> files, editor settings, custom spell-check dictionary, and version snapshots.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2.5 text-center">
                <div>
                  <div className="text-base font-bold text-foreground">{documentCount}</div>
                  <div className="text-[11px] text-muted-foreground">Documents</div>
                </div>
                <div>
                  <div className="text-base font-bold text-foreground">{customWordCount}</div>
                  <div className="text-[11px] text-muted-foreground">Custom Words</div>
                </div>
                <div>
                  <div className="text-base font-bold text-foreground">{versionCount}</div>
                  <div className="text-[11px] text-muted-foreground">Snapshots</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={handleDownloadZip}
                  disabled={isGeneratingZip}
                  className="flex-1 gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  {isGeneratingZip ? 'Packaging .ZIP...' : 'Download .ZIP Archive'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadJson}
                  className="gap-1.5"
                >
                  <FileCode2 className="h-4 w-4" />
                  <span>Download .JSON</span>
                </Button>
              </div>
            </Card>

            {/* Restore Backup */}
            <Card className="p-4 space-y-3">
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <span>Restore from Backup (.zip or .json)</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Load a Markora workspace backup or any <span className="font-mono">.zip</span> archive containing Markdown files.
                </p>
              </div>

              <input
                ref={restoreInputRef}
                type="file"
                accept=".zip,.json"
                className="hidden"
                onChange={(e) => {
                  void handleBackupFileSelected(e.target.files);
                  e.target.value = '';
                }}
              />

              <Button
                type="button"
                variant="outline"
                onClick={() => restoreInputRef.current?.click()}
                disabled={isInspectingRestore}
                className="w-full border-dashed h-12 gap-2"
              >
                <Upload className="h-4 w-4" />
                <span>
                  {isInspectingRestore
                    ? 'Inspecting backup...'
                    : inspectedBackup
                      ? `Selected: ${inspectedBackup.fileName} (Choose another)`
                      : 'Select .zip or .json Backup File'}
                </span>
              </Button>

              {inspectedBackup && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      {inspectedBackup.fileName}
                    </span>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {inspectedBackup.documentCount} docs • {inspectedBackup.dictionaryWordCount} words
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRestoreMode('merge')}
                      className={`text-left rounded-lg border p-2.5 text-xs transition-colors ${
                        restoreMode === 'merge'
                          ? 'border-primary bg-primary/10'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="font-semibold">Merge with Existing</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Keep current documents and add restored ones safely.
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRestoreMode('replace')}
                      className={`text-left rounded-lg border p-2.5 text-xs transition-colors ${
                        restoreMode === 'replace'
                          ? 'border-destructive bg-destructive/10'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="font-semibold">Replace Workspace</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Overwrite current documents, dictionary &amp; settings.
                      </div>
                    </button>
                  </div>

                  <Button
                    type="button"
                    variant={restoreMode === 'replace' ? 'destructive' : 'default'}
                    onClick={handleConfirmRestore}
                    className="w-full"
                  >
                    {restoreMode === 'replace'
                      ? `Replace Workspace with ${inspectedBackup.documentCount} Document(s)`
                      : `Merge ${inspectedBackup.documentCount} Document(s) into Workspace`}
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-2 border-t gap-2">
          <Button type="button" variant="outline" onClick={closeModal}>
            Close
          </Button>
          {activeTab === 'import' && (
            <Button
              type="button"
              disabled={stagedImports.length === 0 || isParsingImport}
              onClick={handleConfirmImport}
              className="gap-1.5"
            >
              <FileUp className="h-4 w-4" />
              Import {stagedImports.length > 0 ? stagedImports.length : ''} Document
              {stagedImports.length === 1 ? '' : 's'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
