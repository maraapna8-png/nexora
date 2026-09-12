import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

// Configuration loaded from firebase-applet-config.json with environment variable fallback support
const firebaseConfig = {
  ...appletConfig,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || appletConfig.appId,
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  firestoreDatabaseId: (import.meta as any).env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  oAuthClientId: (import.meta as any).env?.VITE_FIREBASE_OAUTH_CLIENT_ID || appletConfig.oAuthClientId
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Non-blocking connection verification as per Firestore guidelines
if (typeof window !== 'undefined') {
  setTimeout(async () => {
    try {
      await getDocFromServer(doc(db, 'system_health', 'ping'));
    } catch (error) {
      if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable'))) {
        console.info('Nexora: Operating in offline-resilient local cache mode.');
      }
    }
  }, 1000);
}

export default app;
