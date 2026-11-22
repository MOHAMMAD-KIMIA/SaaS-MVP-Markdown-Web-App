/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Markora Desktop Bridge API
 * Abstraction layer for seamless execution across Electron, Tauri, and Web Cloud Preview.
 */

export interface DesktopFileResult {
  filePath?: string;
  fileName?: string;
  content?: string;
  canceled?: boolean;
  error?: string;
}

export interface DesktopAPI {
  isDesktop: boolean;
  platform: 'windows' | 'mac' | 'linux' | 'web';
  openFile: () => Promise<DesktopFileResult>;
  saveFile: (content: string, suggestedPath?: string, defaultFileName?: string) => Promise<DesktopFileResult>;
  exportPdf: (htmlContent: string, suggestedName?: string) => Promise<DesktopFileResult>;
  exportHtml: (htmlContent: string, suggestedName?: string) => Promise<DesktopFileResult>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isMaximized: () => Promise<boolean>;
  openExternal: (url: string) => void;
  onMenuAction: (callback: (action: string, payload?: any) => void) => () => void;
  showNotification: (title: string, body: string) => void;
}

declare global {
  interface Window {
    desktopAPI?: DesktopAPI;
    __TAURI__?: any;
  }
}

class WebFallbackDesktopAPI implements DesktopAPI {
  isDesktop = false;
  platform: 'windows' | 'mac' | 'linux' | 'web' = 'web';

  async openFile(): Promise<DesktopFileResult> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md,.txt,.markdown';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve({ canceled: true });
          return;
        }
        const content = await file.text();
        resolve({
          filePath: file.name,
          fileName: file.name,
          content,
          canceled: false,
        });
      };
      input.click();
    });
  }

  async saveFile(content: string, _suggestedPath?: string, defaultFileName = 'document.md'): Promise<DesktopFileResult> {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFileName;
    a.click();
    URL.revokeObjectURL(url);
    return {
      filePath: defaultFileName,
      fileName: defaultFileName,
      canceled: false,
    };
  }

  async exportPdf(htmlContent: string, suggestedName = 'document.pdf'): Promise<DesktopFileResult> {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        iframe.remove();
        resolve({ canceled: true, error: 'Could not open print frame' });
        return;
      }

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${suggestedName}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
            pre, code { font-family: monospace; background: #f4f4f5; padding: 4px 8px; border-radius: 4px; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            img { max-width: 100%; }
          </style>
        </head>
        <body>${htmlContent}</body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          // Ignore iframe print error
        } finally {
          setTimeout(() => iframe.remove(), 1000);
          resolve({ fileName: suggestedName, canceled: false });
        }
      }, 500);
    });
  }

  async exportHtml(htmlContent: string, suggestedName = 'document.html'): Promise<DesktopFileResult> {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${suggestedName.replace('.html', '')}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1f2937; line-height: 1.6; }
    pre { background: #1e1e2e; color: #cdd6f4; padding: 16px; border-radius: 8px; overflow-x: auto; }
    code { font-family: 'Fira Code', monospace; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #e5e7eb; padding: 10px 14px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; }
    blockquote { border-left: 4px solid #3b82f6; margin: 0; padding-left: 16px; color: #4b5563; }
    img { max-width: 100%; border-radius: 6px; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName;
    a.click();
    URL.revokeObjectURL(url);
    return { fileName: suggestedName, canceled: false };
  }

  minimizeWindow(): void {
    console.log('[DesktopBridge] Minimize requested (Web fallback)');
  }

  maximizeWindow(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  closeWindow(): void {
    if (confirm('Are you sure you want to close Markora Desktop?')) {
      window.close();
    }
  }

  async isMaximized(): Promise<boolean> {
    return !!document.fullscreenElement;
  }

  openExternal(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  onMenuAction(callback: (action: string, payload?: any) => void): () => void {
    const handler = (e: CustomEvent) => {
      callback(e.detail.action, e.detail.payload);
    };
    window.addEventListener('markora-menu-action' as any, handler as any);
    return () => window.removeEventListener('markora-menu-action' as any, handler as any);
  }

  showNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    } else {
      console.log(`[Notification] ${title}: ${body}`);
    }
  }
}

export function getDesktopBridge(): DesktopAPI {
  if (window.desktopAPI) {
    return window.desktopAPI;
  }
  if (window.__TAURI__) {
    // Tauri fallback bridge mapping if Tauri IPC is loaded
    return new WebFallbackDesktopAPI();
  }
  return new WebFallbackDesktopAPI();
}

export const desktop = getDesktopBridge();
