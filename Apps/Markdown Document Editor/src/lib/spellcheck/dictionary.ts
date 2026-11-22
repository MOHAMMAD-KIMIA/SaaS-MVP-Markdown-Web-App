// src/lib/spellcheck/dictionary.ts
// Comprehensive offline English spell-check dictionary (100,000+ SCOWL English, US & UK words + Tech/Markdown terms)
// with fast edit-distance-1 hash lookup + frequency-ranked Levenshtein-2 suggestions.

import en10 from 'wordlist-english/english-words-10.json';
import en20 from 'wordlist-english/english-words-20.json';
import en35 from 'wordlist-english/english-words-35.json';
import en40 from 'wordlist-english/english-words-40.json';
import en50 from 'wordlist-english/english-words-50.json';
import en55 from 'wordlist-english/english-words-55.json';
import en60 from 'wordlist-english/english-words-60.json';
import en70 from 'wordlist-english/english-words-70.json';

import am10 from 'wordlist-english/american-words-10.json';
import am20 from 'wordlist-english/american-words-20.json';
import am35 from 'wordlist-english/american-words-35.json';
import am40 from 'wordlist-english/american-words-40.json';
import am50 from 'wordlist-english/american-words-50.json';
import am55 from 'wordlist-english/american-words-55.json';
import am60 from 'wordlist-english/american-words-60.json';
import am70 from 'wordlist-english/american-words-70.json';

import br10 from 'wordlist-english/british-words-10.json';
import br20 from 'wordlist-english/british-words-20.json';
import br35 from 'wordlist-english/british-words-35.json';
import br40 from 'wordlist-english/british-words-40.json';
import br50 from 'wordlist-english/british-words-50.json';
import br55 from 'wordlist-english/british-words-55.json';
import br60 from 'wordlist-english/british-words-60.json';
import br70 from 'wordlist-english/british-words-70.json';

export const COMMON_TYPOS: Record<string, string[]> = {
  teh: ['the'],
  adn: ['and'],
  taht: ['that'],
  thsi: ['this'],
  wiht: ['with'],
  recieve: ['receive'],
  recieved: ['received'],
  recieving: ['receiving'],
  seperate: ['separate'],
  seperated: ['separated'],
  seperately: ['separately'],
  definately: ['definitely'],
  definate: ['definite'],
  occured: ['occurred'],
  occuring: ['occurring'],
  occurrance: ['occurrence'],
  untill: ['until'],
  wierd: ['weird'],
  goverment: ['government'],
  reccomend: ['recommend'],
  recomended: ['recommended'],
  beleive: ['believe'],
  beleived: ['believed'],
  calender: ['calendar'],
  embarass: ['embarrass'],
  enviroment: ['environment'],
  truely: ['truly'],
  freind: ['friend'],
  freinds: ['friends'],
  helo: ['hello', 'help'],
  helllo: ['hello'],
  wrold: ['world'],
  markdwon: ['markdown'],
  markdonw: ['markdown'],
  mkae: ['make'],
  mkaing: ['making'],
  shoudl: ['should'],
  coudl: ['could'],
  woudl: ['would'],
  wich: ['which', 'wish'],
  becuase: ['because'],
  beacuse: ['because'],
  alot: ['a lot', 'allot'],
  accross: ['across'],
  acheive: ['achieve'],
  acheived: ['achieved'],
  agreemnt: ['agreement'],
  alreay: ['already'],
  amoung: ['among'],
  aparent: ['apparent'],
  appearence: ['appearance'],
  arguement: ['argument'],
  assasination: ['assassination'],
  basicly: ['basically'],
  begining: ['beginning'],
  buisness: ['business'],
  collegue: ['colleague'],
  comming: ['coming'],
  completly: ['completely'],
  concious: ['conscious'],
  decission: ['decision'],
  dissapear: ['disappear'],
  dissapoint: ['disappoint'],
  embarras: ['embarrass'],
  existance: ['existence'],
  familar: ['familiar'],
  finalyl: ['finally'],
  foreward: ['forward'],
  fourty: ['forty'],
  guarentee: ['guarantee'],
  happend: ['happened'],
  immediatly: ['immediately'],
  incidently: ['incidentally'],
  independant: ['independent'],
  interupt: ['interrupt'],
  knowlege: ['knowledge'],
  lenght: ['length'],
  liason: ['liaison'],
  millenium: ['millennium'],
  neccessary: ['necessary'],
  noticable: ['noticeable'],
  ocassion: ['occasion'],
  peice: ['piece'],
  persue: ['pursue'],
  posession: ['possession'],
  prefered: ['preferred'],
  publically: ['publicly'],
  religous: ['religious'],
  remeber: ['remember'],
  resistence: ['resistance'],
  rythm: ['rhythm'],
  sensable: ['sensible'],
  similiar: ['similar'],
  suceed: ['succeed'],
  suprise: ['surprise'],
  tendancy: ['tendency'],
  thier: ['their'],
  tommorow: ['tomorrow'],
  tomorow: ['tomorrow'],
  tounge: ['tongue'],
  unfortunatly: ['unfortunately'],
  usefull: ['useful'],
  wether: ['whether', 'weather'],
  writting: ['writing'],
  yeild: ['yield'],
  dictonary: ['dictionary'],
  bottun: ['button'],
  speling: ['spelling'],
  grammer: ['grammar'],
  documnet: ['document'],
  exmaple: ['example'],
  fucntion: ['function'],
  compnent: ['component'],
  databse: ['database'],
};

