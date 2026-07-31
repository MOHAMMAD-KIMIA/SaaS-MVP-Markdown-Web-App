import { useState } from 'react';
import { Search, Plus, FileText, MoreVertical, Trash2, Copy, Edit2, FileCode, Share2, Check, Target, Trophy } from 'lucide-react';
import { useDocumentStore } from '../../../stores/documentStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { exportToHtml } from '../../export/utils/exportHtml';
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

export function DocumentSidebar() {
  const { documents, activeDocumentId, createDocument, openDocument, renameDocument, setDailyWordGoal, deleteDocument, duplicateDocument } = useDocumentStore();
  const settings = useSettingsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingDoc, setRenamingDoc] = useState<string | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);
  const [goalDocId, setGoalDocId] = useState<string | null>(null);
  const [goalValue, setGoalValue] = useState<string>('500');
  const [newTitle, setNewTitle] = useState('');
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  const activeDoc = documents.find((d) => d.id === activeDocumentId);
  const activeWords = activeDoc?.content.trim() ? activeDoc.content.trim().split(/\s+/).length : 0;
  const activeGoal = activeDoc?.dailyWordGoal;
  const activePercent = activeGoal && activeGoal > 0 ? Math.min(100, Math.round((activeWords / activeGoal) * 100)) : 0;

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

  const filteredDocuments = documents
    .filter((doc) => doc.title.toLowerCase().includes(searchQuery.toLowerCase()))
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
    <div className="flex h-full w-72 flex-col border-r bg-background shrink-0 overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
        <h2 className="font-semibold">Documents</h2>
        <Button size="sm" variant="ghost" onClick={() => createDocument()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

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
        <div className="space-y-1 p-2 pr-3">
          {filteredDocuments.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery ? 'No documents found' : 'No documents yet'}
            </div>
          )}

          {filteredDocuments.map((doc) => {
            const docWords = doc.content.trim() ? doc.content.trim().split(/\s+/).length : 0;
            const docGoal = doc.dailyWordGoal;
            const docPct = docGoal && docGoal > 0 ? Math.min(100, Math.round((docWords / docGoal) * 100)) : 0;

            return (
              <div
                key={doc.id}
                className={cn(
                  'group flex flex-col rounded-md px-3 py-2 text-sm hover:bg-accent cursor-pointer gap-1 overflow-hidden w-full transition-colors',
                  activeDocumentId === doc.id && 'bg-accent'
                )}
                onClick={() => openDocument(doc.id)}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="truncate font-medium">{doc.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {formatRelativeTime(doc.updatedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
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
  );
}
