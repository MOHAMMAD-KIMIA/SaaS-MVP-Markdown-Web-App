export type TextDirection = 'rtl' | 'ltr';

const RTL_CHAR_REGEX = /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}\p{Script=Samaritan}\p{Script=Mandaic}]/u;
const LTR_CHAR_REGEX = /[\p{Script=Latin}\p{Script=Cyrillic}\p{Script=Greek}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Thai}\p{Script=Devanagari}\p{Script=Bengali}]/u;

export function stripMarkdownPrefix(line: string): string {
  let value = line ?? '';

  // trim leading spaces/tabs
  value = value.replace(/^[\t ]+/, '');

  // blockquotes
  value = value.replace(/^(>\s*)+/, '');

  // headings
  value = value.replace(/^#{1,6}\s+/, '');

  // task lists first
  value = value.replace(/^[-*+]\s+\[(?: |x|X)\]\s+/, '');

  // unordered list
  value = value.replace(/^[-*+]\s+/, '');

  // ordered list
  value = value.replace(/^\d+[.)]\s+/, '');

  // neutral punctuation / symbols
  value = value.replace(/^[\s\p{P}\p{S}]+/gu, '');

  return value;
}

export function detectTextDirection(input: string): TextDirection | null {
  // Check explicit Unicode direction marks first
  if (input.includes('\u2067') || input.includes('\u200F')) return 'rtl';
  if (input.includes('\u2066') || input.includes('\u200E')) return 'ltr';

  const value = stripMarkdownPrefix(input);

  if (!value) return null;

  let sawAsciiDigit = false;

  for (const char of Array.from(value)) {
    if (RTL_CHAR_REGEX.test(char)) return 'rtl';
    if (LTR_CHAR_REGEX.test(char)) return 'ltr';
    if (/[0-9]/.test(char)) sawAsciiDigit = true;
  }

  // Optional rule: ASCII digits alone imply LTR
  if (sawAsciiDigit) return 'ltr';

  return null;
}

export function getLineAtPosition(text: string, position: number): string {
  const safePosition = Math.max(0, Math.min(position, text.length));
  const start = text.lastIndexOf('\n', safePosition - 1) + 1;
  const endIndex = text.indexOf('\n', safePosition);
  const end = endIndex === -1 ? text.length : endIndex;
  return text.slice(start, end);
}

export function getBlockDirectionAtPosition(
  text: string,
  position: number
): TextDirection | null {
  const safePos = Math.max(0, Math.min(position, text.length));
  const before = text.slice(0, safePos);
  const lines = before.split('\n');

  let currentBlockDir: TextDirection | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === ':::rtl') {
      currentBlockDir = 'rtl';
    } else if (trimmed === ':::ltr') {
      currentBlockDir = 'ltr';
    } else if (trimmed === ':::' && currentBlockDir !== null) {
      currentBlockDir = null;
    }
  }
  return currentBlockDir;
}

export function getPreviousNonEmptyLineDirection(
  text: string,
  caretPosition: number,
  fallback: TextDirection = 'ltr'
): TextDirection {
  const safePos = Math.max(0, Math.min(caretPosition, text.length));
  const before = text.slice(0, safePos);
  const lines = before.split('\n');

  // Search backwards from the line before current line
  for (let i = lines.length - 2; i >= 0; i--) {
    const line = lines[i];
    const dir = detectTextDirection(line);
    if (dir) return dir;
  }

  return fallback;
}

export function getCurrentLineDirection(
  text: string,
  caretPosition: number,
  fallback: TextDirection = 'ltr',
  autoDetect: boolean = true
): TextDirection {
  // 1. Check container blocks (:::rtl / :::ltr)
  const blockDir = getBlockDirectionAtPosition(text, caretPosition);
  if (blockDir) return blockDir;

  const line = getLineAtPosition(text, caretPosition);

  // 2. If auto-detection is enabled, check current line or maintain previous line's direction on new line events
  if (autoDetect) {
    const lineDir = detectTextDirection(line);
    if (lineDir) return lineDir;

    // For an empty or neutral new line (e.g. after Enter key), maintain active direction from previous paragraph/line
    return getPreviousNonEmptyLineDirection(text, caretPosition, fallback);
  }

  // 3. If auto-detection is disabled, check explicit line Unicode marks or use default fallback setting
  if (line.includes('\u2067') || line.includes('\u200F')) return 'rtl';
  if (line.includes('\u2066') || line.includes('\u200E')) return 'ltr';

  return fallback;
}

export function isCaretInsideCodeOrMath(
  text: string,
  caretPosition: number
): boolean {
  const before = text.slice(0, caretPosition);

  // fenced code blocks
  const codeFenceMatches = before.match(/```/g);
  if (codeFenceMatches && codeFenceMatches.length % 2 === 1) {
return true;
  }

  // block math $$ ... $$
  const blockMathMatches = before.match(/\$\$/g);
  if (blockMathMatches && blockMathMatches.length % 2 === 1) {
return true;
  }

  const currentLine = before.slice(before.lastIndexOf('\n') + 1);

  // inline code
  const backticks = currentLine.match(/`/g);
  if (backticks && backticks.length % 2 === 1) {
return true;
  }

  // inline math
  const dollars = currentLine.match(/(^|[^\\])\$/g);
  if (dollars && dollars.length % 2 === 1) {
return true;
  }

  return false;
}