// Modern tech, Markdown, software & productivity vocabulary + contractions
const TECH_AND_MODERN_WORDS: string[] = [
  // Markdown & Publishing
  'markora', 'markdown', 'mdx', 'markup', 'frontmatter', 'yaml', 'toml', 'json',
  'gfm', 'commonmark', 'katex', 'latex', 'mermaid', 'flowchart', 'sequence',
  'gantt', 'gitgraph', 'classdiagram', 'erdiagram', 'mindmap', 'quadrant',
  'sankey', 'xychart', 'blockdiagram', 'piechart', 'wikilink', 'wikilinks',
  'backlink', 'backlinks', 'outlink', 'outlinks', 'callout', 'callouts',
  'blockquote', 'blockquotes', 'strikethrough', 'highlight', 'highlighter',
  'monospace', 'wysiwyg', 'checklist', 'tasklist', 'todo', 'todos', 'changelog',
  'readme', 'roadmap', 'subheading', 'subheadings', 'toc', 'footnote', 'footnotes',
  'superscript', 'subscript', 'fenced', 'inline', 'rtl', 'ltr', 'bidi',

  // Software & Web Development
  'github', 'gitlab', 'bitbucket', 'obsidian', 'notion', 'vscode', 'cursor',
  'typescript', 'javascript', 'ecmascript', 'react', 'reactjs', 'nextjs', 'vite',
  'vitejs', 'webpack', 'esbuild', 'rollup', 'tailwind', 'tailwindcss', 'postcss',
  'shadcn', 'radix', 'zustand', 'redux', 'lodash', 'axios', 'eslint', 'prettier',
  'vitest', 'jest', 'playwright', 'cypress', 'storybook', 'npm', 'pnpm', 'yarn',
  'npx', 'nodejs', 'deno', 'bun', 'electron', 'tauri', 'chromium', 'webview',
  'html', 'css', 'scss', 'sass', 'less', 'svg', 'png', 'jpg', 'jpeg', 'webp',
  'gif', 'avif', 'ico', 'pdf', 'docx', 'epub', 'csv', 'tsv', 'xml', 'wasm',
  'api', 'apis', 'sdk', 'sdks', 'cli', 'gui', 'tui', 'ui', 'ux', 'dx',
  'url', 'urls', 'uri', 'uris', 'href', 'src', 'http', 'https', 'ws', 'wss',
  'localhost', 'oauth', 'jwt', 'jwts', 'cors', 'csrf', 'xss', 'ssl', 'tls',
  'ssh', 'dns', 'cdn', 'ssr', 'ssg', 'isr', 'spa', 'pwa', 'seo', 'og',
  'dom', 'vdom', 'shadowdom', 'flexbox', 'grid', 'cssgrid', 'keyframes',
  'viewport', 'breakpoint', 'breakpoints', 'responsive', 'retina', 'hidpi',
  'async', 'await', 'callback', 'callbacks', 'promise', 'promises', 'iterable',
  'regex', 'regexp', 'boolean', 'booleans', 'enum', 'enums', 'tuple', 'tuples',
  'struct', 'structs', 'nullable', 'undefined', 'truthy', 'falsy', 'typeof',
  'debounce', 'debounced', 'debouncing', 'throttle', 'throttled', 'throttling',
  'memoize', 'memoized', 'memoization', 'refactor', 'refactored', 'refactoring',
  'codebase', 'monorepo', 'polyfill', 'polyfills', 'transpile', 'transpiled',
  'bundler', 'bundlers', 'minify', 'minified', 'minification', 'sourcemap',
  'sourcemaps', 'hmr', 'hotfix', 'bugfix', 'linter', 'linting', 'typecheck',
  'typechecking', 'runtime', 'buildtime', 'middleware', 'middlewares', 'webhook',
  'webhooks', 'endpoint', 'endpoints', 'payload', 'payloads', 'metadata',
  'schema', 'schemas', 'orm', 'sql', 'nosql', 'postgres', 'postgresql', 'sqlite',
  'mysql', 'mariadb', 'redis', 'mongodb', 'firestore', 'firebase', 'supabase',
  'cloudsql', 'docker', 'dockerfile', 'kubernetes', 'k8s', 'terraform', 'devops',
  'ci', 'cd', 'cicd', 'serverless', 'microservice', 'microservices', 'saas',
  'mvp', 'crud', 'uuid', 'uuids', 'guid', 'nanoid', 'hash', 'hashed', 'hashing',
  'checksum', 'checksums', 'cryptographic', 'utf', 'ascii', 'unicode', 'emoji',
  'emojis', 'linux', 'ubuntu', 'debian', 'macos', 'windows', 'android', 'ios',

  // UI & App Terms
  'sidebar', 'sidebars', 'topbar', 'toolbar', 'toolbars', 'statusbar', 'navbar',
  'dropdown', 'dropdowns', 'popover', 'popovers', 'tooltip', 'tooltips', 'modal',
  'modals', 'drawer', 'drawers', 'accordion', 'accordions', 'carousel', 'slider',
  'sliders', 'checkbox', 'checkboxes', 'textarea', 'textareas', 'scrollbar',
  'scrollbars', 'resize', 'resizable', 'resizer', 'splitter', 'tabpanel', 'tablist',
  'breadcrumb', 'breadcrumbs', 'pagination', 'paginated', 'stepper', 'skeleton',
  'spinner', 'progressbar', 'snackbar', 'toast', 'toasts', 'badge', 'badges',
  'avatar', 'avatars', 'favicon', 'favicons', 'hotkey', 'hotkeys', 'keystroke',
  'keystrokes', 'autosave', 'autosaved', 'autosaving', 'autocomplete',
  'spellcheck', 'spellchecker', 'spellchecking', 'localstorage', 'sessionstorage',
  'indexeddb', 'offline', 'online', 'sync', 'synced', 'syncing', 'unsynced',
  'unarchive', 'unarchived', 'unpin', 'unpinned', 'pin', 'pinned', 'bookmark',
  'bookmarked', 'bookmarks', 'workplace', 'workspace', 'workspaces', 'dashboard',
  'dashboards', 'analytics', 'onboarding', 'workflow', 'workflows', 'kanban',
  'multi', 'multiline', 'multicursor', 'fullscreen', 'darkmode', 'lightmode',
  'plaintext', 'rich', 'richtext', 'snippet', 'snippets', 'template', 'templates',
  'plugin', 'plugins', 'addon', 'addons', 'widget', 'widgets', 'config', 'configs',
  'env', 'dotenv', 'ai', 'llm', 'llms', 'genai', 'gemini', 'chatbot', 'chatbots',
  'prompt', 'prompts', 'prompting', 'token', 'tokens', 'tokenized', 'tokenizer',
  'embeddings', 'vector', 'vectors', 'rag', 'cron', 'daemon', 'daemons',
  'app', 'apps', 'applet', 'applets', 'ok', 'okay', 'etc', 'eg', 'ie', 'vs',
  'faq', 'faqs', 'kpi', 'kpis', 'roi', 'sla', 'b2b', 'b2c',
  'ctrl', 'cmd', 'esc', 'pgup', 'pgdn', 'del', 'ins', 'fn', 'capslock', 'numlock',
];

