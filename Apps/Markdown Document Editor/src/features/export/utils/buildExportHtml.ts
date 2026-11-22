// src/lib/export/buildExportHtml.ts

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

import type {
  AppSettings,
  Document as EditorDocument,
} from '../../../types/common.types';

import { preprocessMarkdown } from '../../../lib/markdown/parser';
import { splitFrontmatter } from '../../../lib/markdown/frontmatter';
import {
  ASSET_URI_PREFIX,
  extractWidthFromImageTitle,
  useAssetStore,
} from '../../../stores/assetStore';
import {
  buildPagedMediaMarginBoxesCss,
  buildScreenHeaderFooterParts,
  resolveExportLayout,
} from './exportLayoutHelpers';
import { buildExportStyleOverridesCss } from './exportThemePresets';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function resolveLocalAssetsInHtml(html: string): string {
  const assets = useAssetStore.getState().assets;
  if (!assets.length) return html;
  const assetMap = new Map(assets.map((a) => [a.id, a.dataUrl]));

  return html.replace(/<img\b([^>]*)>/gi, (fullMatch, attrs: string) => {
    const srcMatch = attrs.match(/\bsrc\s*=\s*"([^"]*)"/i);
    if (!srcMatch) return fullMatch;

    let nextAttrs = attrs;
    const srcVal = srcMatch[1];
    if (srcVal.startsWith(ASSET_URI_PREFIX)) {
      const assetId = srcVal.slice(ASSET_URI_PREFIX.length);
      const dataUrl = assetMap.get(assetId);
      if (dataUrl) {
        nextAttrs = nextAttrs.replace(
          /\bsrc\s*=\s*"[^"]*"/i,
          `src="${dataUrl}"`
        );
      }
    }

    const titleMatch = nextAttrs.match(/\btitle\s*=\s*"([^"]*)"/i);
    const width = titleMatch ? extractWidthFromImageTitle(titleMatch[1]) : undefined;
    if (width) {
      nextAttrs = nextAttrs.replace(/\btitle\s*=\s*"[^"]*"/i, '');
      nextAttrs = `${nextAttrs} style="width:${width}px;max-width:100%;height:auto;"`;
    }

    return `<img${nextAttrs}>`;
  });
}

async function markdownToHtml(markdown: string): Promise<string> {
  const { body } = splitFrontmatter(markdown);
  const processed = preprocessMarkdown(body);

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(remarkMath)
    .use(remarkRehype, {
      allowDangerousHtml: true,
    })
    .use(rehypeRaw as any)
    .use(rehypeKatex as any, {
      throwOnError: false,
      strict: false,
    })
    .use(rehypeStringify as any, {
      allowDangerousHtml: true,
    })
    .process(processed);

  return resolveLocalAssetsInHtml(String(file));
}

