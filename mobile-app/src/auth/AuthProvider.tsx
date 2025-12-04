// src/auth/AuthProvider.tsx
import React, {
  useState,
  useCallback,
  PropsWithChildren,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "./AuthContext";
import type { AuthUser } from "./types";
import { STORAGE_KEYS } from "./storageKeys";
import {
  login as backendLogin,
  getCurrentUser,
  type LoginRequest,
} from "./authApi";

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // start as true while restoring

  // Map backend user → AuthUser
  const mapBackendUserToAuthUser = (backendUser: {
    id: number;
    email: string;
    full_name: string;
    is_admin: boolean;
  }): AuthUser => ({
    id: String(backendUser.id),
    email: backendUser.email,
    name: backendUser.full_name,
    role: backendUser.is_admin ? "admin" : "farmer",
  });

  // Restore tokens & user on app start
  useEffect(() => {
    const restoreAuthState = async () => {
      try {
        setIsLoading(true);
        const storedAccess = await AsyncStorage.getItem(
          STORAGE_KEYS.ACCESS_TOKEN
        );
        const storedRefresh = await AsyncStorage.getItem(
          STORAGE_KEYS.REFRESH_TOKEN
        );

        if (!storedAccess || !storedRefresh) {
          // no stored auth
          setUser(null);
          setAccessToken(null);
          setRefreshToken(null);
          return;
        }

        // Validate token by calling /auth/me
        const backendUser = await getCurrentUser(storedAccess);
        const authUser = mapBackendUserToAuthUser(backendUser);

        setUser(authUser);
        setAccessToken(storedAccess);
        setRefreshToken(storedRefresh);
      } catch (err) {
        console.warn("Failed to restore auth state:", err);
        // clear invalid tokens
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.ACCESS_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
        ]);
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreAuthState();
  }, []);

  // Sign in using email/password (real backend)
  const signInWithEmailPassword = useCallback(
    async (credentials: LoginRequest) => {
      setIsLoading(true);
      try {
        const loginRes = await backendLogin(credentials);
        const backendUser = await getCurrentUser(loginRes.access_token);
        const authUser = mapBackendUserToAuthUser(backendUser);

        setUser(authUser);
        setAccessToken(loginRes.access_token);
        setRefreshToken(loginRes.refresh_token);

        await AsyncStorage.setItem(
          STORAGE_KEYS.ACCESS_TOKEN,
          loginRes.access_token
        );
        await AsyncStorage.setItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          loginRes.refresh_token
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
    ]);
  }, []);

  const value = {
    user,
    accessToken,
    refreshToken,
    isLoading,

    signIn: (_: {
      user: AuthUser;
      accessToken: string;
      refreshToken: string | null;
    }) => {
      console.warn(
        "Deprecated signIn called directly. Use signInWithEmailPassword from LoginScreen."
      );
    },
    signOut,
    setLoading: setIsLoading,
    signInWithEmailPassword,
  } as any; 

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
