// src/features/export/utils/exportThemePresets.ts
import type { ExportThemePreset } from '../../../types/common.types';

export interface ExportThemePresetMeta {
  id: ExportThemePreset;
  name: string;
  description: string;
  badge: string;
}

export const EXPORT_THEME_PRESETS: ExportThemePresetMeta[] = [
  {
    id: 'default',
    name: 'Classic Clean',
    description: 'Neutral sans-serif typography with balanced spacing.',
    badge: 'Default',
  },
  {
    id: 'academic',
    name: 'Academic Paper',
    description: 'Formal serif body, justified text, double-ruled titles.',
    badge: 'Serif',
  },
  {
    id: 'minimal_resume',
    name: 'Minimal Resume',
    description: 'Compact modern layout with accented section borders.',
    badge: 'Compact',
  },
  {
    id: 'technical_spec',
    name: 'Technical Spec',
    description: 'Crisp engineering spec with structured headings & code boxes.',
    badge: 'RFC',
  },
  {
    id: 'book_chapter',
    name: 'Book Chapter',
    description: 'Editorial serif rhythm, centered chapter titles & warm quotes.',
    badge: 'Editorial',
  },
  {
    id: 'slate_editorial',
    name: 'Slate Executive',
    description: 'Deep slate headings, subtle tinted callouts & modern tables.',
    badge: 'Executive',
  },
];

const PRESET_CSS_MAP: Record<ExportThemePreset, string> = {
  default: '',

  academic: `
    .export-document, .markdown-preview-export-root {
      font-family: Georgia, "Times New Roman", Times, serif !important;
      color: #111827 !important;
      line-height: 1.75 !important;
    }
    .export-document p, .markdown-preview-export-root p {
      text-align: justify !important;
    }
    .export-document h1, .markdown-preview-export-root h1 {
      font-size: 1.9em !important;
      border-bottom: 3px double #1f2937 !important;
      padding-bottom: 0.35em !important;
      letter-spacing: -0.01em !important;
    }
    .export-document h2, .markdown-preview-export-root h2 {
      font-size: 1.35em !important;
      border-bottom: 1px solid #9ca3af !important;
      padding-bottom: 0.2em !important;
    }
    .export-document blockquote, .markdown-preview-export-root blockquote {
      font-style: italic !important;
      border-inline-start: 3px solid #374151 !important;
      background: #f9fafb !important;
      padding: 0.65em 1em !important;
    }
    .export-document th, .markdown-preview-export-root th {
      background: #f3f4f6 !important;
      border-top: 2px solid #111827 !important;
      border-bottom: 2px solid #111827 !important;
    }
  `,

  minimal_resume: `
    .export-document, .markdown-preview-export-root {
      font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      line-height: 1.48 !important;
      color: #0f172a !important;
    }
    .export-document h1, .markdown-preview-export-root h1 {
      font-size: 1.8em !important;
      margin-top: 0.2em !important;
      margin-bottom: 0.3em !important;
      letter-spacing: -0.025em !important;
      color: #0f172a !important;
    }
    .export-document h2, .markdown-preview-export-root h2 {
      font-size: 1.05em !important;
      text-transform: uppercase !important;
      letter-spacing: 0.08em !important;
      color: #2563eb !important;
      border-bottom: 1.5px solid #dbeafe !important;
      padding-bottom: 0.2em !important;
      margin-top: 1.2em !important;
    }
    .export-document p, .export-document ul, .export-document ol,
    .markdown-preview-export-root p, .markdown-preview-export-root ul, .markdown-preview-export-root ol {
      margin: 0.45em 0 !important;
    }
    .export-document code, .markdown-preview-export-root code {
      background: #eff6ff !important;
      color: #1d4ed8 !important;
      border: 1px solid #bfdbfe !important;
    }
  `,

  technical_spec: `
    .export-document, .markdown-preview-export-root {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      color: #0f172a !important;
    }
    .export-document h1, .markdown-preview-export-root h1 {
      border-left: 5px solid #0284c7 !important;
      padding-left: 0.55em !important;
      background: #f0f9ff !important;
      padding-top: 0.35em !important;
      padding-bottom: 0.35em !important;
      border-radius: 0 6px 6px 0 !important;
    }
    .export-document h2, .markdown-preview-export-root h2 {
      border-left: 3px solid #38bdf8 !important;
      padding-left: 0.5em !important;
      color: #0369a1 !important;
    }
    .export-document pre, .markdown-preview-export-root pre {
      background: #0f172a !important;
      color: #e2e8f0 !important;
      border: 1px solid #334155 !important;
    }
    .export-document th, .markdown-preview-export-root th {
      background: #e0f2fe !important;
      color: #0c4a6e !important;
    }
  `,

  book_chapter: `
    .export-document, .markdown-preview-export-root {
      font-family: "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif !important;
      line-height: 1.8 !important;
      color: #1c1917 !important;
    }
    .export-document h1, .markdown-preview-export-root h1 {
      text-align: center !important;
      font-size: 2.1em !important;
      font-weight: 600 !important;
      margin-bottom: 1em !important;
      padding-bottom: 0.5em !important;
      border-bottom: 1px solid #d6d3d1 !important;
    }
    .export-document h2, .markdown-preview-export-root h2 {
      font-size: 1.35em !important;
      font-style: italic !important;
      color: #44403c !important;
    }
    .export-document blockquote, .markdown-preview-export-root blockquote {
      border-inline-start: 3px solid #a8a29e !important;
      color: #57534e !important;
      font-style: italic !important;
    }
    .export-document hr, .markdown-preview-export-root hr {
      border: 0 !important;
      text-align: center !important;
      margin: 2em 0 !important;
      border-top: 1px dashed #a8a29e !important;
    }
  `,

  slate_editorial: `
    .export-document, .markdown-preview-export-root {
      font-family: "Inter", system-ui, sans-serif !important;
      color: #1e293b !important;
      line-height: 1.65 !important;
    }
    .export-document h1, .markdown-preview-export-root h1 {
      color: #0f172a !important;
      font-size: 2em !important;
      letter-spacing: -0.03em !important;
      border-bottom: 2px solid #475569 !important;
      padding-bottom: 0.3em !important;
    }
    .export-document h2, .markdown-preview-export-root h2 {
      color: #334155 !important;
      letter-spacing: -0.015em !important;
    }
    .export-document blockquote, .markdown-preview-export-root blockquote {
      background: #f8fafc !important;
      border-inline-start: 4px solid #475569 !important;
      padding: 0.75em 1em !important;
      border-radius: 0 6px 6px 0 !important;
    }
    .export-document th, .markdown-preview-export-root th {
      background: #1e293b !important;
      color: #f8fafc !important;
    }
  `,
};

export function getExportPresetCss(preset?: ExportThemePreset): string {
  if (!preset) return '';
  return PRESET_CSS_MAP[preset] || '';
}

export function buildExportStyleOverridesCss(
  preset?: ExportThemePreset,
  customCss?: string,
  applyLayout = true
): string {
  if (!applyLayout) return '';
  const presetCss = getExportPresetCss(preset);
  const safeCustom = (customCss || '').replace(/<\/style/gi, '<\\/style').trim();
  return [presetCss, safeCustom ? `/* User Custom CSS */\n${safeCustom}` : '']
    .filter(Boolean)
    .join('\n\n');
}
