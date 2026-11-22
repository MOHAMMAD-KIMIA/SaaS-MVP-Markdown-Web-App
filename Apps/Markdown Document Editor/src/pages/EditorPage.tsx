import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';

const ScrollProgressBar = React.memo(
  forwardRef<{ setProgress: (progress: number) => void }, {}>(
    (_props, ref) => {
      const barRef = useRef<HTMLDivElement>(null);

      useImperativeHandle(ref, () => ({
        setProgress: (progress: number) => {
          if (barRef.current) {
            const clamped = Math.min(100, Math.max(0, progress));
            barRef.current.style.width = `${clamped}%`;
          }
        },
      }));

      return (
        <div
          className="relative w-full h-1 bg-muted/30 overflow-hidden shrink-0 z-10"
          title="Document scroll progress"
        >
          <div
            ref={barRef}
            className="h-full bg-gradient-to-r from-indigo-500 via-primary to-cyan-500 transition-[width] duration-150 ease-out shadow-2xs"
            style={{ width: '0%' }}
          />
        </div>
      );
    }
  )
);
ScrollProgressBar.displayName = 'ScrollProgressBar';
import { AlignVerticalJustifyCenter, Eye, Minimize2 } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { DocumentSidebar } from '../features/documents/components/DocumentSidebar';
import { EditorToolbar } from '../features/editor/components/EditorToolbar';
import { EditorStatusBar } from '../features/editor/components/EditorStatusBar';
import {
  MarkdownEditor,
  MarkdownEditorHandle,
} from '../features/editor/components/MarkdownEditor';
import { MarkdownPreview } from '../features/preview/components/MarkdownPreview';
import { PresentationModal } from '../features/preview/components/PresentationModal';
import { SettingsSidebar } from '../features/settings/components/SettingsSidebar';
import { CommandPalette } from '../features/command-palette/components/CommandPalette';
import { SearchReplacePanel } from '../features/search/components/SearchReplacePanel';
import { ExportModal } from '../features/export/components/ExportModal';
import { TemplatePickerModal } from '../features/templates/components/TemplatePickerModal';
import { HistoryPanel } from '../features/history/components/HistoryPanel';
import { KnowledgeGraphModal } from '../features/graph/components/KnowledgeGraphModal';
import { AssetManagerModal } from '../features/assets/components/AssetManagerModal';
import { FrontmatterBar } from '../features/editor/components/FrontmatterBar';
import { ReadabilityPanel } from '../features/editor/components/ReadabilityPanel';
import { TableBuilderModal } from '../features/editor/components/TableBuilderModal';
import { ImportBackupModal } from '../features/documents/components/ImportBackupModal';
import { GoogleDriveModal } from '../components/GoogleDriveModal';
import { GoogleCalendarModal } from '../components/GoogleCalendarModal';
import { useDocumentStore } from '../stores/documentStore';
import { useEditorStore } from '../stores/editorStore';
import { useUIStore } from '../stores/uiStore';
import { ASSET_URI_PREFIX, useAssetStore } from '../stores/assetStore';
import { extractDocumentTags } from '../lib/markdown/frontmatter';
import {
  toggleBold,
  toggleItalic,
  toggleStrikethrough,
  insertHeading,
  insertLink,
  insertImage,
  insertBlockquote,
  insertInlineCode,
  insertCodeBlock,
  insertBulletList,
  insertNumberedList,
  insertTaskList,
  insertTable,
  insertHorizontalRule,
  insertMermaidBlock,
  insertCustomBlock,
  insertMathBlock,
  insertInlineMath,
  insertPageBreak,
  insertMarkdown,
  toggleHighlight,
  setTextDirection,
} from '../lib/markdown/actions';

import type { TextDirection } from '../lib/markdown/textDirection';
import { toggleMarkdownTask } from '../lib/markdown/tasks';
import { formatTableAtCursor } from '../lib/markdown/tables';
import { cn } from '../lib/utils/cn';
import { desktop } from '../lib/desktop/bridge';

