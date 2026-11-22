// src/lib/markdown/parser.ts

import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

export const remarkPlugins = [remarkGfm, remarkMath];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function slugifyBlockType(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Converts custom block syntax into HTML.
 *
 * Supported examples:
 *
 * ::: important
 * Content here
 * :::
 *
 * :::rtl
 * متن فارسی
 * :::
 *
 * :::ltr
 * English text
 * :::
 */
export function parseCustomBlocks(content: string): string {
  const blockPattern = /^:::\s*([^\n]+?)\s*\n([\s\S]*?)\n:::\s*$/gm;

  return content.replace(blockPattern, (_, rawTitle, blockContent) => {
    const title = String(rawTitle).trim();
    const normalizedType = slugifyBlockType(title) || 'custom';
    const contentValue = String(blockContent).trim();

    if (normalizedType === 'rtl' || normalizedType === 'ltr') {
      return `<div dir="${normalizedType}" class="markdown-direction markdown-direction-${normalizedType}">
${contentValue}
</div>`;
    }

    const safeTitle = escapeHtml(title);

    return `<div class="custom-block custom-block-${normalizedType}">
  <div class="custom-block-title">${safeTitle}</div>
  <div class="custom-block-content">${contentValue}</div>
</div>`;
  });
}

/**
 * Converts wiki links into markdown links.
 *
 * [[Page Name]]
 *
 * becomes:
 *
 * [Page Name](#wiki/page-name)
 */
export function parseWikiLinks(content: string): string {
  const wikiLinkPattern = /\[\[([^\]]+)\]\]/g;

  return content.replace(wikiLinkPattern, (_, pageName) => {
    const label = String(pageName).trim();

    const slug = label
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}-]+/gu, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `[${label}](#wiki/${slug})`;
  });
}

/**
 * Converts supported page-break markers into HTML.
 *
 * Supported:
 *
 * <!--page-break-->
 * <!-- page-break -->
 * <--page-break-->
 */
function parsePageBreaks(content: string): string {
  return content.replace(
    /^\s*(?:<!--\s*page-break\s*-->|<--page-break-->)\s*$/gim,
    '\n<div class="page-break" aria-hidden="true"></div>\n'
  );
}

const HIGHLIGHT_COLOR_NAMES = '(?:yellow|amber|green|blue|pink|purple|rose|red|orange|cyan|y|g|b|p|r)';
const HIGHLIGHT_REGEX = new RegExp(`==(?:(${HIGHLIGHT_COLOR_NAMES}):\\s*)?([^=\\r\\n]+?)==`, 'gi');

const HIGHLIGHT_COLOR_NORM: Record<string, string> = {
  yellow: 'yellow',
  amber: 'yellow',
  y: 'yellow',
  green: 'green',
  g: 'green',
  blue: 'blue',
  cyan: 'blue',
  b: 'blue',
  pink: 'pink',
  rose: 'pink',
  p: 'pink',
  purple: 'purple',
  red: 'pink',
  r: 'pink',
  orange: 'yellow',
};

/**
 * Converts markdown highlight syntax into HTML <mark> tags with corresponding custom CSS classes:
 * - .highlight-yellow, .markdown-highlight-yellow
 * - .highlight-green, .markdown-highlight-green
 * - .highlight-blue, .markdown-highlight-blue
 * - .highlight-pink, .markdown-highlight-pink
 *
 * Supported syntaxes:
 * - ==text== (defaults to yellow)
 * - ==green:text==, ==blue:text==, ==pink:text==, ==yellow:text==
 * - ==text=={green}, ==text=={.highlight-green}, etc.
 */