const CONTRACTIONS: string[] = [
  "aren't", "can't", "couldn't", "didn't", "doesn't", "don't", "hadn't",
  "hasn't", "haven't", "he'd", "he'll", "he's", "here's", "how's", "i'd",
  "i'll", "i'm", "i've", "isn't", "it'd", "it'll", "it's", "let's",
  "mightn't", "mustn't", "needn't", "shan't", "she'd", "she'll", "she's",
  "shouldn't", "that'd", "that'll", "that's", "there'd", "there'll", "there's",
  "they'd", "they'll", "they're", "they've", "wasn't", "we'd", "we'll",
  "we're", "we've", "weren't", "what'll", "what're", "what's", "what've",
  "where's", "who'd", "who'll", "who're", "who's", "who've", "won't",
  "wouldn't", "you'd", "you'll", "you're", "you've", "y'all", "o'clock",
  "ma'am",
];

// Build tiered sets for fast checking and frequency-prioritized suggestions
const TIER1_LISTS = [en10, am10, br10, en20, am20, br20];
const TIER2_LISTS = [en35, am35, br35, en40, am40, br40, en50, am50, br50];
const TIER3_LISTS = [en55, am55, br55, en60, am60, br60, en70, am70, br70];

const DICTIONARY_SET = new Set<string>();
const COMMON_WORDS_SET = new Set<string>();
const STANDARD_WORDS_SET = new Set<string>();
const TECH_WORDS_SET = new Set<string>();

