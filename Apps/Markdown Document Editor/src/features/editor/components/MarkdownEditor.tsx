// src/features/editor/components/MarkdownEditor.tsx
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useImperativeHandle,
  useState,
  KeyboardEvent,
} from 'react';
import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../../lib/utils/cn';
import {
  getCurrentLineDirection,
  isCaretInsideCodeOrMath,
  TextDirection,
} from '../../../lib/markdown/textDirection';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useEditorStore } from '../../../stores/editorStore';
import { useUIStore } from '../../../stores/uiStore';
import { useCommentStore } from '../../../stores/commentStore';
import {
  ASSET_URI_PREFIX,
  extractWidthFromImageTitle,
  useAssetStore,
} from '../../../stores/assetStore';
import { analyzeReadability } from '../../../lib/markdown/readability';
import { getCaretCoordinates } from '../../../lib/editor/caretCoordinates';
import { getFocusHighlightRanges } from '../../../lib/editor/focusRanges';
import {
  buildFoldedDisplay,
  displayOffsetToFullOffset,
  findCodeBlockRegions,
  fullOffsetToDisplayOffset,
  measureTextareaOffsetTops,
  reconcileFoldedEdit,
  remapFoldedIdsAfterTextChange,
} from '../../../lib/editor/codeFolding';
import { SlashCommandMenu, SlashCommand } from './SlashCommandMenu';
import { FloatingFormatBar, FloatingFormatAction } from './FloatingFormatBar';
import { InlineCommentPopover } from './InlineCommentPopover';
import { WikiLinkAutocomplete } from './WikiLinkAutocomplete';
import { ImagePopover } from './ImagePopover';
import {
  SpellCheckerOverlay,
  type CommentHighlightSpan,
  type FoldedPlaceholderSpan,
  type StyleHighlightSpan,
} from './SpellCheckerOverlay';
import { SpellCheckContextMenu } from './SpellCheckContextMenu';
import { checkSpelling, SpellError } from '../../../lib/spellcheck/spellChecker';
import { useSpellCheckStore } from '../../../stores/spellCheckStore';

