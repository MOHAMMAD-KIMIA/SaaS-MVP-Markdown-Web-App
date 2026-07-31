import type { AppSettings } from '../../../types/common.types';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForImages(doc: Document): Promise<void> {
  const images = Array.from(doc.images);

  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();

      return new Promise<void>((resolve) => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
    })
  );
}

function collectStyles(): string {
  let css = '';

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      if ('cssRules' in sheet) {
        const rules = Array.from(sheet.cssRules);
        css += rules.map((rule) => rule.cssText).join('\n');
      }
    } catch {
      /**
       * Ignore stylesheets that cannot be read.
       */
    }
  }

  return css;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildPrintWrapperHtml(
  previewHtml: string,
  styles: string,
  settings: AppSettings,
  title: string
): string {
  const top = settings?.page?.margins?.top ?? 40;
  const right = settings?.page?.margins?.right ?? 40;
  const bottom = settings?.page?.margins?.bottom ?? 40;
  const left = settings?.page?.margins?.left ?? 40;

  return `<!DOCTYPE html>
<html lang="en" dir="auto">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    ${styles}

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
    }

    body {
      color: #000000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      overflow: visible !important;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    .pdf-export-page {
      display: block;
      width: 100%;
      min-height: 100vh;
      background: #ffffff !important;
    }

    .pdf-export-root {
      padding: ${top}px ${right}px ${bottom}px ${left}px;
      background: #ffffff !important;
    }

    .page-break {
      display: block;
      width: 100%;
      height: 0 !important;
      margin: 0 !important;
      border: 0 !important;
      break-before: page !important;
      page-break-before: always !important;
    }

    [data-export-ignore="true"] {
      display: none !important;
    }

    @media print {
      @page {
        size: auto;
        margin: 0;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        overflow: visible !important;
      }

      .pdf-export-page {
        background: #ffffff !important;
      }

      .pdf-export-root {
        padding: ${top}px ${right}px ${bottom}px ${left}px;
        background: #ffffff !important;
      }

      .page-break {
        display: block !important;
        width: 100% !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        break-before: page !important;
        page-break-before: always !important;
      }

      [data-radix-scroll-area-viewport],
      [data-radix-scroll-area-root] {
        overflow: visible !important;
        height: auto !important;
        max-height: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="pdf-export-page">
    <div class="pdf-export-root">
      ${previewHtml}
    </div>
  </div>
</body>
</html>`;
}

function getExportNode(previewElement: HTMLElement): HTMLElement {
  const directExportRoot = previewElement.querySelector(
    '[data-export-root="true"]'
  ) as HTMLElement | null;

  if (directExportRoot) {
    return directExportRoot;
  }

  return previewElement;
}

function cleanupClonedPreview(cloned: HTMLElement): HTMLElement {
  cloned.querySelectorAll('[data-export-ignore="true"]').forEach((el) => {
    el.remove();
  });

  const radixViewport = cloned.querySelector(
    '[data-radix-scroll-area-viewport]'
  ) as HTMLElement | null;

  if (radixViewport) {
    return radixViewport;
  }

  return cloned;
}

export async function exportPreviewToPdf(
  previewElement: HTMLElement,
  settings: AppSettings,
  fileName: string
): Promise<void> {
  const exportNode = getExportNode(previewElement);
  const cloned = exportNode.cloneNode(true) as HTMLElement;
  const cleanedNode = cleanupClonedPreview(cloned);

  const styles = collectStyles();
  const html = buildPrintWrapperHtml(
    cleanedNode.outerHTML,
    styles,
    settings,
    fileName
  );

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.setAttribute('aria-hidden', 'true');

  document.body.appendChild(iframe);

  const cleanup = () => {
    window.setTimeout(() => {
      iframe.remove();
    }, 1500);
  };

  iframe.srcdoc = html;

  await new Promise<void>((resolve, reject) => {
    iframe.onload = () => resolve();
    iframe.onerror = () => reject(new Error('Failed to load print iframe'));
  });

  const iframeWindow = iframe.contentWindow;
  const iframeDocument = iframe.contentDocument;

  if (!iframeWindow || !iframeDocument) {
    cleanup();
    throw new Error('Print iframe is not accessible');
  }

  await waitForImages(iframeDocument);
  await wait(400);

  iframeWindow.focus();
  iframeWindow.print();

  cleanup();
}
