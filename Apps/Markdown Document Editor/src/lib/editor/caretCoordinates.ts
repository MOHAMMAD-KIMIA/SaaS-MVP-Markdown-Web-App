// src/lib/editor/caretCoordinates.ts
// Calculates the pixel coordinates of the caret or selection in a textarea

export interface CaretCoordinates {
  top: number;
  left: number;
  height: number;
}

function createTextareaMirror(element: HTMLTextAreaElement): HTMLDivElement {
  const computed = window.getComputedStyle(element);
  const div = document.createElement('div');
  const style = div.style;

  style.position = 'absolute';
  style.top = '0px';
  style.left = '-9999px';
  style.visibility = 'hidden';
  style.pointerEvents = 'none';
  style.whiteSpace = 'pre-wrap';
  style.wordWrap = 'break-word';
  style.overflowWrap = 'break-word';
  style.wordBreak = 'normal';
  style.boxSizing = 'border-box';
  style.width = `${element.clientWidth}px`;
  style.fontFamily = computed.fontFamily;
  style.fontSize = computed.fontSize;
  style.fontWeight = computed.fontWeight;
  style.fontStyle = computed.fontStyle;
  style.lineHeight = computed.lineHeight;
  style.letterSpacing = computed.letterSpacing;
  style.wordSpacing = computed.wordSpacing;
  style.tabSize = computed.tabSize;
  style.fontVariantLigatures = computed.fontVariantLigatures;
  style.fontFeatureSettings = computed.fontFeatureSettings;
  style.fontKerning = computed.fontKerning;
  style.direction = computed.direction;
  style.unicodeBidi = computed.unicodeBidi;
  style.paddingTop = computed.paddingTop;
  style.paddingRight = computed.paddingRight;
  style.paddingBottom = computed.paddingBottom;
  style.paddingLeft = computed.paddingLeft;
  style.borderTopWidth = '0px';
  style.borderRightWidth = '0px';
  style.borderBottomWidth = '0px';
  style.borderLeftWidth = '0px';

  return div;
}

/**
 * Checks whether a viewport point (clientX, clientY) falls inside (or within tolerance of)
 * a character range [start, end] in a textarea using exact unclamped DOM range rects.
 */
export function isPointInTextareaRange(
  element: HTMLTextAreaElement,
  start: number,
  end: number,
  clientX: number,
  clientY: number,
  tolerancePx = 6
): boolean {
  if (typeof window === 'undefined' || !element || end <= start) return false;

  const rect = element.getBoundingClientRect();
  if (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  ) {
    return false;
  }

  let mirror: HTMLDivElement | null = null;
  try {
    const safeStart = Math.max(0, Math.min(start, element.value.length));
    const safeEnd = Math.max(safeStart, Math.min(end, element.value.length));
    if (safeEnd <= safeStart) return false;

    mirror = createTextareaMirror(element);
    const fullTextNode = document.createTextNode(element.value);
    mirror.appendChild(fullTextNode);
    document.body.appendChild(mirror);

    const mirrorRect = mirror.getBoundingClientRect();
    const range = document.createRange();
    range.setStart(fullTextNode, safeStart);
    range.setEnd(fullTextNode, safeEnd);

    const clientRects = range.getClientRects();
    for (let i = 0; i < clientRects.length; i++) {
      const r = clientRects[i];
      const top = rect.top + (r.top - mirrorRect.top) - element.scrollTop - tolerancePx;
      const bottom = rect.top + (r.bottom - mirrorRect.top) - element.scrollTop + tolerancePx;
      const left = rect.left + (r.left - mirrorRect.left) - element.scrollLeft - tolerancePx;
      const right = rect.left + (r.right - mirrorRect.left) - element.scrollLeft + tolerancePx;

      if (clientX >= left && clientX <= right && clientY >= top && clientY <= bottom) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  } finally {
    if (mirror && mirror.parentNode) {
      mirror.parentNode.removeChild(mirror);
    }
  }
}

export function getCaretCoordinates(
  element: HTMLTextAreaElement,
  position: number
): CaretCoordinates {
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser || !element) {
    return { top: 60, left: 40, height: 22 };
  }

  const rect = element.getBoundingClientRect();
  const computed = window.getComputedStyle(element);

  const fontSize = parseFloat(computed.fontSize) || 14;
  const lineHeight = parseFloat(computed.lineHeight) || fontSize * 1.6;
  const paddingTop = parseFloat(computed.paddingTop) || 32;
  const paddingLeft = parseFloat(computed.paddingLeft) || 32;

  // Safe fallback calculation based on line count and character width
  const textUpToPosition = element.value.substring(0, Math.max(0, position));
  const lines = textUpToPosition.split('\n');
  const lineIndex = lines.length - 1;
  const currentLineText = lines[lineIndex] || '';
  const charWidth = fontSize * 0.605;

  let calculatedTop = rect.top + paddingTop + lineIndex * lineHeight - element.scrollTop;
  let calculatedLeft = rect.left + paddingLeft + currentLineText.length * charWidth - element.scrollLeft;

  // Try high-precision mirror measurement safely
  let mirror: HTMLDivElement | null = null;
  try {
    mirror = createTextareaMirror(element);
    mirror.textContent = textUpToPosition;

    const span = document.createElement('span');
    span.textContent = element.value.substring(position, position + 1) || '\u200b';
    mirror.appendChild(span);

    document.body.appendChild(mirror);

    if (typeof span.offsetTop === 'number' && typeof span.offsetLeft === 'number') {
      calculatedTop = rect.top + span.offsetTop - element.scrollTop;
      calculatedLeft = rect.left + span.offsetLeft - element.scrollLeft;
    }
  } catch {
    // If mirror measurement throws in any environment, fallback is used
  } finally {
    if (mirror && mirror.parentNode) {
      mirror.parentNode.removeChild(mirror);
    }
  }

  // Constrain coordinates nicely within the visible viewport
  const safeTop = Math.max(56, Math.min(calculatedTop, window.innerHeight - 340));
  const safeLeft = Math.max(16, Math.min(calculatedLeft, window.innerWidth - 340));

  return {
    top: safeTop,
    left: safeLeft,
    height: lineHeight,
  };
}
