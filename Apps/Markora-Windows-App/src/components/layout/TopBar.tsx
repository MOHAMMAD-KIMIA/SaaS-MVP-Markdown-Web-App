import { useState, useRef } from 'react';
import { FileText, Search, Command, Download, Settings, Share2, Eye, Edit, Columns, PanelLeft, Sparkles, Clock } from 'lucide-react';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '../../app/components/ui/toggle-group';
import { Separator } from '../../app/components/ui/separator';
import { useDocumentStore } from '../../stores/documentStore';
import { useEditorStore } from '../../stores/editorStore';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { cn } from '../../lib/utils/cn';
import { MarkoraLogo } from '../MarkoraLogo';

export function TopBar() {
  const { getActiveDocument, renameDocument } = useDocumentStore();
  const lastSyncedAt = useDocumentStore((state) => state.lastSyncedAt);
  const autoSave = useSettingsStore((state) => state.autoSave);
  const { editorMode, setEditorMode } = useEditorStore();
  const {
    openCommandPalette,
    openSearchPanel,
    openExportModal,
    openTemplatePicker,
    openHistoryPanel,
    toggleSettingsSidebar,
    toggleLeftSidebar,
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
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLeftSidebar}
          title="Toggle Document Sidebar (⌘B)"
          aria-label="Toggle Document Sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <MarkoraLogo className="h-6 w-6 shrink-0" />
          <span className="font-bold text-lg tracking-tight">Markora</span>
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

        <div className="flex items-center gap-2 text-xs">
          {activeDoc?.isDirty ? (
            autoSave?.enabled && autoSave?.interval === 'keystroke' ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium" title="Saved to local storage on every keystroke">
                ● Auto-saved (Keystroke)
              </span>
            ) : (
              <span className="text-amber-500 flex items-center gap-1 font-medium" title={autoSave?.enabled ? `Auto-saving to storage every ${autoSave.interval}s` : 'Unsaved changes'}>
                ● Modified {autoSave?.enabled && `(Syncing every ${autoSave.interval}s)`}
              </span>
            )
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium" title="All changes saved to local storage">
              ✓ Synced to Storage
            </span>
          )}
          {lastSyncedAt && (
            <span className="text-[11px] text-muted-foreground/80 hidden lg:inline font-mono">
              Last saved: {lastSyncedAt}
            </span>
          )}
        </div>
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

        <Button variant="ghost" size="sm" onClick={openTemplatePicker} title="Templates">
          <Sparkles className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={openHistoryPanel} title="Version History">
          <Clock className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={openSearchPanel} title="Search & Replace (⌘F)">
          <Search className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={openCommandPalette} title="Command Palette (⌘K)">
          <Command className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={openExportModal} title="Export Document">
          <Download className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={toggleSettingsSidebar} title="Settings">
          <Settings className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            if (!activeDoc) return;
            try {
              if (navigator.share) {
                await navigator.share({
                  title: activeDoc.title,
                  text: activeDoc.content,
                });
              } else {
                await navigator.clipboard.writeText(activeDoc.content);
                alert('Document markdown copied to clipboard!');
              }
            } catch {
              // Ignore share cancel
            }
          }}
          title="Share / Copy markdown"
          aria-label="Share document"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
