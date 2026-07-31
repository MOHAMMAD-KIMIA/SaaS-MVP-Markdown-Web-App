import {
  AppSettings,
  Document as EditorDocument,
} from '../../../types/common.types';
import { buildExportHtml } from './buildExportHtml';
import { convertMarkdownToPlainText } from './plainText';
import { downloadBlob, sanitizeFilename } from './exportUtils';

/**
 * Export the current document as a standalone HTML file.
 */
export async function exportToHtml(
  document: EditorDocument,
  settings: AppSettings
): Promise<void> {
  const html = await buildExportHtml(document, settings);
  const filename = `${sanitizeFilename(document.title)}.html`;

  downloadBlob(html, filename, 'text/html;charset=utf-8');
}

/**
 * Legacy PDF export path.
 *
 * This generates PDF output from buildExportHtml().
 *
 * If you want the PDF to match the in-app preview exactly,
 * prefer using exportPreviewToPdf(previewElement, settings, filename)
 * from exportPreviewToPdf.ts.
 */
export async function exportToPdf(
  document: EditorDocument,
  settings: AppSettings
): Promise<void> {
  const html = await buildExportHtml(document, settings);

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
 * Export the original markdown source.
 */
export function exportToMarkdown(document: EditorDocument): void {
  const filename = `${sanitizeFilename(document.title)}.md`;

  downloadBlob(document.content, filename, 'text/markdown;charset=utf-8');
}

/**
 * Export a simplified plain-text version of the markdown source.
 */
export function exportToPlainText(document: EditorDocument): void {
  const filename = `${sanitizeFilename(document.title)}.txt`;
  const plainText = convertMarkdownToPlainText(document.content);

  downloadBlob(plainText, filename, 'text/plain;charset=utf-8');
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