export function EditorPage() {
  const { documents, getActiveDocument, updateDocumentContent } = useDocumentStore();
  const {
    editorMode,
    focusMode,
    focusDimming,
    typewriterMode,
    toggleFocusMode,
    toggleFocusDimming,
    toggleTypewriterMode,
  } = useEditorStore();
  const { isLeftSidebarOpen } = useUIStore();

  const activeDoc = getActiveDocument();
  const allWorkspaceTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    for (const doc of documents) {
      for (const t of extractDocumentTags(doc.content)) {
        tagSet.add(t);
      }
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [documents]);

  const editorRef = useRef<MarkdownEditorHandle>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const imageUploadInputRef = useRef<HTMLInputElement | null>(null);
  const selectionRef = useRef({ start: 0, end: 0 });

  const [cursorPosition, setCursorPosition] = useState<{
    start: number;
    end: number;
    timestamp?: number;
  } | null>(null);

  const progressBarRef = useRef<{ setProgress: (progress: number) => void }>(null);
  const rafIdRef = useRef<number | null>(null);
  const hoveredPaneRef = useRef<'editor' | 'preview' | null>('editor');

  const [currentEditorDirection, setCurrentEditorDirection] =
    useState<TextDirection>('ltr');

  useEffect(() => {
    progressBarRef.current?.setProgress(0);
    setCursorPosition({ start: 0, end: 0 });
    selectionRef.current = { start: 0, end: 0 };
  }, [activeDoc?.id]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const updateScrollProgress = useCallback((progress: number) => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      progressBarRef.current?.setProgress(progress);
    });
  }, []);

  const showEditor = editorMode === 'markdown' || editorMode === 'split';
  const showPreview = editorMode === 'preview' || editorMode === 'split';

  const handleEditorScrollProgress = useCallback((progress: number) => {
    if (!showPreview || hoveredPaneRef.current === 'editor') {
      updateScrollProgress(progress);
    }
  }, [showPreview, updateScrollProgress]);

  const handlePreviewScrollProgress = useCallback((progress: number) => {
    if (showPreview && (hoveredPaneRef.current === 'preview' || !showEditor)) {
      updateScrollProgress(progress);
    }
  }, [showPreview, showEditor, updateScrollProgress]);

  const handleToggleTask = useCallback((taskIndex: number) => {
    const currentDoc = useDocumentStore.getState().getActiveDocument();
    if (!currentDoc) return;
    const newContent = toggleMarkdownTask(currentDoc.content, taskIndex);
    updateDocumentContent(currentDoc.id, newContent);
  }, [updateDocumentContent]);

  const handleWikiLinkClick = useCallback((targetTitleOrSlug: string) => {
    if (!targetTitleOrSlug) return;
    const cleanTarget = targetTitleOrSlug.trim();
    const cleanLower = cleanTarget.toLowerCase();
    const cleanSlug = cleanLower.replace(/\s+/g, '-');

    const { documents, openDocument, createDocument } = useDocumentStore.getState();
    const existing = documents.find(
      (d) =>
        d.title.toLowerCase() === cleanLower ||
        d.title.toLowerCase().replace(/\s+/g, '-') === cleanSlug
    );

    if (existing) {
      openDocument(existing.id);
      desktop.showNotification('Opened Note', `Switched to "${existing.title}"`);
    } else {
      const newId = createDocument(cleanTarget, `# ${cleanTarget}\n\n`);
      openDocument(newId);
      desktop.showNotification('Created Note', `Created new note "${cleanTarget}"`);
    }
  }, []);

  const handleEditorChange = useCallback((value: string) => {
    if (activeDoc) {
      updateDocumentContent(activeDoc.id, value);
    }
  }, [activeDoc, updateDocumentContent]);

  const handleSelectionChange = useCallback((start: number, end: number) => {
    selectionRef.current = { start, end };
    setCursorPosition((prev) => {
      if (prev && prev.start === start && prev.end === end && !prev.timestamp) {
        return prev;
      }
      return { start, end };
    });
  }, []);

  const handleToolbarAction = (actionId: string, data?: any) => {
    if (!activeDoc) return;

    const content = activeDoc.content;
    const currentSel = editorRef.current?.getSelection() || selectionRef.current;
    const { start, end } = currentSel;

    let result;

    switch (actionId) {
      case 'bold':
        result = toggleBold(content, start, end);
        break;
      case 'italic':
        result = toggleItalic(content, start, end);
        break;
      case 'strikethrough':
        result = toggleStrikethrough(content, start, end);
        break;
      case 'heading':
        result = insertHeading(content, start, end, data);
        break;
      case 'link':
        result = insertLink(content, start, end);
        break;
      case 'image':
        result = insertImage(content, start, end);
        break;
      case 'uploadImage':
        imageUploadInputRef.current?.click();
        return;
      case 'openAssetManager':
        useUIStore.getState().openAssetManager();
        return;
      case 'blockquote':
        result = insertBlockquote(content, start, end);
        break;
      case 'inlineCode':
        result = insertInlineCode(content, start, end);
        break;
      case 'codeBlock':
        result = insertCodeBlock(content, start, end);
        break;
      case 'bulletList':
        result = insertBulletList(content, start, end);
        break;
      case 'numberedList':
        result = insertNumberedList(content, start, end);
        break;
      case 'taskList':
        result = insertTaskList(content, start, end);
        break;
      case 'table':
        result = insertTable(content, start, end);
        break;
      case 'openTableBuilder':
        useUIStore.getState().openTableBuilder();
        return;
      case 'formatTables': {
        const formattedRes = formatTableAtCursor(content, start);
        if (formattedRes.tableCount === 0) {
          desktop.showNotification('No Tables Found', 'No Markdown tables were detected in this document.');
          return;
        }
        updateDocumentContent(activeDoc.id, formattedRes.formatted);
        selectionRef.current = { start: formattedRes.newCursor, end: formattedRes.newCursor };
        setCursorPosition({
          start: formattedRes.newCursor,
          end: formattedRes.newCursor,
          timestamp: Date.now(),
        });
        desktop.showNotification(
          'Tables Formatted',
          `Aligned ${formattedRes.tableCount} Markdown table${formattedRes.tableCount === 1 ? '' : 's'}.`
        );
        return;
      }
      case 'horizontalRule':
        result = insertHorizontalRule(content, start, end);
        break;
      case 'pageBreak':
        result = insertPageBreak(content, start, end);
        break;
      case 'mermaid':
        result = insertMermaidBlock(content, start, end);
        break;
      case 'customBlock':
        result = insertCustomBlock(content, start, end, data);
        break;
      case 'mathBlock':
        result = insertMathBlock(content, start, end);
        break;
      case 'inlineMath':
        result = insertInlineMath(content, start, end);
        break;
      case 'highlight': {
        const color = typeof data === 'string' ? data : 'yellow';
        result = toggleHighlight(content, start, end, color);
        break;
      }
      case 'callout': {
        const calloutType = String(data || 'NOTE').toUpperCase();
        result = insertMarkdown(content, start, end, `> [!${calloutType}]\n> `, '', 'Callout text');
        break;
      }
      case 'wikilink':
        result = insertMarkdown(content, start, end, '[[', ']]', 'Note Title');
        break;
      case 'setDirection':
        if (data === 'rtl' || data === 'ltr') {
          result = setTextDirection(content, start, end, data);
        }
        break;
      default:
        return;
    }

    if (result) {
      updateDocumentContent(activeDoc.id, result.newText);
      selectionRef.current = { start: result.newSelection.start, end: result.newSelection.end };

      setCursorPosition({
        start: result.newSelection.start,
        end: result.newSelection.end,
        timestamp: Date.now(),
      });
    }
  };

  const handleApplyTable = useCallback(
    (markdownTable: string, replaceRange?: { start: number; end: number }) => {
      const currentDoc = useDocumentStore.getState().getActiveDocument();
      if (!currentDoc) return;

      const content = currentDoc.content;
      if (replaceRange) {
        const newText =
          content.slice(0, replaceRange.start) +
          markdownTable +
          content.slice(replaceRange.end);
        const nextCursor = replaceRange.start + markdownTable.length;
        updateDocumentContent(currentDoc.id, newText);
        selectionRef.current = { start: nextCursor, end: nextCursor };
        setCursorPosition({ start: nextCursor, end: nextCursor, timestamp: Date.now() });
        return;
      }

      const sel = editorRef.current?.getSelection() || selectionRef.current;
      const before = content.slice(0, sel.start);
      const after = content.slice(sel.end);
      const prefix = before.length === 0 ? '' : before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
      const suffix = after.length === 0 ? '\n' : after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n';
      const inserted = `${prefix}${markdownTable}${suffix}`;
      const newText = before + inserted + after;
      const nextCursor = before.length + inserted.length;

      updateDocumentContent(currentDoc.id, newText);
      selectionRef.current = { start: nextCursor, end: nextCursor };
      setCursorPosition({ start: nextCursor, end: nextCursor, timestamp: Date.now() });
    },
    [updateDocumentContent]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        handleToolbarAction('bold');
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        handleToolbarAction('italic');
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleToolbarAction('link');
      }
    };

    const handleCustomAction = (e: Event) => {
      const customEvent = e as CustomEvent<{ actionId: string; data?: any }>;
      if (customEvent.detail?.actionId) {
        handleToolbarAction(customEvent.detail.actionId, customEvent.detail.data);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('editor-action', handleCustomAction);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('editor-action', handleCustomAction);
    };
  }, [activeDoc]);

  useEffect(() => {
    const isEditorVisible = editorMode === 'markdown' || editorMode === 'split';
    if (isEditorVisible && editorRef.current) {
      editorRef.current.focus();
    }
  }, [editorMode]);

  return (
    <div className="flex h-full w-full flex-1 min-w-0 flex-col overflow-hidden">
      {!focusMode && <TopBar />}

      <div className="flex flex-1 min-w-0 overflow-hidden relative">
        {!focusMode && isLeftSidebarOpen && <DocumentSidebar />}

        <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
          {!focusMode && (
            <EditorToolbar
              onAction={handleToolbarAction}
              editorDirection={currentEditorDirection}
            />
          )}

          {/* Subtle Scroll Progress Bar at the top of editor view */}
          <ScrollProgressBar ref={progressBarRef} />

          <div className="flex flex-col md:flex-row flex-1 min-w-0 overflow-hidden relative">
            {focusMode && (
              <div className="absolute top-3 right-4 z-30 flex items-center gap-1 rounded-full border border-border/70 bg-background/85 backdrop-blur-md px-2 py-1 shadow-md opacity-70 hover:opacity-100 transition-opacity text-[11px]">
                <button
                  type="button"
                  onClick={toggleFocusDimming}
                  title="Dim surrounding paragraphs"
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded-full font-medium transition-colors',
                    focusDimming
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Eye className="h-3 w-3" />
                  <span className="hidden sm:inline">Dim</span>
                </button>
                <button
                  type="button"
                  onClick={toggleTypewriterMode}
                  title="Typewriter scrolling (keep cursor centered)"
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded-full font-medium transition-colors',
                    typewriterMode
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <AlignVerticalJustifyCenter className="h-3 w-3" />
                  <span className="hidden sm:inline">Typewriter</span>
                </button>
                <div className="h-3 w-px bg-border/60 mx-0.5" />
                <button
                  type="button"
                  onClick={toggleFocusMode}
                  title="Exit Focus Mode (F11)"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Minimize2 className="h-3 w-3" />
                  <span>Exit Focus</span>
                </button>
              </div>
            )}

            {showEditor && (
              <div
                className={cn(
                  'flex-1 min-w-0 overflow-hidden flex flex-col',
                  showPreview && 'border-r',
                  focusMode && !showPreview && 'max-w-3xl mx-auto w-full'
                )}
                onMouseEnter={() => { hoveredPaneRef.current = 'editor'; }}
              >
                {!focusMode && activeDoc && (
                  <FrontmatterBar
                    content={activeDoc.content}
                    allWorkspaceTags={allWorkspaceTags}
                    onUpdateContent={handleEditorChange}
                  />
                )}
                <div className="flex-1 min-h-0">
                  <MarkdownEditor
                    ref={editorRef}
                    documentId={activeDoc?.id}
                    value={activeDoc?.content || ''}
                    onChange={handleEditorChange}
                    onSelectionChange={handleSelectionChange}
                    onDirectionChange={setCurrentEditorDirection}
                    onScrollProgress={handleEditorScrollProgress}
                    cursorPosition={cursorPosition}
                    className="h-full"
                  />
                </div>
              </div>
            )}

            <div
              className={cn('flex-1 min-w-0 overflow-hidden', !showPreview && 'opacity-0 pointer-events-none absolute -left-[9999px] top-0 w-[800px] h-full overflow-hidden -z-50')}
              onMouseEnter={() => { hoveredPaneRef.current = 'preview'; }}
            >
              <div ref={previewRef} className="h-full">
                <MarkdownPreview
                  content={activeDoc?.content || ''}
                  onScrollProgress={showPreview ? handlePreviewScrollProgress : undefined}
                  onToggleTask={handleToggleTask}
                  onWikiLinkClick={handleWikiLinkClick}
                  className="h-full"
                />
              </div>
            </div>
          </div>

          <EditorStatusBar cursorPosition={cursorPosition} />
        </div>

        <ReadabilityPanel />
        <SettingsSidebar />
      </div>

      <input
        ref={imageUploadInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files || []).filter((f) =>
            f.type.startsWith('image/')
          );
          e.target.value = '';
          if (files.length === 0) return;

          const snippets: string[] = [];
          for (const file of files) {
            const asset = await useAssetStore.getState().addAssetFromFile(file);
            const alt =
              (file.name || 'image').replace(/\.[^.]+$/, '').replace(/[\[\]]/g, '') || 'image';
            snippets.push(`![${alt}](${ASSET_URI_PREFIX}${asset.id})`);
          }
          window.dispatchEvent(
            new CustomEvent('editor-insert-raw', {
              detail: { text: snippets.join('\n\n') },
            })
          );
          desktop.showNotification(
            'Image Embedded',
            `Added ${files.length} image${files.length === 1 ? '' : 's'} into the document.`
          );
        }}
      />

      <SearchReplacePanel />
      <CommandPalette />
      <ExportModal previewRef={previewRef} />
      <TableBuilderModal
        getCursorPosition={() =>
          editorRef.current?.getSelection()?.start ?? selectionRef.current.start
        }
        onApplyTable={handleApplyTable}
      />
      <ImportBackupModal />
      <TemplatePickerModal />
      <HistoryPanel />
      <KnowledgeGraphModal />
      <AssetManagerModal />
      <GoogleDriveModal />
      <GoogleCalendarModal />
      <PresentationModal />
    </div>
  );
}
