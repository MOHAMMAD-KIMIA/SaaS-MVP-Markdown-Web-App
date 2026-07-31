// src/lib/export/buildExportHtml.ts

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function markdownToHtml(markdown: string): Promise<string> {
  const processed = preprocessMarkdown(markdown);

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
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

  return String(file);
}

function buildPageSize(settings: AppSettings): string {
  const pageSize = settings.page.pageSize;
  const orientation = settings.page.orientation;

  return `${pageSize} ${orientation}`;
}

export async function buildExportHtml(
  document: EditorDocument,
  settings: AppSettings
): Promise<string> {
  const contentHtml = await markdownToHtml(document.content);

  const title = escapeHtml(document.title || 'document');

  const margins = settings.page.margins;
  const pageSize = buildPageSize(settings);

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
      margin: ${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px;
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
    }

    .export-document {
      width: 100%;
      max-width: 100%;
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
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .katex-display {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  </style>
</head>

<body>
  <main class="export-document">
    ${contentHtml}
  </main>
</body>
</html>`;
}
