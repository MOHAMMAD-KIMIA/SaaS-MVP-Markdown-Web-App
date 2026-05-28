import katex from 'katex';
import katexCssUrl from 'katex/dist/katex.min.css?url';
import { marked } from 'marked';

import { preprocessMarkdown } from '../../../lib/markdown/parser';
import type {
  AppSettings,
  Document as AppDocument,
} from '../../../types/common.types';
import {
  escapeHtml,
  looksRtl,
  normalizePageBreaks,
} from './exportUtils';

type MathTokenType = 'inline' | 'block';

interface MathToken {
  type: MathTokenType;
  content: string;
  placeholder: string;
}

interface ProtectedToken {
  placeholder: string;
  content: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

function splitMarkdownByPageBreak(markdown: string): string[] {
  return normalizePageBreaks(markdown).split('<!--page-break-->');
}

/**
 * Protect fenced code blocks and inline code so math extraction does not
 * accidentally render dollar signs inside code.
 */
function protectCode(markdown: string): {
  text: string;
  tokens: ProtectedToken[];
} {
  const tokens: ProtectedToken[] = [];
  let text = markdown;

  text = text.replace(/```[\s\S]*?```/g, (match) => {
    const placeholder = `@@EXPORT_CODE_BLOCK_${tokens.length}@@`;
    tokens.push({
      placeholder,
      content: match,
    });
    return placeholder;
  });

  text = text.replace(/`[^`\n]*`/g, (match) => {
    const placeholder = `@@EXPORT_INLINE_CODE_${tokens.length}@@`;
    tokens.push({
      placeholder,
      content: match,
    });
    return placeholder;
  });

  return { text, tokens };
}

function restoreProtectedCode(text: string, tokens: ProtectedToken[]): string {
  let result = text;

  for (const token of tokens) {
    result = result.replace(
      new RegExp(escapeRegExp(token.placeholder), 'g'),
      token.content
    );
  }

  return result;
}

/**
 * Extract LaTeX math before markdown rendering.
 *
 * Supports:
 * - Block math: $$ ... $$
 * - Inline math: $...$
 */
function extractMath(markdown: string): {
  text: string;
  tokens: MathToken[];
} {
  const tokens: MathToken[] = [];
  let index = 0;
  let text = markdown;

  /**
   * Block math.
   *
   * Example:
   * $$
   * \frac{a}{b}
   * $$
   */
  text = text.replace(/(^|[^\\])\$\$([\s\S]+?)\$\$/g, (match, prefix, content) => {
    const placeholder = `@@EXPORT_MATH_BLOCK_${index}@@`;

    tokens.push({
      type: 'block',
      content: String(content).trim(),
      placeholder,
    });

    index += 1;

    return `${prefix}\n\n${placeholder}\n\n`;
  });

  /**
   * Inline math.
   *
   * Example:
   * This is $E = mc^2$.
   *
   * This avoids:
   * - escaped dollars: \$
   * - double dollars: $$
   */
  text = text.replace(/(^|[^\\$])\$([^\n$]+?)\$(?!\$)/g, (match, prefix, content) => {
    const placeholder = `@@EXPORT_MATH_INLINE_${index}@@`;

    tokens.push({
      type: 'inline',
      content: String(content).trim(),
      placeholder,
    });

    index += 1;

    return `${prefix}${placeholder}`;
  });

  return { text, tokens };
}

function renderMathExpression(content: string, displayMode: boolean): string {
  try {
    return katex.renderToString(content, {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
      trust: true,
      output: 'html',
    });
  } catch {
    return displayMode
      ? `<div class="math-fallback math-block">${escapeHtml(content)}</div>`
      : `<span class="math-fallback math-inline">${escapeHtml(content)}</span>`;
  }
}

function restoreMath(html: string, tokens: MathToken[]): string {
  let result = html;

  for (const token of tokens) {
    const placeholderPattern = escapeRegExp(token.placeholder);

    const rendered = renderMathExpression(
      token.content,
      token.type === 'block'
    );

    /**
     * If marked wraps a block math placeholder in <p>, unwrap it first.
     */
    if (token.type === 'block') {
      result = result.replace(
        new RegExp(`<p>\\s*${placeholderPattern}\\s*</p>`, 'g'),
        token.placeholder
      );
    }

    result = result.replace(
      new RegExp(placeholderPattern, 'g'),
      rendered
    );
  }

  return result;
}

async function renderMarkdownWithMath(markdown: string): Promise<string> {
  const preprocessed = preprocessMarkdown(markdown);

  const protectedCode = protectCode(preprocessed);
  const extractedMath = extractMath(protectedCode.text);

  const markdownReadyForMarked = restoreProtectedCode(
    extractedMath.text,
    protectedCode.tokens
  );

  const html = await marked.parse(markdownReadyForMarked, {
    gfm: true,
    breaks: false,
  });

  return restoreMath(String(html), extractedMath.tokens);
}

async function getKatexCssText(): Promise<string> {
  try {
    const response = await fetch(katexCssUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch KaTeX CSS: ${response.status}`);
    }

    let css = await response.text();

    /**
     * Important:
     * KaTeX CSS references fonts using relative URLs.
     * In iframe/srcdoc/print flows, those relative URLs can break.
     * This rewrites them to absolute URLs.
     */
    const cssBaseUrl = katexCssUrl.substring(
      0,
      katexCssUrl.lastIndexOf('/') + 1
    );

    css = css.replace(
      /url\((?!['"]?(?:data:|https?:|\/))['"]?([^'")]+)['"]?\)/g,
      (_match, assetPath: string) => {
        return `url("${new URL(assetPath, cssBaseUrl).href}")`;
      }
    );

    return css;
  } catch {
    /**
     * Fallback.
     * If local CSS loading fails, use CDN CSS.
     * This is less ideal for offline usage but keeps export functional.
     */
    return `
      @import url("https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css");
    `;
  }
}

