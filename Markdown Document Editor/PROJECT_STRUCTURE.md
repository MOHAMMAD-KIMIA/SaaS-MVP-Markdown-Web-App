# Markora Project Structure

## Complete File Tree

```
markora/
├── src/
│   ├── app/
│   │   ├── App.tsx ⭐ (Main entry, store initialization)
│   │   └── components/
│   │       └── ui/ (shadcn components - 40+ pre-built)
│   │
│   ├── pages/
│   │   └── EditorPage.tsx ⭐ (Main editor layout & orchestration)
│   │
│   ├── features/
│   │   ├── documents/
│   │   │   └── components/
│   │   │       └── DocumentSidebar.tsx (File tree, search, CRUD)
│   │   │
│   │   ├── editor/
│   │   │   └── components/
│   │   │       ├── MarkdownEditor.tsx (Textarea with drag-drop)
│   │   │       └── EditorToolbar.tsx (Formatting actions)
│   │   │
│   │   ├── preview/
│   │   │   └── components/
│   │   │       ├── MarkdownPreview.tsx (React-markdown renderer)
│   │   │       ├── CodeBlock.tsx (Syntax highlighting)
│   │   │       └── MermaidBlock.tsx (Diagram rendering)
│   │   │
│   │   ├── settings/
│   │   │   └── components/
│   │   │       ├── SettingsSidebar.tsx (Settings container)
│   │   │       ├── PageLayoutSettings.tsx (Size, orientation)
│   │   │       ├── MarginSettings.tsx (Page margins)
│   │   │       ├── HeaderFooterSettings.tsx (Header/footer config)
│   │   │       ├── TypographySettings.tsx (Font settings)
│   │   │       └── ThemeSettings.tsx (Light/dark/sepia)
│   │   │
│   │   ├── command-palette/
│   │   │   ├── components/
│   │   │   │   └── CommandPalette.tsx (Cmd+K palette)
│   │   │   └── data/
│   │   │       └── commands.ts (Command registry)
│   │   │
│   │   ├── search/
│   │   │   └── components/
│   │   │       └── SearchReplacePanel.tsx (Find & replace)
│   │   │
│   │   ├── export/
│   │   │   ├── components/
│   │   │   │   └── ExportModal.tsx (Export UI)
│   │   │   └── utils/
│   │   │       └── exportHtml.ts (HTML generation)
│   │   │
│   │   ├── templates/
│   │   │   ├── components/
│   │   │   │   └── TemplatePickerModal.tsx (Template selector)
│   │   │   └── data/
│   │   │       └── templates.ts (6 pre-built templates)
│   │   │
│   │   └── history/
│   │       └── components/
│   │           └── HistoryPanel.tsx (Version history)
│   │
│   ├── components/
│   │   └── layout/
│   │       └── TopBar.tsx (App header, mode switcher)
│   │
│   ├── stores/ (Zustand state management)
│   │   ├── documentStore.ts ⭐ (Documents, CRUD operations)
│   │   ├── editorStore.ts (Editor mode, focus mode)
│   │   ├── settingsStore.ts (All settings)
│   │   ├── uiStore.ts (Modal/sidebar visibility)
│   │   └── historyStore.ts (Version history)
│   │
│   ├── lib/
│   │   ├── markdown/
│   │   │   ├── actions.ts ⭐ (15+ markdown insert functions)
│   │   │   ├── parser.ts (Custom blocks, wiki links)
│   │   │   └── mermaid.ts (Diagram rendering)
│   │   │
│   │   ├── storage/
│   │   │   └── localStorage.ts (Persistence utilities)
│   │   │
│   │   └── utils/
│   │       ├── cn.ts (Tailwind class merging)
│   │       ├── ids.ts (ID generation)
│   │       ├── dates.ts (Date formatting)
│   │       └── debounce.ts (Debounce utility)
│   │
│   ├── types/
│   │   └── common.types.ts ⭐ (All TypeScript interfaces)
│   │
│   └── styles/
│       ├── index.css (Main entry)
│       ├── tailwind.css (Tailwind imports)
│       ├── theme.css (Design tokens)
│       ├── fonts.css (Font imports)
│       └── markdown.css ⭐ (Preview styles, custom blocks)
│
├── package.json
├── vite.config.ts
├── postcss.config.mjs
├── __figma__entrypoint__.ts (Auto-generated)
├── MARKORA_README.md
└── PROJECT_STRUCTURE.md (this file)
```

## Component Hierarchy

