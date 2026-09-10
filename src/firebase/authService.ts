import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth, googleProvider } from './config';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

export const authService = {
  // Sign in with email & password
  async loginWithEmail(email: string, pass: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return userCredential.user;
  },

  // Register with email, password & name
  async registerWithEmail(email: string, pass: string, name: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName: name });
    }
    return userCredential.user;
  },

  // Sign in with Google (popup with auto-fallback to redirect if popup is blocked)
  async loginWithGoogle(): Promise<User | null> {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      return userCredential.user;
    } catch (err: any) {
      // If popup is blocked by browser or netlify iframe, fall back to redirect
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        console.warn('Popup blocked, attempting signInWithRedirect fallback...');
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
      throw err;
    }
  },

  // Check for redirect result on app initialization
  async checkRedirectResult(): Promise<User | null> {
    try {
      const result = await getRedirectResult(auth);
      return result ? result.user : null;
    } catch (err) {
      console.warn('Redirect result check non-fatal error:', err);
      return null;
    }
  },

  // Password reset email
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  // Logout
  async logout(): Promise<void> {
    await signOut(auth);
  },

  // Subscribe to auth changes
  subscribeToAuth(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser(): User | null {
    return auth.currentUser;
  }
};

