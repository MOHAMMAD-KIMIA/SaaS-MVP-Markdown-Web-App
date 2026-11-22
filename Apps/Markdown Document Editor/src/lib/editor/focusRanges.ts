// src/lib/editor/focusRanges.ts

export interface FocusHighlightRanges {
  paragraphStart: number;
  paragraphEnd: number;
  sentenceStart: number;
  sentenceEnd: number;
}

/**
 * Computes active paragraph (delimited by blank lines) and active sentence
 * ranges around `caretOffset` for distraction-free focus dimming.
 */
export function getFocusHighlightRanges(
  text: string,
  caretOffset: number
): FocusHighlightRanges {
  if (!text) {
    return {
      paragraphStart: 0,
      paragraphEnd: 0,
      sentenceStart: 0,
      sentenceEnd: 0,
    };
  }

  const clamped = Math.max(0, Math.min(text.length, caretOffset));

  // Find paragraph boundaries delimited by blank lines (\n\s*\n)
  let paragraphStart = 0;
  let paragraphEnd = text.length;

  const beforeCaret = text.slice(0, clamped);
  const blankLineBeforeRegex = /\n[ \t]*\n/g;
  let match: RegExpExecArray | null;
  while ((match = blankLineBeforeRegex.exec(beforeCaret)) !== null) {
    paragraphStart = match.index + match[0].length;
  }

  const afterCaret = text.slice(clamped);
  const blankLineAfter = afterCaret.match(/\n[ \t]*\n/);
  if (blankLineAfter && blankLineAfter.index !== undefined) {
    paragraphEnd = clamped + blankLineAfter.index;
  }

  // Handle when caret sits inside a blank-line separator
  if (paragraphStart > paragraphEnd) {
    paragraphStart = clamped;
    paragraphEnd = clamped;
  }

  // Find active line / sentence inside the active paragraph
  let sentenceStart = paragraphStart;
  let sentenceEnd = paragraphEnd;

  const paragraphSlice = text.slice(paragraphStart, paragraphEnd);
  const relCaret = Math.max(0, Math.min(paragraphSlice.length, clamped - paragraphStart));

  // Scan backward to sentence or line boundary
  for (let i = relCaret - 1; i >= 0; i--) {
    const ch = paragraphSlice[i];
    if (ch === '\n') {
      sentenceStart = paragraphStart + i + 1;
      break;
    }
    if ((ch === '.' || ch === '!' || ch === '?' || ch === '؟') && i < relCaret - 1) {
      const nextCh = paragraphSlice[i + 1];
      if (nextCh === ' ' || nextCh === '\t') {
        sentenceStart = paragraphStart + i + 2;
        break;
      }
    }
  }

  // Scan forward to sentence or line boundary
  for (let i = relCaret; i < paragraphSlice.length; i++) {
    const ch = paragraphSlice[i];
    if (ch === '\n') {
      sentenceEnd = paragraphStart + i;
      break;
    }
    if (ch === '.' || ch === '!' || ch === '?' || ch === '؟') {
      const nextCh = paragraphSlice[i + 1];
      if (nextCh === undefined || nextCh === ' ' || nextCh === '\t' || nextCh === '\n') {
        sentenceEnd = paragraphStart + i + 1;
        break;
      }
    }
  }

  if (sentenceStart > sentenceEnd) {
    sentenceStart = paragraphStart;
    sentenceEnd = paragraphEnd;
  }

  return {
    paragraphStart,
    paragraphEnd,
    sentenceStart,
    sentenceEnd,
  };
}
