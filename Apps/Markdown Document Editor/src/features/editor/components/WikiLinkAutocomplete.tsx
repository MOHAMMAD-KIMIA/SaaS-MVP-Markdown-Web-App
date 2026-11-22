// src/features/editor/components/WikiLinkAutocomplete.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { FileText, Plus, Hash, Clock } from 'lucide-react';
import { useDocumentStore } from '../../../stores/documentStore';
import { cn } from '../../../lib/utils/cn';
import { formatRelativeTime } from '../../../lib/utils/dates';

interface WikiLinkAutocompleteProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (title: string, isNewDoc?: boolean) => void;
  onClose: () => void;
}

export function WikiLinkAutocomplete({
  query,
  position,
  onSelect,
  onClose,
}: WikiLinkAutocompleteProps) {
  const documents = useDocumentStore((state) => state.documents);
  const activeDocId = useDocumentStore((state) => state.activeDocumentId);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const cleanQuery = query.trim().toLowerCase();

  const filteredDocs = useMemo(() => {
    return documents
      .filter((doc) => {
        if (doc.id === activeDocId && !cleanQuery) return false;
        if (!cleanQuery) return true;
        return doc.title.toLowerCase().includes(cleanQuery);
      })
      .slice(0, 8);
  }, [documents, activeDocId, cleanQuery]);

  const hasExactMatch = useMemo(() => {
    if (!cleanQuery) return true;
    return documents.some(
      (doc) => doc.title.toLowerCase() === cleanQuery
    );
  }, [documents, cleanQuery]);

  const showCreateOption = cleanQuery.length > 0 && !hasExactMatch;

  const totalOptionsCount = filteredDocs.length + (showCreateOption ? 1 : 0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keep selected item scrolled into view
  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement | null;
      activeEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (totalOptionsCount === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => (prev + 1) % totalOptionsCount);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => (prev - 1 + totalOptionsCount) % totalOptionsCount);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        if (showCreateOption && selectedIndex === filteredDocs.length) {
          onSelect(query.trim(), true);
        } else if (filteredDocs[selectedIndex]) {
          onSelect(filteredDocs[selectedIndex].title, false);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [filteredDocs, selectedIndex, totalOptionsCount, showCreateOption, query, onSelect, onClose]);

  // Outside click
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  const safeTop = Math.max(56, Math.min(position.top, window.innerHeight - 320));
  const safeLeft = Math.max(16, Math.min(position.left, window.innerWidth - 320));

  return (
    <div
      ref={menuRef}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        top: `${safeTop}px`,
        left: `${safeLeft}px`,
      }}
      className="fixed z-50 w-72 sm:w-80 rounded-xl border border-purple-500/30 bg-popover/95 shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-100 select-none flex flex-col"
    >
      <div className="flex items-center justify-between border-b border-border/60 bg-purple-500/10 px-3 py-1.5 text-[11px] font-medium text-purple-700 dark:text-purple-300">
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-bold">[[</span>
          <span>Link to Note</span>
        </div>
        <div className="text-[10px] opacity-70">
          <span>&crarr; to select</span>
        </div>
      </div>

      <div ref={containerRef} className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 no-scrollbar">
        {filteredDocs.map((doc, idx) => {
          const isSelected = idx === selectedIndex;
          const wordCount = doc.content.trim() ? doc.content.trim().split(/\s+/).length : 0;

          return (
            <button
              key={doc.id}
              data-index={idx}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(doc.title, false);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(doc.title, false);
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={cn(
                'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors',
                isSelected
                  ? 'bg-purple-600 text-white font-medium shadow-2xs'
                  : 'text-foreground hover:bg-muted/70'
              )}
            >
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/50 bg-background/80',
                  isSelected && 'border-transparent bg-white/20 text-white'
                )}
              >
                <FileText className="h-3.5 w-3.5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="truncate font-medium text-xs">
                  {doc.title || 'Untitled Document'}
                </div>
                <div
                  className={cn(
                    'flex items-center gap-2 text-[10px] opacity-80',
                    isSelected ? 'text-white/80' : 'text-muted-foreground'
                  )}
                >
                  <span>{wordCount} words</span>
                  <span>&bull;</span>
                  <span>{formatRelativeTime(doc.updatedAt)}</span>
                </div>
              </div>
            </button>
          );
        })}

        {showCreateOption && (
          <button
            data-index={filteredDocs.length}
            type="button"
            onClick={() => onSelect(query.trim(), true)}
            onMouseEnter={() => setSelectedIndex(filteredDocs.length)}
            className={cn(
              'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors border border-dashed border-purple-500/40',
              selectedIndex === filteredDocs.length
                ? 'bg-purple-600 text-white font-medium'
                : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
            )}
          >
            <div
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/50',
                selectedIndex === filteredDocs.length && 'bg-white/20 text-white'
              )}
            >
              <Plus className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold">Create new note:</span> &ldquo;
              <span className="underline">{query.trim()}</span>&rdquo;
            </div>
          </button>
        )}

        {totalOptionsCount === 0 && (
          <div className="p-3 text-center text-xs text-muted-foreground">
            No notes found. Type a note title to link or create.
          </div>
        )}
      </div>
    </div>
  );
}
