import { useEffect, useRef, useState } from 'react';
import { TopBar } from '../components/layout/TopBar';
import { DocumentSidebar } from '../features/documents/components/DocumentSidebar';
import { EditorToolbar } from '../features/editor/components/EditorToolbar';
import { MarkdownEditor, MarkdownEditorHandle } from '../features/editor/components/MarkdownEditor';
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

export function EditorPage() {
  const { getActiveDocument, updateDocumentContent } = useDocumentStore();
  const { editorMode, focusMode } = useEditorStore();
  const { isLeftSidebarOpen } = useUIStore();

  const activeDoc = getActiveDocument();
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const [cursorPosition, setCursorPosition] = useState<{
    start: number;
    end: number;
    timestamp?: number;
  } | null>(null);
  const [currentEditorDirection, setCurrentEditorDirection] =
    useState<TextDirection>('rtl');

  const handleEditorChange = (value: string) => {
    if (activeDoc) {
      updateDocumentContent(activeDoc.id, value);
    }
  };

  const handleSelectionChange = (start: number, end: number) => {
    selectionRef.current = { start, end };
  };

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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDoc]);

  useEffect(() => {
    const isEditorVisible = editorMode === 'markdown' || editorMode === 'split';
    if (isEditorVisible && editorRef.current) {
      editorRef.current.focus();
    }
  }, [editorMode]);

  const showEditor = editorMode === 'markdown' || editorMode === 'split';
  const showPreview = editorMode === 'preview' || editorMode === 'split';

  return (
    <div className="flex h-screen flex-col">
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

          <div className="flex flex-1 overflow-hidden">
            {showEditor && (
              <div className={cn('flex-1 overflow-hidden', showPreview && 'border-r')}>
                <MarkdownEditor
                  ref={editorRef}
                  value={activeDoc?.content || ''}
                  onChange={handleEditorChange}
                  onSelectionChange={handleSelectionChange}
                  onDirectionChange={setCurrentEditorDirection}
                  cursorPosition={cursorPosition}
                  className="h-full"
                />
              </div>
            )}

            {showPreview && (
              <div className="flex-1 overflow-hidden">
                <MarkdownPreview content={activeDoc?.content || ''} />
              </div>
            )}
          </div>
        </div>

        <SettingsSidebar />
      </div>

      <SearchReplacePanel />
      <CommandPalette />
      <ExportModal />
      <TemplatePickerModal />
      <HistoryPanel />
    </div>
  );
}
