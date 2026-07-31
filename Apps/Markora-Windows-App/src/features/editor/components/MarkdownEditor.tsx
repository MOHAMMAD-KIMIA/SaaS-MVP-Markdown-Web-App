// src/features/editor/components/MarkdownEditor.tsx
import React, {
  forwardRef,
  useEffect,
  useRef,
  useImperativeHandle,
  useState,
  KeyboardEvent,
} from 'react';
import { cn } from '../../../lib/utils/cn';
import {
  getCurrentLineDirection,
  isCaretInsideCodeOrMath,
  TextDirection,
} from '../../../lib/markdown/textDirection';
import { useSettingsStore } from '../../../stores/settingsStore';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
  cursorPosition?: { start: number; end: number; timestamp?: number } | null;
  className?: string;
  showLineNumbers?: boolean;
  tabSize?: number;
  onDirectionChange?: (dir: TextDirection) => void;
  onScrollProgress?: (progress: number) => void;
}

export interface MarkdownEditorHandle {
  focus: () => void;
  setSelection: (start: number, end: number) => void;
  insertText: (text: string) => void;
}

export const MarkdownEditor = React.memo(forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  (
    {
      value,
      onChange,
      onSelectionChange,
      cursorPosition,
      className,
      showLineNumbers = false,
      tabSize = 2,
      onDirectionChange,
      onScrollProgress,
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

    const handleScrollTextarea = (e: React.UIEvent<HTMLTextAreaElement>) => {
      const target = e.currentTarget;
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = target.scrollTop;
      }
      const maxScroll = target.scrollHeight - target.clientHeight;
      const progress = maxScroll > 0 ? (target.scrollTop / maxScroll) * 100 : 0;
      onScrollProgress?.(Math.min(100, Math.max(0, progress)));
    };
    const pendingCursorRef = useRef<{ start: number; end: number } | null>(null);
    const lastTimestampRef = useRef<number | undefined>(undefined);
    const [editorDir, setEditorDir] = useState<TextDirection>('rtl');

    const applyDirection = (dir: TextDirection) => {
      setEditorDir(dir);
      onDirectionChange?.(dir);
    };

    const updateDirection = (text: string, caretPosition: number) => {
      const nextDir: TextDirection = isCaretInsideCodeOrMath(text, caretPosition)
        ? 'ltr'
        : getCurrentLineDirection(text, caretPosition, 'rtl');

      applyDirection(nextDir);
    };

    const syncSelectionAndDirection = (target: HTMLTextAreaElement) => {
      onSelectionChange?.(target.selectionStart, target.selectionEnd);
      updateDirection(target.value, target.selectionStart ?? 0);
    };

    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
      setSelection: (start: number, end: number) => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(start, end);
          updateDirection(textareaRef.current.value, start);
        }
      },
      insertText: (text: string) => {
        if (textareaRef.current) {
          const start = textareaRef.current.selectionStart;
          const end = textareaRef.current.selectionEnd;
          const newValue = value.substring(0, start) + text + value.substring(end);
          onChange(newValue);

          requestAnimationFrame(() => {
            if (textareaRef.current) {
              const newPosition = start + text.length;
              textareaRef.current.setSelectionRange(newPosition, newPosition);
              textareaRef.current.focus();
              updateDirection(newValue, newPosition);
              onSelectionChange?.(newPosition, newPosition);
            }
          });
        }
      },
    }));

    useEffect(() => {
      if (cursorPosition && cursorPosition.timestamp !== lastTimestampRef.current) {
        pendingCursorRef.current = { start: cursorPosition.start, end: cursorPosition.end };
        lastTimestampRef.current = cursorPosition.timestamp;
      }
    }, [cursorPosition]);

    useEffect(() => {
      if (pendingCursorRef.current && textareaRef.current) {
        const { start, end } = pendingCursorRef.current;
        pendingCursorRef.current = null;

        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(start, end);
            updateDirection(textareaRef.current.value, start);
            onSelectionChange?.(start, end);
          }
        });
      }
    }, [value, onSelectionChange]);

    useEffect(() => {
      const textarea = textareaRef.current;
      const lineNumbers = lineNumbersRef.current;

      if (!textarea || !lineNumbers || !showLineNumbers) return;

      const handleScroll = () => {
        lineNumbers.scrollTop = textarea.scrollTop;
      };

      textarea.addEventListener('scroll', handleScroll);
      return () => textarea.removeEventListener('scroll', handleScroll);
    }, [showLineNumbers]);

    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const caret = textarea.selectionStart ?? 0;
      updateDirection(value, caret);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      updateDirection(newValue, e.target.selectionStart ?? 0);
    };

    const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
      const target = e.target as HTMLTextAreaElement;
      syncSelectionAndDirection(target);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd } = textarea;

      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();

        const spaces = ' '.repeat(tabSize);

        if (selectionStart !== selectionEnd) {
          const beforeSelection = value.substring(0, selectionStart);
          const selection = value.substring(selectionStart, selectionEnd);
          const afterSelection = value.substring(selectionEnd);

          const lineStartPos = beforeSelection.lastIndexOf('\n') + 1;
          const linesBeforeSelection = beforeSelection.substring(0, lineStartPos);
          const firstLinePrefix = beforeSelection.substring(lineStartPos);

          const indentedSelection = (firstLinePrefix + selection)
            .split('\n')
            .map((line) => spaces + line)
            .join('\n');

          const newValue = linesBeforeSelection + indentedSelection + afterSelection;
          onChange(newValue);

          requestAnimationFrame(() => {
            const newStart = selectionStart + tabSize;
            const newEnd =
              selectionEnd + indentedSelection.split('\n').length * tabSize;

            textarea.setSelectionRange(newStart, newEnd);
            updateDirection(newValue, newStart);
            onSelectionChange?.(newStart, newEnd);
          });
        } else {
          const newValue =
            value.substring(0, selectionStart) + spaces + value.substring(selectionEnd);
          onChange(newValue);

          requestAnimationFrame(() => {
            const newPosition = selectionStart + tabSize;
            textarea.setSelectionRange(newPosition, newPosition);
            updateDirection(newValue, newPosition);
            onSelectionChange?.(newPosition, newPosition);
          });
        }
        return;
      }

      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();

        const beforeSelection = value.substring(0, selectionStart);
        const selection = value.substring(selectionStart, selectionEnd);
        const afterSelection = value.substring(selectionEnd);

        const lineStartPos = beforeSelection.lastIndexOf('\n') + 1;
        const linesBeforeSelection = beforeSelection.substring(0, lineStartPos);
        const firstLinePrefix = beforeSelection.substring(lineStartPos);

        const lines = (firstLinePrefix + selection).split('\n');
        let totalRemoved = 0;
        let firstLineRemoved = 0;

        const outdentedLines = lines.map((line, index) => {
          let removed = 0;
          for (let i = 0; i < Math.min(tabSize, line.length); i++) {
            if (line[i] === ' ') {
              removed++;
            } else {
              break;
            }
          }

          if (index === 0) firstLineRemoved = removed;
          totalRemoved += removed;

          return line.substring(removed);
        });

        const outdentedSelection = outdentedLines.join('\n');
        const newValue = linesBeforeSelection + outdentedSelection + afterSelection;

        onChange(newValue);

        requestAnimationFrame(() => {
          if (selectionStart === selectionEnd) {
            const newPosition = selectionStart - firstLineRemoved;
            textarea.setSelectionRange(newPosition, newPosition);
            updateDirection(newValue, newPosition);
            onSelectionChange?.(newPosition, newPosition);
          } else {
            const newStart = selectionStart - firstLineRemoved;
            const newEnd = selectionEnd - totalRemoved;
            textarea.setSelectionRange(newStart, newEnd);
            updateDirection(newValue, newStart);
            onSelectionChange?.(newStart, newEnd);
          }
        });
        return;
      }

      if (e.key === 'Enter') {
        const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
        const lineText = value.substring(lineStart, selectionStart);
        const indent = lineText.match(/^\s*/)?.[0] || '';

        const listMatch = lineText.match(/^(\s*)([-*+]|\d+\.)\s/);

        if (listMatch) {
          e.preventDefault();
          const [, listIndent, marker] = listMatch;

          if (lineText.trim() === marker) {
            const newValue = value.substring(0, lineStart) + value.substring(selectionEnd);
            onChange(newValue);

            requestAnimationFrame(() => {
              textarea.setSelectionRange(lineStart, lineStart);
              updateDirection(newValue, lineStart);
              onSelectionChange?.(lineStart, lineStart);
            });
          } else {
            const newMarker = marker.match(/\d+/)
              ? `${parseInt(marker, 10) + 1}.`
              : marker;

            const newValue =
              value.substring(0, selectionStart) +
              '\n' +
              listIndent +
              newMarker +
              ' ' +
              value.substring(selectionEnd);

            onChange(newValue);

            requestAnimationFrame(() => {
              const newPosition =
                selectionStart + 1 + listIndent.length + newMarker.length + 1;
              textarea.setSelectionRange(newPosition, newPosition);
              updateDirection(newValue, newPosition);
              onSelectionChange?.(newPosition, newPosition);
            });
          }
        } else if (indent) {
          e.preventDefault();
          const newValue =
            value.substring(0, selectionStart) +
            '\n' +
            indent +
            value.substring(selectionEnd);

          onChange(newValue);

          requestAnimationFrame(() => {
            const newPosition = selectionStart + 1 + indent.length;
            textarea.setSelectionRange(newPosition, newPosition);
            updateDirection(newValue, newPosition);
            onSelectionChange?.(newPosition, newPosition);
          });
        }
      }
    };

    const lineCount = value.split('\n').length;
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);
    const typography = useSettingsStore((state) => state.typography);
    const lineNumHeight = `${Math.round(typography.fontSize * typography.lineHeight)}px`;

    return (
      <div className="relative flex h-full w-full">
        {showLineNumbers && (
          <div
            ref={lineNumbersRef}
            className="select-none overflow-hidden border-r border-border bg-muted/40 px-2 py-8 text-right font-mono text-sm leading-relaxed text-muted-foreground"
            style={{
              width: '3.5rem',
              lineHeight: typography.lineHeight,
              fontSize: `${typography.fontSize}px`,
              direction: 'ltr',
            }}
            aria-hidden="true"
          >
            {lineNumbers.map((num) => (
              <div key={num} style={{ height: lineNumHeight }}>
                {num}
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          dir={editorDir}
          onChange={handleChange}
          onSelect={handleSelect}
          onClick={handleSelect}
          onKeyUp={handleSelect}
          onKeyDown={handleKeyDown}
          onScroll={handleScrollTextarea}
          className={cn(
            'h-full flex-1 resize-none border-0 bg-transparent p-8 font-mono text-sm leading-relaxed text-foreground outline-none',
            editorDir === 'rtl' ? 'text-right direction-rtl' : 'text-left direction-ltr',
            className
          )}
          style={{
            unicodeBidi: 'isolate',
            fontFamily: typography.fontFamily,
            fontSize: `${typography.fontSize}px`,
            lineHeight: typography.lineHeight,
          }}
          spellCheck={false}
          aria-label="Markdown editor"
          aria-multiline="true"
          role="textbox"
        />
      </div>
    );
  })
);

MarkdownEditor.displayName = 'MarkdownEditor';
