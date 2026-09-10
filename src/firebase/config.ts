import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;
