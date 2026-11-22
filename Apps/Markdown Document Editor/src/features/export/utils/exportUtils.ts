const PAGE_BREAK_REGEX = /<!--\s*page-break\s*-->|<--page-break-->/g;

export function normalizePageBreaks(markdown: string): string {
  return markdown.replace(PAGE_BREAK_REGEX, '<!--page-break-->');
}

export function sanitizeFilename(title: string): string {
  const cleaned = (title || 'document')
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 120);

  return cleaned || 'document';
}

export function downloadBlob(
  content: BlobPart,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function looksRtl(text: string): boolean {
  return /[\u0590-\u08FF]/.test(text);
}
