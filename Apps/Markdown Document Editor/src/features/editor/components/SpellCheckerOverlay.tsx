// src/features/editor/components/SpellCheckerOverlay.tsx
import React, { useMemo, forwardRef } from 'react';
import { SpellError } from '../../../lib/spellcheck/spellChecker';
import { cn } from '../../../lib/utils/cn';
import { TextDirection } from '../../../lib/markdown/textDirection';
import type { FocusHighlightRanges } from '../../../lib/editor/focusRanges';

export interface CommentHighlightSpan {
  id: string;
  start: number;
  end: number;
}

export interface StyleHighlightSpan {
  id: string;
  start: number;
  end: number;
  kind: 'passive' | 'repeat';
}

export interface FoldedPlaceholderSpan {
  start: number;
  end: number;
}

interface SpellCheckerOverlayProps {
  value: string;
  errors: SpellError[];
  commentHighlights?: CommentHighlightSpan[];
  styleHighlights?: StyleHighlightSpan[];
  foldedPlaceholderSpans?: FoldedPlaceholderSpan[];
  focusDimming?: FocusHighlightRanges | null;
  typewriterPadding?: boolean;
  typography: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
  };
  editorDir?: TextDirection;
  className?: string;
  enabled?: boolean;
}

export const SpellCheckerOverlay = forwardRef<HTMLDivElement, SpellCheckerOverlayProps>(
  (
    {
      value,
      errors,
      commentHighlights = [],
      styleHighlights = [],
      foldedPlaceholderSpans = [],
      focusDimming = null,
      typewriterPadding = false,
      typography,
      editorDir = 'ltr',
      className,
      enabled = true,
    },
    ref
  ) => {
    const activeErrors = enabled ? errors : [];

    // Break the text into non-overlapping segments supporting spell errors, style hints, comments, folded blocks, and focus dimming
    const segments = useMemo(() => {
      if (
        activeErrors.length === 0 &&
        commentHighlights.length === 0 &&
        styleHighlights.length === 0 &&
        foldedPlaceholderSpans.length === 0 &&
        !focusDimming
      ) {
        return null;
      }

      const boundarySet = new Set<number>([0, value.length]);
      for (const err of activeErrors) {
        const s = Math.max(0, Math.min(value.length, err.start));
        const e = Math.max(0, Math.min(value.length, err.end));
        if (e > s) {
          boundarySet.add(s);
          boundarySet.add(e);
        }
      }
      for (const hl of commentHighlights) {
        const s = Math.max(0, Math.min(value.length, hl.start));
        const e = Math.max(0, Math.min(value.length, hl.end));
        if (e > s) {
          boundarySet.add(s);
          boundarySet.add(e);
        }
      }
      for (const st of styleHighlights) {
        const s = Math.max(0, Math.min(value.length, st.start));
        const e = Math.max(0, Math.min(value.length, st.end));
        if (e > s) {
          boundarySet.add(s);
          boundarySet.add(e);
        }
      }
      for (const fp of foldedPlaceholderSpans) {
        const s = Math.max(0, Math.min(value.length, fp.start));
        const e = Math.max(0, Math.min(value.length, fp.end));
        if (e > s) {
          boundarySet.add(s);
          boundarySet.add(e);
        }
      }
      if (focusDimming) {
        boundarySet.add(Math.max(0, Math.min(value.length, focusDimming.paragraphStart)));
        boundarySet.add(Math.max(0, Math.min(value.length, focusDimming.paragraphEnd)));
        boundarySet.add(Math.max(0, Math.min(value.length, focusDimming.sentenceStart)));
        boundarySet.add(Math.max(0, Math.min(value.length, focusDimming.sentenceEnd)));
      }

      const boundaries = Array.from(boundarySet).sort((a, b) => a - b);
      const parts: React.ReactNode[] = [];

      for (let i = 0; i < boundaries.length - 1; i++) {
        const start = boundaries[i];
        const end = boundaries[i + 1];
        if (end <= start) continue;

        const err = activeErrors.find((e) => start >= e.start && end <= e.end);
        const hasComment = commentHighlights.some((h) => start >= h.start && end <= h.end);
        const styleHl = styleHighlights.find((s) => start >= s.start && end <= s.end);
        const isFoldedPlaceholder = foldedPlaceholderSpans.some(
          (f) => start >= f.start && end <= f.end
        );
        const slice = value.substring(start, end);

        let textColorClass = 'text-transparent';
        if (focusDimming) {
          const inSentence =
            start >= focusDimming.sentenceStart && end <= focusDimming.sentenceEnd;
          const inParagraph =
            start >= focusDimming.paragraphStart && end <= focusDimming.paragraphEnd;
          textColorClass = inSentence
            ? 'text-foreground'
            : inParagraph
              ? 'text-foreground/65'
              : 'text-foreground/25';
        }

        if (!err && !hasComment && !styleHl && !isFoldedPlaceholder && !focusDimming) {
          parts.push(
            <span key={`t-${start}`} className="text-transparent select-none">
              {slice}
            </span>
          );
        } else {
          parts.push(
            <span
              key={`d-${start}`}
              data-spell-error-id={err?.id}
              data-word={err?.word}
              className={cn(
                'select-none transition-colors duration-150',
                textColorClass,
                isFoldedPlaceholder && 'bg-primary/12 rounded-[3px]',
                hasComment &&
                  'bg-amber-300/35 dark:bg-amber-400/25 border-b-2 border-amber-500/80 rounded-[2px]',
                styleHl?.kind === 'passive' &&
                  'underline decoration-sky-500/85 decoration-dotted decoration-2 underline-offset-4',
                styleHl?.kind === 'repeat' &&
                  'bg-amber-300/20 dark:bg-amber-400/15 underline decoration-amber-500/90 decoration-wavy decoration-1 underline-offset-4 rounded-[2px]',
                err && 'underline decoration-red-500 decoration-2 underline-offset-4'
              )}
            >
              {slice}
            </span>
          );
        }
      }

      if (value.endsWith('\n')) {
        parts.push(<br key="trailing-br" />);
      }

      return parts;
    }, [value, activeErrors, commentHighlights, styleHighlights, foldedPlaceholderSpans, focusDimming]);

    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 z-0 overflow-hidden whitespace-pre-wrap break-words p-8 font-mono text-sm leading-relaxed select-none',
          className
        )}
        style={{
          unicodeBidi: 'plaintext',
          fontFamily: typography.fontFamily,
          fontSize: `${typography.fontSize}px`,
          lineHeight: typography.lineHeight,
          direction: editorDir,
          paddingTop: typewriterPadding ? '42vh' : undefined,
          paddingBottom: typewriterPadding ? '48vh' : undefined,
        }}
      >
        {segments}
      </div>
    );
  }
);

SpellCheckerOverlay.displayName = 'SpellCheckerOverlay';
