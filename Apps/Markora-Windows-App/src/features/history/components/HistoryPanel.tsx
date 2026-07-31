import { useState } from 'react';
import { X, Clock, RotateCcw } from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { ScrollArea } from '../../../app/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../app/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../app/components/ui/dialog';
import { useUIStore } from '../../../stores/uiStore';
import { useHistoryStore } from '../../../stores/historyStore';
import { useDocumentStore } from '../../../stores/documentStore';
import { formatDate } from '../../../lib/utils/dates';

export function HistoryPanel() {
  const { isHistoryPanelOpen, closeHistoryPanel } = useUIStore();
  const { versions } = useHistoryStore();
  const { getActiveDocument, updateDocumentContent } = useDocumentStore();
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  const activeDoc = getActiveDocument();
  const documentVersions = activeDoc
    ? versions.filter((v) => v.documentId === activeDoc.id).reverse()
    : [];

  const handleConfirmRestore = () => {
    if (!activeDoc || !restoringVersionId) return;

    const version = versions.find((v) => v.id === restoringVersionId);
    if (!version) return;

    updateDocumentContent(activeDoc.id, version.content);
    setRestoringVersionId(null);
    closeHistoryPanel();
  };

  return (
    <>
      <Sheet open={isHistoryPanelOpen} onOpenChange={closeHistoryPanel}>
        <SheetContent side="right" className="w-80 sm:w-96">
          <SheetHeader>
            <SheetTitle>Document History</SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
            {documentVersions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No version history yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documentVersions.map((version) => (
                  <div
                    key={version.id}
                    className="rounded-lg border p-4 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {version.label || 'Auto-saved version'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(version.createdAt, 'PPpp')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => setRestoringVersionId(version.id)}
                      >
                        <RotateCcw className="mr-2 h-3 w-3" />
                        Restore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Dialog open={restoringVersionId !== null} onOpenChange={() => setRestoringVersionId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Version</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            Are you sure you want to restore this version? This will replace your current document content.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoringVersionId(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRestore}>
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
