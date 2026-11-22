// src/features/export/utils/exportLayoutHelpers.ts
import type { Alignment, AppSettings, BoxSpacing } from '../../../types/common.types';

export interface ResolvedExportLayout {
  pageSize: string;
  margins: BoxSpacing;
  padding: BoxSpacing;
  headerEnabled: boolean;
  headerText: string;
  headerAlignment: Alignment;
  footerEnabled: boolean;
  footerText: string;
  footerAlignment: Alignment;
  pageNumberEnabled: boolean;
  pageNumberFormat: string;
  pageNumberPosition: 'header' | 'footer';
  pageNumberAlignment: Alignment;
}

const ZERO_BOX: BoxSpacing = { top: 0, right: 0, bottom: 0, left: 0 };

export function resolveExportLayout(
  settings: AppSettings,
  options?: { applyLayout?: boolean }
): ResolvedExportLayout {
  const applyLayout = options?.applyLayout ?? true;

  if (!applyLayout) {
    return {
      pageSize: `${settings?.page?.pageSize || 'A4'} ${settings?.page?.orientation || 'portrait'}`,
      margins: { top: 48, right: 48, bottom: 48, left: 48 },
      padding: { ...ZERO_BOX },
      headerEnabled: false,
      headerText: '',
      headerAlignment: 'center',
      footerEnabled: false,
      footerText: '',
      footerAlignment: 'center',
      pageNumberEnabled: false,
      pageNumberFormat: 'Page {{page}} of {{total}}',
      pageNumberPosition: 'footer',
      pageNumberAlignment: 'center',
    };
  }

  const margins = settings?.page?.margins || { top: 72, right: 72, bottom: 72, left: 72 };
  const padding = settings?.page?.padding || { top: 24, right: 24, bottom: 24, left: 24 };
  const hf = settings?.headerFooter;

  return {
    pageSize: `${settings?.page?.pageSize || 'A4'} ${settings?.page?.orientation || 'portrait'}`,
    margins: {
      top: Math.max(0, Number(margins.top) || 0),
      right: Math.max(0, Number(margins.right) || 0),
      bottom: Math.max(0, Number(margins.bottom) || 0),
      left: Math.max(0, Number(margins.left) || 0),
    },
    padding: {
      top: Math.max(0, Number(padding.top) || 0),
      right: Math.max(0, Number(padding.right) || 0),
      bottom: Math.max(0, Number(padding.bottom) || 0),
      left: Math.max(0, Number(padding.left) || 0),
    },
    headerEnabled: Boolean(hf?.headerEnabled),
    headerText: hf?.headerText || '',
    headerAlignment: hf?.headerAlignment || 'center',
    footerEnabled: Boolean(hf?.footerEnabled),
    footerText: hf?.footerText || '',
    footerAlignment: hf?.footerAlignment || 'center',
    pageNumberEnabled: Boolean(hf?.pageNumberEnabled),
    pageNumberFormat: hf?.pageNumberFormat || 'Page {{page}} of {{total}}',
    pageNumberPosition: hf?.pageNumberPosition || 'footer',
    pageNumberAlignment: hf?.pageNumberAlignment || 'center',
  };
}

export function formatStaticLayoutText(
  template: string,
  title: string,
  page = '1',
  total = '1'
): string {
  const today = new Date().toLocaleDateString();
  return template
    .replaceAll('{{title}}', title || 'Untitled Document')
    .replaceAll('{{date}}', today)
    .replaceAll('{{page}}', page)
    .replaceAll('{{total}}', total);
}

function escapeCssString(text: string): string {
  return text
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('\n', ' ')
    .replaceAll('\r', '');
}

/**
 * Converts a template string containing {{page}} and {{total}} into CSS content() expression
 * using CSS Paged Media counters: counter(page) and counter(pages).
 */
function templateToCssContent(template: string, title: string): string {
  const today = new Date().toLocaleDateString();
  const withStatic = template
    .replaceAll('{{title}}', title || 'Untitled Document')
    .replaceAll('{{date}}', today);

  const parts: string[] = [];
  const tokenRegex = /(\{\{page\}\}|\{\{total\}\})/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(withStatic)) !== null) {
    if (match.index > lastIndex) {
      parts.push(`"${escapeCssString(withStatic.slice(lastIndex, match.index))}"`);
    }
    if (match[1] === '{{page}}') {
      parts.push('counter(page)');
    } else {
      parts.push('counter(pages)');
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < withStatic.length) {
    parts.push(`"${escapeCssString(withStatic.slice(lastIndex))}"`);
  }

  return parts.length > 0 ? parts.join(' ') : '""';
}

