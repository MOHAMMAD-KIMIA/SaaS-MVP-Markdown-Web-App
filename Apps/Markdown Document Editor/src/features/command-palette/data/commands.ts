export const commands = [
  // View
  { id: 'mode-markdown', label: 'View: Editor Only', category: 'View', shortcut: '' },
  { id: 'mode-preview', label: 'View: Preview Only', category: 'View', shortcut: '' },
  { id: 'mode-split', label: 'View: Split View', category: 'View', shortcut: '' },
  { id: 'open-outline', label: 'View: Document Outline & Heading Minimap', category: 'View', shortcut: '' },
  { id: 'knowledge-graph', label: 'View: Interactive Knowledge Graph', category: 'View', shortcut: '' },
  { id: 'readability-insights', label: 'View: Readability & Writing Style Insights', category: 'View', shortcut: '' },
  { id: 'start-presentation', label: 'View: Present Slide Deck (--- Slides)', category: 'View', shortcut: 'Alt+P' },
  { id: 'focus-mode', label: 'Toggle Focus Mode (Dim Paragraphs)', category: 'View', shortcut: 'F11' },
  { id: 'typewriter-mode', label: 'Toggle Typewriter Scrolling', category: 'View', shortcut: '' },

  // Insert
  { id: 'insert-heading', label: 'Insert Heading', category: 'Insert', shortcut: '' },
  { id: 'insert-link', label: 'Insert Link', category: 'Insert', shortcut: '⌘K' },
  { id: 'insert-image', label: 'Insert Image', category: 'Insert', shortcut: '' },
  { id: 'insert-table', label: 'Visual Table Builder', category: 'Insert', shortcut: '' },
  { id: 'format-tables', label: 'Format Markdown Tables', category: 'Format', shortcut: '' },
  { id: 'insert-code-block', label: 'Insert Code Block', category: 'Insert', shortcut: '' },

  // Format
  { id: 'format-bold', label: 'Format: Bold', category: 'Format', shortcut: '⌘B' },
  { id: 'format-italic', label: 'Format: Italic', category: 'Format', shortcut: '⌘I' },
  { id: 'format-code', label: 'Format: Inline Code', category: 'Format', shortcut: '' },

  // Export & Backup
  { id: 'export-html', label: 'Export as HTML', category: 'Export', shortcut: '' },
  { id: 'export-pdf', label: 'Export as PDF', category: 'Export', shortcut: '' },
  { id: 'import-documents', label: 'Import Document (.md, .txt, .html, .docx)', category: 'Tools', shortcut: '' },
  { id: 'workspace-backup', label: 'Workspace Backup & Restore (.zip)', category: 'Tools', shortcut: '' },

  // Tools
  { id: 'search', label: 'Search and Replace', category: 'Tools', shortcut: '⌘F' },
  { id: 'open-comments', label: 'Open Review Comments & Notes', category: 'Tools', shortcut: '' },
  { id: 'asset-manager', label: 'Local Asset Manager (Images)', category: 'Tools', shortcut: '' },
  { id: 'fold-code', label: 'Fold All Code Blocks', category: 'View', shortcut: 'Ctrl+Shift+[' },
  { id: 'unfold-code', label: 'Unfold All Code Blocks', category: 'View', shortcut: 'Ctrl+Shift+]' },
  { id: 'templates', label: 'Open Template Picker', category: 'Tools', shortcut: '' },
  { id: 'history', label: 'View Document History & Diff', category: 'Tools', shortcut: '' },
];
