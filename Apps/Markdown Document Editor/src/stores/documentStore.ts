import { create } from 'zustand';
import { Document } from '../types/common.types';
import { generateId } from '../lib/utils/ids';
import { getCurrentTimestamp } from '../lib/utils/dates';
import { loadFromLocalStorage, saveToLocalStorage } from '../lib/storage/localStorage';
import { useSettingsStore } from './settingsStore';
import { formatMarkdown } from '../lib/markdown/formatting';
import { useOfflineSyncStore } from './offlineSyncStore';
import { useAuthStore } from './authStore';
import {
  SAMPLE_PRESENTATION_CONTENT,
  SAMPLE_PRESENTATION_TITLE,
} from '../lib/markdown/samplePresentation';

interface DocumentStore {
  documents: Document[];
  activeDocumentId: string | null;
  lastSyncedAt: string | null;

  // Actions
  createDocument: (title?: string, initialContent?: string) => string;
  importDocuments: (items: Array<{ title: string; content: string }>) => string[];
  restoreDocuments: (
    restoredDocs: Document[],
    restoredActiveId: string | null,
    mode: 'merge' | 'replace'
  ) => number;
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
const SAMPLE_PRESENTATION_SEEDED_KEY = 'markora-sample-presentation-seeded';

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
    const { syncDocumentToCloud } = useAuthStore.getState();
    syncDocumentToCloud(newDocument);
    get().saveToStorage();
    return id;
  },

  importDocuments: (items) => {
    if (!items.length) return [];
    const now = getCurrentTimestamp();
    const createdDocs: Document[] = items.map((item) => ({
      id: generateId(),
      title: item.title.trim() || 'Imported Document',
      content: item.content,
      createdAt: now,
      updatedAt: now,
      version: 1,
      isDirty: false,
    }));

    set((state) => ({
      documents: [...state.documents, ...createdDocs],
      activeDocumentId: createdDocs[0].id,
    }));

    createdDocs.forEach((doc) => {
      useOfflineSyncStore.getState().enqueueChange(doc.id, 'CREATE', doc);
      useAuthStore.getState().syncDocumentToCloud(doc);
    });
    get().saveToStorage(false, false);
    return createdDocs.map((d) => d.id);
  },

  restoreDocuments: (restoredDocs, restoredActiveId, mode) => {
    const now = getCurrentTimestamp();
    const sanitized = restoredDocs.map((d) => ({
      ...d,
      id: d.id || generateId(),
      title: d.title || 'Restored Document',
      content: d.content ?? '',
      createdAt: d.createdAt || now,
      updatedAt: d.updatedAt || now,
      version: d.version || 1,
      isDirty: false,
    }));

    if (mode === 'replace') {
      const nextActiveId =
        sanitized.find((d) => d.id === restoredActiveId)?.id || sanitized[0]?.id || null;
      set({
        documents: sanitized,
        activeDocumentId: nextActiveId,
      });
      get().saveToStorage(true, false);
      return sanitized.length;
    }

    // Merge: keep existing docs, add incoming docs (assign fresh id if collision)
    const existingDocs = get().documents;
    const existingIds = new Set(existingDocs.map((d) => d.id));
    const added: Document[] = sanitized.map((doc) =>
      existingIds.has(doc.id)
        ? { ...doc, id: generateId(), title: `${doc.title} (Restored)` }
        : doc
    );

    set({
      documents: [...existingDocs, ...added],
      activeDocumentId: added[0]?.id || get().activeDocumentId,
    });
    get().saveToStorage(false, false);
    return added.length;
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
      useAuthStore.getState().syncDocumentToCloud(updatedDoc);
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
    useAuthStore.getState().deleteCloudDocument(id);
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
    useAuthStore.getState().syncDocumentToCloud(duplicated);
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
    const rawDocuments = loadFromLocalStorage<Document[]>(STORAGE_KEY, []);
    const activeDocumentId = loadFromLocalStorage<string | null>(ACTIVE_DOC_KEY, null);

    // Sanitize any existing documents that had nested brackets inside Mermaid diagram nodes
    let didSanitize = false;
    const documents = rawDocuments.map((doc) => {
      if (!doc.content) return doc;
      let content = doc.content;

      if (
        content.includes('C[Link via [[WikiLinks') ||
        content.includes('C[Link via [WikiLinks')
      ) {
        content = content.replace(
          /C\[Link via \[*WikiLinks[^\]]*\]*(?:\([^)]*\))?\]+/g,
          'C["Link via WikiLinks"]'
        );
      }

      if (content !== doc.content) {
        didSanitize = true;
        return { ...doc, content };
      }
      return doc;
    });

    if (didSanitize) {
      saveToLocalStorage(STORAGE_KEY, documents);
    }

    // Create a welcome document if none exist
    if (documents.length === 0) {
      const id = generateId();
      const now = getCurrentTimestamp();
      const welcomeDoc: Document = {
        id,
        title: 'Welcome to Markora',
        content: `# Welcome to Markora ✨

A high-performance Markdown workstation for thinkers, writers, and builders.

## 🚀 What's New

### 1. Interactive Checklists in Preview
Click any checkbox directly in the Preview pane on the right—it immediately syncs with your source text:
- [x] Explore Markora's modern interface
- [ ] Try typing \`/\` on a new line below to open Quick Commands
- [ ] Highlight some text to see the floating format bubble
- [ ] Click a WikiLink like [[Project Roadmap]]

### 2. Slash (\`/\`) Commands
Type \`/\` on any empty line to open an instant command menu for headings, callouts, tables, math, and code blocks—no keyboard departure needed!

### 3. Floating Format Bubble & Multi-Color Highlights
Select any word or sentence in the editor to reveal the instant format bubble with 5 vibrant highlight colors: ==classic yellow==, ==green:emerald green==, ==blue:sky blue==, ==pink:rose pink==, and ==purple:royal purple==.

### 4. GitHub & Obsidian-Style Callouts
Callout boxes are beautifully styled with distinct theme colors and icons:

> [!NOTE] Knowledge Base
> You can create bi-directional links to any document using \`[[Document Title]]\`.

> [!TIP] Fast Writing
> Press **Cmd/Ctrl + K** to open the Command Palette, or type \`/\` on an empty line.

> [!IMPORTANT] Bi-Directional Linking
> Open the **Backlinks** tab in the left sidebar to see all references pointing to this note!

> [!WARNING] Cautionary Alert
> Urgent information or warnings stand out clearly in amber cards.

### 5. Mermaid & Math Diagrams
\`\`\`mermaid
graph TD
    A[Draft Idea] --> B[Write with Slash Commands]
    B --> C["Link via WikiLinks"]
    C --> D[Export Clean Document]
\`\`\`

Happy writing!
`,
        createdAt: now,
        updatedAt: now,
        version: 1,
        isDirty: false,
      };

      const alreadySeeded = loadFromLocalStorage<boolean>(
        SAMPLE_PRESENTATION_SEEDED_KEY,
        false
      );
      const hasSampleDeck = documents.some(
        (d) => d.title === SAMPLE_PRESENTATION_TITLE
      );

      if (!alreadySeeded && !hasSampleDeck) {
        const sampleId = generateId();
        const now = getCurrentTimestamp();
        const sampleDoc: Document = {
          id: sampleId,
          title: SAMPLE_PRESENTATION_TITLE,
          content: SAMPLE_PRESENTATION_CONTENT,
          createdAt: now,
          updatedAt: now,
          version: 1,
          isDirty: false,
        };
        const updatedDocs = [welcomeDoc, sampleDoc];
        saveToLocalStorage(SAMPLE_PRESENTATION_SEEDED_KEY, true);
        set({
          documents: updatedDocs,
          activeDocumentId: sampleId,
        });
        get().saveToStorage(true, false);
      } else {
        set({
          documents: [welcomeDoc],
          activeDocumentId: id,
        });
        get().saveToStorage();
      }
    } else {
      const alreadySeeded = loadFromLocalStorage<boolean>(
        SAMPLE_PRESENTATION_SEEDED_KEY,
        false
      );
      const existingSample = documents.find(
        (d) => d.title === SAMPLE_PRESENTATION_TITLE
      );

      if (!alreadySeeded && !existingSample) {
        const sampleId = generateId();
        const now = getCurrentTimestamp();
        const sampleDoc: Document = {
          id: sampleId,
          title: SAMPLE_PRESENTATION_TITLE,
          content: SAMPLE_PRESENTATION_CONTENT,
          createdAt: now,
          updatedAt: now,
          version: 1,
          isDirty: false,
        };
        const nextDocs = [sampleDoc, ...documents];
        saveToLocalStorage(SAMPLE_PRESENTATION_SEEDED_KEY, true);
        saveToLocalStorage(STORAGE_KEY, nextDocs);
        saveToLocalStorage(ACTIVE_DOC_KEY, sampleId);
        set({
          documents: nextDocs,
          activeDocumentId: sampleId,
        });
      } else {
        if (!alreadySeeded) {
          saveToLocalStorage(SAMPLE_PRESENTATION_SEEDED_KEY, true);
        }
        set({
          documents,
          activeDocumentId: activeDocumentId || documents[0]?.id || null,
        });
      }
    }
  },
}));