function addWordsToSets(lists: string[][], targetSet?: Set<string>) {
  for (const list of lists) {
    for (let i = 0; i < list.length; i++) {
      const w = list[i].toLowerCase().trim();
      if (!w) continue;
      DICTIONARY_SET.add(w);
      if (targetSet) targetSet.add(w);
    }
  }
}

addWordsToSets(TIER1_LISTS, COMMON_WORDS_SET);
addWordsToSets(TIER2_LISTS, STANDARD_WORDS_SET);
addWordsToSets(TIER3_LISTS);

for (const w of TECH_AND_MODERN_WORDS) {
  const lower = w.toLowerCase();
  DICTIONARY_SET.add(lower);
  COMMON_WORDS_SET.add(lower);
  TECH_WORDS_SET.add(lower);
}

for (const w of CONTRACTIONS) {
  const lower = w.toLowerCase();
  DICTIONARY_SET.add(lower);
  COMMON_WORDS_SET.add(lower);
}

// Array of common words for fast edit-distance-2 Levenshtein search (~11k words)
const COMMON_WORDS_ARRAY: string[] = Array.from(COMMON_WORDS_SET);

// Cached sorted lists for the Dictionary Page UI
let cachedAllBuiltInWords: string[] | null = null;
let cachedCommonWords: string[] | null = null;
let cachedTechWords: string[] | null = null;

export function getAllBuiltInWords(): string[] {
  if (!cachedAllBuiltInWords) {
    cachedAllBuiltInWords = Array.from(DICTIONARY_SET).sort((a, b) => a.localeCompare(b));
  }
  return cachedAllBuiltInWords;
}

