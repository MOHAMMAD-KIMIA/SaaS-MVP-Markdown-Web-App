export interface InsertResult {
  newText: string;
  newSelection: { start: number; end: number };
}

export function insertMarkdown(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix: string = '',
  placeholder: string = ''
): InsertResult {
  const before = text.substring(0, selectionStart);
  const selected = text.substring(selectionStart, selectionEnd);
  const after = text.substring(selectionEnd);

  const content = selected || placeholder;
  const newText = before + prefix + content + suffix + after;

  const newStart = selectionStart + prefix.length;
  const newEnd = newStart + content.length;

  return {
    newText,
    newSelection: { start: newStart, end: newEnd },
  };
}

export function toggleBold(
  text: string,
  start: number,
  end: number
): InsertResult {
  return insertMarkdown(text, start, end, '**', '**', 'bold text');
}

export function toggleItalic(
  text: string,
  start: number,
  end: number
): InsertResult {
  return insertMarkdown(text, start, end, '*', '*', 'italic text');
}

export function insertLink(
  text: string,
  start: number,
  end: number
): InsertResult {
  const selected = text.substring(start, end);
  const linkText = selected || 'link text';
  const before = text.substring(0, start);
  const after = text.substring(end);

  const newText = before + `[${linkText}](url)` + after;
  const urlStart = start + linkText.length + 3;
  const urlEnd = urlStart + 3;

  return {
    newText,
    newSelection: { start: urlStart, end: urlEnd },
  };
}

export function insertImage(
  text: string,
  start: number,
  end: number
): InsertResult {
  const selected = text.substring(start, end);
  const altText = selected || 'image';
  const before = text.substring(0, start);
  const after = text.substring(end);

  const newText = before + `![${altText}](url)` + after;
  const urlStart = start + altText.length + 4;
  const urlEnd = urlStart + 3;

  return {
    newText,
    newSelection: { start: urlStart, end: urlEnd },
  };
}

export function insertBlockquote(
  text: string,
  start: number,
  end: number
): InsertResult {
  return insertMarkdown(text, start, end, '> ', '', 'Quote');
}

export function insertInlineCode(
  text: string,
  start: number,
  end: number
): InsertResult {
  return insertMarkdown(text, start, end, '`', '`', 'code');
}

export function insertCodeBlock(
  text: string,
  start: number,
  end: number,
  language: string = ''
): InsertResult {
  const prefix = `\n\`\`\`${language}\n`;
  const suffix = '\n```\n';
  return insertMarkdown(text, start, end, prefix, suffix, 'code');
}

export function insertBulletList(
  text: string,
  start: number,
  end: number
): InsertResult {
  return insertMarkdown(text, start, end, '\n- ', '', 'List item');
}

export function insertNumberedList(
  text: string,
  start: number,
  end: number
): InsertResult {
  return insertMarkdown(text, start, end, '\n1. ', '', 'List item');
}

export function insertTaskList(
  text: string,
  start: number,
  end: number
): InsertResult {
  return insertMarkdown(text, start, end, '\n- [ ] ', '', 'Task item');
}

export function insertTable(
  text: string,
  start: number,
  end: number
): InsertResult {
  const table = `\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n`;
  return insertMarkdown(text, start, end, table, '', '');
}

export function insertHorizontalRule(
  text: string,
  start: number,
  end: number
): InsertResult {
  return insertMarkdown(text, start, end, '\n---\n', '', '');
}

export function insertMermaidBlock(
  text: string,
  start: number,
  end: number
): InsertResult {
  const mermaid = `\n\`\`\`mermaid
graph TD
A[Start] --> B[End]
\`\`\`\n`;

  return insertMarkdown(text, start, end, mermaid, '', '');
}

export function insertCustomBlock(
  text: string,
  start: number,
  end: number,
  title: string = 'note'
): InsertResult {
  const safeTitle = title.trim() || 'note';

  const selectedText = text.slice(start, end);
  const content = selectedText || 'Content';

  const before = text.slice(0, start);
  const after = text.slice(end);

  const needsLeadingNewline = before.length > 0 && !before.endsWith('\n');
  const needsTrailingNewline = after.length > 0 && !after.startsWith('\n');

  const prefix = `${needsLeadingNewline ? '\n' : ''}::: ${safeTitle}\n`;
  const suffix = `\n:::${needsTrailingNewline ? '\n' : ''}`;

  const newText = before + prefix + content + suffix + after;

  const newSelectionStart = before.length + prefix.length;
  const newSelectionEnd = newSelectionStart + content.length;

  return {
newText,
newSelection: {
start: newSelectionStart,
end: newSelectionEnd,
},
  };
}

