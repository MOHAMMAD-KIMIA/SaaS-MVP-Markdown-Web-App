import {
  AppSettings,
  Document as EditorDocument,
} from '../../../types/common.types';
import { buildExportHtml } from './buildExportHtml';
import { convertMarkdownToPlainText } from './plainText';
import { downloadBlob, sanitizeFilename } from './exportUtils';
import {
  buildScreenHeaderFooterParts,
  resolveExportLayout,
} from './exportLayoutHelpers';

export interface ExportLayoutOptions {
  applyLayout?: boolean;
}

/**
 * Export the current document as a standalone HTML file.
 */
export async function exportToHtml(
  document: EditorDocument,
  settings: AppSettings,
  options?: ExportLayoutOptions
): Promise<void> {
  const html = await buildExportHtml(document, settings, options);
  const filename = `${sanitizeFilename(document.title)}.html`;

  downloadBlob(html, filename, 'text/html;charset=utf-8');
}

/**
 * Legacy PDF export path.
 */
export async function exportToPdf(
  document: EditorDocument,
  settings: AppSettings,
  options?: ExportLayoutOptions
): Promise<void> {
  const html = await buildExportHtml(document, settings, options);

  const iframe = createPrintIframe();
  window.document.body.appendChild(iframe);

  try {
    const iframeWindow = iframe.contentWindow;
    const iframeDocument = iframe.contentDocument || iframeWindow?.document;

    if (!iframeWindow || !iframeDocument) {
      throw new Error('Unable to create print frame.');
    }

    iframeDocument.open();
    iframeDocument.write(html);
    iframeDocument.close();

    await waitForPrintDocumentReady(iframe, iframeDocument);

    iframeWindow.focus();
    iframeWindow.print();
  } finally {
    window.setTimeout(() => {
      iframe.remove();
    }, 1500);
  }
}

/**
 * Export the markdown source, optionally applying configured header, footer, page number, and layout styling.
 */
export function exportToMarkdown(
  document: EditorDocument,
  settings?: AppSettings,
  options?: ExportLayoutOptions
): void {
  const filename = `${sanitizeFilename(document.title)}.md`;

  if (!options?.applyLayout || !settings) {
    downloadBlob(document.content, filename, 'text/markdown;charset=utf-8');
    return;
  }

  const layout = resolveExportLayout(settings, { applyLayout: true });
  const { headerSlots, footerSlots, hasHeader, hasFooter } = buildScreenHeaderFooterParts(
    layout,
    document.title || 'Untitled Document'
  );

  const headerLine = [headerSlots.left, headerSlots.center, headerSlots.right]
    .filter(Boolean)
    .join(' | ');
  const footerLine = [footerSlots.left, footerSlots.center, footerSlots.right]
    .filter(Boolean)
    .join(' | ');

  const sections: string[] = [];

  if (hasHeader && headerLine) {
    sections.push(`> **Header:** ${headerLine}\n\n---`);
  }

  sections.push(document.content);

  if (hasFooter && footerLine) {
    sections.push(`---\n\n> **Footer:** ${footerLine}`);
  }

  // Include compact layout style comment at top if margins or padding were customized
  const layoutSummary = `<!-- Export Layout: size=${layout.pageSize}; margin=${layout.margins.top}px ${layout.margins.right}px ${layout.margins.bottom}px ${layout.margins.left}px; padding=${layout.padding.top}px ${layout.padding.right}px ${layout.padding.bottom}px ${layout.padding.left}px -->`;
  const output = `${layoutSummary}\n\n${sections.join('\n\n')}`;

  downloadBlob(output, filename, 'text/markdown;charset=utf-8');
}

/**
 * Export a plain-text version of the markdown source, optionally applying header, footer, page number, margin, and padding spacing.
 */
export function exportToPlainText(
  document: EditorDocument,
  settings?: AppSettings,
  options?: ExportLayoutOptions
): void {
  const filename = `${sanitizeFilename(document.title)}.txt`;
  const plainText = convertMarkdownToPlainText(document.content);

  if (!options?.applyLayout || !settings) {
    downloadBlob(plainText, filename, 'text/plain;charset=utf-8');
    return;
  }

  const layout = resolveExportLayout(settings, { applyLayout: true });
  const { headerSlots, footerSlots, hasHeader, hasFooter } = buildScreenHeaderFooterParts(
    layout,
    document.title || 'Untitled Document'
  );

  const leftSpaces = ' '.repeat(
    Math.min(16, Math.round((layout.margins.left + layout.padding.left) / 16))
  );
  const topLines = '\n'.repeat(
    Math.min(6, Math.round((layout.margins.top + layout.padding.top) / 24))
  );
  const bottomLines = '\n'.repeat(
    Math.min(6, Math.round((layout.margins.bottom + layout.padding.bottom) / 24))
  );

  const formatSlotRow = (slots: { left: string; center: string; right: string }) =>
    [slots.left, slots.center, slots.right].filter(Boolean).join('   |   ');

  const indentedBody = plainText
    .split('\n')
    .map((line) => (line ? `${leftSpaces}${line}` : ''))
    .join('\n');

  const parts: string[] = [];
  if (topLines) parts.push(topLines.slice(0, -1));
  if (hasHeader) {
    parts.push(`${leftSpaces}${formatSlotRow(headerSlots)}`);
    parts.push(`${leftSpaces}${'-'.repeat(48)}`);
  }
  parts.push(indentedBody);
  if (hasFooter) {
    parts.push(`${leftSpaces}${'-'.repeat(48)}`);
    parts.push(`${leftSpaces}${formatSlotRow(footerSlots)}`);
  }
  if (bottomLines) parts.push(bottomLines.slice(0, -1));

  downloadBlob(parts.join('\n'), filename, 'text/plain;charset=utf-8');
}

function createPrintIframe(): HTMLIFrameElement {
  const iframe = window.document.createElement('iframe');

  iframe.style.position = 'fixed';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';

  iframe.setAttribute('aria-hidden', 'true');

  return iframe;
}

async function waitForPrintDocumentReady(
  iframe: HTMLIFrameElement,
  iframeDocument: globalThis.Document
): Promise<void> {
  await new Promise<void>((resolve) => {
    let resolved = false;

    const finish = () => {
      if (resolved) return;

      resolved = true;
      window.setTimeout(resolve, 300);
    };

    if (iframeDocument.readyState === 'complete') {
      finish();
      return;
    }

    const timeout = window.setTimeout(finish, 1200);

    iframe.onload = () => {
      window.clearTimeout(timeout);
      finish();
    };
  });

  await waitForImages(iframeDocument);
}

async function waitForImages(iframeDocument: globalThis.Document): Promise<void> {
  const images = Array.from(iframeDocument.images || []);

  await Promise.all(
    images.map((img) => {
      if (img.complete) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        const done = () => resolve();

        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
    })
  );
}
