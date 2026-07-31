export type TextDirection = 'rtl' | 'ltr';

const RTL_CHAR_REGEX = /[\p{Script=Arabic}\p{Script=Hebrew}]/u;
const LTR_CHAR_REGEX = /[\p{Script=Latin}]/u;

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

export function getCurrentLineDirection(
  text: string,
  caretPosition: number,
  fallback: TextDirection = 'rtl'
): TextDirection {
  const line = getLineAtPosition(text, caretPosition);
  return detectTextDirection(line) ?? fallback;
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
