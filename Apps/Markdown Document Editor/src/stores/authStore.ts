import { create } from 'zustand';
import { User } from 'firebase/auth';
import { initAuthListener, signInWithGoogle, logoutUser } from '../lib/firebase/firebase';
import {
  subscribeToUserDocuments,
  saveUserDocumentToFirestore,
  deleteUserDocumentFromFirestore
} from '../lib/firebase/firestoreService';
import { useDocumentStore } from './documentStore';
import { Document } from '../types/common.types';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  initAuth: () => () => void;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
  syncDocumentToCloud: (doc: Document) => Promise<void>;
  deleteCloudDocument: (docId: string) => Promise<void>;
}

let unsubFirestore: (() => void) | null = null;

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  loading: true,
  error: null,

  initAuth: () => {
    set({ loading: true });
    const unsubscribe = initAuthListener(
      (user, token) => {
        set({ user, accessToken: token, loading: false, error: null });

        // Unsubscribe from previous firestore listener if any
        if (unsubFirestore) {
          unsubFirestore();
          unsubFirestore = null;
        }

        // Subscribe to real-time Firestore user documents
        if (user) {
          unsubFirestore = subscribeToUserDocuments(user.uid, (cloudDocs) => {
            if (cloudDocs.length > 0) {
              const localDocs = useDocumentStore.getState().documents;
              // Merge cloud docs with local docs
              const docMap = new Map<string, Document>();
              localDocs.forEach((d) => docMap.set(d.id, d));
              cloudDocs.forEach((cd) => docMap.set(cd.id, cd));

              const merged = Array.from(docMap.values());
              useDocumentStore.setState({ documents: merged });
            }
          });
        }
      },
      () => {
        set({ user: null, accessToken: null, loading: false, error: null });
        if (unsubFirestore) {
          unsubFirestore();
          unsubFirestore = null;
        }
      }
    );

    return () => {
      unsubscribe();
      if (unsubFirestore) {
        unsubFirestore();
      }
    };
  },

  signIn: async () => {
    set({ loading: true, error: null });
    try {
      const res = await signInWithGoogle();
      if (res) {
        set({ user: res.user, accessToken: res.accessToken, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      set({ error: err.message || 'Failed to sign in with Google', loading: false });
    }
  },

  signOutUser: async () => {
    set({ loading: true });
    try {
      await logoutUser();
      if (unsubFirestore) {
        unsubFirestore();
        unsubFirestore = null;
      }
      set({ user: null, accessToken: null, loading: false });
    } catch (err: any) {
      console.error('Sign-out error:', err);
      set({ error: err.message || 'Failed to sign out', loading: false });
    }
  },

  syncDocumentToCloud: async (doc: Document) => {
    const { user } = get();
    if (!user) return;
    try {
      await saveUserDocumentToFirestore(user.uid, doc);
    } catch (err) {
      console.error('Error syncing doc to cloud:', err);
    }
  },

  deleteCloudDocument: async (docId: string) => {
    const { user } = get();
    if (!user) return;
    try {
      await deleteUserDocumentFromFirestore(user.uid, docId);
    } catch (err) {
      console.error('Error deleting cloud doc:', err);
    }
  },
}));
