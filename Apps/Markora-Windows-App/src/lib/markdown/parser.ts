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

/**
 * Runs all markdown preprocessing before rendering/exporting.
 */
export function preprocessMarkdown(content: string): string {
  let processed = content;

  processed = parseWikiLinks(processed);
  processed = parseCustomBlocks(processed);
  processed = parsePageBreaks(processed);

  return processed;
}