export function buildPagedMediaMarginBoxesCss(
  layout: ResolvedExportLayout,
  title: string
): { pageMarginTop: number; pageMarginBottom: number; marginBoxCss: string } {
  const topBoxes: Record<Alignment, string[]> = { left: [], center: [], right: [] };
  const bottomBoxes: Record<Alignment, string[]> = { left: [], center: [], right: [] };

  if (layout.headerEnabled && layout.headerText.trim()) {
    topBoxes[layout.headerAlignment].push(layout.headerText.trim());
  }

  if (layout.footerEnabled && layout.footerText.trim()) {
    bottomBoxes[layout.footerAlignment].push(layout.footerText.trim());
  }

  if (layout.pageNumberEnabled) {
    const pageExpr = layout.pageNumberFormat || 'Page {{page}} of {{total}}';
    if (layout.pageNumberPosition === 'header') {
      if (!topBoxes[layout.pageNumberAlignment].some((t) => t.includes('{{page}}'))) {
        topBoxes[layout.pageNumberAlignment].push(pageExpr);
      }
    } else {
      if (!bottomBoxes[layout.pageNumberAlignment].some((t) => t.includes('{{page}}'))) {
        bottomBoxes[layout.pageNumberAlignment].push(pageExpr);
      }
    }
  }

  const hasTop = topBoxes.left.length > 0 || topBoxes.center.length > 0 || topBoxes.right.length > 0;
  const hasBottom =
    bottomBoxes.left.length > 0 || bottomBoxes.center.length > 0 || bottomBoxes.right.length > 0;

  const pageMarginTop = hasTop ? Math.max(layout.margins.top, 48) : layout.margins.top;
  const pageMarginBottom = hasBottom ? Math.max(layout.margins.bottom, 48) : layout.margins.bottom;

  const rules: string[] = [];
  const boxStyle =
    'font-size: 11px; color: #6b7280; font-family: system-ui, -apple-system, sans-serif; vertical-align: middle;';

  for (const align of ['left', 'center', 'right'] as Alignment[]) {
    if (topBoxes[align].length > 0) {
      const combined = topBoxes[align].join('  •  ');
      rules.push(
        `@top-${align} { content: ${templateToCssContent(combined, title)}; ${boxStyle} padding-bottom: 8px; }`
      );
    }
    if (bottomBoxes[align].length > 0) {
      const combined = bottomBoxes[align].join('  •  ');
      rules.push(
        `@bottom-${align} { content: ${templateToCssContent(combined, title)}; ${boxStyle} padding-top: 8px; }`
      );
    }
  }

  return {
    pageMarginTop,
    pageMarginBottom,
    marginBoxCss: rules.join('\n      '),
  };
}

export function buildScreenHeaderFooterParts(
  layout: ResolvedExportLayout,
  title: string
): {
  headerSlots: Record<Alignment, string>;
  footerSlots: Record<Alignment, string>;
  hasHeader: boolean;
  hasFooter: boolean;
} {
  const headerSlots: Record<Alignment, string> = { left: '', center: '', right: '' };
  const footerSlots: Record<Alignment, string> = { left: '', center: '', right: '' };

  if (layout.headerEnabled && layout.headerText.trim()) {
    headerSlots[layout.headerAlignment] = formatStaticLayoutText(layout.headerText.trim(), title);
  }
  if (layout.footerEnabled && layout.footerText.trim()) {
    footerSlots[layout.footerAlignment] = formatStaticLayoutText(layout.footerText.trim(), title);
  }

  if (layout.pageNumberEnabled) {
    const formattedNum = formatStaticLayoutText(
      layout.pageNumberFormat || 'Page {{page}} of {{total}}',
      title
    );
    if (layout.pageNumberPosition === 'header') {
      headerSlots[layout.pageNumberAlignment] = headerSlots[layout.pageNumberAlignment]
        ? `${headerSlots[layout.pageNumberAlignment]}  •  ${formattedNum}`
        : formattedNum;
    } else {
      footerSlots[layout.pageNumberAlignment] = footerSlots[layout.pageNumberAlignment]
        ? `${footerSlots[layout.pageNumberAlignment]}  •  ${formattedNum}`
        : formattedNum;
    }
  }

  return {
    headerSlots,
    footerSlots,
    hasHeader: Boolean(headerSlots.left || headerSlots.center || headerSlots.right),
    hasFooter: Boolean(footerSlots.left || footerSlots.center || footerSlots.right),
  };
}