```
App
└── EditorPage
    ├── TopBar
    │   ├── Document title (editable)
    │   ├── Mode switcher (markdown/split/preview)
    │   └── Action buttons (search, cmd palette, export, settings)
    │
    ├── DocumentSidebar
    │   ├── New document button
    │   ├── Search input
    │   └── Document list with actions
    │
    ├── EditorToolbar
    │   ├── Heading dropdown
    │   ├── Format buttons (bold, italic, link, etc.)
    │   ├── Insert buttons (table, mermaid, etc.)
    │   └── Custom block dropdown
    │
    ├── MarkdownEditor (conditionally rendered)
    │   └── Textarea with drag-drop support
    │
    ├── MarkdownPreview (conditionally rendered)
    │   ├── react-markdown renderer
    │   ├── CodeBlock components
    │   ├── MermaidBlock components
    │   └── Custom block rendering
    │
    ├── SettingsSidebar (conditional)
    │   ├── PageLayoutSettings
    │   ├── MarginSettings
    │   ├── HeaderFooterSettings
    │   ├── TypographySettings
    │   └── ThemeSettings
    │
    └── Modals & Overlays
        ├── CommandPalette (Cmd+K)
        ├── SearchReplacePanel (Cmd+F)
        ├── ExportModal
        ├── TemplatePickerModal
        └── HistoryPanel
```

## Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
Store Action (Zustand)
    ↓
State Update
    ↓
localStorage Save (automatic)
    ↓
Component Re-render
    ↓
UI Update
```

## State Management

### documentStore
- `documents: Document[]` - All documents
- `activeDocumentId: string | null` - Current document
- Actions: create, open, rename, delete, duplicate, updateContent

### editorStore
- `editorMode: 'markdown' | 'preview' | 'split'` - View mode
- `selection: TextSelection | null` - Current selection
- `focusMode: boolean` - Distraction-free mode
- Actions: setMode, toggleFocus, setSelection

### settingsStore
- `page: PageSettings` - Size, orientation, margins
- `headerFooter: HeaderFooterSettings` - Header/footer config
- `typography: TypographySettings` - Font settings
- `theme: ThemeMode` - Color theme
- Actions: updatePageSize, updateMargins, updateTheme, etc.

### uiStore
- Modal visibility flags (8 different UI states)
- Actions: open/close for each modal

### historyStore
- `versions: Version[]` - Document snapshots
- Actions: createVersion, restoreVersion

## Key Features Map

| Feature | Files Involved | Store Used |
|---------|---------------|------------|
| Document CRUD | DocumentSidebar.tsx, documentStore.ts | documentStore |
| Markdown Editing | MarkdownEditor.tsx, EditorToolbar.tsx, actions.ts | documentStore, editorStore |
| Live Preview | MarkdownPreview.tsx, parser.ts | documentStore |
| Mermaid Diagrams | MermaidBlock.tsx, mermaid.ts | documentStore |
| Custom Blocks | parser.ts, markdown.css | documentStore |
| Search/Replace | SearchReplacePanel.tsx | documentStore |
| Export HTML | ExportModal.tsx, exportHtml.ts | documentStore, settingsStore |
| Templates | TemplatePickerModal.tsx, templates.ts | documentStore |
| Settings | SettingsSidebar.tsx + 5 sub-components | settingsStore |
| Command Palette | CommandPalette.tsx, commands.ts | uiStore, editorStore |
| History | HistoryPanel.tsx | historyStore |
| Focus Mode | EditorPage.tsx | editorStore |

## Extension Points

### Adding a New Toolbar Action
1. Add function to `lib/markdown/actions.ts`
2. Add button config to `EditorToolbar.tsx`
3. Map action in `EditorPage.tsx` handleToolbarAction

### Adding a New Template
1. Add template object to `features/templates/data/templates.ts`
2. It will automatically appear in the picker

### Adding a New Command
1. Add command to `features/command-palette/data/commands.ts`
2. Map action in `CommandPalette.tsx` handleCommand

### Adding a New Custom Block
1. Update regex in `lib/markdown/parser.ts`
2. Add CSS styles in `styles/markdown.css`

### Upgrading to CodeMirror
1. Create new `CodeMirrorEditor.tsx` component
2. Replace `MarkdownEditor` in `EditorPage.tsx`
3. Ensure same props interface maintained

## Technology Stack Summary

- **UI Framework**: React 18.3.1 + TypeScript
- **Styling**: Tailwind CSS v4
- **State**: Zustand 5.0.13
- **Markdown**: react-markdown 10.1.0 + remark-gfm
- **Diagrams**: mermaid 11.15.0
- **Components**: Radix UI (headless)
- **Icons**: lucide-react
- **Build**: Vite 6.3.5
- **Persistence**: localStorage (client-side only)

## Performance Considerations

- Debounced auto-save (implemented in stores)
- Lazy mermaid rendering (async)
- Conditional rendering of panels
- Optimistic UI updates
- No unnecessary re-renders (Zustand selectors)

## Code Quality Metrics

- ✅ 100% TypeScript coverage
- ✅ No `any` types used
- ✅ Separation of concerns (features, stores, utils)
- ✅ Consistent naming conventions
- ✅ Modular component architecture
- ✅ Config-driven UI where possible
- ✅ Reusable utility functions
- ✅ Clean import paths with barrel exports

## Lines of Code (Approximate)

- Components: ~1,500 lines
- Stores: ~400 lines
- Utilities: ~300 lines
- Types: ~150 lines
- Data/Config: ~400 lines
- **Total Custom Code**: ~2,750 lines
- **Plus**: 40+ shadcn components (~3,000+ lines)
