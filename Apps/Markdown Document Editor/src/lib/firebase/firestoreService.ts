import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Document } from '../../types/common.types';

export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

export async function saveUserDocumentToFirestore(userId: string, document: Document) {
  const path = `users/${userId}/documents/${document.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'documents', document.id);
    await setDoc(docRef, {
      id: document.id,
      userId,
      title: document.title,
      content: document.content,
      dailyWordGoal: document.dailyWordGoal || null,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      version: document.version || 1,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserDocumentFromFirestore(userId: string, documentId: string) {
  const path = `users/${userId}/documents/${documentId}`;
  try {
    const docRef = doc(db, 'users', userId, 'documents', documentId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getUserDocumentsFromFirestore(userId: string): Promise<Document[]> {
  const path = `users/${userId}/documents`;
  try {
    const colRef = collection(db, 'users', userId, 'documents');
    const snapshot = await getDocs(colRef);
    const documents: Document[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      documents.push({
        id: data.id,
        title: data.title,
        content: data.content,
        dailyWordGoal: data.dailyWordGoal || undefined,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        version: data.version || 1,
        isDirty: false,
      });
    });
    return documents;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export function subscribeToUserDocuments(
  userId: string,
  onUpdate: (documents: Document[]) => void
) {
  const path = `users/${userId}/documents`;
  const colRef = collection(db, 'users', userId, 'documents');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const docs: Document[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        docs.push({
          id: data.id,
          title: data.title,
          content: data.content,
          dailyWordGoal: data.dailyWordGoal || undefined,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          version: data.version || 1,
          isDirty: false,
        });
      });
      onUpdate(docs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
