// src/lib/markdown/parser.ts

import remarkGfm from 'remark-gfm';

export const remarkPlugins = [remarkGfm];

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

export function parseCustomBlocks(content: string): string {
  // Accept any custom block title:
  //
  // ::: important
  // Content
  // :::
  //
  // But handle special direction blocks separately:
  //
  // :::rtl
  // متن فارسی
  // :::
  //
  // :::ltr
  // English text
  // :::

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

export function parseWikiLinks(content: string): string {
  // Replace wiki links [[Page Name]] with markdown links
  const wikiLinkPattern = /\[\[([^\]]+)\]\]/g;

  return content.replace(wikiLinkPattern, (_, pageName) => {
    const slug = String(pageName)
      .toLowerCase()
      .replace(/\s+/g, '-');

    return `[${pageName}](#wiki/${slug})`;
  });
}

export function preprocessMarkdown(content: string): string {
  let processed = content;

  processed = parseWikiLinks(processed);
  processed = parseCustomBlocks(processed);

  return processed;
}
