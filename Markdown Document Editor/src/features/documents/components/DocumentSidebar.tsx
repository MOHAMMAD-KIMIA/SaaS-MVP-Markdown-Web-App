import { useState } from 'react';
import { Search, Plus, FileText, MoreVertical, Trash2, Copy, Edit2 } from 'lucide-react';
import { useDocumentStore } from '../../../stores/documentStore';
import { Input } from '../../../app/components/ui/input';
import { Button } from '../../../app/components/ui/button';
import { ScrollArea } from '../../../app/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

export function DocumentSidebar() {
  const { documents, activeDocumentId, createDocument, openDocument, renameDocument, deleteDocument, duplicateDocument } = useDocumentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingDoc, setRenamingDoc] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRename = () => {
    if (renamingDoc && newTitle.trim()) {
      renameDocument(renamingDoc, newTitle.trim());
      setRenamingDoc(null);
      setNewTitle('');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteDocument(id);
    }
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-semibold">Documents</h2>
        <Button size="sm" variant="ghost" onClick={() => createDocument()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {filteredDocuments.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery ? 'No documents found' : 'No documents yet'}
            </div>
          )}

          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className={cn(
                'group flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent cursor-pointer',
                activeDocumentId === doc.id && 'bg-accent'
              )}
              onClick={() => openDocument(doc.id)}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{doc.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatRelativeTime(doc.updatedAt)}
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingDoc(doc.id);
                      setNewTitle(doc.title);
                    }}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateDocument(doc.id);
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
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
    </div>
  );
}
