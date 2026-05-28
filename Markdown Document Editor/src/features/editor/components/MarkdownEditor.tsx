// src/features/editor/components/MarkdownEditor.tsx
import { forwardRef, useEffect, useRef, useImperativeHandle, KeyboardEvent } from 'react';
import { cn } from '../../../lib/utils/cn';


interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
  cursorPosition?: { start: number; end: number; timestamp?: number } | null;
  className?: string;
  showLineNumbers?: boolean;
  tabSize?: number;
}

export interface MarkdownEditorHandle {
  focus: () => void;
  setSelection: (start: number, end: number) => void;
  insertText: (text: string) => void;
}

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  ({ 
    value, 
    onChange, 
    onSelectionChange, 
    cursorPosition, 
    className,
    showLineNumbers = false,
    tabSize = 2
  }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const pendingCursorRef = useRef<{ start: number; end: number } | null>(null);
    const lastTimestampRef = useRef<number | undefined>(undefined);

    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
      setSelection: (start: number, end: number) => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(start, end);
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
          }
        });
      }
    }, [value]);

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

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    };

    const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
      const target = e.target as HTMLTextAreaElement;
      onSelectionChange?.(target.selectionStart, target.selectionEnd);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd } = textarea;

      // Handle Tab key
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        
        const spaces = ' '.repeat(tabSize);
        
        // If there's a selection, indent all selected lines
        if (selectionStart !== selectionEnd) {
          const beforeSelection = value.substring(0, selectionStart);
          const selection = value.substring(selectionStart, selectionEnd);
          const afterSelection = value.substring(selectionEnd);
          
          const lineStartPos = beforeSelection.lastIndexOf('\n') + 1;
          const linesBeforeSelection = beforeSelection.substring(0, lineStartPos);
          const firstLinePrefix = beforeSelection.substring(lineStartPos);
          
          const indentedSelection = (firstLinePrefix + selection).split('\n').map(line => spaces + line).join('\n');
          const newValue = linesBeforeSelection + indentedSelection + afterSelection;
          
          onChange(newValue);
          
          requestAnimationFrame(() => {
            textarea.setSelectionRange(
              selectionStart + tabSize,
              selectionEnd + (indentedSelection.split('\n').length * tabSize)
            );
          });
        } else {
          // No selection, just insert spaces
          const newValue = value.substring(0, selectionStart) + spaces + value.substring(selectionEnd);
          onChange(newValue);
          
          requestAnimationFrame(() => {
            textarea.setSelectionRange(selectionStart + tabSize, selectionStart + tabSize);
          });
        }
        return;
      }

      // Handle Shift+Tab (outdent)
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
            textarea.setSelectionRange(
              selectionStart - firstLineRemoved,
              selectionStart - firstLineRemoved
            );
          } else {
            textarea.setSelectionRange(
              selectionStart - firstLineRemoved,
              selectionEnd - totalRemoved
            );
          }
        });
        return;
      }

      // Auto-indent on Enter
      if (e.key === 'Enter') {
        const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
        const lineText = value.substring(lineStart, selectionStart);
        const indent = lineText.match(/^\s*/)?.[0] || '';
        
        // Check for list items
        const listMatch = lineText.match(/^(\s*)([-*+]|\d+\.)\s/);
        
        if (listMatch) {
          e.preventDefault();
          const [, listIndent, marker] = listMatch;
          
          // If line only has the marker, remove it and outdent
          if (lineText.trim() === marker) {
            const newValue = 
              value.substring(0, lineStart) + 
              value.substring(selectionEnd);
            onChange(newValue);
            
            requestAnimationFrame(() => {
              textarea.setSelectionRange(lineStart, lineStart);
            });
          } else {
            // Continue the list
            const newMarker = marker.match(/\d+/) 
              ? `${parseInt(marker) + 1}.` 
              : marker;
            const newValue = 
              value.substring(0, selectionStart) + 
              '\n' + listIndent + newMarker + ' ' + 
              value.substring(selectionEnd);
            onChange(newValue);
            
            requestAnimationFrame(() => {
              const newPosition = selectionStart + 1 + listIndent.length + newMarker.length + 1;
              textarea.setSelectionRange(newPosition, newPosition);
            });
          }
        } else if (indent) {
          e.preventDefault();
          const newValue = 
            value.substring(0, selectionStart) + 
            '\n' + indent + 
            value.substring(selectionEnd);
          onChange(newValue);
          
          requestAnimationFrame(() => {
            const newPosition = selectionStart + 1 + indent.length;
            textarea.setSelectionRange(newPosition, newPosition);
          });
        }
      }
    };

    const lineCount = value.split('\n').length;
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

    return (
      <div className="relative flex h-full w-full">
        {showLineNumbers && (
          <div
            ref={lineNumbersRef}
            className="select-none overflow-hidden border-r border-gray-200 bg-gray-50 px-2 py-8 text-right font-mono text-sm leading-relaxed text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
            style={{ 
              width: '3.5rem',
              lineHeight: '1.625' // Match leading-relaxed
            }}
            aria-hidden="true"
          >
            {lineNumbers.map((num) => (
              <div key={num} style={{ height: '1.625rem' }}>{num}</div>
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onSelect={handleSelect}
          onClick={handleSelect}
          onKeyUp={handleSelect}
          onKeyDown={handleKeyDown}
          className={cn(
            'h-full flex-1 resize-none border-0 bg-transparent p-8 font-mono text-sm leading-relaxed text-gray-900 outline-none dark:text-gray-100',
            className
          )}
          spellCheck={false}
          aria-label="Markdown editor"
          aria-multiline="true"
          role="textbox"
        />
      </div>
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';
