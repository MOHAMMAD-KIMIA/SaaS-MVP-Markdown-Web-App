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
import { TopBar } from '../components/layout/TopBar';
import { DocumentSidebar } from '../features/documents/components/DocumentSidebar';
import { EditorToolbar } from '../features/editor/components/EditorToolbar';
import { EditorStatusBar } from '../features/editor/components/EditorStatusBar';
import {
  MarkdownEditor,
  MarkdownEditorHandle,
} from '../features/editor/components/MarkdownEditor';
import { MarkdownPreview } from '../features/preview/components/MarkdownPreview';
import { SettingsSidebar } from '../features/settings/components/SettingsSidebar';
import { CommandPalette } from '../features/command-palette/components/CommandPalette';
import { SearchReplacePanel } from '../features/search/components/SearchReplacePanel';
import { ExportModal } from '../features/export/components/ExportModal';
import { TemplatePickerModal } from '../features/templates/components/TemplatePickerModal';
import { HistoryPanel } from '../features/history/components/HistoryPanel';
import { useDocumentStore } from '../stores/documentStore';
import { useEditorStore } from '../stores/editorStore';
import { useUIStore } from '../stores/uiStore';
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
  setTextDirection,
} from '../lib/markdown/actions';

import type { TextDirection } from '../lib/markdown/textDirection';
import { cn } from '../lib/utils/cn';
import { desktop } from '../lib/desktop/bridge';

export function EditorPage() {
  const { getActiveDocument, updateDocumentContent, saveToStorage } = useDocumentStore();
  const { editorMode, focusMode } = useEditorStore();
  const { isLeftSidebarOpen } = useUIStore();

  const activeDoc = getActiveDocument();
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
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
    useState<TextDirection>('rtl');

  useEffect(() => {
    progressBarRef.current?.setProgress(0);
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

  const handleEditorChange = useCallback((value: string) => {
    if (activeDoc) {
      updateDocumentContent(activeDoc.id, value);
    }
  }, [activeDoc, updateDocumentContent]);

  const handleSelectionChange = useCallback((start: number, end: number) => {
    selectionRef.current = { start, end };
  }, []);

  const handleToolbarAction = (actionId: string, data?: any) => {
    if (!activeDoc) return;

    const content = activeDoc.content;
    const { start, end } = selectionRef.current;

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

      setCursorPosition({
        start: result.newSelection.start,
        end: result.newSelection.end,
        timestamp: Date.now(),
      });

      setTimeout(() => setCursorPosition(null), 200);
    }
  };

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
    <div className="flex h-full w-full flex-1 flex-col overflow-hidden">
      {!focusMode && <TopBar />}

      <div className="flex flex-1 overflow-hidden">
        {!focusMode && isLeftSidebarOpen && <DocumentSidebar />}

        <div className="flex flex-1 flex-col">
          {!focusMode && (
            <EditorToolbar
              onAction={handleToolbarAction}
              editorDirection={currentEditorDirection}
            />
          )}

          {/* Subtle Scroll Progress Bar at the top of editor view */}
          <ScrollProgressBar ref={progressBarRef} />

          <div className="flex flex-1 overflow-hidden relative">
            {showEditor && (
              <div
                className={cn('flex-1 overflow-hidden', showPreview && 'border-r')}
                onMouseEnter={() => { hoveredPaneRef.current = 'editor'; }}
              >
                <MarkdownEditor
                  ref={editorRef}
                  value={activeDoc?.content || ''}
                  onChange={handleEditorChange}
                  onSelectionChange={handleSelectionChange}
                  onDirectionChange={setCurrentEditorDirection}
                  onScrollProgress={handleEditorScrollProgress}
                  cursorPosition={cursorPosition}
                  className="h-full"
                />
              </div>
            )}

            <div
              className={cn('flex-1 overflow-hidden', !showPreview && 'opacity-0 pointer-events-none absolute -left-[9999px] top-0 w-[800px] h-full overflow-hidden -z-50')}
              onMouseEnter={() => { hoveredPaneRef.current = 'preview'; }}
            >
              <div ref={previewRef} className="h-full">
                <MarkdownPreview
                  content={activeDoc?.content || ''}
                  onScrollProgress={showPreview ? handlePreviewScrollProgress : undefined}
                  className="h-full"
                />
              </div>
            </div>
          </div>

          <EditorStatusBar cursorPosition={cursorPosition} />
        </div>

        <SettingsSidebar />
      </div>

      <SearchReplacePanel />
      <CommandPalette />
      <ExportModal previewRef={previewRef} />
      <TemplatePickerModal />
      <HistoryPanel />
    </div>
  );
}
