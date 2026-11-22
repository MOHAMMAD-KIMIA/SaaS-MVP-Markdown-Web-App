import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../app/components/ui/dialog';
import { ScrollArea } from '../../../app/components/ui/scroll-area';
import { Card } from '../../../app/components/ui/card';
import { Button } from '../../../app/components/ui/button';
import { useUIStore } from '../../../stores/uiStore';
import { useDocumentStore } from '../../../stores/documentStore';
import { templates } from '../data/templates';

export function TemplatePickerModal() {
  const { isTemplatePickerOpen, closeTemplatePicker } = useUIStore();
  const { getActiveDocument, updateDocumentContent, createDocument } = useDocumentStore();

  const handleUseTemplate = (templateContent: string, templateName: string) => {
    const activeDoc = getActiveDocument();

    if (activeDoc && activeDoc.content.trim() === '') {
      updateDocumentContent(activeDoc.id, templateContent);
    } else {
      const newDocId = createDocument(templateName);
      updateDocumentContent(newDocId, templateContent);
    }

    closeTemplatePicker();
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, typeof templates>);

  return (
    <Dialog open={isTemplatePickerOpen} onOpenChange={closeTemplatePicker}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
          <DialogDescription>
            Start with a pre-built template to speed up your writing
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
              <div key={category}>
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                  {category}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {categoryTemplates.map((template) => (
                    <Card key={template.id} className="p-4 hover:bg-accent transition-colors">
                      <h4 className="font-semibold mb-2">{template.name}</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        {template.description}
                      </p>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleUseTemplate(template.content, template.name)}
                      >
                        Use Template
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
