import mermaid from 'mermaid';

export type MermaidThemeOption = 'auto' | 'default' | 'dark' | 'forest' | 'neutral';

export interface MermaidTemplate {
  id: string;
  label: string;
  category: string;
  description: string;
  code: string;
}

export const MERMAID_TEMPLATES: MermaidTemplate[] = [
  {
    id: 'flowchart',
    label: 'Flowchart',
    category: 'Process',
    description: 'Decision tree with subgraphs & styled nodes',
    code: `flowchart TD
  A([Start Request]) --> B{Authenticated?}
  B -- Yes --> C[(Fetch Data)]
  B -- No --> D[Redirect to Login]
  C --> E{Cache Hit?}
  E -- Hit --> F[Return Fast Response]
  E -- Miss --> G[Compute & Store]
  G --> F`,
  },
  {
    id: 'sequence',
    label: 'Sequence Diagram',
    category: 'Interaction',
    description: 'API calls, activations & conditional blocks',
    code: `sequenceDiagram
  autonumber
  actor User
  participant Client as Web App
  participant API as Gateway API
  participant DB as Database

  User->>Client: Click Save Document
  Client->>+API: POST /api/documents
  alt Valid Token
    API->>+DB: UPSERT document
    DB-->>-API: 200 OK (Saved)
    API-->>Client: JSON { status: "synced" }
  else Expired Session
    API-->>-Client: 401 Unauthorized
  end
  Client-->>User: Update Sync Status`,
  },
  {
    id: 'er',
    label: 'ER Diagram',
    category: 'Data',
    description: 'Database entities & cardinality relationships',
    code: `erDiagram
  WORKSPACE ||--o{ DOCUMENT : contains
  DOCUMENT ||--o{ REVISION : tracks
  DOCUMENT }o--o{ TAG : labeled_with
  USER ||--o{ DOCUMENT : authors

  DOCUMENT {
    string id PK
    string title
    text content
    datetime updated_at
  }
  TAG {
    string name PK
    string color
  }`,
  },
  {
    id: 'state',
    label: 'State Diagram',
    category: 'Behavior',
    description: 'Lifecycle states, transitions & nested states',
    code: `stateDiagram-v2
  [*] --> Draft
  Draft --> Reviewing : Submit
  Reviewing --> ChangesRequested : Request Edits
  ChangesRequested --> Draft : Revise
  Reviewing --> Approved : Approve
  Approved --> Published : Deploy
  Published --> Archived : Deprecate
  Archived --> [*]`,
  },
  {
    id: 'class',
    label: 'Class Diagram',
    category: 'Architecture',
    description: 'Classes, properties, methods & inheritance',
    code: `classDiagram
  class Document {
    +string id
    +string title
    +string content
    +save() void
    +exportHtml() string
  }
  class MarkdownParser {
    +parseFrontmatter(raw) Meta
    +extractHeadings(raw) Heading[]
  }
  class Exporter {
    <<interface>>
    +export(doc) Blob
  }
  Document --> MarkdownParser : uses
  Document ..|> Exporter : implements`,
  },
  {
    id: 'gantt',
    label: 'Gantt Chart',
    category: 'Planning',
    description: 'Project timeline, dependencies & milestones',
    code: `gantt
  title Product Release Roadmap
  dateFormat YYYY-MM-DD
  section Discovery
    User Research       :done, r1, 2026-01-05, 5d
    Architecture Spec   :done, r2, after r1, 4d
  section Engineering
    Core Editor Engine  :active, e1, after r2, 8d
    Diagram Studio      :e2, after r2, 6d
  section Launch
    QA & Polish         :crit, q1, after e1, 4d
    Release v2.0        :milestone, after q1, 0d`,
  },
  {
    id: 'mindmap',
    label: 'Mindmap',
    category: 'Ideation',
    description: 'Hierarchical brainstorming & topic branches',
    code: `mindmap
  root((Markora Studio))
    Writing
      Zen Mode
      Readability Insights
      Spell Checker
    Diagrams
      Flowcharts
      Sequence Diagrams
      ER & Class Models
    Knowledge
      WikiLinks
      Backlinks
      Knowledge Graph`,
  },
  {
    id: 'pie',
    label: 'Pie Chart',
    category: 'Analytics',
    description: 'Proportional breakdown with live percentages',
    code: `pie showData
  title Document Content Breakdown
  "Prose & Narrative" : 52
  "Code Snippets" : 24
  "Diagrams & Charts" : 14
  "Tables & Callouts" : 10`,
  },
  {
    id: 'git',
    label: 'Git Graph',
    category: 'Workflow',
    description: 'Branching, commits, merges & release tags',
    code: `gitGraph
  commit id: "init"
  branch feat/mermaid-studio
  checkout feat/mermaid-studio
  commit id: "parser"
  commit id: "zoom-pan"
  checkout main
  merge feat/mermaid-studio tag: "v2.1"
  commit id: "docs"`,
  },
  {
    id: 'quadrant',
    label: 'Quadrant Chart',
    category: 'Strategy',
    description: '2x2 prioritization matrix (Impact vs Effort)',
    code: `quadrantChart
  title Feature Prioritization Matrix
  x-axis Low Effort --> High Effort
  y-axis Low Impact --> High Impact
  quadrant-1 Strategic Bets
  quadrant-2 Quick Wins
  quadrant-3 Low Priority
  quadrant-4 Time Sinks
  Zen Mode: [0.25, 0.82]
  TOC Sidebar: [0.32, 0.78]
  Diagram Studio: [0.58, 0.88]
  Legacy Importer: [0.76, 0.28]`,
  },
];

