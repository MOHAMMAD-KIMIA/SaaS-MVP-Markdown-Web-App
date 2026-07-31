export const commands = [
  // View
  { id: 'mode-markdown', label: 'View: Editor Only', category: 'View', shortcut: '' },
  { id: 'mode-preview', label: 'View: Preview Only', category: 'View', shortcut: '' },
  { id: 'mode-split', label: 'View: Split View', category: 'View', shortcut: '' },
  { id: 'focus-mode', label: 'Toggle Focus Mode', category: 'View', shortcut: 'Alt+F' },

  // Insert
  { id: 'insert-heading', label: 'Insert Heading', category: 'Insert', shortcut: '' },
  { id: 'insert-link', label: 'Insert Link', category: 'Insert', shortcut: '⌘K' },
  { id: 'insert-image', label: 'Insert Image', category: 'Insert', shortcut: '' },
  { id: 'insert-table', label: 'Insert Table', category: 'Insert', shortcut: '' },
  { id: 'insert-code-block', label: 'Insert Code Block', category: 'Insert', shortcut: '' },

  // Format
  { id: 'format-bold', label: 'Format: Bold', category: 'Format', shortcut: '⌘B' },
  { id: 'format-italic', label: 'Format: Italic', category: 'Format', shortcut: '⌘I' },
  { id: 'format-code', label: 'Format: Inline Code', category: 'Format', shortcut: '' },

  // Export
  { id: 'export-html', label: 'Export as HTML', category: 'Export', shortcut: '' },
  { id: 'export-pdf', label: 'Export as PDF', category: 'Export', shortcut: '' },

  // Tools
  { id: 'search', label: 'Search and Replace', category: 'Tools', shortcut: '⌘F' },
  { id: 'templates', label: 'Open Template Picker', category: 'Tools', shortcut: '' },
  { id: 'history', label: 'View Document History', category: 'Tools', shortcut: '' },
];
