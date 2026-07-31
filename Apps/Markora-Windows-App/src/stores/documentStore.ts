import { create } from 'zustand';
import { Document } from '../types/common.types';
import { generateId } from '../lib/utils/ids';
import { getCurrentTimestamp } from '../lib/utils/dates';
import { loadFromLocalStorage, saveToLocalStorage } from '../lib/storage/localStorage';
import { useSettingsStore } from './settingsStore';
import { formatMarkdown } from '../lib/markdown/formatting';
import { useOfflineSyncStore } from './offlineSyncStore';

interface DocumentStore {
  documents: Document[];
  activeDocumentId: string | null;
  lastSyncedAt: string | null;

  // Actions
  createDocument: (title?: string, initialContent?: string) => string;
  openDocument: (id: string) => void;
  renameDocument: (id: string, title: string) => void;
  setDailyWordGoal: (id: string, goal: number | undefined) => void;
  deleteDocument: (id: string) => void;
  duplicateDocument: (id: string) => void;
  updateDocumentContent: (id: string, content: string) => void;
  getActiveDocument: () => Document | null;
  formatActiveDocument: () => void;
  saveToStorage: (markClean?: boolean, formatOnSaveTrigger?: boolean) => void;
  loadFromStorage: () => void;
}

const STORAGE_KEY = 'markora-documents';
const ACTIVE_DOC_KEY = 'markora-active-document';

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  activeDocumentId: null,
  lastSyncedAt: null,

  createDocument: (title = 'Untitled Document', initialContent = '') => {
    const id = generateId();
    const now = getCurrentTimestamp();
    const newDocument: Document = {
      id,
      title,
      content: initialContent,
      createdAt: now,
      updatedAt: now,
      version: 1,
      isDirty: false,
    };

    set((state) => ({
      documents: [...state.documents, newDocument],
      activeDocumentId: id,
    }));

    useOfflineSyncStore.getState().enqueueChange(id, 'CREATE', newDocument);
    get().saveToStorage();
    return id;
  },

  openDocument: (id: string) => {
    set({ activeDocumentId: id });
    saveToLocalStorage(ACTIVE_DOC_KEY, id);
  },

  renameDocument: (id: string, title: string) => {
    let updatedDoc: Document | undefined;
    set((state) => ({
      documents: state.documents.map((doc) => {
        if (doc.id === id) {
          updatedDoc = { ...doc, title, updatedAt: getCurrentTimestamp() };
          return updatedDoc;
        }
        return doc;
      }),
    }));

    if (updatedDoc) {
      useOfflineSyncStore.getState().enqueueChange(id, 'UPDATE', updatedDoc);
    }
    get().saveToStorage();
  },

  setDailyWordGoal: (id: string, goal: number | undefined) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id
          ? { ...doc, dailyWordGoal: goal, updatedAt: getCurrentTimestamp() }
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

    useOfflineSyncStore.getState().enqueueChange(id, 'DELETE', { id });
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
      activeDocumentId: newId,
    }));

    useOfflineSyncStore.getState().enqueueChange(newId, 'CREATE', duplicated);
    get().saveToStorage();
  },

  updateDocumentContent: (id: string, content: string) => {
    let updatedDoc: Document | undefined;
    set((state) => ({
      documents: state.documents.map((doc) => {
        if (doc.id === id) {
          updatedDoc = {
            ...doc,
            content,
            updatedAt: getCurrentTimestamp(),
            isDirty: true,
          };
          return updatedDoc;
        }
        return doc;
      }),
    }));

    if (updatedDoc) {
      useOfflineSyncStore.getState().enqueueChange(id, 'UPDATE', updatedDoc);
    }

    const { autoSave } = useSettingsStore.getState();
    if (autoSave?.enabled && autoSave?.interval === 'keystroke') {
      get().saveToStorage(true, false);
    }
  },

  getActiveDocument: () => {
    const { documents, activeDocumentId } = get();
    return documents.find((doc) => doc.id === activeDocumentId) || null;
  },

  formatActiveDocument: () => {
    const { activeDocumentId } = get();
    if (!activeDocumentId) return;

    set((state) => ({
      documents: state.documents.map((doc) => {
        if (doc.id === activeDocumentId) {
          const formatted = formatMarkdown(doc.content);
          return formatted !== doc.content
            ? { ...doc, content: formatted, updatedAt: getCurrentTimestamp(), isDirty: true }
            : doc;
        }
        return doc;
      }),
    }));
    get().saveToStorage(false, false);
  },

  saveToStorage: (markClean = false, formatOnSaveTrigger = true) => {
    const { editor } = useSettingsStore.getState();
    const shouldFormat = formatOnSaveTrigger && (editor?.formatOnSave ?? true);

    if (shouldFormat) {
      set((state) => ({
        documents: state.documents.map((doc) => {
          if (doc.isDirty || doc.id === state.activeDocumentId) {
            const formatted = formatMarkdown(doc.content);
            return formatted !== doc.content ? { ...doc, content: formatted } : doc;
          }
          return doc;
        }),
      }));
    }

    if (markClean) {
      set((state) => ({
        documents: state.documents.map((doc) =>
          doc.isDirty ? { ...doc, isDirty: false } : doc
        ),
      }));
    }
    const { documents, activeDocumentId } = get();
    saveToLocalStorage(STORAGE_KEY, documents);
    if (activeDocumentId) {
      saveToLocalStorage(ACTIVE_DOC_KEY, activeDocumentId);
    }
    set({ lastSyncedAt: new Date().toLocaleTimeString() });
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
