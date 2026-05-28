import { useState } from 'react';
import { FileDown, Download } from 'lucide-react';
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
import { exportToHtml } from '../utils/exportHtml';

export function ExportModal() {
  const { isExportModalOpen, closeExportModal } = useUIStore();
  const { getActiveDocument } = useDocumentStore();
  const settings = useSettingsStore();
  const [isExporting, setIsExporting] = useState(false);

  const activeDoc = getActiveDocument();

  const handleExportHtml = async () => {
    if (!activeDoc) return;

    setIsExporting(true);
    try {
      await exportToHtml(activeDoc, settings);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = () => {
    alert('PDF export will be implemented with a library like jsPDF or browser print API');
  };

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
            className="p-4 cursor-pointer hover:bg-accent transition-colors"
            onClick={handleExportHtml}
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900 p-3">
                <FileDown className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Export as HTML</h4>
                <p className="text-sm text-muted-foreground">
                  Download a standalone HTML file with embedded styles
                </p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:bg-accent transition-colors"
            onClick={handleExportPdf}
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-purple-100 dark:bg-purple-900 p-3">
                <Download className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Export as PDF</h4>
                <p className="text-sm text-muted-foreground">
                  Generate a PDF with your custom page settings
                </p>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={closeExportModal}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
