// src/lib/markdown/frontmatter.ts

export interface CustomFrontmatterProperty {
  key: string;
  value: string;
}

export interface FrontmatterData {
  hasFrontmatter: boolean;
  tags: string[];
  author: string;
  status: string;
  date: string;
  folder: string;
  customProperties: CustomFrontmatterProperty[];
  body: string;
}

const KNOWN_KEYS = new Set(['tags', 'tag', 'author', 'status', 'date', 'folder', 'category']);

function unquoteYamlScalar(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  return trimmed;
}

function formatYamlScalar(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '""';
  if (/[:#[\]{}&*!|>'"%@`]/.test(trimmed) || /^\s|\s$/.test(value)) {
    return `"${trimmed.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return trimmed;
}

function parseInlineTagList(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((t) => unquoteYamlScalar(t))
      .map((t) => t.replace(/^#/, '').trim())
      .filter(Boolean);
  }
  return trimmed
    .split(',')
    .map((t) => unquoteYamlScalar(t))
    .map((t) => t.replace(/^#/, '').trim())
    .filter(Boolean);
}

/**
 * Extracts raw frontmatter lines and body from a Markdown document if present at line 0.
 */
export function splitFrontmatter(content: string): {
  hasFrontmatter: boolean;
  yamlLines: string[];
  body: string;
  frontmatterEndOffset: number;
} {
  if (!content) {
    return { hasFrontmatter: false, yamlLines: [], body: '', frontmatterEndOffset: 0 };
  }

  const normalized = content.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  if (lines[0].trim() !== '---') {
    return { hasFrontmatter: false, yamlLines: [], body: content, frontmatterEndOffset: 0 };
  }

  for (let i = 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === '---' || trimmed === '...') {
      const yamlLines = lines.slice(1, i);
      const restLines = lines.slice(i + 1);
      // Trim a single separating blank line after closing ---
      const body = restLines.join('\n').replace(/^\n+/, '');
      const frontmatterEndOffset = lines.slice(0, i + 1).join('\n').length + 1;
      return {
        hasFrontmatter: true,
        yamlLines,
        body,
        frontmatterEndOffset: Math.min(content.length, frontmatterEndOffset),
      };
    }
  }

  return { hasFrontmatter: false, yamlLines: [], body: content, frontmatterEndOffset: 0 };
}

export function stripLeadingFrontmatter(content: string): string {
  return splitFrontmatter(content).body;
}

export function parseFrontmatter(content: string): FrontmatterData {
  const { hasFrontmatter, yamlLines, body } = splitFrontmatter(content);

  if (!hasFrontmatter) {
    return {
      hasFrontmatter: false,
      tags: [],
      author: '',
      status: '',
      date: '',
      folder: '',
      customProperties: [],
      body: content,
    };
  }

  const tags: string[] = [];
  let author = '';
  let status = '';
  let date = '';
  let folder = '';
  const customProperties: CustomFrontmatterProperty[] = [];

  let activeListKey: string | null = null;

  for (const line of yamlLines) {
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    const listItemMatch = line.match(/^\s*-\s+(.+)$/);
    if (listItemMatch && activeListKey === 'tags') {
      const item = unquoteYamlScalar(listItemMatch[1]).replace(/^#/, '').trim();
      if (item && !tags.includes(item)) {
        tags.push(item);
      }
      continue;
    }

    const kvMatch = line.match(/^([A-Za-z0-9_.-]+)\s*:\s*(.*)$/);
    if (!kvMatch) {
      activeListKey = null;
      continue;
    }

    const rawKey = kvMatch[1].trim();
    const keyLower = rawKey.toLowerCase();
    const rawVal = kvMatch[2].trim();

    if (keyLower === 'tags' || keyLower === 'tag') {
      if (!rawVal) {
        activeListKey = 'tags';
      } else {
        activeListKey = null;
        for (const t of parseInlineTagList(rawVal)) {
          if (!tags.includes(t)) tags.push(t);
        }
      }
      continue;
    }

    activeListKey = null;
    const value = unquoteYamlScalar(rawVal);

    if (keyLower === 'author') {
      author = value;
    } else if (keyLower === 'status') {
      status = value;
    } else if (keyLower === 'date') {
      date = value;
    } else if (keyLower === 'folder' || keyLower === 'category') {
      if (!folder) folder = value;
    } else if (!KNOWN_KEYS.has(keyLower)) {
      customProperties.push({ key: rawKey, value });
    }
  }

  return {
    hasFrontmatter: true,
    tags,
    author,
    status,
    date,
    folder,
    customProperties,
    body,
  };
}

export function serializeFrontmatter(data: Omit<FrontmatterData, 'hasFrontmatter'>): string {
  const lines: string[] = [];

  const cleanTags = Array.from(
    new Set(data.tags.map((t) => t.replace(/^#/, '').trim()).filter(Boolean))
  );
  if (cleanTags.length > 0) {
    lines.push(`tags: [${cleanTags.map(formatYamlScalar).join(', ')}]`);
  }
  if (data.author.trim()) {
    lines.push(`author: ${formatYamlScalar(data.author)}`);
  }
  if (data.status.trim()) {
    lines.push(`status: ${formatYamlScalar(data.status)}`);
  }
  if (data.date.trim()) {
    lines.push(`date: ${formatYamlScalar(data.date)}`);
  }
  if (data.folder.trim()) {
    lines.push(`folder: ${formatYamlScalar(data.folder)}`);
  }

  for (const prop of data.customProperties) {
    const k = prop.key.trim().replace(/[^\w.-]/g, '_');
    if (!k) continue;
    lines.push(`${k}: ${formatYamlScalar(prop.value)}`);
  }

  const trimmedBody = data.body.replace(/^\n+/, '');
  if (lines.length === 0) {
    return trimmedBody;
  }

  return `---\n${lines.join('\n')}\n---\n\n${trimmedBody}`;
}

export function extractDocumentTags(content: string): string[] {
  return parseFrontmatter(content).tags;
}