export async function buildExportHtml(
  document: EditorDocument,
  settings: AppSettings,
  options?: { applyLayout?: boolean }
): Promise<string> {
  const contentHtml = await markdownToHtml(document.content);

  const rawTitle = document.title || 'document';
  const title = escapeHtml(rawTitle);
  const layout = resolveExportLayout(settings, options);
  const { margins, padding, pageSize } = layout;
  const applyLayout = options?.applyLayout ?? true;
  const themeOverridesCss = buildExportStyleOverridesCss(
    settings.exportStyle?.themePreset,
    settings.exportStyle?.customCss,
    applyLayout
  );

  const { pageMarginTop, pageMarginBottom, marginBoxCss } = buildPagedMediaMarginBoxesCss(
    layout,
    rawTitle
  );
  const { headerSlots, footerSlots, hasHeader, hasFooter } = buildScreenHeaderFooterParts(
    layout,
    rawTitle
  );

  const fontFamily = settings.typography.fontFamily || 'system-ui, sans-serif';
  const fontSize = settings.typography.fontSize || 16;
  const lineHeight = settings.typography.lineHeight || 1.7;

  return `<!DOCTYPE html>
<html lang="en" dir="auto">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>${title}</title>

  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
  />

  <style>
    @page {
      size: ${pageSize};
      margin: ${pageMarginTop}px ${margins.right}px ${pageMarginBottom}px ${margins.left}px;
      ${marginBoxCss}
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #111827;
      font-family: ${fontFamily};
      font-size: ${fontSize}px;
      line-height: ${lineHeight};
    }

    body {
      padding: ${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px;
      box-sizing: border-box;
    }

    .export-page-shell {
      width: 100%;
      max-width: 960px;
      margin: 0 auto;
    }

    .export-screen-header,
    .export-screen-footer {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      color: #6b7280;
      padding: 10px 0;
    }

    .export-screen-header {
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 16px;
    }

    .export-screen-footer {
      border-top: 1px solid #e5e7eb;
      margin-top: 24px;
    }

    .export-slot-left { text-align: left; }
    .export-slot-center { text-align: center; }
    .export-slot-right { text-align: right; }

    .export-document {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      padding: ${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px;
    }

    .export-document h1,
    .export-document h2,
    .export-document h3,
    .export-document h4,
    .export-document h5,
    .export-document h6 {
      line-height: 1.35;
      margin-top: 1.5em;
      margin-bottom: 0.6em;
      font-weight: 700;
    }

    .export-document p,
    .export-document h1,
    .export-document h2,
    .export-document h3,
    .export-document h4,
    .export-document h5,
    .export-document h6,
    .export-document li,
    .export-document blockquote {
      unicode-bidi: plaintext;
      text-align: start;
    }

    .export-document p {
      margin: 0.8em 0;
    }

    .export-document ul,
    .export-document ol {
      margin: 0.8em 0;
      padding-inline-start: 1.5em;
    }

    .export-document blockquote {
      margin: 1em 0;
      padding-inline-start: 1em;
      border-inline-start: 4px solid #d1d5db;
      color: #4b5563;
    }

    .export-document code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.92em;
      background: #f3f4f6;
      padding: 0.15em 0.35em;
      border-radius: 4px;
    }

    .export-document pre {
      background: #f3f4f6;
      padding: 1em;
      overflow-x: auto;
      border-radius: 8px;
    }

    .export-document pre code {
      background: transparent;
      padding: 0;
    }

    .export-document table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }

    .export-document th,
    .export-document td {
      border: 1px solid #d1d5db;
      padding: 0.5em 0.7em;
    }

    .export-document th {
      background: #f3f4f6;
      font-weight: 700;
    }

    .export-document img {
      max-width: 100%;
      height: auto;
    }

    .page-break {
      break-before: page;
      page-break-before: always;
      height: 0;
      margin: 0;
      padding: 0;
      border: 0;
    }

    .markdown-direction-rtl {
      direction: rtl;
      text-align: right;
    }

    .markdown-direction-ltr {
      direction: ltr;
      text-align: left;
    }

    .custom-block {
      margin: 1em 0;
      padding: 1em;
      border-radius: 8px;
      border: 1px solid #d1d5db;
      background: #f9fafb;
    }

    .custom-block-title {
      font-weight: 700;
      margin-bottom: 0.5em;
    }

    .katex-display {
      overflow-x: auto;
      overflow-y: hidden;
      padding: 0.5em 0;
      direction: ltr;
      text-align: center;
    }

    .katex {
      direction: ltr;
      unicode-bidi: isolate;
    }

    @media print {
      body {
        padding: 0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .export-page-shell {
        max-width: 100%;
      }

      .export-screen-header,
      .export-screen-footer {
        display: none !important;
      }

      .katex-display {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }

    ${themeOverridesCss}
  </style>
</head>

<body>
  <div class="export-page-shell">
    ${
      hasHeader
        ? `<header class="export-screen-header">
      <div class="export-slot-left">${escapeHtml(headerSlots.left)}</div>
      <div class="export-slot-center">${escapeHtml(headerSlots.center)}</div>
      <div class="export-slot-right">${escapeHtml(headerSlots.right)}</div>
    </header>`
        : ''
    }
    <main class="export-document">
      ${contentHtml}
    </main>
    ${
      hasFooter
        ? `<footer class="export-screen-footer">
      <div class="export-slot-left">${escapeHtml(footerSlots.left)}</div>
      <div class="export-slot-center">${escapeHtml(footerSlots.center)}</div>
      <div class="export-slot-right">${escapeHtml(footerSlots.right)}</div>
    </footer>`
        : ''
    }
  </div>
</body>
</html>`;
}
