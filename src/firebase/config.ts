import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration injected by Google AI Studio with environment variable fallback support
const firebaseConfig = {
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0272883032",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:974673054914:web:76b9ba291ae079e64abf5b",
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyAe9lsjpwxnsUJSF8aAmAqw5G7O--4Xuao",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0272883032.firebaseapp.com",
  firestoreDatabaseId: (import.meta as any).env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-8f8191a4-9790-4a83-a080-275026d9e18f",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0272883032.firebasestorage.app",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "974673054914",
  oAuthClientId: (import.meta as any).env?.VITE_FIREBASE_OAUTH_CLIENT_ID || "974673054914-7be938ohlp388tu3hgaf0lcc3tv1bsdv.apps.googleusercontent.com"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;
