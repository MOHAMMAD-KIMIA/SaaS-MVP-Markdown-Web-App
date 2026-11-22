// src/lib/editor/caretCoordinates.ts
// Calculates the pixel coordinates of the caret or selection in a textarea

export interface CaretCoordinates {
  top: number;
  left: number;
  height: number;
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
  try {
    const div = document.createElement('div');
    const style = div.style;

    style.position = 'absolute';
    style.top = '0px';
    style.left = '-9999px';
    style.visibility = 'hidden';
    style.pointerEvents = 'none';
    style.whiteSpace = 'pre-wrap';
    style.wordWrap = 'break-word';
    style.width = `${element.clientWidth}px`;
    style.fontFamily = computed.fontFamily;
    style.fontSize = computed.fontSize;
    style.lineHeight = computed.lineHeight;
    style.paddingTop = computed.paddingTop;
    style.paddingRight = computed.paddingRight;
    style.paddingBottom = computed.paddingBottom;
    style.paddingLeft = computed.paddingLeft;
    style.boxSizing = computed.boxSizing;

    div.textContent = textUpToPosition;

    const span = document.createElement('span');
    span.textContent = element.value.substring(position, position + 1) || '.';
    div.appendChild(span);

    document.body.appendChild(div);

    if (typeof span.offsetTop === 'number' && typeof span.offsetLeft === 'number') {
      calculatedTop = rect.top + span.offsetTop - element.scrollTop;
      calculatedLeft = rect.left + span.offsetLeft - element.scrollLeft;
    }

    document.body.removeChild(div);
  } catch (err) {
    // If mirror measurement throws in any environment, fallback is used
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
