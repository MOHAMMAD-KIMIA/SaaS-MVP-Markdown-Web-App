/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, HardDrive, Clock, Plus, FolderOpen, Download, Trash2, 
  ArrowUpRight, CheckCircle2, Cloud, Cpu, Sparkles, BookOpen, Share2,
  MoreVertical, Copy, Edit2, FileCode, Check
} from 'lucide-react';
import { useDocumentStore } from '../../../stores/documentStore';
import { desktop } from '../../../lib/desktop/bridge';
import { exportToHtml } from '../../../features/export/utils/exportHtml';
import { buildExportHtml } from '../../../features/export/utils/buildExportHtml';
import { useSettingsStore } from '../../../stores/settingsStore';
import { copyToClipboard } from '../../../lib/utils/clipboard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../app/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../app/components/ui/dialog';
import { Input } from '../../../app/components/ui/input';
import { Button } from '../../../app/components/ui/button';

interface DesktopDashboardProps {
  onNavigate: (view: 'editor' | 'dashboard' | 'publishing' | 'account' | 'documentation') => void;
}

export function DesktopDashboard({ onNavigate }: DesktopDashboardProps) {
  const documents = useDocumentStore((state) => state.documents);
  const createDocument = useDocumentStore((state) => state.createDocument);
  const openDocument = useDocumentStore((state) => state.openDocument);
  const deleteDocument = useDocumentStore((state) => state.deleteDocument);
  const renameDocument = useDocumentStore((state) => state.renameDocument);
  const duplicateDocument = useDocumentStore((state) => state.duplicateDocument);
  const settings = useSettingsStore((state) => state);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const [renamingDoc, setRenamingDoc] = useState<{ id: string; title: string } | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<{ id: string; title: string } | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const handleRename = (id: string, currentTitle: string) => {
    setRenamingDoc({ id, title: currentTitle });
    setNewTitle(currentTitle);
  };

  const executeRename = () => {
    if (renamingDoc && newTitle.trim() && newTitle.trim() !== renamingDoc.title) {
      renameDocument(renamingDoc.id, newTitle.trim());
      desktop.showNotification('Renamed', `Document renamed to "${newTitle.trim()}".`);
    }
    setRenamingDoc(null);
  };

  const handleCopyContent = async (content: string, id: string) => {
    try {
      const success = await copyToClipboard(content || '');
      if (success) {
        setCopiedDocId(id);
        desktop.showNotification('Copied', 'Markdown copied to clipboard!');
        setTimeout(() => setCopiedDocId(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy document content:', err);
      desktop.showNotification('Copy Failed', 'Could not copy content to clipboard.');
    }
  };

  // Calculate real metrics
  const totalDocs = documents.length;
  const totalWords = documents.reduce((acc, doc) => {
    const words = doc.content.trim().split(/\s+/).filter(Boolean).length;
    return acc + words;
  }, 0);
  const totalChars = documents.reduce((acc, doc) => acc + doc.content.length, 0);
  const estimatedKb = (totalChars * 2 / 1024).toFixed(1);

  const handleCreateNew = () => {
    createDocument('New Desktop Document');
    onNavigate('editor');
  };

  const handleOpenDoc = (id: string) => {
    openDocument(id);
    onNavigate('editor');
  };

  const handleOpenFromDisk = async () => {
    const res = await desktop.openFile();
    if (!res.canceled && res.content !== undefined) {
      const id = createDocument(res.fileName || 'Imported File');
      useDocumentStore.getState().updateDocumentContent(id, res.content);
      onNavigate('editor');
      desktop.showNotification('File Imported', `Loaded ${res.fileName} into workspace.`);
    }
  };

  const handleExportAll = () => {
    desktop.showNotification('Backup Started', `Archiving ${totalDocs} documents to Windows user directory...`);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 text-foreground select-none animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-card via-muted/40 to-card border border-primary/30 shadow-xl backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              Windows 11 Native Engine
            </span>
            <span className="text-muted-foreground text-xs">● Desktop v2.0 Activated</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Markora SaaS Workspace</h1>
          <p className="text-sm text-foreground">
            Manage your markdown library, monitor disk usage, and sync with your cloud publishing channels.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleOpenFromDisk}
            className="px-4 py-2 rounded-xl bg-muted hover:bg-muted text-foreground text-sm font-medium border border-border flex items-center space-x-2 transition-all shadow-sm"
          >
            <FolderOpen className="w-4 h-4 text-indigo-400" />
            <span>Open from Disk</span>
          </button>

          <button
            onClick={handleCreateNew}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium flex items-center space-x-2 transition-all shadow-md hover:shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Document</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-card/90 border border-border/80 shadow-md space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>TOTAL DOCUMENTS</span>
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-foreground tracking-tight">{totalDocs}</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
            <span>↑ Active in local workspace</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card/90 border border-border/80 shadow-md space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>TOTAL WORDS</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-foreground tracking-tight">{totalWords.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">
            Across all stored files
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card/90 border border-border/80 shadow-md space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>DISK FOOTPRINT</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-foreground tracking-tight">{estimatedKb} <span className="text-sm font-normal text-muted-foreground">KB</span></div>
          <div className="text-xs text-muted-foreground flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Encrypted SQLite / JSON Cache</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card/90 border border-border/80 shadow-md space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>SAAS CLOUD SYNC</span>
            <Cloud className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 pt-1">
            <CheckCircle2 className="w-5 h-5" />
            <span>Real-time Ready</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Linked to markora.cloud
          </div>
        </div>
      </div>

      {/* Recent Documents Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>Recent Workspace Documents</span>
          </h2>
          <span className="text-xs text-muted-foreground font-mono">Showing {documents.length} items</span>
        </div>

        <div className="rounded-xl border border-border bg-card/60 overflow-hidden shadow-lg backdrop-blur-sm">
          {documents.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground text-sm">No documents found in workspace.</p>
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Your First Document</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border/80">
              {documents.map((doc) => {
                const wordCount = doc.content.trim().split(/\s+/).filter(Boolean).length;
                const updatedDate = new Date(doc.updatedAt).toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                return (
                  <div
                    key={doc.id}
                    onClick={() => handleOpenDoc(doc.id)}
                    className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden flex-1">
                      <div className="w-9 h-9 rounded-lg bg-muted border border-border/80 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-medium text-foreground group-hover:text-primary truncate text-sm flex items-center space-x-2">
                          <span>{doc.title}</span>
                          {doc.isDirty && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center space-x-3 mt-0.5 font-mono">
                          <span>{wordCount} words</span>
                          <span>•</span>
                          <span>Edited {updatedDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 ml-4 opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportToHtml(doc, settings);
                          desktop.showNotification('Exported HTML', `${doc.title}.html saved to disk.`);
                        }}
                        className="p-1.5 rounded bg-muted hover:bg-muted text-foreground text-xs flex items-center space-x-1"
                        title="Export HTML"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">HTML</span>
                      </button>

                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const html = await buildExportHtml(doc, settings);
                          desktop.exportPdf(html, `${doc.title}.pdf`);
                        }}
                        className="p-1.5 rounded bg-muted hover:bg-muted text-foreground text-xs flex items-center space-x-1"
                        title="Export PDF"
                      >
                        <Download className="w-3.5 h-3.5 text-purple-400" />
                        <span className="hidden sm:inline">PDF</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingDoc({ id: doc.id, title: doc.title });
                        }}
                        className="p-1.5 rounded hover:bg-red-900/30 text-muted-foreground hover:text-red-400 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.stopPropagation();
                                handleRename(doc.id, doc.title);
                              }}
                            >
                                <Edit2 className="mr-2 h-4 w-4 text-primary" />
                                <span>Rename</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.stopPropagation();
                                duplicateDocument(doc.id);
                                desktop.showNotification('Duplicated', `Created a copy of ${doc.title}.`);
                              }}
                            >
                                <Copy className="mr-2 h-4 w-4 text-blue-500" />
                                <span>Duplicate</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCopyContent(doc.content, doc.id);
                              }}
                            >
                                {copiedDocId === doc.id ? (
                                  <Check className="mr-2 h-4 w-4 text-emerald-500" />
                                ) : (
                                  <Share2 className="mr-2 h-4 w-4 text-purple-500" />
                                )}
                                <span>{copiedDocId === doc.id ? 'Copied Markdown!' : 'Copy Markdown'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.stopPropagation();
                                exportToHtml(doc, settings);
                                desktop.showNotification('Exported HTML', `${doc.title}.html saved to disk.`);
                              }}
                            >
                                <FileCode className="mr-2 h-4 w-4 text-amber-500" />
                                <span>Export as HTML</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.stopPropagation();
                                setDeletingDoc({ id: doc.id, title: doc.title });
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Cards Bottom */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div 
          onClick={() => onNavigate('publishing')}
          className="p-5 rounded-xl bg-card/60 border border-border hover:border-indigo-500/50 transition-all cursor-pointer group flex items-start space-x-4"
        >
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary text-sm flex items-center space-x-1">
              <span>Cloud Publishing Hub</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Generate public share links, manage team permissions, and publish static sites.
            </p>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('account')}
          className="p-5 rounded-xl bg-card/60 border border-border hover:border-purple-500/50 transition-all cursor-pointer group flex items-start space-x-4"
        >
          <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-300 text-sm flex items-center space-x-1">
              <span>Desktop Pro License</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Verify your offline license key, manage user roles, and customize desktop storage tiers.
            </p>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('documentation')}
          className="p-5 rounded-xl bg-card/60 border border-border hover:border-emerald-500/50 transition-all cursor-pointer group flex items-start space-x-4"
        >
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-300 text-sm flex items-center space-x-1">
              <span>Documentation & Shortcuts</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Master Mermaid diagrams, LaTeX math syntax, and Windows desktop keyboard bindings.
            </p>
          </div>
        </div>
      </div>

      <Dialog open={renamingDoc !== null} onOpenChange={() => setRenamingDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Document title"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') executeRename();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingDoc(null)}>
              Cancel
            </Button>
            <Button onClick={executeRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deletingDoc !== null} onOpenChange={() => setDeletingDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            Are you sure you want to delete &ldquo;{deletingDoc?.title}&rdquo;? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingDoc(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingDoc) {
                  deleteDocument(deletingDoc.id);
                  desktop.showNotification('Deleted', `Removed "${deletingDoc.title}" from workspace.`);
                  setDeletingDoc(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