export function getCommonWords(): string[] {
  if (!cachedCommonWords) {
    cachedCommonWords = Array.from(COMMON_WORDS_SET).sort((a, b) => a.localeCompare(b));
  }
  return cachedCommonWords;
}

export function getTechWords(): string[] {
  if (!cachedTechWords) {
    cachedTechWords = Array.from(TECH_WORDS_SET).sort((a, b) => a.localeCompare(b));
  }
  return cachedTechWords;
}

export function isBuiltInWord(word: string): boolean {
  return DICTIONARY_SET.has(word.toLowerCase().trim());
}

export function getDictionaryStats() {
  return {
    totalBuiltIn: DICTIONARY_SET.size,
    commonCount: COMMON_WORDS_SET.size,
    techCount: TECH_WORDS_SET.size,
  };
}

// User dictionary persistence
export const USER_DICTIONARY_STORAGE_KEY = 'markora_user_dictionary';

export function loadUserDictionary(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(USER_DICTIONARY_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(
      Array.isArray(parsed)
        ? parsed.map((w) => String(w).trim().toLowerCase()).filter(Boolean)
        : []
    );
  } catch {
    return new Set();
  }
}

export function saveUserDictionary(words: Set<string> | string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const arr = Array.isArray(words) ? words : Array.from(words);
    localStorage.setItem(USER_DICTIONARY_STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // ignore quota errors
  }
}

/**
 * Checks if a word (with optional inflections/possessives/prefixes) is in the dictionary.
 */
