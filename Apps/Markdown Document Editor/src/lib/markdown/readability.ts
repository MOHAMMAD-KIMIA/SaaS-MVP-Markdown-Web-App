// src/lib/markdown/readability.ts
import { splitFrontmatter } from './frontmatter';

export interface PassiveVoiceHint {
  id: string;
  start: number;
  end: number;
  phrase: string;
  line: number;
}

export interface RepeatedWordHint {
  id: string;
  start: number;
  end: number;
  word: string;
  kind: 'consecutive' | 'cluster';
  line: number;
}

export interface ReadabilityReport {
  wordCount: number;
  sentenceCount: number;
  syllableCount: number;
  avgWordsPerSentence: number;
  fkGrade: number;
  fleschEase: number;
  gradeLabel: string;
  readingMinutes: number;
  speakingMinutes: number;
  speakingSecondsTotal: number;
  passiveHints: PassiveVoiceHint[];
  repeatedWordHints: RepeatedWordHint[];
}

const IRREGULAR_PARTICIPLES = new Set([
  'awoken', 'beaten', 'become', 'begun', 'bent', 'bet', 'bitten', 'bled', 'blown',
  'broken', 'brought', 'built', 'burnt', 'bought', 'caught', 'chosen', 'clung',
  'come', 'cost', 'crept', 'cut', 'dealt', 'dug', 'done', 'drawn', 'dreamt',
  'driven', 'drunk', 'eaten', 'fallen', 'fed', 'felt', 'fought', 'found', 'fled',
  'flung', 'flown', 'forbidden', 'forgotten', 'forgiven', 'frozen', 'got', 'gotten',
  'given', 'gone', 'ground', 'grown', 'hung', 'heard', 'hidden', 'hit', 'held',
  'hurt', 'kept', 'knelt', 'known', 'laid', 'led', 'leapt', 'learnt', 'left',
  'lent', 'let', 'lit', 'lost', 'made', 'meant', 'met', 'paid', 'put', 'quit',
  'read', 'ridden', 'rung', 'risen', 'run', 'said', 'seen', 'sought', 'sold',
  'sent', 'set', 'shaken', 'shone', 'shot', 'shown', 'shrunk', 'shut', 'sung',
  'sunk', 'sat', 'slept', 'slid', 'slit', 'spoken', 'spent', 'spun', 'spat',
  'split', 'spread', 'sprung', 'stood', 'stolen', 'stuck', 'stung', 'struck',
  'strung', 'striven', 'sworn', 'swept', 'swollen', 'swum', 'swung', 'taken',
  'taught', 'torn', 'told', 'thought', 'thrown', 'understood', 'woken', 'worn',
  'woven', 'wept', 'won', 'wound', 'withdrawn', 'written',
]);

const NON_PASSIVE_PARTICIPLES = new Set([
  'tired', 'excited', 'interested', 'bored', 'worried', 'pleased', 'satisfied',
  'prepared', 'supposed', 'used', 'located', 'based', 'related', 'committed',
  'dedicated', 'focused', 'involved', 'crowded', 'married', 'divorced', 'engaged',
  'allowed', 'expected', 'required', 'needed', 'designed', 'named',
]);

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'with', 'this', 'from', 'your', 'have', 'will',
  'are', 'was', 'were', 'been', 'being', 'into', 'than', 'then', 'when', 'where',
  'which', 'while', 'about', 'after', 'before', 'other', 'their', 'there', 'these',
  'those', 'they', 'them', 'what', 'would', 'could', 'should', 'each', 'more',
  'most', 'some', 'such', 'only', 'over', 'also', 'very', 'just', 'like', 'make',
  'made', 'using', 'used', 'each', 'both', 'does', 'into', 'here', 'note', 'slide',
]);

function countSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleaned) return 0;
  if (cleaned.length <= 3) return 1;

  let trimmed = cleaned.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  trimmed = trimmed.replace(/^y/, '');
  const vowelGroups = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, vowelGroups ? vowelGroups.length : 1);
}

function getLineNumberAtOffset(text: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') line++;
  }
  return line;
}

/**
 * Returns character spans in `text` that represent prose (excluding YAML frontmatter,
 * fenced code blocks, inline code, URLs, and HTML tags).
 */
