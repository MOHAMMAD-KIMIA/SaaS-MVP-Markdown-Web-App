// src/stores/commentStore.ts
import { create } from 'zustand';
import type { Comment, CommentReply } from '../types/common.types';
import { generateId } from '../lib/utils/ids';
import { getCurrentTimestamp } from '../lib/utils/dates';
import { loadFromLocalStorage, saveToLocalStorage } from '../lib/storage/localStorage';

const STORAGE_KEY = 'markora-comments';
const AUTHOR_STORAGE_KEY = 'markora-comment-author';
const FILTER_STORAGE_KEY = 'markora-comment-filter';

export type CommentFilter = 'all' | 'unresolved' | 'resolved';

export interface PendingCommentDraft {
  documentId: string;
  quotedText: string;
  range: { start: number; end: number };
}

function matchesStatusToken(isResolved: boolean, token: string): boolean {
  if (!token) return false;
  if (isResolved) {
    return (
      (token.length >= 2 && 'resolved'.startsWith(token)) ||
      (token.length >= 2 && 'solved'.startsWith(token)) ||
      (token.length >= 2 && 'closed'.startsWith(token)) ||
      token === 'done'
    );
  }
  return (
    (token.length >= 2 && 'unresolved'.startsWith(token)) ||
    (token.length >= 2 && 'open'.startsWith(token)) ||
    (token.length >= 2 && 'pending'.startsWith(token))
  );
}

export function matchesCommentSearch(comment: Comment, rawQuery: string): boolean {
  const normalized = rawQuery.trim().toLowerCase();
  if (!normalized) return true;

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const replies = comment.replies || [];
  const authorText = [comment.author || 'Reviewer', ...replies.map((r) => r.author)]
    .join(' ')
    .toLowerCase();
  const contentText = [
    comment.text,
    comment.quotedText || '',
    ...replies.map((r) => r.text),
  ]
    .join(' ')
    .toLowerCase();
  const isResolved = Boolean(comment.resolved);

  return tokens.every((token) => {
    if (token.startsWith('author:')) {
      const value = token.slice(7);
      return !value || authorText.includes(value);
    }
    if (token.startsWith('status:')) {
      const value = token.slice(7);
      return !value || matchesStatusToken(isResolved, value);
    }
    return (
      contentText.includes(token) ||
      authorText.includes(token) ||
      matchesStatusToken(isResolved, token)
    );
  });
}

interface CommentStore {
  comments: Comment[];
  pendingDraft: PendingCommentDraft | null;
  authorName: string;
  filter: CommentFilter;
  searchQuery: string;
  lastAddedCommentId: string | null;
  lastAddedReplyId: string | null;

  loadFromStorage: () => void;
  saveToStorage: () => void;
  setAuthorName: (name: string) => void;
  setFilter: (filter: CommentFilter) => void;
  setSearchQuery: (query: string) => void;
  getFilteredComments: (documentId: string) => Comment[];
  addComment: (input: {
    documentId: string;
    text: string;
    author?: string;
    quotedText: string;
    range: { start: number; end: number };
  }) => Comment;
  updateComment: (id: string, text: string) => void;
  addReply: (commentId: string, text: string, author?: string) => CommentReply | null;
  deleteReply: (commentId: string, replyId: string) => void;
  toggleResolved: (id: string) => void;
  deleteComment: (id: string) => void;
  setPendingDraft: (draft: PendingCommentDraft | null) => void;
}