interface MarkdownEditorProps {
  value: string;
  documentId?: string;
  onChange: (value: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
  cursorPosition?: { start: number; end: number; timestamp?: number } | null;
  className?: string;
  showLineNumbers?: boolean;
  tabSize?: number;
  onDirectionChange?: (dir: TextDirection) => void;
  onScrollProgress?: (progress: number) => void;
  spellCheckEnabled?: boolean;
}

export interface MarkdownEditorHandle {
  focus: () => void;
  getSelection: () => { start: number; end: number };
  setSelection: (start: number, end: number) => void;
  insertText: (text: string) => void;
}

export const MarkdownEditor = React.memo(forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  (
    {
      value,
      documentId,
      onChange,
      onSelectionChange,
      cursorPosition,
      className,
      showLineNumbers = false,
      tabSize = 2,
      onDirectionChange,
      onScrollProgress,
      spellCheckEnabled,
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const foldGutterRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const lastTimestampRef = useRef<number | undefined>(undefined);
    const isEnterKeyDownRef = useRef<boolean>(false);
    const prevLineCountRef = useRef<number>(value.split('\n').length);
    const prevValueRef = useRef<string>(value);

    const { editor: editorSettings, typography } = useSettingsStore();
    const focusMode = useEditorStore((s) => s.focusMode);
    const focusDimming = useEditorStore((s) => s.focusDimming);
    const typewriterMode = useEditorStore((s) => s.typewriterMode);
    const showStyleHighlights = useEditorStore((s) => s.showStyleHighlights);
    const setCursorOffset = useEditorStore((s) => s.setCursorOffset);

    const defaultDir = editorSettings?.defaultTextDirection ?? 'ltr';
    const autoDetect = editorSettings?.autoDetectTextDirection ?? true;
    const isSpellCheckEnabled = spellCheckEnabled ?? editorSettings?.spellCheck ?? true;

    const [editorDir, setEditorDir] = useState<TextDirection>(defaultDir);
    const [displayCaret, setDisplayCaret] = useState<number>(0);
    const [isDraggingImage, setIsDraggingImage] = useState(false);

    // Code block folding state (non-destructive display projection)
    const [foldedIds, setFoldedIds] = useState<Set<string>>(() => new Set());
    const [markerTops, setMarkerTops] = useState<number[]>([]);
    const [foldGutterHeight, setFoldGutterHeight] = useState<number>(0);
    const regions = useMemo(() => findCodeBlockRegions(value), [value]);
    const prevRegionsRef = useRef(regions);
    const foldedView = useMemo(
      () => buildFoldedDisplay(value, foldedIds, regions),
      [value, foldedIds, regions]
    );
    const displayText = foldedView.displayText;
    const segments = foldedView.segments;

    // Reset folds when switching documents
    useEffect(() => {
      setFoldedIds(new Set());
    }, [documentId]);

    // Shift folded IDs cleanly if lines are edited above folded blocks
    useEffect(() => {
      if (prevValueRef.current !== value && foldedIds.size > 0) {
        const remapped = remapFoldedIdsAfterTextChange(
          prevValueRef.current,
          value,
          prevRegionsRef.current,
          foldedIds
        );
        if (remapped !== foldedIds) {
          setFoldedIds(remapped);
        }
      }
      prevRegionsRef.current = regions;
    }, [value, regions, foldedIds]);

    const toFullOffset = useCallback(
      (displayOffset: number) => displayOffsetToFullOffset(displayOffset, segments),
      [segments]
    );

    const toDisplayOffset = useCallback(
      (fullOffset: number) => fullOffsetToDisplayOffset(fullOffset, segments),
      [segments]
    );

    const toggleFoldRegion = useCallback((regionId: string) => {
      setFoldedIds((prev) => {
        const next = new Set(prev);
        if (next.has(regionId)) {
          next.delete(regionId);
        } else {
          next.add(regionId);
        }
        return next;
      });
    }, []);

    // Listen to global fold/unfold all events
    useEffect(() => {
      const handleFoldEvent = (e: Event) => {
        const mode = (e as CustomEvent<{ mode?: 'fold-all' | 'unfold-all' | 'toggle-all' }>).detail?.mode;
        if (mode === 'fold-all') {
          setFoldedIds(new Set(regions.map((r) => r.id)));
        } else if (mode === 'unfold-all') {
          setFoldedIds(new Set());
        } else if (mode === 'toggle-all') {
          setFoldedIds((prev) =>
            prev.size > 0 ? new Set() : new Set(regions.map((r) => r.id))
          );
        }
      };

      const handleJumpRange = (e: Event) => {
        const detail = (e as CustomEvent<{ start: number; end: number }>).detail;
        if (!detail || !textareaRef.current) return;
        const { start, end } = detail;

        // Auto-unfold any code block containing target range
        setFoldedIds((prev) => {
          if (prev.size === 0) return prev;
          let changed = false;
          const next = new Set(prev);
          for (const r of regions) {
            if (next.has(r.id) && start <= r.endOffset && end >= r.startOffset) {
              next.delete(r.id);
              changed = true;
            }
          }
          return changed ? next : prev;
        });

        requestAnimationFrame(() => {
          const ta = textareaRef.current;
          if (!ta) return;
          const dispStart = toDisplayOffset(Math.min(start, value.length));
          const dispEnd = toDisplayOffset(Math.min(end, value.length));
          ta.focus();
          ta.setSelectionRange(dispStart, dispEnd);
          setDisplayCaret(dispStart);
          setCursorOffset(Math.min(start, value.length));
          const tops = measureTextareaOffsetTops(ta, displayText, [dispStart]);
          if (tops.length > 0) {
            const targetRatio = typewriterMode ? 0.44 : 1 / 3;
            const nextTop = Math.max(0, tops[0] - ta.clientHeight * targetRatio);
            ta.scrollTop = nextTop;
            if (overlayRef.current) overlayRef.current.scrollTop = nextTop;
            if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = nextTop;
            if (foldGutterRef.current) foldGutterRef.current.scrollTop = nextTop;
          }
        });
      };

      const handleInsertRaw = (e: Event) => {
        const textToInsert = (e as CustomEvent<{ text?: string }>).detail?.text;
        if (!textToInsert) return;
        const ta = textareaRef.current;
        const dispStart = ta ? (ta.selectionStart ?? 0) : 0;
        const dispEnd = ta ? (ta.selectionEnd ?? 0) : 0;
        const fullStart = toFullOffset(dispStart);
        const fullEnd = toFullOffset(dispEnd);

        const nextValue =
          value.slice(0, fullStart) + textToInsert + value.slice(fullEnd);
        onChange(nextValue);

        requestAnimationFrame(() => {
          if (!textareaRef.current) return;
          const nextPos = fullStart + textToInsert.length;
          const nextDisp = toDisplayOffset(nextPos);
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(nextDisp, nextDisp);
          setDisplayCaret(nextDisp);
          onSelectionChange?.(nextPos, nextPos);
        });
      };

      window.addEventListener('editor-fold-code', handleFoldEvent);
      window.addEventListener('editor-jump-range', handleJumpRange);
      window.addEventListener('editor-insert-raw', handleInsertRaw);
      return () => {
        window.removeEventListener('editor-fold-code', handleFoldEvent);
        window.removeEventListener('editor-jump-range', handleJumpRange);
        window.removeEventListener('editor-insert-raw', handleInsertRaw);
      };
    }, [regions, toDisplayOffset, toFullOffset, value, displayText, onChange, onSelectionChange, setCursorOffset, typewriterMode]);

    // Measure gutter marker positions & scroll height whenever displayText, markers, or width changes
    useEffect(() => {
      const ta = textareaRef.current;
      if (!ta) {
        setMarkerTops([]);
        setFoldGutterHeight(0);
        return;
      }

      const measure = () => {
        const el = textareaRef.current;
        if (!el) return;
        setFoldGutterHeight(el.scrollHeight);
        if (foldedView.displayMarkers.length === 0) {
          setMarkerTops([]);
          return;
        }
        const offsets = foldedView.displayMarkers.map((m) => m.displayStartOffset);
        setMarkerTops(measureTextareaOffsetTops(el, displayText, offsets));
      };

      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(ta);
      return () => observer.disconnect();
    }, [foldedView.displayMarkers, displayText, typography.fontFamily, typography.fontSize, typography.lineHeight, typewriterMode]);

    const isDimmingActive = focusMode && focusDimming;
    const activeFocusRanges = useMemo(() => {
      if (!isDimmingActive) return null;
      return getFocusHighlightRanges(displayText, displayCaret);
    }, [isDimmingActive, displayText, displayCaret]);

    const centerTypewriterCaret = useCallback(
      (dispOffset: number) => {
        if (!typewriterMode || !textareaRef.current) return;
        const ta = textareaRef.current;
        const tops = measureTextareaOffsetTops(ta, displayText, [dispOffset]);
        if (tops.length > 0) {
          const targetTop = Math.max(0, tops[0] - ta.clientHeight * 0.44);
          ta.scrollTop = targetTop;
          if (overlayRef.current) overlayRef.current.scrollTop = targetTop;
          if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = targetTop;
          if (foldGutterRef.current) foldGutterRef.current.scrollTop = targetTop;
          const maxScroll = ta.scrollHeight - ta.clientHeight;
          const progress = maxScroll > 0 ? (targetTop / maxScroll) * 100 : 0;
          onScrollProgress?.(Math.min(100, Math.max(0, progress)));
        }
      },
      [typewriterMode, displayText, onScrollProgress]
    );

    useEffect(() => {
      if (typewriterMode && textareaRef.current) {
        const dispPos = textareaRef.current.selectionStart ?? 0;
        requestAnimationFrame(() => centerTypewriterCaret(dispPos));
      }
    }, [typewriterMode, centerTypewriterCaret]);

    // Spell check state from shared store
    const userDictionaryList = useSpellCheckStore((s) => s.userDictionary);
    const ignoredWordsList = useSpellCheckStore((s) => s.ignoredWords);
    const addWordToStore = useSpellCheckStore((s) => s.addWord);
    const ignoreWordInStore = useSpellCheckStore((s) => s.ignoreWord);
    const setLastErrorCount = useSpellCheckStore((s) => s.setLastErrorCount);

    const [spellErrors, setSpellErrors] = useState<SpellError[]>([]);
    const [spellContextMenu, setSpellContextMenu] = useState<{
      error: SpellError;
      position: { x: number; y: number };
    } | null>(null);

    // Run spell check with debounce
    useEffect(() => {
      if (!isSpellCheckEnabled) {
        setSpellErrors([]);
        setLastErrorCount(0);
        return;
      }

      const timer = setTimeout(() => {
        const errors = checkSpelling(value, {
          userDict: userDictionaryList,
          ignoredWords: ignoredWordsList,
        });
        setSpellErrors(errors);
        setLastErrorCount(errors.length);
      }, 80);

      return () => clearTimeout(timer);
    }, [value, userDictionaryList, ignoredWordsList, isSpellCheckEnabled, setLastErrorCount]);

    const displaySpellErrors = useMemo(() => {
      if (foldedIds.size === 0) return spellErrors;
      return spellErrors
        .filter((err) => {
          const insideFolded = segments.some(
            (s) => s.foldedRegionId && err.start >= s.fullStart && err.end <= s.fullEnd
          );
          return !insideFolded;
        })
        .map((err) => ({
          ...err,
          start: toDisplayOffset(err.start),
          end: toDisplayOffset(err.end),
        }));
    }, [spellErrors, foldedIds.size, segments, toDisplayOffset]);

    const displayStyleHighlights = useMemo<StyleHighlightSpan[]>(() => {
      if (!showStyleHighlights) return [];
      const report = analyzeReadability(value);
      const raw: Array<{ id: string; start: number; end: number; kind: 'passive' | 'repeat' }> = [
        ...report.passiveHints.map((p) => ({
          id: p.id,
          start: p.start,
          end: p.end,
          kind: 'passive' as const,
        })),
        ...report.repeatedWordHints.map((r) => ({
          id: r.id,
          start: r.start,
          end: r.end,
          kind: 'repeat' as const,
        })),
      ];

      return raw
        .filter((item) => {
          if (foldedIds.size === 0) return true;
          return !segments.some(
            (s) => s.foldedRegionId && item.start >= s.fullStart && item.end <= s.fullEnd
          );
        })
        .map((item) => ({
          ...item,
          start: toDisplayOffset(item.start),
          end: toDisplayOffset(item.end),
        }))
        .filter((item) => item.end > item.start);
    }, [showStyleHighlights, value, foldedIds.size, segments, toDisplayOffset]);

    const foldedPlaceholderSpans = useMemo<FoldedPlaceholderSpan[]>(() => {
      return foldedView.displayMarkers
        .filter((m) => m.isFolded)
        .map((m) => ({ start: m.displayStartOffset, end: m.displayEndOffset }));
    }, [foldedView.displayMarkers]);

    // Popups states
    const [slashMenu, setSlashMenu] = useState<{
      isOpen: boolean;
      query: string;
      position: { top: number; left: number };
      lineStart: number;
    } | null>(null);

    const [wikiAutocomplete, setWikiAutocomplete] = useState<{
      isOpen: boolean;
      query: string;
      position: { top: number; left: number };
      openBracketPos: number;
    } | null>(null);

    const [formatBarPosition, setFormatBarPosition] = useState<{
      top: number;
      left: number;
    } | null>(null);

    const [inlineCommentState, setInlineCommentState] = useState<{
      position: { top: number; left: number };
      selectionRange: { start: number; end: number };
      quotedText: string;
    } | null>(null);

    const [imagePopover, setImagePopover] = useState<{
      start: number;
      end: number;
      alt: string;
      url: string;
      width?: number;
      position: { top: number; left: number };
    } | null>(null);

    const allComments = useCommentStore((s) => s.comments);
    const docRangeComments = useMemo(() => {
      if (!documentId) return [];
      return allComments.filter(
        (c) => c.documentId === documentId && c.range && c.range.end > c.range.start
      );
    }, [allComments, documentId]);

    const openCommentHighlights = useMemo<CommentHighlightSpan[]>(() => {
      return docRangeComments
        .filter((c) => !c.resolved && c.range)
        .filter((c) => {
          const r = c.range!;
          if (foldedIds.size === 0) return true;
          return !segments.some(
            (s) => s.foldedRegionId && r.start >= s.fullStart && r.end <= s.fullEnd
          );
        })
        .map((c) => {
          const r = c.range!;
          const s = toDisplayOffset(Math.min(r.start, value.length));
          const e = toDisplayOffset(Math.min(r.end, value.length));
          return { id: c.id, start: s, end: e };
        })
        .filter((h) => h.end > h.start);
    }, [docRangeComments, foldedIds.size, segments, toDisplayOffset, value.length]);

    const formatBarOverlappingCount = useMemo(() => {
      if (!formatBarPosition || !textareaRef.current) return 0;
      const s = toFullOffset(textareaRef.current.selectionStart ?? 0);
      const e = toFullOffset(textareaRef.current.selectionEnd ?? 0);
      const lo = Math.min(s, e);
      const hi = Math.max(s, e);
      return docRangeComments.filter(
        (c) => c.range && c.range.start <= hi && c.range.end >= lo
      ).length;
    }, [formatBarPosition, docRangeComments, toFullOffset]);

    const inlineOverlappingComments = useMemo(() => {
      if (!inlineCommentState) return [];
      const { start, end } = inlineCommentState.selectionRange;
      const lo = Math.min(start, end);
      const hi = Math.max(start, end);
      return docRangeComments.filter((c) => {
        if (!c.range) return false;
        if (lo === hi) {
          return lo >= c.range.start && lo <= c.range.end;
        }
        return c.range.start <= hi && c.range.end >= lo;
      });
    }, [inlineCommentState, docRangeComments]);

    useEffect(() => {
      setInlineCommentState(null);
      setImagePopover(null);
    }, [documentId]);

    const handleScrollTextarea = (e: React.UIEvent<HTMLTextAreaElement>) => {
      const target = e.currentTarget;
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = target.scrollTop;
      }
      if (foldGutterRef.current) {
        foldGutterRef.current.scrollTop = target.scrollTop;
      }
      if (overlayRef.current) {
        overlayRef.current.scrollTop = target.scrollTop;
        overlayRef.current.scrollLeft = target.scrollLeft;
      }
      const maxScroll = target.scrollHeight - target.clientHeight;
      const progress = maxScroll > 0 ? (target.scrollTop / maxScroll) * 100 : 0;
      onScrollProgress?.(Math.min(100, Math.max(0, progress)));
    };

    const applyDirection = (dir: TextDirection) => {
      if (dir !== editorDir) {
        setEditorDir(dir);
      }
      onDirectionChange?.(dir);
    };

    const updateDirection = (text: string, caretPosition: number) => {
      const nextDir: TextDirection = isCaretInsideCodeOrMath(text, caretPosition)
        ? 'ltr'
        : getCurrentLineDirection(text, caretPosition, defaultDir, autoDetect);

      applyDirection(nextDir);
    };

    const syncSelectionAndDirection = (target: HTMLTextAreaElement) => {
      const dispStart = target.selectionStart ?? 0;
      const fullStart = toFullOffset(dispStart);
      const fullEnd = toFullOffset(target.selectionEnd ?? 0);
      setDisplayCaret(dispStart);
      setCursorOffset(fullStart);
      onSelectionChange?.(fullStart, fullEnd);
      updateDirection(value, fullStart);
    };

    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
      getSelection: () => {
        if (textareaRef.current) {
          return {
            start: toFullOffset(textareaRef.current.selectionStart ?? 0),
            end: toFullOffset(textareaRef.current.selectionEnd ?? 0),
          };
        }
        return { start: 0, end: 0 };
      },
      setSelection: (start: number, end: number) => {
        if (textareaRef.current) {
          const dispStart = toDisplayOffset(start);
          const dispEnd = toDisplayOffset(end);
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(dispStart, dispEnd);
          updateDirection(value, start);
        }
      },
      insertText: (text: string) => {
        if (textareaRef.current) {
          const start = toFullOffset(textareaRef.current.selectionStart ?? 0);
          const end = toFullOffset(textareaRef.current.selectionEnd ?? 0);
          const newValue = value.substring(0, start) + text + value.substring(end);
          onChange(newValue);

          requestAnimationFrame(() => {
            if (textareaRef.current) {
              const newPosition = start + text.length;
              const dispPos = fullOffsetToDisplayOffset(newPosition, segments);
              textareaRef.current.focus();
              textareaRef.current.setSelectionRange(dispPos, dispPos);
              updateDirection(newValue, newPosition);
              onSelectionChange?.(newPosition, newPosition);
            }
          });
        }
      },
    }));

    useEffect(() => {
      if (cursorPosition && cursorPosition.timestamp !== lastTimestampRef.current) {
        lastTimestampRef.current = cursorPosition.timestamp;
        const { start, end } = cursorPosition;

        const applySelection = () => {
          if (textareaRef.current) {
            const dispStart = toDisplayOffset(start);
            const dispEnd = toDisplayOffset(end);
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(dispStart, dispEnd);
            updateDirection(value, start);
            onSelectionChange?.(start, end);
          }
        };

        applySelection();
        requestAnimationFrame(applySelection);
      }
    }, [cursorPosition, onSelectionChange, toDisplayOffset, value]);

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

      const caret = toFullOffset(textarea.selectionStart ?? 0);
      const currentLineCount = value.split('\n').length;
      const isNewLineCreated = currentLineCount > prevLineCountRef.current || isEnterKeyDownRef.current;

      if (isNewLineCreated) {
        updateDirection(value, caret);
        isEnterKeyDownRef.current = false;
      } else {
        updateDirection(value, caret);
      }

      prevValueRef.current = value;
      prevLineCountRef.current = currentLineCount;
    }, [value, defaultDir, autoDetect, toFullOffset]);

    const checkTriggers = (text: string, start: number, end: number) => {
      if (!textareaRef.current) return;

      // 1. Text Selection -> Floating Format Bar
      if (start !== end && Math.abs(end - start) > 0) {
        setSlashMenu(null);
        setWikiAutocomplete(null);
        try {
          const coords = getCaretCoordinates(textareaRef.current, Math.min(start, end));
          setFormatBarPosition({
            top: coords.top,
            left: coords.left,
          });
        } catch {
          setFormatBarPosition(null);
        }
        return;
      }

      setFormatBarPosition(null);

      // Caret is collapsed at `start`
      const lineStart = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
      const lineBeforeCaret = text.substring(lineStart, start);

      // 2. Check for WikiLink `[[`
      const openBracketIdx = lineBeforeCaret.lastIndexOf('[[');
      if (openBracketIdx !== -1) {
        const textAfter = lineBeforeCaret.substring(openBracketIdx + 2);
        if (!textAfter.includes(']]')) {
          try {
            const coords = getCaretCoordinates(
              textareaRef.current,
              lineStart + openBracketIdx + 2
            );
            setWikiAutocomplete({
              isOpen: true,
              query: textAfter,
              position: { top: coords.top + coords.height + 4, left: coords.left },
              openBracketPos: lineStart + openBracketIdx,
            });
            setSlashMenu(null);
            return;
          } catch {
            setWikiAutocomplete(null);
          }
        }
      }
      setWikiAutocomplete(null);

      // 3. Check for Slash Command `/`
      // Matches at line start, with indent, or after a space
      const slashMatch = lineBeforeCaret.match(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/);
      if (slashMatch) {
        const matchIdx = lineBeforeCaret.search(/(?:^|\s)\/[a-zA-Z0-9_-]*$/);
        const slashOffset = lineBeforeCaret.charAt(matchIdx) === '/' ? matchIdx : matchIdx + 1;
        const slashPos = lineStart + slashOffset;
        const slashQuery = slashMatch[1] || '';
        try {
          const coords = getCaretCoordinates(textareaRef.current, start);
          setSlashMenu({
            isOpen: true,
            query: slashQuery,
            position: { top: coords.top + coords.height + 4, left: coords.left },
            lineStart: slashPos,
          });
          return;
        } catch {
          // If any unexpected coordinate calculation error
          setSlashMenu({
            isOpen: true,
            query: slashQuery,
            position: { top: 120, left: 60 },
            lineStart: slashPos,
          });
          return;
        }
      }
      setSlashMenu(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nextDisplayText = e.target.value;
      const dispStart = e.target.selectionStart ?? 0;
      const dispEnd = e.target.selectionEnd ?? 0;

      if (foldedIds.size > 0) {
        const reconciled = reconcileFoldedEdit(
          value,
          displayText,
          nextDisplayText,
          segments
        );
        if (reconciled.unfoldedRegionIds.length > 0) {
          setFoldedIds((prev) => {
            const next = new Set(prev);
            for (const id of reconciled.unfoldedRegionIds) next.delete(id);
            return next;
          });
          onChange(reconciled.nextFullText);
          return;
        }
        onChange(reconciled.nextFullText);
        const fullStart = toFullOffset(dispStart);
        const fullEnd = toFullOffset(dispEnd);
        updateDirection(reconciled.nextFullText, fullStart);
        onSelectionChange?.(fullStart, fullEnd);
        checkTriggers(nextDisplayText, dispStart, dispEnd);
        return;
      }

      onChange(nextDisplayText);
      setDisplayCaret(dispStart);
      setCursorOffset(dispStart);
      updateDirection(nextDisplayText, dispStart);
      onSelectionChange?.(dispStart, dispEnd);
      checkTriggers(nextDisplayText, dispStart, dispEnd);
      if (typewriterMode) {
        requestAnimationFrame(() => centerTypewriterCaret(dispStart));
      }
    };

    const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
      const target = e.target as HTMLTextAreaElement;
      const dispStart = target.selectionStart ?? 0;
      syncSelectionAndDirection(target);
      checkTriggers(target.value, dispStart, target.selectionEnd ?? 0);
      if (typewriterMode && e.type !== 'focus') {
        requestAnimationFrame(() => centerTypewriterCaret(dispStart));
      }
    };

    const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
      handleSelect(e);
      if (!textareaRef.current) return;
      const dispStart = textareaRef.current.selectionStart ?? 0;
      const dispEnd = textareaRef.current.selectionEnd ?? 0;
      if (dispStart !== dispEnd) {
        setImagePopover(null);
        return;
      }

      const caretFull = toFullOffset(dispStart);

      // Check if caret clicked inside Markdown image syntax ![alt](url "width=...")
      const lineStart = value.lastIndexOf('\n', Math.max(0, caretFull - 1)) + 1;
      const lineEndRaw = value.indexOf('\n', caretFull);
      const lineEnd = lineEndRaw === -1 ? value.length : lineEndRaw;
      const lineStr = value.slice(lineStart, lineEnd);
      const imgRegex = /!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)/g;
      let imgMatch: RegExpExecArray | null;
      let matchedImage = false;
      while ((imgMatch = imgRegex.exec(lineStr)) !== null) {
        const absStart = lineStart + imgMatch.index;
        const absEnd = absStart + imgMatch[0].length;
        if (caretFull >= absStart && caretFull <= absEnd) {
          matchedImage = true;
          try {
            const coords = getCaretCoordinates(textareaRef.current, dispStart);
            setImagePopover({
              start: absStart,
              end: absEnd,
              alt: imgMatch[1] || '',
              url: imgMatch[2],
              width: extractWidthFromImageTitle(imgMatch[3]),
              position: { top: coords.top, left: coords.left },
            });
          } catch {
            // ignore
          }
          break;
        }
      }
      if (!matchedImage) {
        setImagePopover(null);
      }

      if (!documentId) return;
      const hitOpen = docRangeComments.some(
        (c) => !c.resolved && c.range && caretFull > c.range.start && caretFull < c.range.end
      );
      if (hitOpen) {
        try {
          const coords = getCaretCoordinates(textareaRef.current, dispStart);
          setInlineCommentState({
            position: { top: coords.top, left: coords.left },
            selectionRange: { start: caretFull, end: caretFull },
            quotedText: '',
          });
        } catch {
          // ignore coordinate measurement issues
        }
      }
    };

    const insertImageFiles = async (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));
      if (imageFiles.length === 0 || !textareaRef.current) return;

      const ta = textareaRef.current;
      const dispStart = ta.selectionStart ?? 0;
      const dispEnd = ta.selectionEnd ?? 0;
      const fullStart = toFullOffset(dispStart);
      const fullEnd = toFullOffset(dispEnd);

      const addedSnippets: string[] = [];
      let lastAssetMeta: { alt: string; url: string; snippet: string } | null = null;
      for (const file of imageFiles) {
        const asset = await useAssetStore.getState().addAssetFromFile(file);
        const alt = (file.name || 'image').replace(/\.[^.]+$/, '').replace(/[\[\]]/g, '') || 'image';
        const url = `${ASSET_URI_PREFIX}${asset.id}`;
        const snippet = `![${alt}](${url})`;
        addedSnippets.push(snippet);
        lastAssetMeta = { alt, url, snippet };
      }

      const insertion = addedSnippets.join('\n\n');
      const nextValue = value.slice(0, fullStart) + insertion + value.slice(fullEnd);
      onChange(nextValue);

      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        const newPos = fullStart + insertion.length;
        const nextDisp = toDisplayOffset(newPos);
        el.focus();
        el.setSelectionRange(nextDisp, nextDisp);
        setDisplayCaret(nextDisp);
        onSelectionChange?.(newPos, newPos);

        if (lastAssetMeta && addedSnippets.length === 1) {
          try {
            const coords = getCaretCoordinates(el, nextDisp);
            setImagePopover({
              start: fullStart,
              end: fullStart + lastAssetMeta.snippet.length,
              alt: lastAssetMeta.alt,
              url: lastAssetMeta.url,
              width: undefined,
              position: { top: coords.top, left: coords.left },
            });
          } catch {
            // ignore
          }
        }
      });
    };

    const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imageFiles: File[] = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const f = item.getAsFile();
          if (f) imageFiles.push(f);
        }
      }
      if (imageFiles.length === 0 && e.clipboardData?.files?.length) {
        for (const f of Array.from(e.clipboardData.files)) {
          if (f.type.startsWith('image/')) imageFiles.push(f);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        await insertImageFiles(imageFiles);
      }
    };

    const handleEditorDrop = async (e: React.DragEvent<HTMLDivElement>) => {
      const files = Array.from(e.dataTransfer.files || []).filter((f) =>
        f.type.startsWith('image/')
      );
      if (files.length === 0) {
        setIsDraggingImage(false);
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingImage(false);
      await insertImageFiles(files);
    };

    const handleApplyImagePopover = (nextAlt: string, nextWidth?: number) => {
      if (!imagePopover) return;
      const safeAlt = nextAlt.replace(/[\[\]]/g, '');
      const titlePart = nextWidth ? ` "width=${nextWidth}"` : '';
      const nextSnippet = `![${safeAlt}](${imagePopover.url}${titlePart})`;
      const nextValue =
        value.slice(0, imagePopover.start) + nextSnippet + value.slice(imagePopover.end);
      onChange(nextValue);
      setImagePopover((prev) =>
        prev
          ? {
              ...prev,
              end: prev.start + nextSnippet.length,
              alt: safeAlt,
              width: nextWidth,
            }
          : null
      );
    };

    const handleRemoveImagePopover = () => {
      if (!imagePopover) return;
      const nextValue =
        value.slice(0, imagePopover.start) + value.slice(imagePopover.end);
      onChange(nextValue);
      setImagePopover(null);
    };

    const handleDoubleClick = () => {
      if (!textareaRef.current || foldedIds.size === 0) return;
      const pos = textareaRef.current.selectionStart ?? 0;
      const marker = foldedView.displayMarkers.find(
        (m) => m.isFolded && pos >= m.displayStartOffset && pos <= m.displayEndOffset
      );
      if (marker) {
        toggleFoldRegion(marker.region.id);
      }
    };

    const handleSelectSlashCommand = (cmd: SlashCommand) => {
      if (!slashMenu || !textareaRef.current) return;
      const lineStart = toFullOffset(slashMenu.lineStart);
      const caret = toFullOffset(textareaRef.current.selectionStart);

      const before = value.substring(0, lineStart);
      const after = value.substring(caret);
      const newValue = before + cmd.snippet + after;

      let newCaret = lineStart + cmd.snippet.length;
      if (cmd.cursorOffset !== undefined) {
        newCaret += cmd.cursorOffset;
      }

      onChange(newValue);
      setSlashMenu(null);

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const dispCaret = toDisplayOffset(newCaret);
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(dispCaret, dispCaret);
          updateDirection(newValue, newCaret);
          onSelectionChange?.(newCaret, newCaret);
        }
      });
    };

    const handleSelectWikiLink = (title: string) => {
      if (!wikiAutocomplete || !textareaRef.current) return;
      const openBracketPos = toFullOffset(wikiAutocomplete.openBracketPos);
      const caret = toFullOffset(textareaRef.current.selectionStart);

      const insertion = `[[${title}]] `;
      const before = value.substring(0, openBracketPos);
      const after = value.substring(caret);
      const newValue = before + insertion + after;
      const newCaret = openBracketPos + insertion.length;

      onChange(newValue);
      setWikiAutocomplete(null);

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const dispCaret = toDisplayOffset(newCaret);
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(dispCaret, dispCaret);
          updateDirection(newValue, newCaret);
          onSelectionChange?.(newCaret, newCaret);
        }
      });
    };

    const handleApplyFloatingFormat = (action: FloatingFormatAction) => {
      if (!textareaRef.current) return;
      const start = toFullOffset(textareaRef.current.selectionStart);
      const end = toFullOffset(textareaRef.current.selectionEnd);
      if (start === end) return;

      const selectedText = value.substring(start, end);
      let newText: string;
      let newStart: number;
      let newEnd: number;

      if (action.isBlock) {
        const lines = selectedText.split('\n');
        const formatted = lines.map((l) => `${action.prefix}${l}`).join('\n');
        newText = value.substring(0, start) + formatted + value.substring(end);
        newStart = start;
        newEnd = start + formatted.length;
      } else if (action.id.startsWith('highlight')) {
        const hlMatch = selectedText.match(/^==(?:[a-z]+:)?([\s\S]*?)==$/);
        if (hlMatch) {
          const innerText = hlMatch[1];
          const isSame = selectedText === `${action.prefix}${innerText}${action.suffix}`;
          if (isSame) {
            newText = value.substring(0, start) + innerText + value.substring(end);
            newStart = start;
            newEnd = start + innerText.length;
          } else {
            newText = value.substring(0, start) + action.prefix + innerText + action.suffix + value.substring(end);
            newStart = start + action.prefix.length;
            newEnd = newStart + innerText.length;
          }
        } else {
          newText =
            value.substring(0, start) +
            action.prefix +
            selectedText +
            action.suffix +
            value.substring(end);
          newStart = start + action.prefix.length;
          newEnd = newStart + selectedText.length;
        }
      } else {
        newText =
          value.substring(0, start) +
          action.prefix +
          selectedText +
          action.suffix +
          value.substring(end);
        newStart = start + action.prefix.length;
        newEnd = newStart + selectedText.length;
      }

      onChange(newText);
      setFormatBarPosition(null);

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const dispStart = toDisplayOffset(newStart);
          const dispEnd = toDisplayOffset(newEnd);
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(dispStart, dispEnd);
          updateDirection(newText, newStart);
          onSelectionChange?.(newStart, newEnd);
        }
      });
    };

    const handleCommentSelection = () => {
      if (!textareaRef.current || !documentId) return;
      const dispStart = textareaRef.current.selectionStart ?? 0;
      const dispEnd = textareaRef.current.selectionEnd ?? 0;
      const start = toFullOffset(dispStart);
      const end = toFullOffset(dispEnd);
      if (start === end) return;

      const lo = Math.min(start, end);
      const hi = Math.max(start, end);
      const quotedText = value.substring(lo, hi).trim();
      if (!quotedText) return;

      let coords = formatBarPosition || { top: 120, left: 120 };
      try {
        coords = getCaretCoordinates(textareaRef.current, Math.min(dispStart, dispEnd));
      } catch {
        // fallback to existing position
      }

      setFormatBarPosition(null);
      setInlineCommentState({
        position: { top: coords.top, left: coords.left },
        selectionRange: { start: lo, end: hi },
        quotedText: quotedText.slice(0, 280),
      });
    };

    const handleContextMenu = (e: React.MouseEvent<HTMLTextAreaElement>) => {
      if (!isSpellCheckEnabled || displaySpellErrors.length === 0 || !textareaRef.current) {
        return;
      }

      const textarea = textareaRef.current;
      const clientX = e.clientX;
      const clientY = e.clientY;

      // 1. Check current selection / caret
      const selStart = textarea.selectionStart;
      let matchedDispError = displaySpellErrors.find(
        (err) => selStart >= err.start && selStart <= err.end
      );

      // 2. If caret not placed directly in the error, check error coordinate bounding boxes
      if (!matchedDispError) {
        for (const err of displaySpellErrors) {
          try {
            const startCoords = getCaretCoordinates(textarea, err.start);
            const endCoords = getCaretCoordinates(textarea, err.end);

            const top = startCoords.top - 6;
            const bottom = startCoords.top + startCoords.height + 6;
            const left = Math.min(startCoords.left, endCoords.left) - 8;
            const right = Math.max(startCoords.left, endCoords.left) + 16;

            if (
              clientY >= top &&
              clientY <= bottom &&
              clientX >= left &&
              clientX <= right
            ) {
              matchedDispError = err;
              break;
            }
          } catch {
            // ignore coordinate measurement issues
          }
        }
      }

      if (matchedDispError) {
        const originalError = spellErrors.find((err) => err.id === matchedDispError.id);
        if (originalError) {
          e.preventDefault();
          e.stopPropagation();
          setSpellContextMenu({
            error: originalError,
            position: { x: clientX, y: clientY },
          });
        }
      }
    };

    const handleApplySpellSuggestion = (error: SpellError, suggestion: string) => {
      const before = value.substring(0, error.start);
      const after = value.substring(error.end);
      const newValue = before + suggestion + after;
      onChange(newValue);
      setSpellContextMenu(null);

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCaret = error.start + suggestion.length;
          const dispCaret = toDisplayOffset(newCaret);
          textareaRef.current.setSelectionRange(dispCaret, dispCaret);
          updateDirection(newValue, newCaret);
          onSelectionChange?.(newCaret, newCaret);
        }
      });
    };

    const handleAddToDictionary = (word: string) => {
      addWordToStore(word);
      setSpellContextMenu(null);
    };

    const handleIgnoreWord = (word: string) => {
      ignoreWordInStore(word);
      setSpellContextMenu(null);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Allow popup menus to intercept navigation and insertion keys
      if (
        slashMenu &&
        (e.key === 'ArrowUp' ||
          e.key === 'ArrowDown' ||
          e.key === 'Enter' ||
          e.key === 'Tab' ||
          e.key === 'Escape')
      ) {
        return;
      }
      if (
        wikiAutocomplete &&
        (e.key === 'ArrowUp' ||
          e.key === 'ArrowDown' ||
          e.key === 'Enter' ||
          e.key === 'Tab' ||
          e.key === 'Escape')
      ) {
        return;
      }

      const textarea = e.currentTarget;
      const dispSelectionStart = textarea.selectionStart ?? 0;
      const dispSelectionEnd = textarea.selectionEnd ?? 0;
      const selectionStart = toFullOffset(dispSelectionStart);
      const selectionEnd = toFullOffset(dispSelectionEnd);

      // Ctrl/Cmd + Shift + [ or ] -> Fold / Unfold code block at caret (or all)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === '{' || e.key === '[')) {
        e.preventDefault();
        const targetRegion = regions.find(
          (r) => selectionStart >= r.startOffset && selectionStart <= r.endOffset
        );
        if (targetRegion) {
          setFoldedIds((prev) => new Set(prev).add(targetRegion.id));
        } else {
          setFoldedIds(new Set(regions.map((r) => r.id)));
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === '}' || e.key === ']')) {
        e.preventDefault();
        const targetRegion = regions.find(
          (r) => selectionStart >= r.startOffset && selectionStart <= r.endOffset
        );
        if (targetRegion) {
          setFoldedIds((prev) => {
            const next = new Set(prev);
            next.delete(targetRegion.id);
            return next;
          });
        } else {
          setFoldedIds(new Set());
        }
        return;
      }

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

            textarea.setSelectionRange(toDisplayOffset(newStart), toDisplayOffset(newEnd));
            updateDirection(newValue, newStart);
            onSelectionChange?.(newStart, newEnd);
          });
        } else {
          const newValue =
            value.substring(0, selectionStart) + spaces + value.substring(selectionEnd);
          onChange(newValue);

          requestAnimationFrame(() => {
            const newPosition = selectionStart + tabSize;
            const dispPos = toDisplayOffset(newPosition);
            textarea.setSelectionRange(dispPos, dispPos);
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
            const dispPos = toDisplayOffset(newPosition);
            textarea.setSelectionRange(dispPos, dispPos);
            updateDirection(newValue, newPosition);
            onSelectionChange?.(newPosition, newPosition);
          } else {
            const newStart = selectionStart - firstLineRemoved;
            const newEnd = selectionEnd - totalRemoved;
            textarea.setSelectionRange(toDisplayOffset(newStart), toDisplayOffset(newEnd));
            updateDirection(newValue, newStart);
            onSelectionChange?.(newStart, newEnd);
          }
        });
        return;
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        isEnterKeyDownRef.current = true;
        const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
        const lineText = value.substring(lineStart, selectionStart);
        const indentMatch = lineText.match(/^(\s+)/);
        const indent = indentMatch ? indentMatch[1] : '';

        const listMatch = lineText.match(/^(\s*)([-*+]|\d+\.)\s/);

        if (listMatch) {
          e.preventDefault();
          const [, listIndent, marker] = listMatch;

          if (lineText.trim() === marker) {
            const newValue = value.substring(0, lineStart) + value.substring(selectionEnd);
            onChange(newValue);

            requestAnimationFrame(() => {
              const dispPos = toDisplayOffset(lineStart);
              textarea.setSelectionRange(dispPos, dispPos);
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
              const dispPos = toDisplayOffset(newPosition);
              textarea.setSelectionRange(dispPos, dispPos);
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
            const dispPos = toDisplayOffset(newPosition);
            textarea.setSelectionRange(dispPos, dispPos);
            updateDirection(newValue, newPosition);
            onSelectionChange?.(newPosition, newPosition);
          });
        }
      }
    };

    const lineCount = displayText.split('\n').length;
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);
    const lineNumPx = Math.round(typography.fontSize * typography.lineHeight);
    const lineNumHeight = `${lineNumPx}px`;

    return (
      <div
        className={cn(
          'relative flex h-full w-full transition-colors',
          isDraggingImage && 'ring-2 ring-inset ring-primary bg-primary/5'
        )}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            setIsDraggingImage(true);
          }
        }}
        onDragLeave={() => setIsDraggingImage(false)}
        onDrop={handleEditorDrop}
      >
        {showLineNumbers && (
          <div
            ref={lineNumbersRef}
            className="select-none overflow-hidden border-r border-border bg-muted/40 px-2 py-8 text-right font-mono text-sm leading-relaxed text-muted-foreground"
            style={{
              width: '3.5rem',
              lineHeight: typography.lineHeight,
              fontSize: `${typography.fontSize}px`,
              direction: 'ltr',
              paddingTop: typewriterMode ? '42vh' : undefined,
              paddingBottom: typewriterMode ? '48vh' : undefined,
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

        {regions.length > 0 && (
          <div
            ref={foldGutterRef}
            className="relative w-7 shrink-0 select-none overflow-hidden border-r border-border/50 bg-muted/20"
            aria-label="Code block fold controls"
          >
            <button
              type="button"
              onClick={() =>
                setFoldedIds((prev) =>
                  prev.size > 0 ? new Set() : new Set(regions.map((r) => r.id))
                )
              }
              title={
                foldedIds.size > 0
                  ? `Unfold all ${regions.length} code blocks (Ctrl+Shift+])`
                  : `Fold all ${regions.length} code blocks (Ctrl+Shift+[)`
              }
              className="absolute top-1.5 left-1 right-1 z-20 flex h-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {foldedIds.size > 0 ? (
                <ChevronsUpDown className="h-3 w-3 text-primary" />
              ) : (
                <ChevronsDownUp className="h-3 w-3" />
              )}
            </button>
            <div
              className="relative w-full"
              style={{
                height: foldGutterHeight > 0 ? `${foldGutterHeight}px` : '100%',
              }}
            >
              {foldedView.displayMarkers.map((marker, idx) => {
                const topPx = markerTops[idx];
                if (topPx === undefined) return null;
                return (
                  <button
                    key={marker.region.id}
                    type="button"
                    onClick={() => toggleFoldRegion(marker.region.id)}
                    title={
                      marker.isFolded
                        ? `Unfold ${marker.region.language} block (${marker.region.bodyLineCount} lines)`
                        : `Fold ${marker.region.language} block (${marker.region.bodyLineCount} lines)`
                    }
                    style={{
                      top: `${topPx}px`,
                      height: `${lineNumPx}px`,
                    }}
                    className={cn(
                      'absolute left-1 right-1 flex items-center justify-center rounded transition-colors',
                      marker.isFolded
                        ? 'bg-primary/15 text-primary hover:bg-primary/25'
                        : 'text-muted-foreground/70 hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {marker.isFolded ? (
                      <ChevronRight className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="relative flex-1 h-full overflow-hidden">
          {isDraggingImage && (
            <div className="pointer-events-none absolute inset-3 z-30 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-background/80 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <ImageIcon className="h-4 w-4" />
                <span>Drop image to embed in document</span>
              </div>
            </div>
          )}

          <SpellCheckerOverlay
            ref={overlayRef}
            value={displayText}
            errors={displaySpellErrors}
            commentHighlights={openCommentHighlights}
            styleHighlights={displayStyleHighlights}
            foldedPlaceholderSpans={foldedPlaceholderSpans}
            focusDimming={activeFocusRanges}
            typewriterPadding={typewriterMode}
            typography={typography}
            editorDir={editorDir}
            enabled={isSpellCheckEnabled}
          />

          <textarea
            ref={textareaRef}
            value={displayText}
            dir={editorDir}
            onChange={handleChange}
            onSelect={handleSelect}
            onClick={handleTextareaClick}
            onDoubleClick={handleDoubleClick}
            onPaste={handlePaste}
            onKeyUp={handleSelect}
            onKeyDown={handleKeyDown}
            onFocus={handleSelect}
            onScroll={handleScrollTextarea}
            onContextMenu={handleContextMenu}
            className={cn(
              'relative z-10 h-full w-full resize-none border-0 bg-transparent p-8 font-mono text-sm leading-relaxed outline-none',
              isDimmingActive
                ? 'text-transparent selection:bg-primary/25'
                : 'text-foreground',
              className
            )}
            style={{
              unicodeBidi: 'plaintext',
              fontFamily: typography.fontFamily,
              fontSize: `${typography.fontSize}px`,
              lineHeight: typography.lineHeight,
              caretColor: isDimmingActive ? 'var(--foreground)' : undefined,
              paddingTop: typewriterMode ? '42vh' : undefined,
              paddingBottom: typewriterMode ? '48vh' : undefined,
            }}
            spellCheck={false}
            aria-label="Markdown editor"
            aria-multiline="true"
            role="textbox"
          />
        </div>

        {spellContextMenu && (
          <SpellCheckContextMenu
            error={spellContextMenu.error}
            position={spellContextMenu.position}
            onApplySuggestion={handleApplySpellSuggestion}
            onAddToDictionary={handleAddToDictionary}
            onIgnoreWord={handleIgnoreWord}
            onClose={() => setSpellContextMenu(null)}
          />
        )}

        {slashMenu && (
          <SlashCommandMenu
            query={slashMenu.query}
            position={slashMenu.position}
            onSelect={handleSelectSlashCommand}
            onClose={() => setSlashMenu(null)}
          />
        )}

        {wikiAutocomplete && (
          <WikiLinkAutocomplete
            query={wikiAutocomplete.query}
            position={wikiAutocomplete.position}
            onSelect={handleSelectWikiLink}
            onClose={() => setWikiAutocomplete(null)}
          />
        )}

        {formatBarPosition && (
          <FloatingFormatBar
            position={formatBarPosition}
            onApplyFormat={handleApplyFloatingFormat}
            onCommentSelection={documentId ? handleCommentSelection : undefined}
            overlappingCommentCount={formatBarOverlappingCount}
            onClose={() => setFormatBarPosition(null)}
          />
        )}

        {inlineCommentState && documentId && (
          <InlineCommentPopover
            documentId={documentId}
            position={inlineCommentState.position}
            selectionRange={inlineCommentState.selectionRange}
            quotedText={inlineCommentState.quotedText}
            overlappingComments={inlineOverlappingComments}
            onOpenAllComments={() => useUIStore.getState().openCommentsPanel()}
            onClose={() => setInlineCommentState(null)}
          />
        )}

        {imagePopover && (
          <ImagePopover
            key={`${imagePopover.start}-${imagePopover.url}`}
            initialAlt={imagePopover.alt}
            initialWidth={imagePopover.width}
            position={imagePopover.position}
            onApply={handleApplyImagePopover}
            onRemove={handleRemoveImagePopover}
            onClose={() => setImagePopover(null)}
          />
        )}
      </div>
    );
  })
);

MarkdownEditor.displayName = 'MarkdownEditor';