let renderQueue: Promise<void> = Promise.resolve();
let lastConfiguredTheme: string | null = null;

function resolveMermaidTheme(
  themeOption: MermaidThemeOption,
  appTheme?: 'light' | 'dark' | 'sepia'
): 'default' | 'dark' | 'forest' | 'neutral' | 'base' {
  if (themeOption !== 'auto') {
    return themeOption;
  }
  if (appTheme === 'dark') return 'dark';
  if (appTheme === 'sepia') return 'neutral';
  return 'default';
}

export function initializeMermaid(
  theme: 'default' | 'dark' | 'forest' | 'neutral' | 'base' = 'default'
) {
  if (lastConfiguredTheme === theme) return;
  try {
    const mermaidObj = (mermaid as any).default || mermaid;
    mermaidObj.initialize({
      startOnLoad: false,
      theme,
      securityLevel: 'loose',
      fontFamily: 'inherit',
      flowchart: {
        htmlLabels: true,
        useMaxWidth: true,
      },
      suppressErrorRendering: true,
    });
    lastConfiguredTheme = theme;
  } catch (e) {
    console.error('Failed to initialize Mermaid:', e);
  }
}

export function sanitizeMermaidCode(code: string): string {
  if (!code) return '';
  // Fix accidental WikiLink syntax pasted inside a bracketed flowchart label
  // without touching valid Mermaid subroutines like A[[Subroutine]] or indentation-sensitive diagrams.
  return code.replace(
    /\[([^\[\]\r\n]+?)\[\[([^\[\]\r\n]+?)\]\](?:\([^)]*\))?\]/g,
    '["$1 $2"]'
  );
}

export function detectMermaidDiagramType(code: string): string {
  const lines = (code || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('%%'));

  const first = lines[0]?.toLowerCase() || '';
  if (first.startsWith('flowchart') || first.startsWith('graph')) return 'Flowchart';
  if (first.startsWith('sequencediagram')) return 'Sequence';
  if (first.startsWith('classdiagram')) return 'Class Diagram';
  if (first.startsWith('statediagram')) return 'State Diagram';
  if (first.startsWith('erdiagram')) return 'ER Diagram';
  if (first.startsWith('gantt')) return 'Gantt Chart';
  if (first.startsWith('mindmap')) return 'Mindmap';
  if (first.startsWith('pie')) return 'Pie Chart';
  if (first.startsWith('gitgraph')) return 'Git Graph';
  if (first.startsWith('timeline')) return 'Timeline';
  if (first.startsWith('quadrantchart')) return 'Quadrant';
  if (first.startsWith('journey')) return 'User Journey';
  if (first.startsWith('c4')) return 'C4 Diagram';
  return 'Diagram';
}

export async function renderMermaid(
  code: string,
  _id: string,
  options?: {
    theme?: MermaidThemeOption;
    appTheme?: 'light' | 'dark' | 'sepia';
  }
): Promise<string> {
  const rawCode = code ? code.trim() : '';
  if (!rawCode) {
    return '';
  }

  const cleanCode = sanitizeMermaidCode(rawCode);
  const resolvedTheme = resolveMermaidTheme(
    options?.theme ?? 'auto',
    options?.appTheme
  );

  // Serialize mermaid.initialize + mermaid.render calls so concurrent diagrams
  // with different themes never stomp on the global mermaid configuration.
  const task = renderQueue.then(async () => {
    const mermaidObj = (mermaid as any).default || mermaid;
    initializeMermaid(resolvedTheme);

    const cleanId = 'mermaid' + Math.random().toString(36).substring(2, 10);

    try {
      if (typeof mermaidObj.parse === 'function') {
        await mermaidObj.parse(cleanCode);
      }
      const result = await mermaidObj.render(cleanId, cleanCode);
      const svg = typeof result === 'string' ? result : result?.svg || '';
      return svg;
    } finally {
      try {
        const lingering =
          document.getElementById(`d${cleanId}`) ||
          document.getElementById(cleanId);
        if (lingering && lingering.parentNode) {
          lingering.parentNode.removeChild(lingering);
        }
      } catch {
        // ignore cleanup errors
      }
    }
  });

  // Keep the queue alive even if one render throws a syntax error
  renderQueue = task.then(
    () => undefined,
    () => undefined
  );

  return task;
}