export const useCommentStore = create<CommentStore>((set, get) => ({
  comments: [],
  pendingDraft: null,
  authorName: 'Reviewer',
  filter: 'all',
  searchQuery: '',
  lastAddedCommentId: null,
  lastAddedReplyId: null,

  loadFromStorage: () => {
    const stored = loadFromLocalStorage<Comment[]>(STORAGE_KEY, []);
    const savedAuthor = loadFromLocalStorage<string>(AUTHOR_STORAGE_KEY, 'Reviewer');
    const savedFilter = loadFromLocalStorage<CommentFilter>(FILTER_STORAGE_KEY, 'all');
    const validFilter: CommentFilter =
      savedFilter === 'resolved' || savedFilter === 'unresolved' || savedFilter === 'all'
        ? savedFilter
        : 'all';

    set({
      comments: Array.isArray(stored) ? stored : [],
      authorName: typeof savedAuthor === 'string' && savedAuthor.trim() ? savedAuthor : 'Reviewer',
      filter: validFilter,
    });
  },

  saveToStorage: () => {
    saveToLocalStorage(STORAGE_KEY, get().comments);
  },

  setAuthorName: (name) => {
    set({ authorName: name });
    if (name.trim()) {
      saveToLocalStorage(AUTHOR_STORAGE_KEY, name.trim());
    }
  },

  setFilter: (filter) => {
    set({ filter });
    saveToLocalStorage(FILTER_STORAGE_KEY, filter);
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  getFilteredComments: (documentId) => {
    const { comments, filter, searchQuery } = get();
    const docComments = comments.filter(
      (c) => c.documentId === documentId && matchesCommentSearch(c, searchQuery)
    );
    if (filter === 'resolved') return docComments.filter((c) => Boolean(c.resolved));
    if (filter === 'unresolved') return docComments.filter((c) => !c.resolved);
    return docComments;
  },

  addComment: ({ documentId, text, author, quotedText, range }) => {
    const now = getCurrentTimestamp();
    const resolvedAuthor = (author ?? get().authorName).trim() || 'Reviewer';
    const comment: Comment = {
      id: generateId(),
      documentId,
      text: text.trim(),
      author: resolvedAuthor,
      quotedText: quotedText.trim(),
      range,
      resolved: false,
      replies: [],
      createdAt: now,
    };

    set((state) => ({
      comments: [comment, ...state.comments],
      pendingDraft: null,
      authorName: resolvedAuthor,
      lastAddedCommentId: comment.id,
    }));
    saveToLocalStorage(AUTHOR_STORAGE_KEY, resolvedAuthor);
    get().saveToStorage();
    return comment;
  },

  updateComment: (id, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === id ? { ...c, text: trimmed, updatedAt: getCurrentTimestamp() } : c
      ),
    }));
    get().saveToStorage();
  },

  addReply: (commentId, text, author) => {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const resolvedAuthor = (author ?? get().authorName).trim() || 'Reviewer';
    const reply: CommentReply = {
      id: generateId(),
      author: resolvedAuthor,
      text: trimmed,
      createdAt: getCurrentTimestamp(),
    };

    set((state) => ({
      authorName: resolvedAuthor,
      lastAddedReplyId: reply.id,
      comments: state.comments.map((c) =>
        c.id === commentId
          ? {
              ...c,
              replies: [...(c.replies || []), reply],
              updatedAt: getCurrentTimestamp(),
            }
          : c
      ),
    }));
    saveToLocalStorage(AUTHOR_STORAGE_KEY, resolvedAuthor);
    get().saveToStorage();
    return reply;
  },

  deleteReply: (commentId, replyId) => {
    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === commentId
          ? {
              ...c,
              replies: (c.replies || []).filter((r) => r.id !== replyId),
              updatedAt: getCurrentTimestamp(),
            }
          : c
      ),
    }));
    get().saveToStorage();
  },

  toggleResolved: (id) => {
    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === id
          ? { ...c, resolved: !c.resolved, updatedAt: getCurrentTimestamp() }
          : c
      ),
    }));
    get().saveToStorage();
  },

  deleteComment: (id) => {
    set((state) => ({
      comments: state.comments.filter((c) => c.id !== id),
    }));
    get().saveToStorage();
  },

  setPendingDraft: (draft) => set({ pendingDraft: draft }),
}));
