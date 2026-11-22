// src/lib/spellcheck/spellChecker.ts
// Markdown-aware spell check engine

import {
  isWordInDictionary,
  getSpellingSuggestions,
  loadUserDictionary,
} from './dictionary';

export interface SpellError {
  id: string;
  word: string;
  start: number;
  end: number;
  suggestions: string[];
}

/**
 * Masks non-prose markdown patterns (YAML frontmatter, code blocks, inline code,
 * formulas, URLs, HTML tags) with whitespace of identical length so character
 * offsets remain 100% preserved.
 */
export function maskMarkdownForSpellCheck(text: string): string {
  if (!text) return '';

  const replaceWithSpaces = (match: string) =>
    match.replace(/[^\n]/g, ' ');

  let masked = text;

  // 0. YAML frontmatter at top of file
  masked = masked.replace(/^---\r?\n[\s\S]*?\r?\n---(?=\r?\n|$)/, replaceWithSpaces);

  // 1. Fenced code blocks ```...``` or ~~~...~~~
  masked = masked.replace(/```[\s\S]*?```/g, replaceWithSpaces);
  masked = masked.replace(/~~~[\s\S]*?~~~/g, replaceWithSpaces);

  // 2. Inline code `...`
  masked = masked.replace(/`[^`\n]+`/g, replaceWithSpaces);

  // 3. Math blocks $$...$$
  masked = masked.replace(/\$\$[\s\S]*?\$\$/g, replaceWithSpaces);

  // 4. Inline math $...$
  masked = masked.replace(/\$[^$\n]+\$/g, replaceWithSpaces);

  // 5. Link & image URLs: [label](URL) -> mask the (URL) portion
  masked = masked.replace(/\]\([^\)]*\)/g, (match) => ']' + ' '.repeat(match.length - 1));

  // 6. Direct URLs and emails
  masked = masked.replace(/https?:\/\/[^\s\)>]+/g, replaceWithSpaces);
  masked = masked.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replaceWithSpaces);

  // 7. HTML tags <...>
  masked = masked.replace(/<[^>]+>/g, replaceWithSpaces);

  // 8. Markdown wikilink brackets [[...]] and callout markers [!NOTE]
  masked = masked.replace(/\[\[/g, '  ').replace(/\]\]/g, '  ');
  masked = masked.replace(/\[![A-Za-z]+\]/g, replaceWithSpaces);

  // 9. Hex color codes #fff, #123456
  masked = masked.replace(/#[0-9a-fA-F]{3,8}\b/g, replaceWithSpaces);

  return masked;
}

const ROMAN_NUMERAL_REGEX = /^(?=[MDCLXVI])M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

/**
 * Scans markdown text and identifies misspelled words, providing suggestions for each.
 */
export function checkSpelling(
  text: string,
  options?: {
    userDict?: Set<string> | string[];
    ignoredWords?: Set<string> | string[];
  }
): SpellError[] {
  if (!text || text.trim().length === 0) return [];

  const userDict = options?.userDict
    ? options.userDict instanceof Set
      ? options.userDict
      : new Set(options.userDict.map((w) => w.toLowerCase()))
    : loadUserDictionary();

  const ignoredWords = options?.ignoredWords
    ? options.ignoredWords instanceof Set
      ? options.ignoredWords
      : new Set(options.ignoredWords.map((w) => w.toLowerCase()))
    : new Set<string>();

  const maskedText = maskMarkdownForSpellCheck(text);
  const errors: SpellError[] = [];

  // Cache results per unique word in the same document scan for instant performance
  const validityCache = new Map<string, boolean>();
  const suggestionCache = new Map<string, string[]>();

  // Match English words, including valid apostrophes in contractions/possessives
  const wordRegex = /\b[a-zA-Z]+(?:'[a-zA-Z]+)?\b/g;
  let match: RegExpExecArray | null;

  while ((match = wordRegex.exec(maskedText)) !== null) {
    const word = match[0];
    const start = match.index;
    const end = start + word.length;

    // Skip single letters
    if (word.length <= 1) continue;

    // Skip camelCase, PascalCase internal transitions, or snake_case identifiers
    if (/[a-z][A-Z]/.test(word) || word.includes('_')) continue;

    // Skip digits
    if (/\d/.test(word)) continue;

    // Skip Roman numerals (e.g., II, III, IV, VII, XII)
    if (word.length >= 2 && word === word.toUpperCase() && ROMAN_NUMERAL_REGEX.test(word)) {
      continue;
    }

    const cacheKey = word.toLowerCase();
    let isValid = validityCache.get(cacheKey);
    if (isValid === undefined) {
      isValid = isWordInDictionary(word, userDict, ignoredWords);
      validityCache.set(cacheKey, isValid);
    }

    if (!isValid) {
      let suggestions = suggestionCache.get(cacheKey);
      if (!suggestions) {
        suggestions = getSpellingSuggestions(word, userDict);
        suggestionCache.set(cacheKey, suggestions);
      }
      errors.push({
        id: `err-${start}-${end}-${word}`,
        word,
        start,
        end,
        suggestions,
      });
    }
  }

  return errors;
}