export function isWordInDictionary(
  rawWord: string,
  userDict?: Set<string>,
  ignoredWords?: Set<string>
): boolean {
  if (!rawWord || rawWord.length <= 1) return true;

  const word = rawWord.toLowerCase();

  // 1. Session ignored or custom user dictionary
  if (ignoredWords && ignoredWords.has(word)) return true;
  if (userDict && userDict.has(word)) return true;

  // 2. Direct lookup across 100k+ dictionary
  if (DICTIONARY_SET.has(word)) return true;

  // 3. Possessives & contractions (e.g. "Markora's", "developers'", "would've")
  if (word.includes("'")) {
    if (word.endsWith("'s") || word.endsWith("s'")) {
      const stem = word.endsWith("'s") ? word.slice(0, -2) : word.slice(0, -1);
      if (stem && isWordInDictionary(stem, userDict, ignoredWords)) return true;
    }
    const withoutApos = word.replace(/'/g, '');
    if (DICTIONARY_SET.has(withoutApos)) return true;

    const contractionParts = word.split("'");
    if (contractionParts.length === 2 && ['re', 've', 'll', 'd', 'm', 's'].includes(contractionParts[1])) {
      if (DICTIONARY_SET.has(contractionParts[0])) return true;
    }
  }

  // 4. Common productive English morphological suffixes (handles newly coined or compound stems)
  if (word.endsWith('s') && word.length > 3) {
    if (DICTIONARY_SET.has(word.slice(0, -1))) return true;
    if (word.endsWith('es')) {
      if (DICTIONARY_SET.has(word.slice(0, -2))) return true;
      if (DICTIONARY_SET.has(word.slice(0, -2) + 'e')) return true;
    }
    if (word.endsWith('ies') && DICTIONARY_SET.has(word.slice(0, -3) + 'y')) return true;
  }

  if (word.endsWith('ed') && word.length > 4) {
    if (DICTIONARY_SET.has(word.slice(0, -2))) return true;
    if (DICTIONARY_SET.has(word.slice(0, -1))) return true;
    if (word.endsWith('ied') && DICTIONARY_SET.has(word.slice(0, -3) + 'y')) return true;
    if (word.length > 5 && word[word.length - 3] === word[word.length - 4]) {
      if (DICTIONARY_SET.has(word.slice(0, -3))) return true;
    }
  }

  if (word.endsWith('ing') && word.length > 5) {
    if (DICTIONARY_SET.has(word.slice(0, -3))) return true;
    if (DICTIONARY_SET.has(word.slice(0, -3) + 'e')) return true;
    if (word.length > 6 && word[word.length - 4] === word[word.length - 5]) {
      if (DICTIONARY_SET.has(word.slice(0, -4))) return true;
    }
  }

  if (word.endsWith('ly') && word.length > 4) {
    if (DICTIONARY_SET.has(word.slice(0, -2))) return true;
    if (word.endsWith('ily') && DICTIONARY_SET.has(word.slice(0, -3) + 'y')) return true;
  }

  if (word.endsWith('er') && word.length > 4) {
    if (DICTIONARY_SET.has(word.slice(0, -2))) return true;
    if (DICTIONARY_SET.has(word.slice(0, -1))) return true;
  }
  if (word.endsWith('est') && word.length > 5) {
    if (DICTIONARY_SET.has(word.slice(0, -3))) return true;
    if (DICTIONARY_SET.has(word.slice(0, -2))) return true;
  }

  if (word.endsWith('able') && word.length > 6) {
    if (DICTIONARY_SET.has(word.slice(0, -4)) || DICTIONARY_SET.has(word.slice(0, -4) + 'e')) return true;
  }
  if (word.endsWith('ment') && word.length > 6 && DICTIONARY_SET.has(word.slice(0, -4))) return true;
  if (word.endsWith('ness') && word.length > 6 && DICTIONARY_SET.has(word.slice(0, -4))) return true;
  if (word.endsWith('ful') && word.length > 5 && DICTIONARY_SET.has(word.slice(0, -3))) return true;
  if (word.endsWith('less') && word.length > 6 && DICTIONARY_SET.has(word.slice(0, -4))) return true;

  // Common productive prefixes
  for (const prefix of ['un', 're', 'dis', 'pre', 'non', 'mis', 'sub', 'over', 'under', 'auto', 'multi', 'anti']) {
    if (word.startsWith(prefix) && word.length > prefix.length + 2) {
      const stem = word.slice(prefix.length);
      if (DICTIONARY_SET.has(stem) || (userDict && userDict.has(stem))) return true;
    }
  }

  return false;
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/**
 * Generates all words within edit distance 1 (deletes, transposes, replaces, inserts)
 * and tests them in O(1) against DICTIONARY_SET & userDict.
 */
function findEdit1Matches(word: string, userDict?: Set<string>): string[] {
  const matches = new Set<string>();
  const len = word.length;

  const checkAndAdd = (candidate: string) => {
    if (candidate !== word && (DICTIONARY_SET.has(candidate) || (userDict && userDict.has(candidate)))) {
      matches.add(candidate);
    }
  };

  // Deletions
  for (let i = 0; i < len; i++) {
    checkAndAdd(word.slice(0, i) + word.slice(i + 1));
  }

  // Adjacent transpositions
  for (let i = 0; i < len - 1; i++) {
    checkAndAdd(word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2));
  }

  // Substitutions
  for (let i = 0; i < len; i++) {
    const before = word.slice(0, i);
    const after = word.slice(i + 1);
    for (let c = 0; c < ALPHABET.length; c++) {
      const ch = ALPHABET[c];
      if (ch !== word[i]) {
        checkAndAdd(before + ch + after);
      }
    }
  }

  // Insertions
  for (let i = 0; i <= len; i++) {
    const before = word.slice(0, i);
    const after = word.slice(i);
    for (let c = 0; c < ALPHABET.length; c++) {
      checkAndAdd(before + ALPHABET[c] + after);
    }
  }

  // Space split (e.g. "alot" -> "a lot", "thankyou" -> "thank you")
  for (let i = 2; i <= len - 2; i++) {
    const left = word.slice(0, i);
    const right = word.slice(i);
    if (COMMON_WORDS_SET.has(left) && COMMON_WORDS_SET.has(right)) {
      matches.add(`${left} ${right}`);
    }
  }

  return Array.from(matches);
}

/**
 * Levenshtein distance with early exit threshold
 */
function levenshteinDistance(a: string, b: string, maxDist = 2): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > maxDist) return 99;

  const aLen = a.length;
  const bLen = b.length;

  let prev = new Array(bLen + 1);
  let curr = new Array(bLen + 1);

  for (let j = 0; j <= bLen; j++) prev[j] = j;

  for (let i = 1; i <= aLen; i++) {
    curr[0] = i;
    let minInRow = curr[0];

    for (let j = 1; j <= bLen; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1];
      } else {
        curr[j] = Math.min(
          prev[j - 1] + 1,
          curr[j - 1] + 1,
          prev[j] + 1
        );
      }
      if (curr[j] < minInRow) minInRow = curr[j];
    }

    if (minInRow > maxDist) return 99;
    [prev, curr] = [curr, prev];
  }

  return prev[bLen];
}

