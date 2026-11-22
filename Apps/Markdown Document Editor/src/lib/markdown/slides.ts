// src/lib/markdown/slides.ts

export interface SlideItem {
  index: number;
  title: string;
  bodyMarkdown: string;
  notes: string;
  rawMarkdown: string;
}

function stripLeadingFrontmatter(content: string): string {
  const lines = content.split('\n');
  if (lines.length === 0 || lines[0].trim() !== '---') return content;

  for (let i = 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === '---' || trimmed === '...') {
      return lines.slice(i + 1).join('\n').replace(/^\n+/, '');
    }
  }
  return content;
}

function extractSpeakerNotes(rawSlide: string): { body: string; notes: string } {
  const notesParts: string[] = [];
  let body = rawSlide;

  // 1. Extract HTML comment speaker notes: <!-- notes: ... --> or <!-- note: ... -->
  body = body.replace(
    /<!--\s*(?:notes?|speaker(?:\s+notes?)?)\s*:([\s\S]*?)-->/gi,
    (_match, noteText: string) => {
      const cleaned = noteText.trim();
      if (cleaned) notesParts.push(cleaned);
      return '';
    }
  );

  // 2. Extract Remark/Marp style `???` speaker notes block (outside code fences)
  const lines = body.split('\n');
  let activeFenceChar: string | null = null;
  let activeFenceLen = 0;
  let noteSeparatorIndex = -1;

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
      continue;
    }

    if (!activeFenceChar && line.trim() === '???') {
      noteSeparatorIndex = i;
      break;
    }
  }

  if (noteSeparatorIndex !== -1) {
    const slideBodyLines = lines.slice(0, noteSeparatorIndex);
    const noteLines = lines.slice(noteSeparatorIndex + 1).join('\n').trim();
    if (noteLines) {
      notesParts.push(noteLines);
    }
    body = slideBodyLines.join('\n');
  }

  return {
    body: body.trim(),
    notes: notesParts.join('\n\n').trim(),
  };
}

function extractSlideTitle(bodyMarkdown: string, fallbackIndex: number): string {
  const lines = bodyMarkdown.split('\n');
  for (const line of lines) {
    const match = line.match(/^#{1,6}\s+(.+?)\s*$/);
    if (match) {
      return match[1].replace(/\s+#+\s*$/, '').trim();
    }
  }
  const firstTextLine = lines.find((l) => l.trim().length > 0);
  if (firstTextLine) {
    const cleaned = firstTextLine.replace(/^[-*+>\s]+/, '').trim();
    return cleaned.length > 48 ? `${cleaned.slice(0, 48)}…` : cleaned;
  }
  return `Slide ${fallbackIndex + 1}`;
}

export function parseMarkdownSlides(content: string): SlideItem[] {
  const withoutFrontmatter = stripLeadingFrontmatter(content || '');
  const lines = withoutFrontmatter.split('\n');

  const rawSlides: string[] = [];
  let currentLines: string[] = [];
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
      currentLines.push(line);
      continue;
    }

    // Standalone horizontal rule (`---`) separates slides
    if (!activeFenceChar && /^ {0,3}-{3,}\s*$/.test(line)) {
      rawSlides.push(currentLines.join('\n'));
      currentLines = [];
      continue;
    }

    currentLines.push(line);
  }

  rawSlides.push(currentLines.join('\n'));

  const nonEmptySlides = rawSlides.filter((s) => s.trim().length > 0);
  const slidesSource = nonEmptySlides.length > 0 ? nonEmptySlides : [''];

  return slidesSource.map((raw, idx) => {
    const { body, notes } = extractSpeakerNotes(raw);
    return {
      index: idx,
      title: extractSlideTitle(body, idx),
      bodyMarkdown: body || '_Empty Slide_',
      notes,
      rawMarkdown: raw,
    };
  });
}
