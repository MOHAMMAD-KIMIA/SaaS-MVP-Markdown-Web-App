// src/lib/markdown/outline.ts

export interface OutlineHeading {
  id: string;
  ordinal: number;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  slug: string;
  rawLine: string;
  lineIndex: number;
  startOffset: number;
  sectionEndOffset: number;
  hasChildren: boolean;
  parentId: string | null;
}

function cleanHeadingTitle(raw: string): string {
  return raw
    .replace(/\s+#+\s*$/, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/==(.*?)==/g, '$1')
    .trim();
}

export function slugifyHeading(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'section'
  );
}

function splitLinesWithOffsets(content: string): Array<{ text: string; startOffset: number }> {
  const result: Array<{ text: string; startOffset: number }> = [];
  const lineBreakRe = /\r\n|\n|\r/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = lineBreakRe.exec(content)) !== null) {
    result.push({
      text: content.slice(lastIndex, match.index),
      startOffset: lastIndex,
    });
    lastIndex = match.index + match[0].length;
  }

  result.push({
    text: content.slice(lastIndex),
    startOffset: lastIndex,
  });

  return result;
}

function isSetextCandidateLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^\s{0,3}(#{1,6})(\s|$)/.test(line)) return false;
  if (/^\s{0,3}(>|[-*+]\s|\d+[.)]\s)/.test(line)) return false;
  if (/^\s{0,3}(`{3,}|~{3,})/.test(line)) return false;
  if (/^\s{0,3}(-{3,}|={3,}|\*{3,}|_{3,})\s*$/.test(line)) return false;
  if (/^\s*\|/.test(line)) return false;
  return true;
}

export function parseMarkdownOutline(content: string): OutlineHeading[] {
  if (!content) return [];

  const lines = splitLinesWithOffsets(content);
  const rawEntries: Array<{
    level: 1 | 2 | 3 | 4 | 5 | 6;
    title: string;
    rawLine: string;
    lineIndex: number;
    startOffset: number;
  }> = [];

  let activeFenceChar: string | null = null;
  let activeFenceLen = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].text;
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);

    if (fenceMatch) {
      const fenceStr = fenceMatch[1];
      const trailing = fenceMatch[2].trim();
      if (!activeFenceChar) {
        activeFenceChar = fenceStr[0];
        activeFenceLen = fenceStr.length;
      } else if (
        fenceStr[0] === activeFenceChar &&
        fenceStr.length >= activeFenceLen &&
        trailing === ''
      ) {
        activeFenceChar = null;
        activeFenceLen = 0;
      }
      continue;
    }

    if (activeFenceChar) continue;

    // Skip YAML frontmatter delimiter block at line 0 if present
    if (i === 0 && line.trim() === '---') {
      let j = 1;
      let foundClose = false;
      while (j < lines.length) {
        const candidate = lines[j].text.trim();
        if (candidate === '---' || candidate === '...') {
          foundClose = true;
          break;
        }
        j++;
      }
      if (foundClose) {
        i = j;
        continue;
      }
    }

    const headingMatch = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*$/);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      const cleaned = cleanHeadingTitle(headingMatch[2]);
      rawEntries.push({
        level,
        title: cleaned || `Heading ${level}`,
        rawLine: line,
        lineIndex: i,
        startOffset: lines[i].startOffset,
      });
      continue;
    }

    // Setext heading (Title\n=== or Title\n---)
    if (i > 0) {
      const setextMatch = line.match(/^\s{0,3}(=+|-+)\s*$/);
      if (setextMatch && isSetextCandidateLine(lines[i - 1].text)) {
        const level: 1 | 2 = setextMatch[1][0] === '=' ? 1 : 2;
        const prevLine = lines[i - 1];
        const cleaned = cleanHeadingTitle(prevLine.text);
        if (cleaned) {
          rawEntries.push({
            level,
            title: cleaned,
            rawLine: prevLine.text,
            lineIndex: i - 1,
            startOffset: prevLine.startOffset,
          });
        }
      }
    }
  }

  const stack: Array<{ id: string; level: number }> = [];
  const slugCounts = new Map<string, number>();

  return rawEntries.map((entry, idx) => {
    const id = `h-${entry.lineIndex}-${entry.level}`;
    const baseSlug = slugifyHeading(entry.title);
    const prevCount = slugCounts.get(baseSlug) || 0;
    slugCounts.set(baseSlug, prevCount + 1);
    const slug = prevCount === 0 ? baseSlug : `${baseSlug}-${prevCount}`;

    while (stack.length > 0 && stack[stack.length - 1].level >= entry.level) {
      stack.pop();
    }
    const parentId = stack.length > 0 ? stack[stack.length - 1].id : null;
    stack.push({ id, level: entry.level });

    // Section ends just before the next heading with level <= current level
    let sectionEndOffset = content.length;
    let hasChildren = false;
    for (let j = idx + 1; j < rawEntries.length; j++) {
      if (rawEntries[j].level <= entry.level) {
        sectionEndOffset = rawEntries[j].startOffset;
        break;
      } else {
        hasChildren = true;
      }
    }

    return {
      ...entry,
      id,
      ordinal: idx,
      slug,
      sectionEndOffset,
      hasChildren,
      parentId,
    };
  });
}

export function buildMarkdownToc(headings: OutlineHeading[]): string {
  if (headings.length === 0) return '';
  const minLevel = Math.min(...headings.map((h) => h.level));
  return headings
    .map((h) => {
      const indent = '  '.repeat(Math.max(0, h.level - minLevel));
      return `${indent}- [${h.title}](#${h.slug})`;
    })
    .join('\n');
}

