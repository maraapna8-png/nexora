import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { authService, AuthUser } from '../firebase/authService';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: User | null;
  loading: boolean;
  isGuest: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'writemind_guest_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync with Firebase Auth state
  useEffect(() => {
    // Check if guest user session exists
    const storedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
    if (storedGuest) {
      try {
        const guestData = JSON.parse(storedGuest);
        setUser(guestData);
        setIsGuest(true);
      } catch (e) {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }
    }

    // Check if returning from redirect sign-in
    authService.checkRedirectResult().catch((err) => {
      console.warn('Redirect result check failed:', err);
    });

    const unsubscribe = authService.subscribeToAuth(async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        setIsGuest(false);
        localStorage.removeItem(GUEST_STORAGE_KEY);
        const mappedUser: AuthUser = {
          uid: fUser.uid,
          email: fUser.email,
          displayName: fUser.displayName || fUser.email?.split('@')[0] || 'User',
          photoURL: fUser.photoURL
        };
        setUser(mappedUser);

        // Ensure user document exists in firestore
        try {
          const userDocRef = doc(db, 'users', fUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (!docSnap.exists()) {
            await setDoc(userDocRef, {
              uid: fUser.uid,
              email: fUser.email,
              displayName: mappedUser.displayName,
              createdAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.warn('User doc initialization non-fatal warning:', err);
        }
      } else {
        // If not a guest, clear user
        if (!localStorage.getItem(GUEST_STORAGE_KEY)) {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const u = await authService.loginWithEmail(email, pass);
      setIsGuest(false);
      localStorage.removeItem(GUEST_STORAGE_KEY);
      setUser({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || email.split('@')[0],
        photoURL: u.photoURL
      });
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const u = await authService.registerWithEmail(email, pass, name);
      setIsGuest(false);
      localStorage.removeItem(GUEST_STORAGE_KEY);
      setUser({
        uid: u.uid,
        email: u.email,
        displayName: name || u.displayName || email.split('@')[0],
        photoURL: u.photoURL
      });
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const u = await authService.loginWithGoogle();
      setIsGuest(false);
      localStorage.removeItem(GUEST_STORAGE_KEY);
      setUser({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        photoURL: u.photoURL
      });
    } finally {
      setLoading(false);
    }
  };

  const loginAsGuest = () => {
    const guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
    const guestUser: AuthUser = {
      uid: guestId,
      email: 'guest@nexora.ai',
      displayName: 'Guest Writer',
      photoURL: null,
      isAnonymous: true
    };
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestUser));
    setUser(guestUser);
    setIsGuest(true);
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem(GUEST_STORAGE_KEY);
      setIsGuest(false);
      setUser(null);
      await authService.logout();
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isGuest,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginAsGuest,
        logout,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
