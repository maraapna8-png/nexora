import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration injected by Google AI Studio
const firebaseConfig = {
  projectId: "gen-lang-client-0272883032",
  appId: "1:974673054914:web:76b9ba291ae079e64abf5b",
  apiKey: "AIzaSyAe9lsjpwxnsUJSF8aAmAqw5G7O--4Xuao",
  authDomain: "gen-lang-client-0272883032.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-8f8191a4-9790-4a83-a080-275026d9e18f",
  storageBucket: "gen-lang-client-0272883032.firebasestorage.app",
  messagingSenderId: "974673054914",
  oAuthClientId: "974673054914-7be938ohlp388tu3hgaf0lcc3tv1bsdv.apps.googleusercontent.com"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;
