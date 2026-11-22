import { useState, useMemo } from 'react';
import { Search, Plus, FileText, MoreVertical, Trash2, Copy, Edit2, FileCode, Share2, Check, Target, Trophy, HardDrive, Link2, FileUp, Archive, MessageSquare, ListTree, Network, Tag, X } from 'lucide-react';
import { useDocumentStore } from '../../../stores/documentStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useCommentStore } from '../../../stores/commentStore';
import { extractDocumentTags } from '../../../lib/markdown/frontmatter';
import { exportToHtml } from '../../export/utils/exportHtml';
import { parseImportedFile } from '../utils/documentImport';
import { desktop } from '../../../lib/desktop/bridge';
import { Input } from '../../../app/components/ui/input';
import { Button } from '../../../app/components/ui/button';
import { ScrollArea } from '../../../app/components/ui/scroll-area';
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
import { cn } from '../../../lib/utils/cn';
import { formatRelativeTime } from '../../../lib/utils/dates';
import { copyToClipboard } from '../../../lib/utils/clipboard';
import { BacklinksPanel } from './BacklinksPanel';
import { CommentsPanel } from './CommentsPanel';
import { OutlinePanel } from './OutlinePanel';

import { useUIStore } from '../../../stores/uiStore';

export function DocumentSidebar() {
  const { documents, activeDocumentId, createDocument, importDocuments, openDocument, renameDocument, setDailyWordGoal, deleteDocument, duplicateDocument } = useDocumentStore();
  const toggleLeftSidebar = useUIStore((state) => state.toggleLeftSidebar);
  const openDriveModal = useUIStore((state) => state.openDriveModal);
  const openImportBackupModal = useUIStore((state) => state.openImportBackupModal);
  const openKnowledgeGraph = useUIStore((state) => state.openKnowledgeGraph);
  const openAssetManager = useUIStore((state) => state.openAssetManager);
  const sidebarTab = useUIStore((state) => state.leftSidebarTab);
  const setSidebarTab = useUIStore((state) => state.setLeftSidebarTab);
  const comments = useCommentStore((state) => state.comments);
  const settings = useSettingsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAllTags, setShowAllTags] = useState(false);
  const [renamingDoc, setRenamingDoc] = useState<string | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);
  const [goalDocId, setGoalDocId] = useState<string | null>(null);
  const [goalValue, setGoalValue] = useState<string>('500');
  const [newTitle, setNewTitle] = useState('');
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const [isDragOverFiles, setIsDragOverFiles] = useState(false);

  const handleSidebarDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOverFiles(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    const imported: Array<{ title: string; content: string }> = [];
    for (const file of files) {
      try {
        const res = await parseImportedFile(file);
        imported.push({ title: res.title, content: res.content });
      } catch {
        // Ignore unsupported dropped items
      }
    }

    if (imported.length > 0) {
      importDocuments(imported);
      setSidebarTab('documents');
      desktop.showNotification(
        'Documents Imported',
        `Imported ${imported.length} file${imported.length === 1 ? '' : 's'} into your workspace.`
      );
    }
  };

  const handleSelectDoc = (id: string) => {
    openDocument(id);
    if (window.innerWidth < 1280) {
      toggleLeftSidebar();
    }
  };

  const activeDoc = documents.find((d) => d.id === activeDocumentId);
  const activeWords = activeDoc?.content.trim() ? activeDoc.content.trim().split(/\s+/).length : 0;
  const activeGoal = activeDoc?.dailyWordGoal;
  const activePercent = activeGoal && activeGoal > 0 ? Math.min(100, Math.round((activeWords / activeGoal) * 100)) : 0;

  const backlinkCount = useMemo(() => {
    if (!activeDoc || !activeDoc.title) return 0;
    const titleLower = activeDoc.title.trim().toLowerCase();
    const escaped = activeDoc.title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wikiRegex = new RegExp(`\\[\\[${escaped}\\]\\]`, 'i');

    return documents.filter((doc) => {
      if (doc.id === activeDoc.id) return false;
      const content = doc.content || '';
      return wikiRegex.test(content) || content.toLowerCase().includes(titleLower);
    }).length;
  }, [documents, activeDoc]);

  const openCommentCount = useMemo(() => {
    if (!activeDocumentId) return 0;
    return comments.filter((c) => c.documentId === activeDocumentId && !c.resolved).length;
  }, [comments, activeDocumentId]);

  const handleCopyContent = async (content: string, id: string) => {
    try {
      const success = await copyToClipboard(content || '');
      if (success) {
        setCopiedDocId(id);
        setTimeout(() => setCopiedDocId(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy document content:', err);
    }
  };

  const docTagsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const doc of documents) {
      map.set(doc.id, extractDocumentTags(doc.content));
    }
    return map;
  }, [documents]);

  const allWorkspaceTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tags of docTagsMap.values()) {
      for (const t of tags) {
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count }));
  }, [docTagsMap]);

  const filteredDocuments = documents
    .filter((doc) => {
      if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedTag) {
        const docTags = docTagsMap.get(doc.id) || [];
        return docTags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleRename = () => {
    if (renamingDoc && newTitle.trim()) {
      renameDocument(renamingDoc, newTitle.trim());
      setRenamingDoc(null);
      setNewTitle('');
    }
  };

  const handleSaveGoal = () => {
    if (goalDocId) {
      const parsed = parseInt(goalValue, 10);
      setDailyWordGoal(goalDocId, isNaN(parsed) || parsed <= 0 ? undefined : parsed);
      setGoalDocId(null);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingDoc(id);
  };

  return (
    <>
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs z-30 xl:hidden"
        onClick={toggleLeftSidebar}
      />
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            setIsDragOverFiles(true);
          }
        }}
        onDragLeave={() => setIsDragOverFiles(false)}
        onDrop={handleSidebarDrop}
        className={cn(
          'absolute xl:relative inset-y-0 left-0 z-40 xl:z-auto flex h-full w-80 max-w-[88vw] flex-col border-r bg-background shrink-0 overflow-hidden shadow-2xl xl:shadow-none transition-colors',
          isDragOverFiles && 'ring-2 ring-inset ring-primary bg-primary/5'
        )}
      >
        <div className="border-b shrink-0 bg-muted/20">
          {/* Top Action Bar: Active Panel Label + New Document / Tools */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {sidebarTab === 'documents'
                ? `Documents (${documents.length})`
                : sidebarTab === 'outline'
                  ? 'Outline & Map'
                  : sidebarTab === 'backlinks'
                    ? 'Linked Notes'
                    : 'Review Notes'}
            </span>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  createDocument();
                  setSidebarTab('documents');
                }}
                title="New Document"
                aria-label="New Document"
                className="h-7 px-2 gap-1 text-xs font-medium text-foreground/80 hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Import, Backup & Cloud Tools"
                    aria-label="Import, Backup & Cloud Tools"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onSelect={openKnowledgeGraph}>
                    <Network className="mr-2 h-4 w-4 text-primary" />
                    <span>Knowledge Graph View</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={openAssetManager}>
                    <FileText className="mr-2 h-4 w-4 text-indigo-500" />
                    <span>Local Asset Manager</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => openImportBackupModal('import')}>
                    <FileUp className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Import File (.md, .html, .docx)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => openImportBackupModal('backup')}>
                    <Archive className="mr-2 h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span>Workspace Backup (.zip)</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={openDriveModal}>
                    <HardDrive className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Google Drive Storage</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Full-Width 4-Tab Segmented Switcher */}
          <div className="px-2 py-1.5">
            <div className="flex items-center gap-0.5 w-full bg-muted/80 p-0.5 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setSidebarTab('documents')}
                className={cn(
                  'flex-auto inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] leading-none font-medium rounded-md transition-all whitespace-nowrap',
                  sidebarTab === 'documents'
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <FileText className="h-3 w-3 shrink-0" />
                <span>Docs</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('outline')}
                className={cn(
                  'flex-auto inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] leading-none font-medium rounded-md transition-all whitespace-nowrap',
                  sidebarTab === 'outline'
                    ? 'bg-background text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Document Outline & Heading Minimap"
              >
                <ListTree className="h-3 w-3 shrink-0" />
                <span>Outline</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('backlinks')}
                className={cn(
                  'flex-auto inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] leading-none font-medium rounded-md transition-all whitespace-nowrap',
                  sidebarTab === 'backlinks'
                    ? 'bg-background text-purple-600 dark:text-purple-400 shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Backlinks"
              >
                <Link2 className="h-3 w-3 shrink-0" />
                <span>Links</span>
                {backlinkCount > 0 && (
                  <span className="rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] px-1 py-0.5 leading-none font-mono font-bold tabular-nums">
                    {backlinkCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('comments')}
                className={cn(
                  'flex-auto inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] leading-none font-medium rounded-md transition-all whitespace-nowrap',
                  sidebarTab === 'comments'
                    ? 'bg-background text-primary shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Document Review Comments"
              >
                <MessageSquare className="h-3 w-3 shrink-0" />
                <span>Notes</span>
                {openCommentCount > 0 && (
                  <span className="rounded-full bg-primary/15 text-primary text-[10px] px-1 py-0.5 leading-none font-mono font-bold tabular-nums">
                    {openCommentCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {sidebarTab === 'outline' ? (
          <OutlinePanel
            onJumpToHeading={() => {
              if (window.innerWidth < 1280) {
                toggleLeftSidebar();
              }
            }}
            className="flex-1"
          />
        ) : sidebarTab === 'backlinks' ? (
          <BacklinksPanel
            onSelectDocument={() => {
              if (window.innerWidth < 1280) {
                toggleLeftSidebar();
              }
            }}
            className="flex-1"
          />
        ) : sidebarTab === 'comments' ? (
          <CommentsPanel
            onJumpToRange={() => {
              if (window.innerWidth < 1280) {
                toggleLeftSidebar();
              }
            }}
            className="flex-1"
          />
        ) : (
          <>
            <div className="border-b p-3 shrink-0 space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              {allWorkspaceTags.length > 0 && (() => {
                const maxCompactTags = 6;
                const hasOverflowTags = allWorkspaceTags.length > maxCompactTags;
                const baseVisible = showAllTags
                  ? allWorkspaceTags
                  : allWorkspaceTags.slice(0, maxCompactTags);
                const visibleTags =
                  selectedTag &&
                  !baseVisible.some((t) => t.tag.toLowerCase() === selectedTag.toLowerCase())
                    ? [
                        ...baseVisible,
                        ...allWorkspaceTags.filter(
                          (t) => t.tag.toLowerCase() === selectedTag.toLowerCase()
                        ),
                      ]
                    : baseVisible;
                const hiddenTagCount = Math.max(0, allWorkspaceTags.length - visibleTags.length);

                return (
                  <div className="flex flex-wrap items-center gap-1 pt-0.5 min-w-0">
                    <Tag className="h-3 w-3 text-muted-foreground shrink-0 mr-0.5" />
                    <button
                      type="button"
                      onClick={() => setSelectedTag(null)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors',
                        selectedTag === null
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      All
                    </button>
                    {visibleTags.map(({ tag, count }) => {
                      const active = selectedTag?.toLowerCase() === tag.toLowerCase();
                      return (
                        <button
                          key={tag}
                          type="button"
                          title={`#${tag} (${count})`}
                          onClick={() => setSelectedTag(active ? null : tag)}
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] max-w-[140px] min-w-0 transition-colors',
                            active
                              ? 'bg-primary text-primary-foreground font-medium'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          )}
                        >
                          <span className="truncate">#{tag}</span>
                          <span className="opacity-65 tabular-nums text-[10px] shrink-0">{count}</span>
                          {active && <X className="h-2.5 w-2.5 ml-0.5 shrink-0" />}
                        </button>
                      );
                    })}
                    {hasOverflowTags && (
                      <button
                        type="button"
                        onClick={() => setShowAllTags((v) => !v)}
                        className="px-1.5 py-0.5 rounded text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors whitespace-nowrap shrink-0"
                      >
                        {showAllTags ? 'Less' : `+${hiddenTagCount} more`}
                      </button>
                    )}
                  </div>
                );
              })()}

        {/* Daily Goal Widget in Sidebar */}
        {activeDoc && (
          <div className="p-2.5 rounded-lg border bg-card/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1.5 font-semibold text-foreground">
                <Target className="h-3.5 w-3.5 text-indigo-500" />
                <span>Daily Word Goal</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-1.5 text-[11px] text-primary hover:text-primary/80"
                onClick={() => {
                  setGoalDocId(activeDoc.id);
                  setGoalValue(activeDoc.dailyWordGoal ? String(activeDoc.dailyWordGoal) : '500');
                }}
              >
                {activeGoal ? 'Edit' : '+ Set'}
              </Button>
            </div>

            {activeGoal ? (
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-medium text-foreground">
                    {activeWords.toLocaleString()} <span className="text-muted-foreground text-[11px]">/ {activeGoal.toLocaleString()} words</span>
                  </span>
                  <span className={cn("font-bold text-[11px]", activePercent >= 100 ? "text-emerald-500" : "text-primary")}>
                    {activePercent}%
                  </span>
                </div>

                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300 rounded-full",
                      activePercent >= 100
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                        : "bg-gradient-to-r from-indigo-500 via-primary to-cyan-500"
                    )}
                    style={{ width: `${activePercent}%` }}
                  />
                </div>

                {activePercent >= 100 && (
                  <div className="flex items-center space-x-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
                    <Trophy className="h-3 w-3 shrink-0" />
                    <span>Goal completed for today!</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground leading-tight">
                Track your writing target for this document.
              </p>
            )}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 min-h-0 w-full overflow-hidden">
        <div className="space-y-1 p-2 pr-3 w-full min-w-0">
          {filteredDocuments.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery ? 'No documents found' : 'No documents yet'}
            </div>
          )}

          {filteredDocuments.map((doc) => {
            const docWords = doc.content.trim() ? doc.content.trim().split(/\s+/).length : 0;
            const docGoal = doc.dailyWordGoal;
            const docPct = docGoal && docGoal > 0 ? Math.min(100, Math.round((docWords / docGoal) * 100)) : 0;
            const docTags = docTagsMap.get(doc.id) || [];

            return (
              <div
                key={doc.id}
                className={cn(
                  'group flex flex-col rounded-md px-3 py-2 text-sm hover:bg-accent cursor-pointer gap-1 overflow-hidden w-full min-w-0 transition-colors',
                  activeDocumentId === doc.id && 'bg-accent'
                )}
                onClick={() => handleSelectDoc(doc.id)}
              >
                <div className="flex items-center justify-between gap-2 w-full min-w-0">
                  <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="truncate font-medium" title={doc.title}>
                        {doc.title}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0 w-full overflow-hidden">
                        <span className="shrink-0 whitespace-nowrap">
                          {formatRelativeTime(doc.updatedAt)}
                        </span>
                        {docTags.length > 0 && (
                          <>
                            <span aria-hidden="true" className="shrink-0">·</span>
                            <span
                              className="text-primary/80 min-w-0 flex-1 truncate"
                              title={docTags.map((t) => `#${t}`).join(' ')}
                            >
                              {docTags
                                .slice(0, 3)
                                .map((t) => `#${t}`)
                                .join(' ')}
                              {docTags.length > 3 ? ` +${docTags.length - 3}` : ''}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Actions for ${doc.title}`}
                          title="Document actions"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted opacity-100 transition-colors shrink-0 flex items-center justify-center"
                        >
                          <MoreVertical className="h-4 w-4 shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.stopPropagation();
                            setRenamingDoc(doc.id);
                            setNewTitle(doc.title);
                          }}
                        >
                          <Edit2 className="mr-2 h-4 w-4 text-primary" />
                          <span>Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.stopPropagation();
                            setGoalDocId(doc.id);
                            setGoalValue(doc.dailyWordGoal ? String(doc.dailyWordGoal) : '500');
                          }}
                        >
                          <Target className="mr-2 h-4 w-4 text-indigo-500" />
                          <span>{doc.dailyWordGoal ? 'Edit Daily Goal' : 'Set Daily Goal'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.stopPropagation();
                            duplicateDocument(doc.id);
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
                          }}
                        >
                          <FileCode className="mr-2 h-4 w-4 text-amber-500" />
                          <span>Export as HTML</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id);
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

                {/* Individual doc progress bar if goal set */}
                {docGoal && docGoal > 0 ? (
                  <div className="pt-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          docPct >= 100 ? "bg-emerald-500" : "bg-primary"
                        )}
                        style={{ width: `${docPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {docPct}% ({docWords}/{docGoal})
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      </>
      )}

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
              if (e.key === 'Enter') handleRename();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingDoc(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Daily Word Count Goal Dialog */}
      <Dialog open={goalDocId !== null} onOpenChange={() => setGoalDocId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-indigo-500" />
              <span>Set Daily Word Count Goal</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-4">
            <p className="text-sm text-muted-foreground">
              Set a daily writing target for this document to keep track of your daily progress.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Target Words / Day</label>
              <Input
                type="number"
                min="10"
                max="100000"
                value={goalValue}
                onChange={(e) => setGoalValue(e.target.value)}
                placeholder="e.g. 500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveGoal();
                }}
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {[250, 500, 1000, 1500, 2000, 5000].map((preset) => (
                  <Button
                    key={preset}
                    size="sm"
                    variant={goalValue === String(preset) ? "default" : "outline"}
                    className="h-7 text-xs"
                    onClick={() => setGoalValue(String(preset))}
                  >
                    {preset.toLocaleString()} words
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between gap-2">
            {documents.find((d) => d.id === goalDocId)?.dailyWordGoal ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (goalDocId) {
                    setDailyWordGoal(goalDocId, undefined);
                    setGoalDocId(null);
                  }
                }}
              >
                Remove Goal
              </Button>
            ) : <div />}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setGoalDocId(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveGoal}>
                Save Goal
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deletingDoc !== null} onOpenChange={() => setDeletingDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            Are you sure you want to delete this document? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingDoc(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingDoc) {
                  deleteDocument(deletingDoc);
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
  </>
  );
}
