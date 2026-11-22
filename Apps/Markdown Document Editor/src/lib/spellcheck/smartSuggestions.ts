// src/lib/spellcheck/smartSuggestions.ts
import { Document } from '../../types/common.types';
import { isWordInDictionary } from './dictionary';
import { maskMarkdownForSpellCheck } from './spellChecker';

export type SmartSuggestionCategory =
  | 'technical_jargon'
  | 'brand_or_acronym'
  | 'domain_term'
  | 'misspelling_correction';

export interface SmartDictionarySuggestion {
  word: string;
  sourceWord: string;
  category: SmartSuggestionCategory;
  reason: string;
  occurrences: number;
  confidence: number;
  sampleContext: string;
}

export interface SmartSuggestionsResponse {
  summary: string;
  suggestions: SmartDictionarySuggestion[];
  analyzedDocuments: number;
  analyzedTokens: number;
}

interface CandidateTokenBucket {
  word: string;
  count: number;
  contexts: string[];
  docTitles: string[];
  kind: 'flagged' | 'technical_candidate';
}

const ROMAN_NUMERAL_REGEX =
  /^(?=[MDCLXVI])M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

function extractSnippet(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 28);
  const end = Math.min(text.length, index + length + 28);
  const raw = text.slice(start, end).replace(/\s+/g, ' ').trim();
  return `${start > 0 ? '...' : ''}${raw}${end < text.length ? '...' : ''}`;
}

/**
 * Collects unknown/flagged words and repeated technical terms from user documents
 * along with concise surrounding context snippets for AI classification.
 */
export function collectDocumentCandidates(
  documents: Document[],
  userDictionary: string[],
  ignoredWords: string[] = []
) {
  const userSet = new Set(userDictionary.map((w) => w.toLowerCase()));
  const ignoredSet = new Set(ignoredWords.map((w) => w.toLowerCase()));
  const buckets = new Map<string, CandidateTokenBucket>();
  const documentExcerpts: { title: string; excerpt: string }[] = [];

  for (const doc of documents) {
    const content = doc.content || '';
    if (!content.trim()) continue;

    if (documentExcerpts.length < 8) {
      documentExcerpts.push({
        title: doc.title || 'Untitled Document',
        excerpt: content.slice(0, 900),
      });
    }

    const masked = maskMarkdownForSpellCheck(content);
    const wordRegex = /\b[a-zA-Z]+(?:'[a-zA-Z]+)?\b/g;
    let match: RegExpExecArray | null;

    while ((match = wordRegex.exec(masked)) !== null) {
      const token = match[0];
      if (token.length < 2) continue;
      if (/\d/.test(token) || token.includes('_')) continue;
      if (token.length >= 2 && token === token.toUpperCase() && ROMAN_NUMERAL_REGEX.test(token)) {
        continue;
      }

      const lower = token.toLowerCase();
      if (userSet.has(lower)) continue;

      const isCamelOrPascal = /[a-z][A-Z]/.test(token);
      const known = !isCamelOrPascal && isWordInDictionary(token, userSet, ignoredSet);
      if (known) continue;

      const existing = buckets.get(lower);
      const snippet = extractSnippet(content, match.index, token.length);
      const docTitle = doc.title || 'Untitled Document';

      if (existing) {
        existing.count += 1;
        if (existing.contexts.length < 2 && !existing.contexts.includes(snippet)) {
          existing.contexts.push(snippet);
        }
        if (existing.docTitles.length < 3 && !existing.docTitles.includes(docTitle)) {
          existing.docTitles.push(docTitle);
        }
      } else {
        buckets.set(lower, {
          word: lower,
          count: 1,
          contexts: [snippet],
          docTitles: [docTitle],
          kind: isCamelOrPascal ? 'technical_candidate' : 'flagged',
        });
      }
    }
  }

  // Sort by occurrence count descending, preferring flagged prose words and repeated technical terms
  const unknownTokens = Array.from(buckets.values())
    .filter((b) => b.kind === 'flagged' || b.count >= 2)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      if (a.kind !== b.kind) return a.kind === 'flagged' ? -1 : 1;
      return a.word.localeCompare(b.word);
    })
    .slice(0, 80);

  return {
    unknownTokens,
    documentExcerpts,
    totalCandidates: buckets.size,
  };
}

export async function fetchSmartDictionarySuggestions(params: {
  documents: Document[];
  userDictionary: string[];
  ignoredWords?: string[];
  signal?: AbortSignal;
}): Promise<SmartSuggestionsResponse> {
  const { documents, userDictionary, ignoredWords = [], signal } = params;
  const { unknownTokens, documentExcerpts, totalCandidates } = collectDocumentCandidates(
    documents,
    userDictionary,
    ignoredWords
  );

  if (unknownTokens.length === 0 && documentExcerpts.length === 0) {
    return {
      summary: 'All words across your documents are already recognized by the dictionary.',
      suggestions: [],
      analyzedDocuments: documents.length,
      analyzedTokens: 0,
    };
  }

  const response = await fetch('/api/dictionary/smart-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      unknownTokens,
      documentExcerpts,
      existingCustomWords: userDictionary,
      totalDocumentsScanned: documents.length,
    }),
    signal,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof payload?.error === 'string' && payload.error.trim()
        ? payload.error
        : `Request failed with status ${response.status}`
    );
  }

  const userSet = new Set(userDictionary.map((w) => w.toLowerCase()));
  const suggestions = (Array.isArray(payload?.suggestions) ? payload.suggestions : []).filter(
    (s: SmartDictionarySuggestion) => s && s.word && !userSet.has(s.word.toLowerCase())
  );

  return {
    summary:
      typeof payload?.summary === 'string'
        ? payload.summary
        : 'AI analysis complete.',
    suggestions,
    analyzedDocuments: documents.length,
    analyzedTokens: totalCandidates,
  };
}