export function parseHighlight(content: string): string {
  // 1. Check for attribute syntax: ==text=={green} or ==text=={.highlight-green}
  let result = content.replace(/==([^=\r\n]+?)==\{(?:\.|\.highlight-)?([a-z]+)\}/gi, (_, text, rawColor) => {
    const norm = rawColor.toLowerCase();
    const color = HIGHLIGHT_COLOR_NORM[norm] || 'yellow';
    return `<mark class="markdown-highlight markdown-highlight-${color} highlight-${color}" data-color="${color}">${text}</mark>`;
  });

  // 2. Check for ==color:text== or standard ==text==
  result = result.replace(HIGHLIGHT_REGEX, (_, rawColor, text) => {
    const norm = rawColor ? rawColor.toLowerCase() : 'yellow';
    const color = HIGHLIGHT_COLOR_NORM[norm] || 'yellow';
    return `<mark class="markdown-highlight markdown-highlight-${color} highlight-${color}" data-color="${color}">${text}</mark>`;
  });

  return result;
}

/**
 * Splits text into code blocks/spans and normal text,
 * applies a transform function only to normal text,
 * and stitches them back together.
 */
export function transformNonCodeContent(
  content: string,
  transform: (text: string) => string
): string {
  // Matches fenced code blocks (```...``` or ~~~...~~~) and inline code (`...`)
  const codeRegex = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\r\n]+`)/g;
  const parts = content.split(codeRegex);

  return parts
    .map((part) => {
      if (
        part.startsWith('```') ||
        part.startsWith('~~~') ||
        part.startsWith('`')
      ) {
        return part;
      }
      return transform(part);
    })
    .join('');
}

/**
 * Converts slide speaker-note sections (`???` on its own line up to the next `---` slide
 * divider or end of document) into styled HTML containers for regular Markdown preview.
 * Respects YAML frontmatter and fenced code blocks.
 */
export function parseSpeakerNotesPreview(content: string): string {
  const lines = content.split('\n');
  const output: string[] = [];

  let i = 0;

  // Skip leading YAML frontmatter if present
  if (lines.length > 0 && lines[0].trim() === '---') {
    for (let fmIdx = 1; fmIdx < lines.length; fmIdx++) {
      const trimmed = lines[fmIdx].trim();
      if (trimmed === '---' || trimmed === '...') {
        for (let k = 0; k <= fmIdx; k++) {
          output.push(lines[k]);
        }
        i = fmIdx + 1;
        break;
      }
    }
  }

  let activeFenceChar: string | null = null;
  let activeFenceLen = 0;

  const updateFenceState = (line: string) => {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (!fenceMatch) return false;
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
    return true;
  };

  while (i < lines.length) {
    const line = lines[i];
    updateFenceState(line);

    if (!activeFenceChar && line.trim() === '???') {
      const noteLines: string[] = [];
      i += 1;

      while (i < lines.length) {
        const innerLine = lines[i];
        const fenceToggled = updateFenceState(innerLine);
        if (!fenceToggled && !activeFenceChar && /^ {0,3}-{3,}\s*$/.test(innerLine)) {
          break;
        }
        noteLines.push(innerLine);
        i += 1;
      }

      const notesBody = noteLines.join('\n').trim();
      output.push('');
      output.push('<div class="slide-speaker-notes" data-speaker-notes="true">');
      output.push('<div class="slide-speaker-notes-header">Speaker Notes</div>');
      if (notesBody) {
        output.push('');
        output.push(notesBody);
        output.push('');
      }
      output.push('</div>');
      output.push('');
      continue;
    }

    output.push(line);
    i += 1;
  }

  return output.join('\n');
}

/**
 * Runs all markdown preprocessing before rendering/exporting.
 * Strictly protects code blocks, inline code, and diagrams from being altered.
 */
export function preprocessMarkdown(content: string): string {
  const withSpeakerNotes = parseSpeakerNotesPreview(content);
  return transformNonCodeContent(withSpeakerNotes, (text) => {
    let processed = text;
    processed = parseWikiLinks(processed);
    processed = parseHighlight(processed);
    processed = parseCustomBlocks(processed);
    processed = parsePageBreaks(processed);
    return processed;
  });
}
