// src/context/PreferencesContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type PreferencesContextType = {
  // Notifications
  pushNotifications: boolean;
  setPushNotifications: (value: boolean) => void;
  emailNotifications: boolean;
  setEmailNotifications: (value: boolean) => void;
  
  // App Settings
  autoSync: boolean;
  setAutoSync: (value: boolean) => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  language: string;
  setLanguage: (value: string) => void;
  
  // Storage
  clearCache: () => Promise<void>;
  getStorageInfo: () => Promise<StorageInfo>;
  
  // Sync all preferences from storage
  loadPreferences: () => Promise<void>;
  
  // Loading state
  loading: boolean;
};

type StorageInfo = {
  appData: string;
  cache: string;
  images: string;
  total: string;
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PUSH_NOTIFICATIONS: "@preferences/push_notifications",
  EMAIL_NOTIFICATIONS: "@preferences/email_notifications",
  AUTO_SYNC: "@preferences/auto_sync",
  DARK_MODE: "@preferences/dark_mode",
  LANGUAGE: "@preferences/language",
};

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [pushNotifications, setPushNotificationsState] = useState(true);
  const [emailNotifications, setEmailNotificationsState] = useState(false);
  const [autoSync, setAutoSyncState] = useState(true);
  const [darkMode, setDarkModeState] = useState(false);
  const [language, setLanguageState] = useState("English");
  const [loading, setLoading] = useState(true);

  // Load preferences from storage on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const [
        pushNotif,
        emailNotif,
        sync,
        dark,
        lang,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PUSH_NOTIFICATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.EMAIL_NOTIFICATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.AUTO_SYNC),
        AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE),
        AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
      ]);

      if (pushNotif !== null) setPushNotificationsState(pushNotif === "true");
      if (emailNotif !== null) setEmailNotificationsState(emailNotif === "true");
      if (sync !== null) setAutoSyncState(sync === "true");
      if (dark !== null) setDarkModeState(dark === "true");
      if (lang !== null) setLanguageState(lang);
    } catch (error) {
      console.error("Failed to load preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const setPushNotifications = async (value: boolean) => {
    setPushNotificationsState(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PUSH_NOTIFICATIONS, value.toString());
    } catch (error) {
      console.error("Failed to save push notifications preference:", error);
    }
  };

  const setEmailNotifications = async (value: boolean) => {
    setEmailNotificationsState(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EMAIL_NOTIFICATIONS, value.toString());
    } catch (error) {
      console.error("Failed to save email notifications preference:", error);
    }
  };

  const setAutoSync = async (value: boolean) => {
    setAutoSyncState(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTO_SYNC, value.toString());
    } catch (error) {
      console.error("Failed to save auto sync preference:", error);
    }
  };

  const setDarkMode = async (value: boolean) => {
    setDarkModeState(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, value.toString());
      // Here you would trigger theme change
      // Could emit an event or use a theme provider
    } catch (error) {
      console.error("Failed to save dark mode preference:", error);
    }
  };

  const setLanguage = async (value: string) => {
    setLanguageState(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, value);
    } catch (error) {
      console.error("Failed to save language preference:", error);
    }
  };

  const clearCache = async () => {
    try {
      // Get all keys
      const keys = await AsyncStorage.getAllKeys();
      
      // Filter out important keys (auth tokens, preferences)
      const cacheKeys = keys.filter(
        (key) =>
          !key.startsWith("@auth/") &&
          !key.startsWith("@preferences/") &&
          !key.startsWith("@user/")
      );
      
      // Remove cache keys
      await AsyncStorage.multiRemove(cacheKeys);
      
      console.log(`Cleared ${cacheKeys.length} cache entries`);
    } catch (error) {
      console.error("Failed to clear cache:", error);
      throw error;
    }
  };

  const getStorageInfo = async (): Promise<StorageInfo> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const allData = await AsyncStorage.multiGet(keys);
      
      let totalSize = 0;
      let cacheSize = 0;
      let appDataSize = 0;
      let imageSize = 0;

      allData.forEach(([key, value]) => {
        const size = (key.length + (value?.length || 0)) * 2; // Rough estimate in bytes
        totalSize += size;

        if (key.startsWith("@auth/") || key.startsWith("@user/")) {
          appDataSize += size;
        } else if (key.includes("image") || key.includes("photo")) {
          imageSize += size;
        } else {
          cacheSize += size;
        }
      });

      const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      };

      return {
        appData: formatSize(appDataSize),
        cache: formatSize(cacheSize),
        images: formatSize(imageSize),
        total: formatSize(totalSize),
      };
    } catch (error) {
      console.error("Failed to get storage info:", error);
      return {
        appData: "0 MB",
        cache: "0 MB",
        images: "0 MB",
        total: "0 MB",
      };
    }
  };

  return (
    <PreferencesContext.Provider
      value={{
        pushNotifications,
        setPushNotifications,
        emailNotifications,
        setEmailNotifications,
        autoSync,
        setAutoSync,
        darkMode,
        setDarkMode,
        language,
        setLanguage,
        clearCache,
        getStorageInfo,
        loadPreferences,
        loading,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
