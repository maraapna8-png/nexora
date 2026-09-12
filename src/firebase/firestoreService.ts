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

const OFFLINE_CONVS_KEY = 'writemind_offline_convs_';
const OFFLINE_MSGS_KEY = 'writemind_offline_msgs_';
const OFFLINE_DOCS_KEY = 'writemind_offline_docs_';

function getLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocal<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // quota safe
  }
}

export const firestoreService = {
  // --- CONVERSATIONS ---
  async createConversation(conv: Conversation): Promise<void> {
    // Save to local cache immediately
    const local = getLocal<Conversation>(OFFLINE_CONVS_KEY + conv.userId);
    const updated = [conv, ...local.filter(c => c.id !== conv.id)];
    setLocal(OFFLINE_CONVS_KEY + conv.userId, updated);

    try {
      const docRef = doc(db, 'conversations', conv.id);
      await setDoc(docRef, conv);
    } catch (err) {
      console.warn('Firestore offline note (conversation queued in local cache):', err);
    }
  },

  async getUserConversations(userId: string): Promise<Conversation[]> {
    const localCached = getLocal<Conversation>(OFFLINE_CONVS_KEY + userId);

    try {
      const q = query(
        collection(db, 'conversations'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const remote = snapshot.docs.map(doc => doc.data() as Conversation);
      if (remote.length > 0) {
        setLocal(OFFLINE_CONVS_KEY + userId, remote);
        return remote;
      }
      return localCached;
    } catch (e) {
      try {
        const qFallback = query(
          collection(db, 'conversations'),
          where('userId', '==', userId)
        );
        const snapshot = await getDocs(qFallback);
        const list = snapshot.docs.map(doc => doc.data() as Conversation);
        const sorted = list.sort((a, b) => b.updatedAt - a.updatedAt);
        if (sorted.length > 0) {
          setLocal(OFFLINE_CONVS_KEY + userId, sorted);
          return sorted;
        }
      } catch (fallbackErr) {
        // Return local cache when completely offline
      }
      return localCached;
    }
  },

  async updateConversation(convId: string, updates: Partial<Conversation>): Promise<void> {
    try {
      const docRef = doc(db, 'conversations', convId);
      await updateDoc(docRef, updates);
    } catch (err) {
      console.warn('Firestore offline note (conversation update cached):', err);
    }
  },

  async deleteConversation(convId: string): Promise<void> {
    try {
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
    } catch (err) {
      console.warn('Firestore offline note on delete:', err);
    }
  },

  // --- MESSAGES ---
  async saveMessage(message: Message): Promise<void> {
    const local = getLocal<Message>(OFFLINE_MSGS_KEY + message.conversationId);
    const updated = [...local.filter(m => m.id !== message.id), message];
    setLocal(OFFLINE_MSGS_KEY + message.conversationId, updated);

    try {
      const docRef = doc(db, 'messages', message.id);
      await setDoc(docRef, message);
    } catch (err) {
      console.warn('Firestore offline note (message saved locally):', err);
    }
  },

  async getConversationMessages(convId: string): Promise<Message[]> {
    const localCached = getLocal<Message>(OFFLINE_MSGS_KEY + convId);

    try {
      const q = query(
        collection(db, 'messages'),
        where('conversationId', '==', convId),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      const remote = snapshot.docs.map(doc => doc.data() as Message);
      if (remote.length > 0) {
        setLocal(OFFLINE_MSGS_KEY + convId, remote);
        return remote;
      }
      return localCached;
    } catch (e) {
      try {
        const qFallback = query(
          collection(db, 'messages'),
          where('conversationId', '==', convId)
        );
        const snapshot = await getDocs(qFallback);
        const list = snapshot.docs.map(doc => doc.data() as Message);
        const sorted = list.sort((a, b) => a.createdAt - b.createdAt);
        if (sorted.length > 0) {
          setLocal(OFFLINE_MSGS_KEY + convId, sorted);
          return sorted;
        }
      } catch (fallbackErr) {
        // Return local cache when completely offline
      }
      return localCached;
    }
  },

  async updateMessage(messageId: string, content: string): Promise<void> {
    try {
      const docRef = doc(db, 'messages', messageId);
      await updateDoc(docRef, { content });
    } catch (err) {
      console.warn('Firestore offline note (message edit saved locally):', err);
    }
  },

  // --- DOCUMENTS ---
  async saveDocument(docData: SavedDocument): Promise<void> {
    const local = getLocal<SavedDocument>(OFFLINE_DOCS_KEY + docData.userId);
    const updated = [docData, ...local.filter(d => d.id !== docData.id)];
    setLocal(OFFLINE_DOCS_KEY + docData.userId, updated);

    try {
      const docRef = doc(db, 'documents', docData.id);
      await setDoc(docRef, docData);
    } catch (err) {
      console.warn('Firestore offline note (document saved locally):', err);
    }
  },

  async getUserDocuments(userId: string): Promise<SavedDocument[]> {
    const localCached = getLocal<SavedDocument>(OFFLINE_DOCS_KEY + userId);

    try {
      const q = query(
        collection(db, 'documents'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const remote = snapshot.docs.map(doc => doc.data() as SavedDocument);
      if (remote.length > 0) {
        setLocal(OFFLINE_DOCS_KEY + userId, remote);
        return remote;
      }
      return localCached;
    } catch (e) {
      try {
        const qFallback = query(
          collection(db, 'documents'),
          where('userId', '==', userId)
        );
        const snapshot = await getDocs(qFallback);
        const list = snapshot.docs.map(doc => doc.data() as SavedDocument);
        const sorted = list.sort((a, b) => b.createdAt - a.createdAt);
        if (sorted.length > 0) {
          setLocal(OFFLINE_DOCS_KEY + userId, sorted);
          return sorted;
        }
      } catch (fallbackErr) {
        // Return local cache
      }
      return localCached;
    }
  },

  async deleteDocument(docId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'documents', docId));
    } catch (err) {
      console.warn('Firestore offline note on deleteDocument:', err);
    }
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
      // offline silent fallback
    }
    return null;
  },

  async saveUserSettings(userId: string, settings: UserSettings): Promise<void> {
    try {
      const docRef = doc(db, 'userSettings', userId);
      await setDoc(docRef, {
        ...settings,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore offline note on saveUserSettings:', err);
    }
  }
};