/**
 * Matches original capitalization (lowercase, Capitalized, UPPERCASE)
 */
export function matchCase(original: string, replacement: string): string {
  if (!original || !replacement) return replacement;
  if (original.length > 1 && original === original.toUpperCase()) {
    return replacement.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1).toLowerCase();
  }
  return replacement.toLowerCase();
}

/**
 * Returns up to 5 best spelling suggestions, prioritizing frequency & edit distance.
 */
export function getSpellingSuggestions(rawWord: string, userDict?: Set<string>): string[] {
  const word = rawWord.toLowerCase();

  // 1. Direct typo lookup
  if (COMMON_TYPOS[word]) {
    return COMMON_TYPOS[word].map((w) => matchCase(rawWord, w));
  }

  const scored = new Map<string, number>();
  const firstChar = word[0];
  const wordLen = word.length;

  const scoreCandidate = (candidate: string, baseDistScore: number) => {
    let score = baseDistScore;
    if (userDict?.has(candidate)) {
      score -= 8; // prioritize user's custom words
    } else if (COMMON_WORDS_SET.has(candidate)) {
      score -= 6; // prioritize Tier 1 common English words
    } else if (STANDARD_WORDS_SET.has(candidate)) {
      score -= 2; // Tier 2 standard English words
    }
    if (candidate[0] !== firstChar) score += 4;
    if (Math.abs(candidate.length - wordLen) > 0) score += 2;
    if (candidate.includes(' ')) score += 3;

    const prev = scored.get(candidate);
    if (prev === undefined || score < prev) {
      scored.set(candidate, score);
    }
  };

  // 2. Fast O(L) edit-distance-1 check across entire 100k+ word dictionary
  const edit1 = findEdit1Matches(word, userDict);
  for (const match of edit1) {
    scoreCandidate(match, 10);
  }

  // 3. If needed, search Tier 1 common words + user dictionary within Levenshtein distance 2
  if (scored.size < 5) {
    const searchPool = userDict && userDict.size > 0
      ? [...COMMON_WORDS_ARRAY, ...Array.from(userDict)]
      : COMMON_WORDS_ARRAY;

    for (let i = 0; i < searchPool.length; i++) {
      const candidate = searchPool[i];
      if (Math.abs(candidate.length - wordLen) > 2) continue;
      if (scored.has(candidate)) continue;

      const dist = levenshteinDistance(word, candidate, 2);
      if (dist <= 2) {
        scoreCandidate(candidate, dist * 12);
      }
    }
  }

  const sorted = Array.from(scored.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([w]) => w);

  const seen = new Set<string>();
  const result: string[] = [];

  for (const w of sorted) {
    const formatted = matchCase(rawWord, w);
    if (!seen.has(formatted.toLowerCase()) && formatted.toLowerCase() !== word) {
      seen.add(formatted.toLowerCase());
      result.push(formatted);
      if (result.length >= 5) break;
    }
  }

  return result;
}
