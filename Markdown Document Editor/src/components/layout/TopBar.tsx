import { useState, useRef } from 'react';
import { FileText, Search, Command, Download, Settings, Share2, Eye, Edit, Columns } from 'lucide-react';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '../../app/components/ui/toggle-group';
import { Separator } from '../../app/components/ui/separator';
import { useDocumentStore } from '../../stores/documentStore';
import { useEditorStore } from '../../stores/editorStore';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/utils/cn';

export function TopBar() {
  const { getActiveDocument, renameDocument } = useDocumentStore();
  const { editorMode, setEditorMode } = useEditorStore();
  const {
    openCommandPalette,
    openSearchPanel,
    openExportModal,
    toggleSettingsSidebar,
  } = useUIStore();

  const activeDoc = getActiveDocument();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(activeDoc?.title || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTitleClick = () => {
    if (activeDoc) {
      setIsEditingTitle(true);
      setTitle(activeDoc.title);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleTitleBlur = () => {
    if (activeDoc && title.trim()) {
      renameDocument(activeDoc.id, title.trim());
    } else if (activeDoc) {
      setTitle(activeDoc.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setTitle(activeDoc?.title || '');
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <span className="font-bold text-lg">Markora</span>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {isEditingTitle ? (
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="h-8 w-64"
          />
        ) : (
          <button
            onClick={handleTitleClick}
            className="text-sm font-medium hover:bg-accent px-2 py-1 rounded transition-colors"
          >
            {activeDoc?.title || 'Untitled Document'}
          </button>
        )}

        {activeDoc?.isDirty && (
          <span className="text-xs text-muted-foreground">Unsaved</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ToggleGroup
          type="single"
          value={editorMode}
          onValueChange={(value) => value && setEditorMode(value as any)}
          className="border rounded-lg"
        >
          <ToggleGroupItem value="markdown" aria-label="Editor only">
            <Edit className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="split" aria-label="Split view">
            <Columns className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="preview" aria-label="Preview only">
            <Eye className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <Separator orientation="vertical" className="h-6" />

        <Button variant="ghost" size="sm" onClick={openSearchPanel}>
          <Search className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={openCommandPalette}>
          <Command className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={openExportModal}>
          <Download className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={toggleSettingsSidebar}>
          <Settings className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