export function findActiveHeadingId(
  headings: OutlineHeading[],
  cursorOffset: number
): string | null {
  if (headings.length === 0) return null;
  let activeId: string | null = null;
  for (const h of headings) {
    if (h.startOffset <= cursorOffset) {
      activeId = h.id;
    } else {
      break;
    }
  }
  return activeId;
}

export function reorderOutlineSection(
  content: string,
  headings: OutlineHeading[],
  sourceId: string,
  targetId: string,
  position: 'before' | 'after'
): string | null {
  if (sourceId === targetId) return null;

  const source = headings.find((h) => h.id === sourceId);
  const target = headings.find((h) => h.id === targetId);
  if (!source || !target) return null;

  // Prevent dropping a parent section inside its own descendant subtree
  if (
    target.startOffset >= source.startOffset &&
    target.startOffset < source.sectionEndOffset
  ) {
    return null;
  }

  const rawSourceBlock = content.slice(source.startOffset, source.sectionEndOffset);
  const normalizedBlock = rawSourceBlock.endsWith('\n')
    ? rawSourceBlock
    : `${rawSourceBlock}\n`;

  const insertionOffset =
    position === 'before' ? target.startOffset : target.sectionEndOffset;

  if (
    insertionOffset >= source.startOffset &&
    insertionOffset <= source.sectionEndOffset
  ) {
    return null;
  }

  let nextContent: string;
  if (insertionOffset < source.startOffset) {
    const beforeTarget = content.slice(0, insertionOffset);
    const between = content.slice(insertionOffset, source.startOffset);
    const afterSource = content.slice(source.sectionEndOffset);

    const prefix =
      beforeTarget.length > 0 && !beforeTarget.endsWith('\n') ? '\n' : '';
    const ensuredBlock =
      between.length > 0 && !normalizedBlock.endsWith('\n\n') && !between.startsWith('\n')
        ? `${normalizedBlock}\n`
        : normalizedBlock;

    nextContent = beforeTarget + prefix + ensuredBlock + between + afterSource;
  } else {
    const beforeSource = content.slice(0, source.startOffset);
    const between = content.slice(source.sectionEndOffset, insertionOffset);
    const afterTarget = content.slice(insertionOffset);

    const betweenWithNewline =
      between.length > 0 && !between.endsWith('\n') ? `${between}\n` : between;
    const prefix =
      beforeSource.length > 0 &&
      !beforeSource.endsWith('\n') &&
      betweenWithNewline.length > 0
        ? '\n'
        : '';
    const blockToInsert =
      afterTarget.length > 0 && !normalizedBlock.endsWith('\n\n') && !afterTarget.startsWith('\n')
        ? `${normalizedBlock}\n`
        : normalizedBlock;

    nextContent = beforeSource + prefix + betweenWithNewline + blockToInsert + afterTarget;
  }

  return nextContent.replace(/\n{4,}/g, '\n\n\n');
}