export function insertWikiLink(
  text: string,
  start: number,
  end: number
): InsertResult {
  return insertMarkdown(text, start, end, '[[', ']]', 'Page Name');
}

const LRI = '\u2066';
const RLI = '\u2067';
const PDI = '\u2069';

function stripExistingInlineDirectionMarks(value: string): string {
  return value.replace(/[\u2066\u2067\u2069]/g, '');
}

function stripExistingDirectionBlock(value: string): string {
  const trimmed = value.trim();

  const blockMatch = trimmed.match(/^:::(rtl|ltr)\s*\n([\s\S]*?)\n:::$/);

  if (!blockMatch) {
return value;
  }

  const inner = blockMatch[2];
  const leadingWhitespace = value.match(/^\s*/)?.[0] ?? '';
  const trailingWhitespace = value.match(/\s*$/)?.[0] ?? '';

  return `${leadingWhitespace}${inner}${trailingWhitespace}`;
}

export const setTextDirection = (
  content: string,
  start: number,
  end: number,
  direction: 'ltr' | 'rtl'
): InsertResult => {
  const hasSelection = start !== end;

  if (!hasSelection) {
const before = content.slice(0, start);
const after = content.slice(end);

const needsLeadingNewline =
before.length > 0 && !before.endsWith('\n') ? '\n' : '';

const needsTrailingNewline =
after.length > 0 && !after.startsWith('\n') ? '\n' : '';

const prefix = `${needsLeadingNewline}:::${direction}\n`;
const placeholder = 'Content';
const suffix = `\n:::${needsTrailingNewline}`;

const newText = before + prefix + placeholder + suffix + after;
const newSelectionStart = before.length + prefix.length;
const newSelectionEnd = newSelectionStart + placeholder.length;

return {
newText,
newSelection: {
start: newSelectionStart,
end: newSelectionEnd,
},
};
  }

  const selectedText = content.slice(start, end);

  // IMPORTANT:
  // Only multiline selections should become block direction.
  // Any single-line selection stays inline.
  if (selectedText.includes('\n')) {
const cleanSelectedText = stripExistingDirectionBlock(selectedText);

const before = content.slice(0, start);
const after = content.slice(end);

const needsLeadingNewline =
before.length > 0 && !before.endsWith('\n') ? '\n' : '';

const needsTrailingNewline =
after.length > 0 && !after.startsWith('\n') ? '\n' : '';

const prefix = `${needsLeadingNewline}:::${direction}\n`;
const suffix = `\n:::${needsTrailingNewline}`;

const newText = before + prefix + cleanSelectedText + suffix + after;
const newSelectionStart = before.length + prefix.length;
const newSelectionEnd = newSelectionStart + cleanSelectedText.length;

return {
newText,
newSelection: {
start: newSelectionStart,
end: newSelectionEnd,
},
};
  }

  // Single-line selection => inline direction marks
  const cleanSelectedText = stripExistingInlineDirectionMarks(selectedText);
  const isolateStart = direction === 'rtl' ? RLI : LRI;
  const replacement = `${isolateStart}${cleanSelectedText}${PDI}`;

  const newText = content.slice(0, start) + replacement + content.slice(end);

  return {
newText,
newSelection: {
start: start + isolateStart.length,
end: start + isolateStart.length + cleanSelectedText.length,
},
  };
};

export function toggleTextDirection(
  text: string,
  start: number,
  end: number
): InsertResult {
  return setTextDirection(text, start, end, 'rtl');
}

export function setRtlDirection(
  text: string,
  start: number,
  end: number
): InsertResult {
  return setTextDirection(text, start, end, 'rtl');
}

export function setLtrDirection(
  text: string,
  start: number,
  end: number
): InsertResult {
  return setTextDirection(text, start, end, 'ltr');
}

export const toggleStrikethrough = (
  content: string,
  start: number,
  end: number
): InsertResult => {
  const selectedText = content.substring(start, end);
  const before = content.substring(Math.max(0, start - 2), start);
  const after = content.substring(end, Math.min(content.length, end + 2));

  if (before === '~~' && after === '~~') {
const newText =
content.substring(0, start - 2) +
selectedText +
content.substring(end + 2);

return {
newText,
newSelection: { start: start - 2, end: end - 2 },
};
  } else {
const value = selectedText || 'strikethrough text';
const wrappedText = `~~${value}~~`;
const newText =
content.substring(0, start) + wrappedText + content.substring(end);

return {
newText,
newSelection: {
start: start + 2,
end: start + 2 + value.length,
},
};
  }
};

