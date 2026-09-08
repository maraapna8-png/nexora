import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings, AIModelType, LanguageOption, WritingStyleOption, ResponseLengthOption, ThemeOption } from '../types';
import { useAuth } from './AuthContext';
import { firestoreService } from '../firebase/firestoreService';

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  loadingSettings: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  defaultLanguage: 'English',
  writingStyle: 'Professional',
  responseLength: 'Short',
  preferredModel: 'gemini-3.1-flash-lite'
};

const SETTINGS_STORAGE_KEY = 'writemind_user_settings';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isGuest } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_SETTINGS;
  });
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Apply dark/light theme class to document
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  // Load from Firestore if authenticated
  useEffect(() => {
    if (user && !isGuest) {
      setLoadingSettings(true);
      firestoreService.getUserSettings(user.uid)
        .then((remoteSettings) => {
          if (remoteSettings) {
            setSettings(prev => ({ ...prev, ...remoteSettings }));
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(remoteSettings));
          }
        })
        .catch((err) => console.warn('Could not sync remote settings:', err))
        .finally(() => setLoadingSettings(false));
    }
  }, [user, isGuest]);

  const updateSettings = async (newValues: Partial<UserSettings>) => {
    const updated = { ...settings, ...newValues };
    setSettings(updated);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));

    if (user && !isGuest) {
      try {
        await firestoreService.saveUserSettings(user.uid, updated);
      } catch (err) {
        console.warn('Failed to save settings to Firestore:', err);
      }
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loadingSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
