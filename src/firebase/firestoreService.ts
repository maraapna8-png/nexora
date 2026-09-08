import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { Conversation, Message, SavedDocument, UserSettings } from '../types';

export const firestoreService = {
  // --- CONVERSATIONS ---
  async createConversation(conv: Conversation): Promise<void> {
    const docRef = doc(db, 'conversations', conv.id);
    await setDoc(docRef, conv);
  },

  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const q = query(
        collection(db, 'conversations'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Conversation);
    } catch (e) {
      console.warn('Fallback getting conversations without index:', e);
      const qFallback = query(
        collection(db, 'conversations'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(qFallback);
      const list = snapshot.docs.map(doc => doc.data() as Conversation);
      return list.sort((a, b) => b.updatedAt - a.updatedAt);
    }
  },

  async updateConversation(convId: string, updates: Partial<Conversation>): Promise<void> {
    const docRef = doc(db, 'conversations', convId);
    await updateDoc(docRef, updates);
  },

  async deleteConversation(convId: string): Promise<void> {
    // Delete conversation document
    await deleteDoc(doc(db, 'conversations', convId));
    // Delete associated messages
    const q = query(collection(db, 'messages'), where('conversationId', '==', convId));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  },

  // --- MESSAGES ---
  async saveMessage(message: Message): Promise<void> {
    const docRef = doc(db, 'messages', message.id);
    await setDoc(docRef, message);
  },

  async getConversationMessages(convId: string): Promise<Message[]> {
    try {
      const q = query(
        collection(db, 'messages'),
        where('conversationId', '==', convId),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Message);
    } catch (e) {
      console.warn('Fallback getting messages:', e);
      const qFallback = query(
        collection(db, 'messages'),
        where('conversationId', '==', convId)
      );
      const snapshot = await getDocs(qFallback);
      const list = snapshot.docs.map(doc => doc.data() as Message);
      return list.sort((a, b) => a.createdAt - b.createdAt);
    }
  },

  async updateMessage(messageId: string, content: string): Promise<void> {
    const docRef = doc(db, 'messages', messageId);
    await updateDoc(docRef, { content });
  },

  // --- DOCUMENTS ---
  async saveDocument(docData: SavedDocument): Promise<void> {
    const docRef = doc(db, 'documents', docData.id);
    await setDoc(docRef, docData);
  },

  async getUserDocuments(userId: string): Promise<SavedDocument[]> {
    try {
      const q = query(
        collection(db, 'documents'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as SavedDocument);
    } catch (e) {
      console.warn('Fallback getting documents:', e);
      const qFallback = query(
        collection(db, 'documents'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(qFallback);
      const list = snapshot.docs.map(doc => doc.data() as SavedDocument);
      return list.sort((a, b) => b.createdAt - a.createdAt);
    }
  },

  async deleteDocument(docId: string): Promise<void> {
    await deleteDoc(doc(db, 'documents', docId));
  },

  // --- USER SETTINGS ---
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const docRef = doc(db, 'userSettings', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserSettings;
      }
    } catch (e) {
      console.error('Error loading user settings from Firestore:', e);
    }
    return null;
  },

  async saveUserSettings(userId: string, settings: UserSettings): Promise<void> {
    const docRef = doc(db, 'userSettings', userId);
    await setDoc(docRef, {
      ...settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }
};
