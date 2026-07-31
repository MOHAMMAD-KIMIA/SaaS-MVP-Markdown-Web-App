import { create } from 'zustand';
import { Document } from '../types/common.types';
import { generateId } from '../lib/utils/ids';
import { getCurrentTimestamp } from '../lib/utils/dates';
import { loadFromLocalStorage, saveToLocalStorage } from '../lib/storage/localStorage';

interface DocumentStore {
  documents: Document[];
  activeDocumentId: string | null;

  // Actions
  createDocument: (title?: string) => string;
  openDocument: (id: string) => void;
  renameDocument: (id: string, title: string) => void;
  deleteDocument: (id: string) => void;
  duplicateDocument: (id: string) => void;
  updateDocumentContent: (id: string, content: string) => void;
  getActiveDocument: () => Document | null;
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

const STORAGE_KEY = 'markora-documents';
const ACTIVE_DOC_KEY = 'markora-active-document';

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  activeDocumentId: null,

  createDocument: (title = 'Untitled Document') => {
    const id = generateId();
    const now = getCurrentTimestamp();
    const newDocument: Document = {
      id,
      title,
      content: '',
      createdAt: now,
      updatedAt: now,
      version: 1,
      isDirty: false,
    };

    set((state) => ({
      documents: [...state.documents, newDocument],
      activeDocumentId: id,
    }));

    get().saveToStorage();
    return id;
  },

  openDocument: (id: string) => {
    set({ activeDocumentId: id });
    saveToLocalStorage(ACTIVE_DOC_KEY, id);
  },

  renameDocument: (id: string, title: string) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id
          ? { ...doc, title, updatedAt: getCurrentTimestamp() }
          : doc
      ),
    }));
    get().saveToStorage();
  },

  deleteDocument: (id: string) => {
    set((state) => {
      const newDocuments = state.documents.filter((doc) => doc.id !== id);
      const newActiveId =
        state.activeDocumentId === id
          ? newDocuments[0]?.id || null
          : state.activeDocumentId;

      return {
        documents: newDocuments,
        activeDocumentId: newActiveId,
      };
    });
    get().saveToStorage();
  },

  duplicateDocument: (id: string) => {
    const doc = get().documents.find((d) => d.id === id);
    if (!doc) return;

    const newId = generateId();
    const now = getCurrentTimestamp();
    const duplicated: Document = {
      ...doc,
      id: newId,
      title: `${doc.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    set((state) => ({
      documents: [...state.documents, duplicated],
    }));
    get().saveToStorage();
  },

  updateDocumentContent: (id: string, content: string) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              content,
              updatedAt: getCurrentTimestamp(),
              isDirty: true,
            }
          : doc
      ),
    }));
    get().saveToStorage();
  },

  getActiveDocument: () => {
    const { documents, activeDocumentId } = get();
    return documents.find((doc) => doc.id === activeDocumentId) || null;
  },

  saveToStorage: () => {
    const { documents, activeDocumentId } = get();
    saveToLocalStorage(STORAGE_KEY, documents);
    if (activeDocumentId) {
      saveToLocalStorage(ACTIVE_DOC_KEY, activeDocumentId);
    }
  },

  loadFromStorage: () => {
    const documents = loadFromLocalStorage<Document[]>(STORAGE_KEY, []);
    const activeDocumentId = loadFromLocalStorage<string | null>(ACTIVE_DOC_KEY, null);

    // Create a welcome document if none exist
    if (documents.length === 0) {
      const id = generateId();
      const now = getCurrentTimestamp();
      const welcomeDoc: Document = {
        id,
        title: 'Welcome to Markora',
        content: `# Welcome to Markora

A modern Markdown editor for writers, developers, and knowledge workers.

## Getting Started

- Use the **formatting toolbar** to add Markdown elements
- Press **Cmd/Ctrl + K** to open the command palette
- Switch between Editor, Preview, and Split modes
- Customize your document settings in the right sidebar

## Features

### Markdown Support
- Headings, lists, and task lists
- **Bold**, *italic*, and \`code\`
- Links and images
- Tables and blockquotes

### Custom Blocks
::: note
This is a note block
:::

::: tip
Pro tip: Use keyboard shortcuts for faster editing!
:::

### Mermaid Diagrams
\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
\`\`\`

Happy writing! ✨
`,
        createdAt: now,
        updatedAt: now,
        version: 1,
        isDirty: false,
      };

      set({
        documents: [welcomeDoc],
        activeDocumentId: id,
      });
      get().saveToStorage();
    } else {
      set({
        documents,
        activeDocumentId: activeDocumentId || documents[0]?.id || null,
      });
    }
  },
}));
