import { useState, useRef } from 'react';
import { Search, Download, Settings, Eye, Edit, Columns, PanelLeft, Presentation, Network, Expand, ListTree } from 'lucide-react';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '../../app/components/ui/toggle-group';
import { Separator } from '../../app/components/ui/separator';
import { useDocumentStore } from '../../stores/documentStore';
import { useEditorStore } from '../../stores/editorStore';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { enterZenMode } from '../../lib/editor/zenFullscreen';
import { MarkoraLogo } from '../MarkoraLogo';
import { GoogleUserButton } from '../GoogleUserButton';

export function TopBar() {
  const { getActiveDocument, renameDocument } = useDocumentStore();
  const autoSave = useSettingsStore((state) => state.autoSave);
  const { editorMode, setEditorMode } = useEditorStore();
  const {
    isLeftSidebarOpen,
    isSettingsSidebarOpen,
    isTableOfContentsOpen,
    openSearchPanel,
    openExportModal,
    openPresentation,
    openKnowledgeGraph,
    toggleSettingsSidebar,
    toggleLeftSidebar,
    toggleTableOfContents,
  } = useUIStore();

  const activeDoc = getActiveDocument();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(activeDoc?.title || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTitleClick = () => {
    if (activeDoc) {
      setIsEditingTitle(true);
      setTitle(activeDoc.title);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 0);
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
    <div className="flex h-14 shrink-0 min-w-0 items-center justify-between border-b bg-background px-2 sm:px-4 gap-2 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Button
          variant={isLeftSidebarOpen ? 'secondary' : 'ghost'}
          size="sm"
          onClick={toggleLeftSidebar}
          title="Toggle Document Sidebar (⌘B)"
          aria-label="Toggle Document Sidebar"
          aria-pressed={isLeftSidebarOpen}
          className="shrink-0"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1.5 shrink-0">
          <MarkoraLogo className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
          <span className="font-bold text-base sm:text-lg tracking-tight hidden xs:inline sm:inline">Markora</span>
        </div>

        <Separator orientation="vertical" className="h-5 sm:h-6 shrink-0" />

        {isEditingTitle ? (
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="h-8 w-36 sm:w-64 text-xs sm:text-sm shrink-0"
          />
        ) : (
          <button
            onClick={handleTitleClick}
            className="text-xs sm:text-sm font-medium hover:bg-accent px-1.5 sm:px-2 py-1 rounded transition-colors max-w-[120px] sm:max-w-[200px] truncate shrink-0"
          >
            {activeDoc?.title || 'Untitled Document'}
          </button>
        )}

        <div className="hidden md:flex items-center gap-2 text-xs shrink-0">
          {activeDoc?.isDirty ? (
            autoSave?.enabled && autoSave?.interval === 'keystroke' ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium" title="Saved to local storage on every keystroke">
                ● Auto-saved
              </span>
            ) : (
              (() => {
                const intervalText = typeof autoSave?.interval === 'number'
                  ? (autoSave.interval >= 60 ? `${autoSave.interval / 60}m` : `${autoSave.interval}s`)
                  : 'keystroke';
                return (
                  <span className="text-amber-500 flex items-center gap-1 font-medium" title={autoSave?.enabled ? `Auto-saving to storage every ${intervalText}` : 'Unsaved changes'}>
                    ● Modified
                  </span>
                );
              })()
            )
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium" title="All changes saved to local storage">
              ✓ Synced
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <ToggleGroup
          type="single"
          value={editorMode}
          onValueChange={(value) => value && setEditorMode(value as any)}
          className="border rounded-lg shrink-0"
        >
          <ToggleGroupItem value="markdown" aria-label="Editor only" className="h-8 px-2">
            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="split" aria-label="Split view" className="h-8 px-2 hidden sm:inline-flex">
            <Columns className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="preview" aria-label="Preview only" className="h-8 px-2">
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        
        <Separator orientation="vertical" className="h-5 sm:h-6 shrink-0" />

        <Button variant="ghost" size="sm" onClick={openSearchPanel} title="Search & Replace (⌘F)" className="h-8 w-8 p-0 sm:w-auto sm:p-2">
          <Search className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={openKnowledgeGraph} title="Knowledge Graph View" aria-label="Knowledge Graph View" className="h-8 w-8 p-0 sm:w-auto sm:p-2">
          <Network className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={openPresentation} title="Present Slide Deck (Alt+P)" aria-label="Present Slide Deck" className="h-8 w-8 p-0 sm:w-auto sm:p-2">
          <Presentation className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={enterZenMode} title="Zen Mode (Alt+Z)" aria-label="Enter Zen Mode" className="h-8 w-8 p-0 sm:w-auto sm:p-2">
          <Expand className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={openExportModal} title="Export Document" className="h-8 w-8 p-0 sm:w-auto sm:p-2">
          <Download className="h-4 w-4" />
        </Button>

        <Button
          variant={isTableOfContentsOpen ? 'secondary' : 'ghost'}
          size="sm"
          onClick={toggleTableOfContents}
          title="Table of Contents (Alt+T)"
          aria-label="Toggle Table of Contents"
          aria-pressed={isTableOfContentsOpen}
          className="h-8 w-8 p-0 sm:w-auto sm:p-2"
        >
          <ListTree className="h-4 w-4" />
        </Button>

        <Button
          variant={isSettingsSidebarOpen ? 'secondary' : 'ghost'}
          size="sm"
          onClick={toggleSettingsSidebar}
          title="Document Settings (Ctrl+,)"
          aria-label="Toggle Document Settings"
          aria-pressed={isSettingsSidebarOpen}
          className="h-8 w-8 p-0 sm:w-auto sm:p-2"
        >
          <Settings className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-5 sm:h-6 shrink-0" />

        <GoogleUserButton />
      </div>
    </div>
  );
}
