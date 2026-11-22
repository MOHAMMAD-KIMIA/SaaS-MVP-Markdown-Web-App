// src/lib/markdown/tables.ts

export type TableColumnAlign = 'left' | 'center' | 'right' | 'none';

export interface ParsedMarkdownTable {
  rows: string[][];
  alignments: TableColumnAlign[];
  startOffset: number;
  endOffset: number;
}

const SEPARATOR_LINE_REGEX =
  /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*(?:\s*:?-{3,}:?\s*)?\|?\s*$/;

function isSeparatorRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('-')) return false;
  if (!trimmed.includes('|')) {
    return /^:?-{3,}:?$/.test(trimmed);
  }
  return SEPARATOR_LINE_REGEX.test(trimmed);
}

/**
 * Splits a markdown table row on unescaped `|` characters.
 */
export function splitTableRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) {
    trimmed = trimmed.slice(1);
  }
  if (trimmed.endsWith('|') && !trimmed.endsWith('\\|')) {
    trimmed = trimmed.slice(0, -1);
  }

  const cells: string[] = [];
  let current = '';
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === '\\' && i + 1 < trimmed.length && trimmed[i + 1] === '|') {
      current += '\\|';
      i++;
      continue;
    }
    if (ch === '|') {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function parseAlignmentCell(cell: string): TableColumnAlign {
  const t = cell.trim();
  const startsColon = t.startsWith(':');
  const endsColon = t.endsWith(':');
  if (startsColon && endsColon) return 'center';
  if (endsColon) return 'right';
  if (startsColon) return 'left';
  return 'none';
}

function escapeCellText(value: string): string {
  return value
    .replace(/\r?\n+/g, ' ')
    .replace(/(?<!\\)\|/g, '\\|')
    .trim();
}

function formatSeparatorCell(align: TableColumnAlign, width: number): string {
  const safeWidth = Math.max(3, width);
  switch (align) {
    case 'center':
      return `:${'-'.repeat(Math.max(1, safeWidth - 2))}:`;
    case 'right':
      return `${'-'.repeat(Math.max(2, safeWidth - 1))}:`;
    case 'left':
      return `:${'-'.repeat(Math.max(2, safeWidth - 1))}`;
    default:
      return '-'.repeat(safeWidth);
  }
}

/**
 * Serializes rows (header + data rows) and column alignments into a clean, aligned GFM table.
 */
export function formatMarkdownTable(
  rawRows: string[][],
  rawAlignments: TableColumnAlign[] = []
): string {
  if (!rawRows || rawRows.length === 0) return '';

  const colCount = Math.max(
    1,
    rawAlignments.length,
    ...rawRows.map((row) => row.length)
  );

  const normalizedRows = rawRows.map((row) => {
    const padded: string[] = [];
    for (let c = 0; c < colCount; c++) {
      padded.push(escapeCellText(row[c] ?? ''));
    }
    return padded;
  });

  // Ensure at least a header row exists
  if (normalizedRows.length === 0) {
    normalizedRows.push(Array.from({ length: colCount }, (_, i) => `Header ${i + 1}`));
  }

  const alignments: TableColumnAlign[] = Array.from(
    { length: colCount },
    (_, i) => rawAlignments[i] || 'none'
  );

  const colWidths = Array.from({ length: colCount }, (_, colIdx) => {
    const minForAlign = alignments[colIdx] === 'center' ? 5 : 3;
    let maxLen = minForAlign;
    for (const row of normalizedRows) {
      maxLen = Math.max(maxLen, row[colIdx].length);
    }
    return maxLen;
  });

  const formatRowLine = (cells: string[]) => {
    const paddedCells = cells.map((cell, idx) => {
      const width = colWidths[idx];
      const align = alignments[idx];
      const gap = Math.max(0, width - cell.length);
      if (align === 'right') {
        return ' '.repeat(gap) + cell;
      }
      if (align === 'center') {
        const left = Math.floor(gap / 2);
        const right = gap - left;
        return ' '.repeat(left) + cell + ' '.repeat(right);
      }
      return cell + ' '.repeat(gap);
    });
    return `| ${paddedCells.join(' | ')} |`;
  };

  const headerLine = formatRowLine(normalizedRows[0]);
  const separatorLine = `| ${colWidths
    .map((width, idx) => formatSeparatorCell(alignments[idx], width))
    .join(' | ')} |`;
  const bodyLines = normalizedRows.slice(1).map((row) => formatRowLine(row));

  return [headerLine, separatorLine, ...bodyLines].join('\n');
}

interface LineSpan {
  text: string;
  start: number;
  end: number;
}

function getLineSpans(content: string): LineSpan[] {
  const spans: LineSpan[] = [];
  let start = 0;
  for (let i = 0; i <= content.length; i++) {
    if (i === content.length || content[i] === '\n') {
      const rawEnd = i;
      const cleanText =
        rawEnd > start && content[rawEnd - 1] === '\r'
          ? content.slice(start, rawEnd - 1)
          : content.slice(start, rawEnd);
      spans.push({ text: cleanText, start, end: i });
      start = i + 1;
    }
  }
  return spans;
}

function isFencedDelimiter(line: string): string | null {
  const trimmed = line.trimStart();
  if (trimmed.startsWith('```')) return '```';
  if (trimmed.startsWith('~~~')) return '~~~';
  return null;
}

/**
 * Finds all GFM Markdown tables in a document (skipping fenced code blocks).
 */
export function findAllMarkdownTables(content: string): ParsedMarkdownTable[] {
  const spans = getLineSpans(content);
  const tables: ParsedMarkdownTable[] = [];

  let inFence: string | null = null;
  let i = 0;

  while (i < spans.length) {
    const line = spans[i].text;
    const fence = isFencedDelimiter(line);
    if (fence) {
      if (!inFence) inFence = fence;
      else if (inFence === fence) inFence = null;
      i++;
      continue;
    }

    if (inFence) {
      i++;
      continue;
    }

    // Check if line i is header and line i + 1 is separator
    if (
      i + 1 < spans.length &&
      line.includes('|') &&
      isSeparatorRow(spans[i + 1].text)
    ) {
      const headerCells = splitTableRow(line);
      const sepCells = splitTableRow(spans[i + 1].text);

      if (headerCells.length > 0 && sepCells.length >= headerCells.length) {
        const colCount = headerCells.length;
        const alignments = sepCells.slice(0, colCount).map(parseAlignmentCell);
        const rows: string[][] = [headerCells];

        let endLineIdx = i + 1;
        let j = i + 2;
        while (j < spans.length) {
          const bodyLine = spans[j].text;
          if (!bodyLine.trim() || !bodyLine.includes('|') || isFencedDelimiter(bodyLine)) {
            break;
          }
          const bodyCells = splitTableRow(bodyLine);
          const normalized = Array.from(
            { length: colCount },
            (_, c) => bodyCells[c] ?? ''
          );
          rows.push(normalized);
          endLineIdx = j;
          j++;
        }

        tables.push({
          rows,
          alignments,
          startOffset: spans[i].start,
          endOffset: spans[endLineIdx].end,
        });

        i = endLineIdx + 1;
        continue;
      }
    }

    i++;
  }

  return tables;
}

/**
 * Finds and parses the Markdown table containing `cursorPos`, if any.
 */
export function parseMarkdownTableAtCursor(
  content: string,
  cursorPos: number
): ParsedMarkdownTable | null {
  const tables = findAllMarkdownTables(content);
  return (
    tables.find(
      (t) => cursorPos >= t.startOffset && cursorPos <= t.endOffset + 1
    ) || null
  );
}

/**
 * Formats all Markdown tables in the document in-place.
 */
export function formatAllTablesInMarkdown(content: string): {
  formatted: string;
  tableCount: number;
} {
  const tables = findAllMarkdownTables(content);
  if (tables.length === 0) {
    return { formatted: content, tableCount: 0 };
  }

  let output = '';
  let lastIndex = 0;

  for (const table of tables) {
    output += content.slice(lastIndex, table.startOffset);
    output += formatMarkdownTable(table.rows, table.alignments);
    lastIndex = table.endOffset;
  }

  output += content.slice(lastIndex);
  return { formatted: output, tableCount: tables.length };
}

/**
 * Formats the table under the cursor (or all tables if cursor is outside a table).
 */
export function formatTableAtCursor(
  content: string,
  cursorPos: number
): { formatted: string; newCursor: number; tableCount: number } {
  const target = parseMarkdownTableAtCursor(content, cursorPos);
  if (target) {
    const formattedTable = formatMarkdownTable(target.rows, target.alignments);
    const formatted =
      content.slice(0, target.startOffset) +
      formattedTable +
      content.slice(target.endOffset);
    return {
      formatted,
      newCursor: target.startOffset + formattedTable.length,
      tableCount: 1,
    };
  }

  const all = formatAllTablesInMarkdown(content);
  return {
    formatted: all.formatted,
    newCursor: Math.min(cursorPos, all.formatted.length),
    tableCount: all.tableCount,
  };
}

/**
 * Parses pasted TSV (Excel/Sheets) or CSV text into table rows & alignments.
 */
export function parseSpreadsheetPaste(raw: string): {
  rows: string[][];
  alignments: TableColumnAlign[];
} | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return null;

  const isTsv = lines.some((l) => l.includes('\t'));
  const rows = lines.map((line) => {
    if (isTsv) {
      return line.split('\t').map((cell) => cell.trim());
    }
    // Simple quoted CSV parser
    const cells: string[] = [];
    let curr = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          curr += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cells.push(curr.trim());
        curr = '';
      } else {
        curr += ch;
      }
    }
    cells.push(curr.trim());
    return cells;
  });

  const maxCols = Math.max(1, ...rows.map((r) => r.length));
  const normalized = rows.map((r) =>
    Array.from({ length: maxCols }, (_, i) => r[i] ?? '')
  );

  // If only 1 row pasted, add 1 empty data row so it forms a valid Markdown table
  if (normalized.length === 1) {
    normalized.push(Array.from({ length: maxCols }, () => ''));
  }

  return {
    rows: normalized,
    alignments: Array.from({ length: maxCols }, () => 'left'),
  };
}
