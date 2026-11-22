// src/lib/editor/codeFolding.ts

export interface CodeBlockRegion {
  id: string;
  startLine: number;
  endLine: number;
  startOffset: number;
  endOffset: number;
  language: string;
  bodyLineCount: number;
  fence: string;
  openLineText: string;
}

export interface FoldSegment {
  fullStart: number;
  fullEnd: number;
  displayStart: number;
  displayEnd: number;
  foldedRegionId?: string;
}

export interface FoldedDisplayResult {
  displayText: string;
  segments: FoldSegment[];
  displayMarkers: Array<{
    region: CodeBlockRegion;
    displayStartOffset: number;
    displayEndOffset: number;
    isFolded: boolean;
  }>;
}

interface RawLineSpan {
  text: string;
  start: number;
  end: number;
}

function splitLineSpans(text: string): RawLineSpan[] {
  const spans: RawLineSpan[] = [];
  let start = 0;
  for (let i = 0; i <= text.length; i++) {
    if (i === text.length || text[i] === '\n') {
      spans.push({
        text: text.slice(start, i),
        start,
        end: i,
      });
      start = i + 1;
    }
  }
  return spans;
}

/**
 * Finds all closed fenced code block regions (` ``` ` or `~~~`) in Markdown text.
 */
export function findCodeBlockRegions(text: string): CodeBlockRegion[] {
  if (!text) return [];
  const spans = splitLineSpans(text);
  const regions: CodeBlockRegion[] = [];

  let openIdx: number | null = null;
  let openFenceChar = '';
  let openFenceLen = 0;
  let openLang = '';

  for (let i = 0; i < spans.length; i++) {
    const line = spans[i].text;
    const match = line.match(/^\s*(`{3,}|~{3,})(.*)$/);

    if (openIdx === null) {
      if (match) {
        openIdx = i;
        openFenceChar = match[1][0];
        openFenceLen = match[1].length;
        openLang = match[2].trim();
      }
    } else if (match) {
      const fenceStr = match[1];
      const trailing = match[2].trim();
      if (
        fenceStr[0] === openFenceChar &&
        fenceStr.length >= openFenceLen &&
        trailing === ''
      ) {
        const startSpan = spans[openIdx];
        const endSpan = spans[i];
        const bodyLineCount = Math.max(0, i - openIdx - 1);
        const fencePrefix = openFenceChar.repeat(openFenceLen);
        regions.push({
          id: `${openIdx}:${fencePrefix}:${openLang || 'plain'}`,
          startLine: openIdx,
          endLine: i,
          startOffset: startSpan.start,
          endOffset: endSpan.end,
          language: openLang || 'code',
          bodyLineCount,
          fence: fencePrefix,
          openLineText: startSpan.text,
        });
        openIdx = null;
      }
    }
  }

  return regions;
}

/**
 * Produces a non-destructive folded display string and bidirectional offset mapping.
 */
export function buildFoldedDisplay(
  fullText: string,
  foldedIds: Set<string>,
  regions: CodeBlockRegion[]
): FoldedDisplayResult {
  const activeFolded = regions.filter((r) => foldedIds.has(r.id));

  if (activeFolded.length === 0) {
    return {
      displayText: fullText,
      segments: [
        {
          fullStart: 0,
          fullEnd: fullText.length,
          displayStart: 0,
          displayEnd: fullText.length,
        },
      ],
      displayMarkers: regions.map((region) => ({
        region,
        displayStartOffset: region.startOffset,
        displayEndOffset: region.endOffset,
        isFolded: false,
      })),
    };
  }

  const segments: FoldSegment[] = [];
  const markerMap = new Map<string, { displayStartOffset: number; displayEndOffset: number; isFolded: boolean }>();
  let displayText = '';
  let fullCursor = 0;

  for (const region of regions) {
    // Emit plain text before this region
    if (region.startOffset > fullCursor) {
      const plain = fullText.slice(fullCursor, region.startOffset);
      const dispStart = displayText.length;
      displayText += plain;
      segments.push({
        fullStart: fullCursor,
        fullEnd: region.startOffset,
        displayStart: dispStart,
        displayEnd: displayText.length,
      });
    }

    if (foldedIds.has(region.id)) {
      const placeholder = `${region.fence}${region.language === 'code' ? '' : region.language} ▸ [Folded ${region.bodyLineCount} line${region.bodyLineCount === 1 ? '' : 's'} — click gutter to unfold] ${region.fence}`;
      const dispStart = displayText.length;
      displayText += placeholder;
      const dispEnd = displayText.length;
      segments.push({
        fullStart: region.startOffset,
        fullEnd: region.endOffset,
        displayStart: dispStart,
        displayEnd: dispEnd,
        foldedRegionId: region.id,
      });
      markerMap.set(region.id, {
        displayStartOffset: dispStart,
        displayEndOffset: dispEnd,
        isFolded: true,
      });
    } else {
      const blockText = fullText.slice(region.startOffset, region.endOffset);
      const dispStart = displayText.length;
      displayText += blockText;
      const dispEnd = displayText.length;
      segments.push({
        fullStart: region.startOffset,
        fullEnd: region.endOffset,
        displayStart: dispStart,
        displayEnd: dispEnd,
      });
      markerMap.set(region.id, {
        displayStartOffset: dispStart,
        displayEndOffset: dispEnd,
        isFolded: false,
      });
    }

    fullCursor = region.endOffset;
  }

  if (fullCursor < fullText.length) {
    const tail = fullText.slice(fullCursor);
    const dispStart = displayText.length;
    displayText += tail;
    segments.push({
      fullStart: fullCursor,
      fullEnd: fullText.length,
      displayStart: dispStart,
      displayEnd: displayText.length,
    });
  }

  return {
    displayText,
    segments,
    displayMarkers: regions.map((region) => ({
      region,
      ...(markerMap.get(region.id) || {
        displayStartOffset: region.startOffset,
        displayEndOffset: region.endOffset,
        isFolded: false,
      }),
    })),
  };
}

export function displayOffsetToFullOffset(
  displayOffset: number,
  segments: FoldSegment[]
): number {
  for (const seg of segments) {
    if (displayOffset <= seg.displayEnd) {
      if (seg.foldedRegionId) {
        return seg.fullStart;
      }
      const delta = Math.max(0, displayOffset - seg.displayStart);
      return Math.min(seg.fullEnd, seg.fullStart + delta);
    }
  }
  const last = segments[segments.length - 1];
  return last ? last.fullEnd : displayOffset;
}

export function fullOffsetToDisplayOffset(
  fullOffset: number,
  segments: FoldSegment[]
): number {
  for (const seg of segments) {
    if (fullOffset <= seg.fullEnd) {
      if (seg.foldedRegionId) {
        return seg.displayStart;
      }
      const delta = Math.max(0, fullOffset - seg.fullStart);
      return Math.min(seg.displayEnd, seg.displayStart + delta);
    }
  }
  const last = segments[segments.length - 1];
  return last ? last.displayEnd : fullOffset;
}

/**
 * Reconciles an edit made in `displayText` back into `fullText` while preserving folded code block bodies intact.
 */
export function reconcileFoldedEdit(
  prevFullText: string,
  prevDisplayText: string,
  nextDisplayText: string,
  segments: FoldSegment[]
): {
  nextFullText: string;
  unfoldedRegionIds: string[];
} {
  const foldedSegments = segments.filter((s) => Boolean(s.foldedRegionId));
  if (foldedSegments.length === 0) {
    return { nextFullText: nextDisplayText, unfoldedRegionIds: [] };
  }

  // Find longest common prefix and suffix between prevDisplayText and nextDisplayText
  let prefixLen = 0;
  const minLen = Math.min(prevDisplayText.length, nextDisplayText.length);
  while (
    prefixLen < minLen &&
    prevDisplayText[prefixLen] === nextDisplayText[prefixLen]
  ) {
    prefixLen++;
  }

  let suffixLen = 0;
  while (
    suffixLen < minLen - prefixLen &&
    prevDisplayText[prevDisplayText.length - 1 - suffixLen] ===
      nextDisplayText[nextDisplayText.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  const changeDisplayStart = prefixLen;
  const changeDisplayEnd = prevDisplayText.length - suffixLen;
  const insertedText = nextDisplayText.slice(
    prefixLen,
    nextDisplayText.length - suffixLen
  );

  // If edit overlaps any folded placeholder, unfold that region and preserve original code
  const overlapped = foldedSegments.filter(
    (s) => changeDisplayStart < s.displayEnd && changeDisplayEnd > s.displayStart
  );

  if (overlapped.length > 0) {
    // Reconstruct untouched regions cleanly and unfold overlapped regions without losing code
    return {
      nextFullText: prevFullText,
      unfoldedRegionIds: overlapped
        .map((s) => s.foldedRegionId)
        .filter((id): id is string => Boolean(id)),
    };
  }

  // Edit occurred strictly outside folded placeholders -> map start/end directly to fullText!
  const fullStart = displayOffsetToFullOffset(changeDisplayStart, segments);
  const fullEnd = displayOffsetToFullOffset(changeDisplayEnd, segments);

  return {
    nextFullText:
      prevFullText.slice(0, fullStart) +
      insertedText +
      prevFullText.slice(fullEnd),
    unfoldedRegionIds: [],
  };
}

/**
 * Keeps foldedIds in sync if lines are inserted/removed strictly before a folded region.
 */
export function remapFoldedIdsAfterTextChange(
  prevText: string,
  nextText: string,
  prevRegions: CodeBlockRegion[],
  prevFoldedIds: Set<string>
): Set<string> {
  if (prevFoldedIds.size === 0 || prevText === nextText) return prevFoldedIds;

  let prefixLen = 0;
  const minLen = Math.min(prevText.length, nextText.length);
  while (prefixLen < minLen && prevText[prefixLen] === nextText[prefixLen]) {
    prefixLen++;
  }

  let suffixLen = 0;
  while (
    suffixLen < minLen - prefixLen &&
    prevText[prevText.length - 1 - suffixLen] === nextText[nextText.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  const oldSlice = prevText.slice(prefixLen, prevText.length - suffixLen);
  const newSlice = nextText.slice(prefixLen, nextText.length - suffixLen);
  const lineDelta =
    newSlice.split('\n').length - oldSlice.split('\n').length;

  if (lineDelta === 0) return prevFoldedIds;

  const nextIds = new Set<string>();
  for (const region of prevRegions) {
    if (!prevFoldedIds.has(region.id)) continue;
    if (region.startOffset >= prefixLen) {
      const shiftedLine = Math.max(0, region.startLine + lineDelta);
      nextIds.add(`${shiftedLine}:${region.fence}:${region.language === 'code' ? 'plain' : region.language}`);
    } else {
      nextIds.add(region.id);
    }
  }
  return nextIds;
}

/**
 * Measures exact scroll-space Y coordinates (`offsetTop`) inside a textarea for multiple offsets in one pass.
 */
export function measureTextareaOffsetTops(
  textarea: HTMLTextAreaElement,
  displayText: string,
  offsets: number[]
): number[] {
  if (offsets.length === 0) return [];
  const computed = window.getComputedStyle(textarea);
  const mirror = document.createElement('div');
  const style = mirror.style;

  style.position = 'absolute';
  style.top = '0px';
  style.left = '-9999px';
  style.visibility = 'hidden';
  style.pointerEvents = 'none';
  style.whiteSpace = 'pre-wrap';
  style.wordWrap = 'break-word';
  style.overflowWrap = 'break-word';
  style.wordBreak = 'normal';
  style.width = `${textarea.clientWidth}px`;
  style.fontFamily = computed.fontFamily;
  style.fontSize = computed.fontSize;
  style.lineHeight = computed.lineHeight;
  style.letterSpacing = computed.letterSpacing;
  style.wordSpacing = computed.wordSpacing;
  style.tabSize = computed.tabSize;
  style.fontVariantLigatures = computed.fontVariantLigatures;
  style.fontFeatureSettings = computed.fontFeatureSettings;
  style.fontKerning = computed.fontKerning;
  style.paddingTop = computed.paddingTop;
  style.paddingRight = computed.paddingRight;
  style.paddingBottom = computed.paddingBottom;
  style.paddingLeft = computed.paddingLeft;
  style.boxSizing = computed.boxSizing;
  style.borderTopWidth = computed.borderTopWidth;
  style.borderBottomWidth = computed.borderBottomWidth;
  style.borderLeftWidth = computed.borderLeftWidth;
  style.borderRightWidth = computed.borderRightWidth;

  const sortedIndices = offsets
    .map((offset, idx) => ({ offset: Math.max(0, Math.min(offset, displayText.length)), idx }))
    .sort((a, b) => a.offset - b.offset);

  const spans: HTMLSpanElement[] = new Array(offsets.length);
  let cursor = 0;

  for (const item of sortedIndices) {
    if (item.offset > cursor) {
      mirror.appendChild(document.createTextNode(displayText.slice(cursor, item.offset)));
    }
    const markerSpan = document.createElement('span');
    markerSpan.textContent = '\u200b';
    mirror.appendChild(markerSpan);
    spans[item.idx] = markerSpan;
    cursor = item.offset;
  }

  if (cursor < displayText.length) {
    mirror.appendChild(document.createTextNode(displayText.slice(cursor)));
  }

  document.body.appendChild(mirror);
  const tops = spans.map((span) => (span ? span.offsetTop : 32));
  document.body.removeChild(mirror);
  return tops;
}
