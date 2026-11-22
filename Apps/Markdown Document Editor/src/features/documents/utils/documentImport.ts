// src/features/documents/utils/documentImport.ts
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import mammoth from 'mammoth';

export type ImportFileFormat = 'md' | 'txt' | 'html' | 'docx';

export interface ImportedDocumentItem {
  id: string;
  fileName: string;
  title: string;
  content: string;
  format: ImportFileFormat;
  warnings: string[];
  wordCount: number;
}

function createTurndownService(): TurndownService {
  const service = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
  });

  service.use(gfm);

  // Clean up redundant empty anchors or non-content tags
  service.remove(['script', 'style', 'noscript']);

  return service;
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.(md|markdown|txt|html|htm|docx)$/i, '').trim() || 'Imported Document';
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function detectImportFormat(fileName: string): ImportFileFormat | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'md';
  if (lower.endsWith('.txt')) return 'txt';
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html';
  if (lower.endsWith('.docx')) return 'docx';
  return null;
}

function htmlToMarkdown(htmlString: string): { titleFromHtml?: string; markdown: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // Remove noise elements
  doc.querySelectorAll('script, style, noscript, iframe, object').forEach((el) => el.remove());

  const titleText = doc.querySelector('title')?.textContent?.trim();
  const bodyHtml = doc.body?.innerHTML || htmlString;

  const turndown = createTurndownService();
  const markdown = turndown
    .turndown(bodyHtml)
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    titleFromHtml: titleText || undefined,
    markdown: markdown ? `${markdown}\n` : '',
  };
}

export async function parseImportedFile(file: File): Promise<ImportedDocumentItem> {
  const format = detectImportFormat(file.name);
  if (!format) {
    throw new Error(
      `Unsupported file format "${file.name}". Supported formats: .md, .txt, .html, .docx`
    );
  }

  const baseTitle = stripExtension(file.name);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (format === 'md') {
    const raw = await file.text();
    const normalized = raw.replace(/\r\n/g, '\n');
    return {
      id,
      fileName: file.name,
      title: baseTitle,
      content: normalized,
      format,
      warnings: [],
      wordCount: countWords(normalized),
    };
  }

  if (format === 'txt') {
    const raw = await file.text();
    const normalized = raw.replace(/\r\n/g, '\n');
    return {
      id,
      fileName: file.name,
      title: baseTitle,
      content: normalized,
      format,
      warnings: [],
      wordCount: countWords(normalized),
    };
  }

  if (format === 'html') {
    const raw = await file.text();
    const { titleFromHtml, markdown } = htmlToMarkdown(raw);
    const title =
      titleFromHtml && titleFromHtml.toLowerCase() !== 'document'
        ? titleFromHtml
        : baseTitle;

    return {
      id,
      fileName: file.name,
      title,
      content: markdown,
      format,
      warnings: markdown ? [] : ['No readable HTML body content was detected.'],
      wordCount: countWords(markdown),
    };
  }

  // .docx via mammoth -> HTML -> GFM Markdown
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const { markdown } = htmlToMarkdown(result.value || '');
  const warnings = result.messages
    .filter((m) => m.message && !m.message.includes('Unrecognised'))
    .slice(0, 5)
    .map((m) => m.message);

  return {
    id,
    fileName: file.name,
    title: baseTitle,
    content: markdown || `# ${baseTitle}\n`,
    format,
    warnings,
    wordCount: countWords(markdown),
  };
}