export async function buildExportHtml(
  document: AppDocument,
  settings: AppSettings
): Promise<string> {
  const normalizedMarkdown = normalizePageBreaks(document.content);
  const segments = splitMarkdownByPageBreak(normalizedMarkdown);

  const renderedSegments = await Promise.all(
    segments.map((segment) => renderMarkdownWithMath(segment))
  );

  const contentHtml = renderedSegments
    .map((segmentHtml, index) => {
      const pageBreak =
        index < renderedSegments.length - 1
          ? '<div class="page-break" aria-hidden="true"></div>'
          : '';

      return `${segmentHtml}${pageBreak}`;
    })
    .join('\n');

  const docDir = looksRtl(document.content) ? 'rtl' : 'ltr';
  const textAlign = docDir === 'rtl' ? 'right' : 'left';
  const blockquoteBorderSide =
    docDir === 'rtl' ? 'border-right' : 'border-left';
  const blockquotePaddingSide =
    docDir === 'rtl' ? 'padding-right' : 'padding-left';

  const katexCss = await getKatexCssText();

  const headerHtml = settings.headerFooter.headerEnabled
    ? `<header>${escapeHtml(settings.headerFooter.headerText)}</header>`
    : '';

  const footerHtml = settings.headerFooter.footerEnabled
    ? `<footer>${escapeHtml(settings.headerFooter.footerText)}</footer>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" dir="${docDir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(document.title)}</title>

  <style>
    ${katexCss}

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #1a202c;
    }

    html {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: "${escapeAttribute(settings.typography.fontFamily)}", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: ${settings.typography.fontSize}px;
      line-height: ${settings.typography.lineHeight};
      direction: ${docDir};
      text-align: ${textAlign};
      unicode-bidi: plaintext;
      word-break: break-word;
      overflow-wrap: anywhere;
      padding:
        ${settings.page.margins.top}px
        ${settings.page.margins.right}px
        ${settings.page.margins.bottom}px
        ${settings.page.margins.left}px;
      max-width: 900px;
      margin: 0 auto;
    }

    main {
      width: 100%;
    }

    header {
      text-align: ${settings.headerFooter.headerAlignment};
      padding-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 2rem;
      color: #475569;
    }

    footer {
      text-align: ${settings.headerFooter.footerAlignment};
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      margin-top: 2rem;
      color: #718096;
      font-size: 0.875rem;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
      line-height: 1.25;
      color: #0f172a;
      page-break-after: avoid;
      break-after: avoid-page;
    }

    h1 {
      font-size: 2em;
    }

    h2 {
      font-size: 1.5em;
    }

    h3 {
      font-size: 1.25em;
    }

    h4 {
      font-size: 1.1em;
    }

    h5,
    h6 {
      font-size: 1em;
    }

    p {
      margin: 0 0 1em;
      orphans: 3;
      widows: 3;
    }

    strong {
      font-weight: 700;
    }

    em {
      font-style: italic;
    }

    a {
      color: #2563eb;
      text-decoration: none;
      overflow-wrap: anywhere;
    }

    a:hover {
      text-decoration: underline;
    }

    code {
      background: #f1f5f9;
      color: #0f172a;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: "Courier New", Courier, monospace;
      font-size: 0.9em;
      direction: ltr;
      unicode-bidi: embed;
    }

    pre {
      background: #1e293b;
      color: #f1f5f9;
      padding: 1em;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1em 0;
      white-space: pre-wrap;
      page-break-inside: avoid;
      break-inside: avoid;
      direction: ltr;
      text-align: left;
    }

    pre code {
      background: transparent;
      padding: 0;
      color: inherit;
      border-radius: 0;
      font-size: inherit;
    }

    blockquote {
      ${blockquoteBorderSide}: 4px solid #e2e8f0;
      ${blockquotePaddingSide}: 1em;
      color: #64748b;
      margin: 1em 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    blockquote > :first-child {
      margin-top: 0;
    }

    blockquote > :last-child {
      margin-bottom: 0;
    }

    ul,
    ol {
      margin: 1em 0;
      padding-inline-start: 2em;
    }

    li {
      margin: 0.5em 0;
    }

    li > p {
      margin: 0.5em 0;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    thead {
      display: table-header-group;
    }

    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    th,
    td {
      border: 1px solid #e2e8f0;
      padding: 0.75em;
      text-align: start;
      vertical-align: top;
    }

    th {
      background: #f8fafc;
      font-weight: 600;
      color: #0f172a;
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1em 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    hr {
      border: none;
      border-top: 2px solid #e2e8f0;
      margin: 2em 0;
    }

    .custom-block {
      padding: 1em;
      border-radius: 8px;
      margin: 1em 0;
      border-left: 4px solid;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    [dir="rtl"] .custom-block {
      border-left: none;
      border-right: 4px solid;
    }

    .custom-block-note {
      background: #eff6ff;
      border-color: #3b82f6;
    }

    .custom-block-tip {
      background: #f0fdf4;
      border-color: #22c55e;
    }

    .custom-block-warning {
      background: #fef3c7;
      border-color: #f59e0b;
    }

    .custom-block-title {
      font-weight: 600;
      margin-bottom: 0.5em;
      text-transform: uppercase;
      font-size: 0.875em;
    }

    .page-break {
      display: block;
      width: 100%;
      height: 0;
      margin: 0;
      padding: 0;
      break-before: page;
      page-break-before: always;
    }

    .katex {
      font-size: 1.05em;
      direction: ltr;
      unicode-bidi: isolate;
    }

    .katex-display {
      overflow-x: auto;
      overflow-y: hidden;
      padding: 0.25em 0;
      margin: 1em 0;
      direction: ltr;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .math-fallback {
      direction: ltr;
      unicode-bidi: isolate;
      font-family: "Courier New", Courier, monospace;
      color: #b91c1c;
      background: #fef2f2;
      border-radius: 4px;
    }

    .math-inline {
      padding: 0.1em 0.25em;
    }

    .math-block {
      display: block;
      padding: 0.75em;
      margin: 1em 0;
      overflow-x: auto;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    @media screen {
      .page-break {
        margin: 2rem 0;
        border-top: 2px dashed #cbd5e1;
        height: 0;
      }
    }

    @media print {
      @page {
        margin: 0;
      }

      html,
      body {
        background: #ffffff;
      }

      body {
        max-width: 100%;
      }

      .page-break {
        display: block;
        break-before: page;
        page-break-before: always;
        border: 0;
        margin: 0;
        padding: 0;
        height: 0;
      }

      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        page-break-after: avoid;
        break-after: avoid-page;
      }

      pre,
      table,
      blockquote,
      img,
      .custom-block,
      .katex-display,
      .math-block {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      a {
        color: inherit;
      }
    }
  </style>
</head>

<body>
  ${headerHtml}

  <main>
    ${contentHtml}
  </main>

  ${footerHtml}
</body>
</html>`;
}