function buildProseMask(text: string): Array<{ start: number; end: number }> {
  const { hasFrontmatter, frontmatterEndOffset } = splitFrontmatter(text);
  const startOffset = hasFrontmatter ? frontmatterEndOffset : 0;
  const masked = text.slice(startOffset);

  // Replace non-prose constructs with spaces of identical length so offsets stay exact!
  let buf = masked;
  const blankOut = (regex: RegExp) => {
    buf = buf.replace(regex, (m) => ' '.repeat(m.length));
  };

  blankOut(/```[\s\S]*?```/g);
  blankOut(/~~~[\s\S]*?~~~/g);
  blankOut(/`[^`\r\n]+`/g);
  blankOut(/\$\$[\s\S]*?\$\$/g);
  blankOut(/\$[^$\r\n]+\$/g);
  blankOut(/<!--[\s\S]*?-->/g);
  blankOut(/!\[[^\]]*\]\([^)]*\)/g);
  blankOut(/\]\([^)]*\)/g);
  blankOut(/https?:\/\/\S+/g);
  blankOut(/<[^>]+>/g);

  // Extract contiguous non-blank prose runs
  const spans: Array<{ start: number; end: number }> = [];
  const lineRegex = /[^\n]+/g;
  let m: RegExpExecArray | null;
  while ((m = lineRegex.exec(buf)) !== null) {
    if (m[0].trim().length > 0) {
      spans.push({
        start: startOffset + m.index,
        end: startOffset + m.index + m[0].length,
      });
    }
  }
  return spans;
}

function getGradeLabel(fkGrade: number): string {
  if (fkGrade <= 5) return 'Elementary';
  if (fkGrade <= 8) return 'Middle School';
  if (fkGrade <= 10) return 'Conversational';
  if (fkGrade <= 12) return 'High School';
  if (fkGrade <= 15) return 'College';
  return 'Academic / Technical';
}

export function analyzeReadability(text: string): ReadabilityReport {
  if (!text || !text.trim()) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      syllableCount: 0,
      avgWordsPerSentence: 0,
      fkGrade: 0,
      fleschEase: 100,
      gradeLabel: 'Empty',
      readingMinutes: 0,
      speakingMinutes: 0,
      speakingSecondsTotal: 0,
      passiveHints: [],
      repeatedWordHints: [],
    };
  }

  const proseSpans = buildProseMask(text);
  const proseChunks: string[] = [];

  const passiveHints: PassiveVoiceHint[] = [];
  const repeatedWordHints: RepeatedWordHint[] = [];

  // Regex for passive voice: auxiliary "be" + optional adverb + participle
  const passiveRegex = /\b(am|is|are|was|were|be|been|being)\s+(?:([a-z]+ly)\s+)?([a-z]{3,})\b/gi;
  // Consecutive duplicate word regex
  const consecutiveRegex = /\b([a-zA-Z']{2,})\s+\1\b/gi;

  // Track content words across a sliding 35-word window for proximity repetition
  const recentWords: Array<{ word: string; start: number; end: number }> = [];

  for (const span of proseSpans) {
    const rawLine = text.slice(span.start, span.end);
    // Skip table delimiter lines or horizontal rules
    if (/^\s*\|?[\s:-]+\|[\s|:-]*$/.test(rawLine) || /^\s*[-*_]{3,}\s*$/.test(rawLine)) {
      continue;
    }

    // Strip markdown formatting markers for metric calculation
    const cleanLine = rawLine
      .replace(/^#{1,6}\s+/, '')
      .replace(/^>\s*(?:\[![A-Z]+\]\s*)?/, '')
      .replace(/^[-*+]\s+(?:\[[ xX]\]\s+)?/, '')
      .replace(/^\d+\.\s+/, '')
      .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => b || a)
      .replace(/[*_~==]+/g, '');

    if (cleanLine.trim()) {
      proseChunks.push(cleanLine.trim());
    }

    // 1. Passive voice detection (with exact original offsets)
    passiveRegex.lastIndex = 0;
    let pMatch: RegExpExecArray | null;
    while ((pMatch = passiveRegex.exec(rawLine)) !== null) {
      const candidate = pMatch[3].toLowerCase();
      if (NON_PASSIVE_PARTICIPLES.has(candidate)) continue;
      const isParticiple =
        IRREGULAR_PARTICIPLES.has(candidate) ||
        (candidate.endsWith('ed') && candidate.length >= 5);
      if (!isParticiple) continue;

      const absStart = span.start + pMatch.index;
      const absEnd = absStart + pMatch[0].length;
      passiveHints.push({
        id: `passive-${absStart}`,
        start: absStart,
        end: absEnd,
        phrase: pMatch[0],
        line: getLineNumberAtOffset(text, absStart),
      });
    }

    // 2. Consecutive repeated words ("the the", "is is")
    consecutiveRegex.lastIndex = 0;
    let cMatch: RegExpExecArray | null;
    while ((cMatch = consecutiveRegex.exec(rawLine)) !== null) {
      const absStart = span.start + cMatch.index;
      const absEnd = absStart + cMatch[0].length;
      repeatedWordHints.push({
        id: `dup-${absStart}`,
        start: absStart,
        end: absEnd,
        word: cMatch[1],
        kind: 'consecutive',
        line: getLineNumberAtOffset(text, absStart),
      });
    }

    // 3. Proximity word clusters (same non-stopword >= 4 chars used >= 3 times within 28 words)
    const wordRegex = /\b[a-zA-Z]{4,}\b/g;
    let wMatch: RegExpExecArray | null;
    while ((wMatch = wordRegex.exec(rawLine)) !== null) {
      const wLower = wMatch[0].toLowerCase();
      if (STOP_WORDS.has(wLower)) continue;
      const absStart = span.start + wMatch.index;
      const absEnd = absStart + wMatch[0].length;

      recentWords.push({ word: wLower, start: absStart, end: absEnd });
      if (recentWords.length > 28) {
        recentWords.shift();
      }

      const matchesInWindow = recentWords.filter((item) => item.word === wLower);
      if (matchesInWindow.length >= 3) {
        const alreadyMarked = repeatedWordHints.some(
          (h) => h.start === absStart && h.end === absEnd
        );
        if (!alreadyMarked) {
          repeatedWordHints.push({
            id: `cluster-${absStart}`,
            start: absStart,
            end: absEnd,
            word: wMatch[0],
            kind: 'cluster',
            line: getLineNumberAtOffset(text, absStart),
          });
        }
      }
    }
  }

  const proseText = proseChunks.join('. ');
  const words = proseText.match(/\b[a-zA-Z0-9''-]+\b/g) || [];
  const wordCount = words.length;

  if (wordCount === 0) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      syllableCount: 0,
      avgWordsPerSentence: 0,
      fkGrade: 0,
      fleschEase: 100,
      gradeLabel: 'No Prose',
      readingMinutes: 0,
      speakingMinutes: 0,
      speakingSecondsTotal: 0,
      passiveHints: [],
      repeatedWordHints: [],
    };
  }

  const cleanedForSentences = proseText
    .replace(/\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|e\.g|i\.e)\./gi, '$1')
    .trim();
  const sentenceParts = cleanedForSentences
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => /\w/.test(s));
  const sentenceCount = Math.max(1, sentenceParts.length);

  let syllableCount = 0;
  for (const w of words) {
    syllableCount += countSyllables(w);
  }

  const avgWordsPerSentence = Number((wordCount / sentenceCount).toFixed(1));
  const avgSyllablesPerWord = syllableCount / wordCount;

  const rawFk = 0.39 * (wordCount / sentenceCount) + 11.8 * avgSyllablesPerWord - 15.59;
  const fkGrade = Number(Math.max(0, Math.min(20, rawFk)).toFixed(1));

  const rawEase = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * avgSyllablesPerWord;
  const fleschEase = Math.round(Math.max(0, Math.min(100, rawEase)));

  const readingMinutes = Math.max(1, Math.ceil(wordCount / 225));
  const speakingSecondsTotal = Math.max(1, Math.round((wordCount / 135) * 60));
  const speakingMinutes = Math.max(1, Math.ceil(speakingSecondsTotal / 60));

  return {
    wordCount,
    sentenceCount,
    syllableCount,
    avgWordsPerSentence,
    fkGrade,
    fleschEase,
    gradeLabel: getGradeLabel(fkGrade),
    readingMinutes,
    speakingMinutes,
    speakingSecondsTotal,
    passiveHints,
    repeatedWordHints,
  };
}
