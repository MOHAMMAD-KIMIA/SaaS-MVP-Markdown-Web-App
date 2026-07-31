import { normalizePageBreaks } from './exportUtils';

export function convertMarkdownToPlainText(markdown: string): string {
  let text = normalizePageBreaks(markdown);

  text = text.replace(
    /<!--page-break-->/g,
    '\n\n---------------- PAGE BREAK ----------------\n\n'
  );

  text = text.replace(/```([\s\S]*?)```/g, (_, code) => `\n${code.trim()}\n`);
  text = text.replace(/`([^`]+)`/g, '$1');

  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1 ($2)');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

  text = text.replace(/^>\s?/gm, '');
  text = text.replace(/^#{1,6}\s+/gm, '');

  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  text = text.replace(/~~([^~]+)~~/g, '$1');

  text = text.replace(/^\s*[-*+]\s+/gm, '• ');
  text = text.replace(/^\s*(\d+)\.\s+/gm, '$1. ');

  text = text.replace(/^\|?(.*\|.*)\|?$/gm, (line) => line.replace(/\|/g, ' | '));
  text = text.replace(/^\s*[-:| ]+\s*$/gm, '');

  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}
