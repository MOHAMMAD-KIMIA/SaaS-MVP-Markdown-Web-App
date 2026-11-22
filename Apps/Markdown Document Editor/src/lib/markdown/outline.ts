// src/lib/markdown/outline.ts

export interface OutlineHeading {
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
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
    .replace(/`([^`]+)`/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .trim();
}

export function parseMarkdownOutline(content: string): OutlineHeading[] {
  if (!content) return [];

  const lines = content.split('\n');
  const rawEntries: Array<{
    level: 1 | 2 | 3 | 4 | 5 | 6;
    title: string;
    rawLine: string;
    lineIndex: number;
    startOffset: number;
  }> = [];

  let offset = 0;
  let activeFenceChar: string | null = null;
  let activeFenceLen = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})(.*)$/);

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
      offset += line.length + 1;
      continue;
    }

    if (!activeFenceChar) {
      // Skip YAML frontmatter delimiter block at line 0 if present
      if (i === 0 && line.trim() === '---') {
        let j = 1;
        let foundClose = false;
        let fmOffset = line.length + 1;
        while (j < lines.length) {
          if (lines[j].trim() === '---' || lines[j].trim() === '...') {
            foundClose = true;
            fmOffset += lines[j].length + 1;
            break;
          }
          fmOffset += lines[j].length + 1;
          j++;
        }
        if (foundClose) {
          i = j;
          offset = fmOffset;
          continue;
        }
      }

      const headingMatch = line.match(/^(#{1,6})\s+(.+?)\s*$/);
      if (headingMatch) {
        const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
        const cleaned = cleanHeadingTitle(headingMatch[2]);
        rawEntries.push({
          level,
          title: cleaned || `Heading ${level}`,
          rawLine: line,
          lineIndex: i,
          startOffset: offset,
        });
      }
    }

    offset += line.length + 1;
  }

  const stack: Array<{ id: string; level: number }> = [];

  return rawEntries.map((entry, idx) => {
    const id = `h-${entry.lineIndex}-${entry.level}`;

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
      sectionEndOffset,
      hasChildren,
      parentId,
    };
  });
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
