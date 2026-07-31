/**
 * Utility functions for automatically formatting Markdown syntax.
 */

export function formatMarkdown(content: string): string {
  if (!content) return content;

  const lines = content.split(/\r?\n/);
  const formattedLines: string[] = [];
  let inCodeBlock = false;
  let inFrontmatter = false;
  let codeBlockDelimiter = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLeft = line.trimStart();

    // Check for frontmatter at the very beginning of the document
    if (i === 0 && trimmedLeft === '---') {
      inFrontmatter = true;
      formattedLines.push(line);
      continue;
    }
    if (inFrontmatter && trimmedLeft === '---') {
      inFrontmatter = false;
      formattedLines.push(line);
      continue;
    }
    if (inFrontmatter) {
      formattedLines.push(line);
      continue;
    }

    // Check for fenced code blocks (``` or ~~~)
    if (trimmedLeft.startsWith('```') || trimmedLeft.startsWith('~~~')) {
      const delimiter = trimmedLeft.slice(0, 3);
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockDelimiter = delimiter;
      } else if (trimmedLeft.startsWith(codeBlockDelimiter)) {
        inCodeBlock = false;
        codeBlockDelimiter = '';
      }
      formattedLines.push(line);
      continue;
    }

    // If inside a code block, preserve exact formatting
    if (inCodeBlock) {
      formattedLines.push(line);
      continue;
    }

    // Apply formatting rules to standard markdown lines
    let formattedLine = line;

    // 1. Trim trailing whitespace (except if exactly 2 spaces which is a hard line break)
    if (/\s+$/.test(formattedLine)) {
      const match = formattedLine.match(/(\s+)$/);
      if (match && match[1] !== '  ') {
        formattedLine = formattedLine.trimEnd();
      }
    }

    // 2. Standardize ATX headers (# Header)
    // E.g., "##   Title" -> "## Title", "###Title" -> "### Title"
    const headerMatch = formattedLine.match(/^(\s*)(#{1,6})(\s*)(.*)$/);
    if (headerMatch) {
      const [, leadingSpace, hashes, , titleText] = headerMatch;
      // Remove trailing # if present in setext/atx style (e.g. ## Title ## -> ## Title)
      const cleanTitle = titleText.replace(/\s+#+$/, '').trim();
      formattedLine = `${leadingSpace}${hashes} ${cleanTitle}`;
    }

    // 3. Standardize Blockquote spacing (> Text)
    // E.g., ">Title" -> "> Title", ">   Title" -> "> Title"
    const blockquoteMatch = formattedLine.match(/^(\s*>+)(?!\s*$|\s)(.*)$/);
    if (blockquoteMatch) {
      const [, arrows, text] = blockquoteMatch;
      formattedLine = `${arrows} ${text.trimStart()}`;
    }

    // 4. Clean up List Indentation and markers
    // Standardize bullet lists (*, -, +) and numbered lists (1.)
    const listMatch = formattedLine.match(/^([ \t]+)?([*+-]|\d+\.)(\s+)(.*)$/);
    if (listMatch) {
      const [, rawIndent = '', marker, , itemText] = listMatch;
      
      // Convert tabs to 2 spaces
      const spaceIndent = rawIndent.replace(/\t/g, '  ');
      // Standardize indentation to multiples of 2 spaces
      const indentLength = spaceIndent.length;
      const standardizedIndentLength = Math.round(indentLength / 2) * 2;
      const cleanIndent = ' '.repeat(standardizedIndentLength);

      formattedLine = `${cleanIndent}${marker} ${itemText}`;
    }

    formattedLines.push(formattedLine);
  }

  // 5. Standardize excessive consecutive empty lines (max 1 blank line between paragraphs)
  const cleanedParagraphs: string[] = [];
  let consecutiveEmptyCount = 0;

  for (let i = 0; i < formattedLines.length; i++) {
    const line = formattedLines[i];
    if (line.trim() === '') {
      consecutiveEmptyCount++;
      if (consecutiveEmptyCount <= 1) {
        cleanedParagraphs.push('');
      }
    } else {
      consecutiveEmptyCount = 0;
      cleanedParagraphs.push(line);
    }
  }

  // 6. Ensure clean trailing newline without extra empty lines at end of document
  while (cleanedParagraphs.length > 0 && cleanedParagraphs[cleanedParagraphs.length - 1].trim() === '') {
    cleanedParagraphs.pop();
  }

  return cleanedParagraphs.join('\n') + (cleanedParagraphs.length > 0 ? '\n' : '');
}
