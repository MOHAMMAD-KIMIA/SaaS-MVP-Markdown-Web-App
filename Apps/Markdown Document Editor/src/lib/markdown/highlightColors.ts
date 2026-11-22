export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

export interface HighlightColorConfig {
  id: HighlightColor;
  label: string;
  prefix: string;
  className: string;
  dotColor: string;
  ringColor: string;
  badgeBg: string;
  previewBg: string;
  previewText: string;
  classes: string;
}

export const HIGHLIGHT_COLORS: HighlightColorConfig[] = [
  {
    id: 'yellow',
    label: 'Yellow',
    prefix: '==',
    className: 'highlight-yellow',
    dotColor: 'bg-amber-400',
    ringColor: 'ring-amber-400',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    previewBg: '#fef08a',
    previewText: '#78350f',
    classes: 'bg-amber-200/95 text-amber-950 dark:bg-amber-400/35 dark:text-amber-100',
  },
  {
    id: 'green',
    label: 'Green',
    prefix: '==green:',
    className: 'highlight-green',
    dotColor: 'bg-emerald-500',
    ringColor: 'ring-emerald-500',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    previewBg: '#bbf7d0',
    previewText: '#064e3b',
    classes: 'bg-emerald-200/95 text-emerald-950 dark:bg-emerald-500/30 dark:text-emerald-100',
  },
  {
    id: 'blue',
    label: 'Blue',
    prefix: '==blue:',
    className: 'highlight-blue',
    dotColor: 'bg-sky-500',
    ringColor: 'ring-sky-500',
    badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
    previewBg: '#bae6fd',
    previewText: '#0c4a6e',
    classes: 'bg-sky-200/95 text-sky-950 dark:bg-sky-500/30 dark:text-sky-100',
  },
  {
    id: 'pink',
    label: 'Pink',
    prefix: '==pink:',
    className: 'highlight-pink',
    dotColor: 'bg-rose-500',
    ringColor: 'ring-rose-500',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
    previewBg: '#fecdd3',
    previewText: '#881337',
    classes: 'bg-rose-200/95 text-rose-950 dark:bg-rose-500/30 dark:text-rose-100',
  },
];

export const HIGHLIGHT_COLOR_MAP = HIGHLIGHT_COLORS.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {} as Record<string, HighlightColorConfig>);
