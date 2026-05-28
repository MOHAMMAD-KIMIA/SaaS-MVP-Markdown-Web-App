import { Document } from '../../../types/common.types';
import { AppSettings } from '../../../types/common.types';
import { preprocessMarkdown } from '../../../lib/markdown/parser';

export async function exportToHtml(document: Document, settings: AppSettings): Promise<void> {
  const { marked } = await import('marked');

  const processedContent = preprocessMarkdown(document.content);
  const htmlContent = await marked(processedContent, { gfm: true });

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${document.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: ${settings.typography.fontFamily};
      font-size: ${settings.typography.fontSize}px;
      line-height: ${settings.typography.lineHeight};
      color: #1a202c;
      background: #ffffff;
      padding: ${settings.page.margins.top}px ${settings.page.margins.right}px ${settings.page.margins.bottom}px ${settings.page.margins.left}px;
      max-width: 900px;
      margin: 0 auto;
    }

    ${settings.headerFooter.headerEnabled ? `
    header {
      text-align: ${settings.headerFooter.headerAlignment};
      padding-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 2rem;
    }
    ` : ''}

    ${settings.headerFooter.footerEnabled ? `
    footer {
      text-align: ${settings.headerFooter.footerAlignment};
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      margin-top: 2rem;
      color: #718096;
      font-size: 0.875rem;
    }
    ` : ''}

    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
      line-height: 1.25;
    }

    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }

    p {
      margin-bottom: 1em;
    }

    a {
      color: #3b82f6;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    code {
      background: #f1f5f9;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }

    pre {
      background: #1e293b;
      color: #f1f5f9;
      padding: 1em;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1em 0;
    }

    pre code {
      background: transparent;
      padding: 0;
      color: inherit;
    }

    blockquote {
      border-left: 4px solid #e2e8f0;
      padding-left: 1em;
      color: #64748b;
      margin: 1em 0;
    }

    ul, ol {
      margin: 1em 0;
      padding-left: 2em;
    }

    li {
      margin: 0.5em 0;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }

    th, td {
      border: 1px solid #e2e8f0;
      padding: 0.75em;
      text-align: left;
    }

    th {
      background: #f8fafc;
      font-weight: 600;
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1em 0;
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

    @media print {
      body {
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  ${settings.headerFooter.headerEnabled ? `<header>${settings.headerFooter.headerText}</header>` : ''}

  <main>
    ${htmlContent}
  </main>

  ${settings.headerFooter.footerEnabled ? `<footer>${settings.headerFooter.footerText}</footer>` : ''}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