export const insertMathBlock = (
  content: string,
  start: number,
  end: number
): InsertResult => {
  const mathBlock = '\n$$\n\\text{Your math here}\n$$\n';
  const newText =
content.substring(0, start) + mathBlock + content.substring(end);

  return {
newText,
newSelection: { start: start + 4, end: start + 4 + 19 },
  };
};

export const insertInlineMath = (
  content: string,
  start: number,
  end: number
): InsertResult => {
  const selectedText = content.substring(start, end);
  const value = selectedText || 'x^2';
  const mathText = `$${value}$`;
  const newText =
content.substring(0, start) + mathText + content.substring(end);

  return {
newText,
newSelection: {
start: start + 1,
end: start + 1 + value.length,
},
  };
};

export function insertHeading(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  level: number
): InsertResult {
  if (level === 0) {
return removeHeading(text, selectionStart, selectionEnd);
  }

  if (level < 1 || level > 6) {
return {
newText: text,
newSelection: { start: selectionStart, end: selectionEnd },
};
  }

  const headingPrefix = '#'.repeat(level) + ' ';

  if (selectionStart === selectionEnd) {
const placeholder = 'Heading';
const before = text.slice(0, selectionStart);
const after = text.slice(selectionEnd);

const newText = before + headingPrefix + placeholder + after;
const newStart = selectionStart + headingPrefix.length;
const newEnd = newStart + placeholder.length;

return {
newText,
newSelection: {
start: newStart,
end: newEnd,
},
};
  }

  const lines = text.split('\n');

  let currentPos = 0;
  let startLine = 0;
  let endLine = 0;

  for (let i = 0; i < lines.length; i++) {
const lineStart = currentPos;
const lineEnd = currentPos + lines[i].length;

if (selectionStart >= lineStart && selectionStart <= lineEnd) {
startLine = i;
}

if (selectionEnd >= lineStart && selectionEnd <= lineEnd + 1) {
endLine = i;
break;
}

currentPos = lineEnd + 1;
  }

  let blockStartOffset = 0;
  for (let i = 0; i < startLine; i++) {
blockStartOffset += lines[i].length + 1;
  }

  const originalSelectedText = text.slice(selectionStart, selectionEnd);

  for (let i = startLine; i <= endLine; i++) {
lines[i] = lines[i].replace(/^(#{1,6})\s+/, '');
lines[i] = headingPrefix + lines[i];
  }

  const newText = lines.join('\n');

  if (startLine === endLine) {
const cleanedSelected = originalSelectedText.replace(/^(#{1,6})\s+/, '');

return {
newText,
newSelection: {
start: blockStartOffset + headingPrefix.length,
end: blockStartOffset + headingPrefix.length + cleanedSelected.length,
},
};
  }

  const newSelectionStart = blockStartOffset + headingPrefix.length;

  let newSelectionEnd = blockStartOffset;
  for (let i = startLine; i <= endLine; i++) {
newSelectionEnd += lines[i].length;
if (i < endLine) newSelectionEnd += 1;
  }

  return {
newText,
newSelection: {
start: newSelectionStart,
end: newSelectionEnd,
},
  };
}

function removeHeading(
  text: string,
  selectionStart: number,
  selectionEnd: number
): InsertResult {
  const lines = text.split('\n');
  let currentPos = 0;
  let startLine = -1;
  let endLine = -1;

  for (let i = 0; i < lines.length; i++) {
const lineLength = lines[i].length + 1;

if (currentPos <= selectionStart && selectionStart < currentPos + lineLength) {
startLine = i;
}
if (currentPos <= selectionEnd && selectionEnd <= currentPos + lineLength) {
endLine = i;
}

currentPos += lineLength;

if (startLine !== -1 && endLine !== -1) break;
  }

  if (startLine === -1) startLine = 0;
  if (endLine === -1) endLine = startLine;

  let totalRemoved = 0;

  for (let i = startLine; i <= endLine; i++) {
const line = lines[i];
const headingMatch = line.match(/^(#{1,6})\s+/);

if (headingMatch) {
const prefixLength = headingMatch[0].length;
lines[i] = line.slice(prefixLength);
totalRemoved += prefixLength;
}
  }

  const newText = lines.join('\n');

  return {
newText,
newSelection: {
start: Math.max(0, selectionStart - totalRemoved),
end: Math.max(0, selectionEnd - totalRemoved),
},
  };
}
