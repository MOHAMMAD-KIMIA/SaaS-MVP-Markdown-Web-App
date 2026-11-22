import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../app/components/ui/dialog';
import { Button } from '../app/components/ui/button';
import { Input } from '../app/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../app/components/ui/tabs';
import { useUIStore } from '../stores/uiStore';
import { useDocumentStore } from '../stores/documentStore';
import { useAuthStore } from '../stores/authStore';
import {
  listDriveFiles,
  getDriveFileContent,
  createDriveFile,
  updateDriveFile,
  DriveFile,
} from '../lib/drive/driveService';
import { openGooglePicker } from '../lib/picker/pickerService';
import { HardDrive, Download, Upload, RefreshCw, FileText, Check, AlertTriangle, LogIn, ExternalLink, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

export function GoogleDriveModal() {
  const { isDriveModalOpen, closeDriveModal } = useUIStore();
  const { getActiveDocument, createDocument, updateDocumentContent, renameDocument } = useDocumentStore();
  const { user, accessToken, signIn, loading: authLoading } = useAuthStore();

  const activeDoc = getActiveDocument();

  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [newFileName, setNewFileName] = useState(activeDoc?.title || 'Untitled Document');
  const [confirmOverwrite, setConfirmOverwrite] = useState<DriveFile | null>(null);

  useEffect(() => {
    if (isDriveModalOpen && activeDoc) {
      setNewFileName(activeDoc.title);
    }
  }, [isDriveModalOpen, activeDoc]);

  const loadFiles = async () => {
    if (!accessToken) return;
    setLoadingFiles(true);
    try {
      const driveFiles = await listDriveFiles(accessToken);
      setFiles(driveFiles);
    } catch (err: any) {
      console.error('Error fetching Google Drive files:', err);
      toast.error(err.message || 'Failed to load Google Drive files');
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (isDriveModalOpen && accessToken) {
      loadFiles();
    }
  }, [isDriveModalOpen, accessToken]);

  const handleImport = async (file: DriveFile) => {
    if (!accessToken) return;
    setImporting(true);
    try {
      const content = await getDriveFileContent(accessToken, file.id);
      const docTitle = file.name.replace(/\.(md|txt|markdown)$/i, '');
      const docId = createDocument(docTitle, content);
      toast.success(`Imported "${file.name}" into Markora!`);
      closeDriveModal();
    } catch (err: any) {
      console.error('Failed to import file:', err);
      toast.error(err.message || 'Failed to import file from Google Drive');
    } finally {
      setImporting(false);
    }
  };

  const handleSaveNew = async () => {
    if (!accessToken || !activeDoc) return;
    setSaving(true);
    try {
      await createDriveFile(accessToken, newFileName, activeDoc.content);
      toast.success(`Saved "${newFileName}" to Google Drive!`);
      loadFiles();
      closeDriveModal();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save to Google Drive');
    } finally {
      setSaving(false);
    }
  };

  const handleOverwrite = async (file: DriveFile) => {
    if (!accessToken || !activeDoc) return;
    setSaving(true);
    try {
      await updateDriveFile(accessToken, file.id, activeDoc.content);
      toast.success(`Updated "${file.name}" on Google Drive!`);
      setConfirmOverwrite(null);
      loadFiles();
      closeDriveModal();
    } catch (err: any) {
      console.error('Overwrite error:', err);
      toast.error(err.message || 'Failed to update Google Drive file');
    } finally {
      setSaving(false);
    }
  };

  const handleLaunchPicker = async () => {
    if (!accessToken) return;
    try {
      await openGooglePicker(accessToken, async (pickedFile) => {
        try {
          const content = await getDriveFileContent(accessToken, pickedFile.id);
          const docTitle = pickedFile.name.replace(/\.(md|txt|markdown)$/i, '');
          createDocument(docTitle, content);
          toast.success(`Imported "${pickedFile.name}" via Google Picker!`);
          closeDriveModal();
        } catch (err: any) {
          console.error('Error reading picked file:', err);
          toast.error('Failed to read content from picked Google Drive file');
        }
      });
    } catch (err: any) {
      console.error('Google Picker error:', err);
      toast.error(err.message || 'Failed to launch Google Picker');
    }
  };

  return (
    <Dialog open={isDriveModalOpen} onOpenChange={(open) => !open && closeDriveModal()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-blue-500" />
            Google Drive Integration
          </DialogTitle>
          <DialogDescription>
            Import Markdown files from Google Drive or save your document directly to Drive.
          </DialogDescription>
        </DialogHeader>

        {!accessToken ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <HardDrive className="h-12 w-12 text-muted-foreground/60 animate-bounce" />
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Connect your Google Account</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Sign in with Google to grant access to your Google Drive files. You will be able to read, edit, and sync Markdown documents seamlessly.
              </p>
            </div>
            <Button
              onClick={() => signIn()}
              disabled={authLoading}
              className="mt-2 bg-white text-slate-800 hover:bg-slate-100 border border-slate-300 shadow-sm gap-2 text-sm font-medium px-4 py-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign in with Google
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="import" className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="import" className="flex items-center gap-1.5">
                <Download className="h-4 w-4" /> Import from Drive
              </TabsTrigger>
              <TabsTrigger value="save" className="flex items-center gap-1.5">
                <Upload className="h-4 w-4" /> Save to Drive
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: IMPORT FROM GOOGLE DRIVE */}
            <TabsContent value="import" className="space-y-4 pt-3">
              <div className="p-3 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <FolderOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    Google Picker UI Widget
                  </h4>
                  <p className="text-[11px] text-blue-700/80 dark:text-blue-300/70">
                    Use Google's native file picker & upload dialog to select files or upload directly to Drive.
                  </p>
                </div>
                <Button
                  onClick={handleLaunchPicker}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 text-xs h-8 gap-1.5 shadow-sm"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  Launch Picker
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Or pick from recent files in Drive:
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadFiles}
                  disabled={loadingFiles}
                  className="h-7 text-xs gap-1"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingFiles ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                {loadingFiles ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Loading files from Google Drive...
                  </div>
                ) : files.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground space-y-1">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground/50" />
                    <p>No Markdown files found in your Drive.</p>
                  </div>
                ) : (
                  files.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Modified: {new Date(file.modifiedTime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleImport(file)}
                        disabled={importing}
                        className="shrink-0 text-xs h-8"
                      >
                        Import
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* TAB 2: SAVE TO GOOGLE DRIVE */}
            <TabsContent value="save" className="space-y-4 pt-3">
              {confirmOverwrite ? (
                <div className="border border-amber-500/50 bg-amber-500/10 p-4 rounded-md space-y-3">
                  <div className="flex items-start gap-2.5 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm">Confirm File Overwrite</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Are you sure you want to overwrite <strong>"{confirmOverwrite.name}"</strong> in Google Drive with current document content?
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setConfirmOverwrite(null)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleOverwrite(confirmOverwrite)}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Overwrite File'}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Save as new Google Drive document</label>
                    <div className="flex gap-2">
                      <Input
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        placeholder="Document title"
                        className="text-sm"
                      />
                      <Button onClick={handleSaveNew} disabled={saving || !newFileName.trim()}>
                        {saving ? 'Saving...' : 'Save New'}
                      </Button>
                    </div>
                  </div>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or update existing Drive file</span>
                    </div>
                  </div>

                  <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium truncate">{file.name}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmOverwrite(file)}
                          className="shrink-0 text-xs h-8"
                        >
                          Overwrite
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
