import { useState, type RefObject } from 'react';
import { Download, FileCode2, FileText, FileType2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../app/components/ui/dialog';
import { Button } from '../../../app/components/ui/button';
import { Card } from '../../../app/components/ui/card';
import { useUIStore } from '../../../stores/uiStore';
import { useDocumentStore } from '../../../stores/documentStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import {
  exportToHtml,
  exportToMarkdown,
  exportToPlainText,
} from '../utils/exportService';
import { exportPreviewToPdf } from '../utils/exportPreviewToPdf';

type ExportType = 'html' | 'pdf' | 'md' | 'txt' | null;

interface ExportModalProps {
  previewRef?: RefObject<HTMLDivElement | null>;
}

export function ExportModal({ previewRef }: ExportModalProps) {
  const { isExportModalOpen, closeExportModal } = useUIStore();
  const { getActiveDocument } = useDocumentStore();
  const settings = useSettingsStore();
  const [loadingType, setLoadingType] = useState<ExportType>(null);

  const activeDoc = getActiveDocument();

  const handleExport = async (type: Exclude<ExportType, null>) => {
    if (!activeDoc) return;

    setLoadingType(type);

    try {
      switch (type) {
        case 'html':
          await exportToHtml(activeDoc, settings);
          break;

        case 'pdf':
          if (!previewRef?.current) {
            throw new Error('Preview is not available for PDF export.');
          }

          await exportPreviewToPdf(
            previewRef.current,
            settings,
            activeDoc.title || 'document'
          );
          break;

        case 'md':
          exportToMarkdown(activeDoc);
          break;

        case 'txt':
          exportToPlainText(activeDoc);
          break;
      }

      closeExportModal();
    } catch (error) {
      console.error(`Export ${type} failed:`, error);
      alert(
        type === 'pdf'
          ? 'PDF export failed. Make sure the preview is visible, then try again.'
          : 'Export failed. Please try again.'
      );
    } finally {
      setLoadingType(null);
    }
  };

  const isBusy = loadingType !== null;

  return (
    <Dialog open={isExportModalOpen} onOpenChange={closeExportModal}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Document</DialogTitle>
          <DialogDescription>
            Choose a format to export "{activeDoc?.title || 'your document'}"
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Card
            className={`p-4 transition-colors ${
              isBusy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-accent'
            }`}
            onClick={() => !isBusy && handleExport('html')}
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
                <FileCode2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="mb-1 font-semibold">Export as HTML</h4>
                <p className="text-sm text-muted-foreground">
                  Download a standalone HTML file with embedded styles
                </p>
                {loadingType === 'html' && (
                  <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                    Preparing HTML export...
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card
            className={`p-4 transition-colors ${
              isBusy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-accent'
            }`}
            onClick={() => !isBusy && handleExport('pdf')}
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900">
                <Download className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="mb-1 font-semibold">Export as PDF</h4>
                <p className="text-sm text-muted-foreground">
                  Print the current preview and save it as PDF
                </p>
                {loadingType === 'pdf' && (
                  <p className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                    Preparing PDF export...
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card
            className={`p-4 transition-colors ${
              isBusy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-accent'
            }`}
            onClick={() => !isBusy && handleExport('md')}
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-emerald-100 p-3 dark:bg-emerald-900">
                <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h4 className="mb-1 font-semibold">Export as Markdown (.md)</h4>
                <p className="text-sm text-muted-foreground">
                  Download the original markdown source exactly as written
                </p>
                {loadingType === 'md' && (
                  <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                    Preparing Markdown export...
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card
            className={`p-4 transition-colors ${
              isBusy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-accent'
            }`}
            onClick={() => !isBusy && handleExport('txt')}
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-amber-100 p-3 dark:bg-amber-900">
                <FileType2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h4 className="mb-1 font-semibold">Export as Plain Text (.txt)</h4>
                <p className="text-sm text-muted-foreground">
                  Download a simplified readable text version of the document
                </p>
                {loadingType === 'txt' && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    Preparing Plain Text export...
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={closeExportModal} disabled={isBusy}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
