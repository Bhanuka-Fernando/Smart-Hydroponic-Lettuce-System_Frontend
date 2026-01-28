import React, { useState, useCallback, PropsWithChildren, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "./AuthContext";
import type { AuthUser } from "./types";
import { STORAGE_KEYS } from "./storageKeys";
import {
  login as backendLogin,
  getCurrentUser,
  googleLogin,
  refreshTokens,
  type LoginRequest,
} from "../api/authApi";

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  const clearAuthState = useCallback(async () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
    ]);
  }, []);

  const persistTokens = async (access: string, refresh: string) => {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
  };

  // ✅ Restore tokens & user on startup, with refresh fallback
  useEffect(() => {
    const restoreAuthState = async () => {
      try {
        setIsLoading(true);

        const storedAccess = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const storedRefresh = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

        // ✅ No tokens -> logged out
        if (!storedAccess || !storedRefresh) {
          await clearAuthState();
          return;
        }

        // Try /me with current access token
        try {
          const backendUser = await getCurrentUser(storedAccess);
          const authUser = mapBackendUserToAuthUser(backendUser);

          setUser(authUser);
          setAccessToken(storedAccess);
          setRefreshToken(storedRefresh);
          return;
        } catch {
          // Access token might be expired. Try refresh.
        }

        // Refresh flow
        try {
          const refreshed = await refreshTokens({ refresh_token: storedRefresh });

          const backendUser = await getCurrentUser(refreshed.access_token);
          const authUser = mapBackendUserToAuthUser(backendUser);

          setUser(authUser);
          setAccessToken(refreshed.access_token);
          setRefreshToken(refreshed.refresh_token);

          await persistTokens(refreshed.access_token, refreshed.refresh_token);
        } catch (err) {
          // Refresh failed -> force logout
          await clearAuthState();
        }
      } finally {
        setIsLoading(false);
      }
    };

    restoreAuthState();
  }, [clearAuthState]);

  const signInWithEmailPassword = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const loginRes = await backendLogin(credentials);
      const backendUser = await getCurrentUser(loginRes.access_token);
      const authUser = mapBackendUserToAuthUser(backendUser);

      setUser(authUser);
      setAccessToken(loginRes.access_token);
      setRefreshToken(loginRes.refresh_token);

      await persistTokens(loginRes.access_token, loginRes.refresh_token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async (idToken: string) => {
    setIsLoading(true);
    try {
      const loginRes = await googleLogin({ id_token: idToken });
      const backendUser = await getCurrentUser(loginRes.access_token);
      const authUser = mapBackendUserToAuthUser(backendUser);

      setUser(authUser);
      setAccessToken(loginRes.access_token);
      setRefreshToken(loginRes.refresh_token);

      await persistTokens(loginRes.access_token, loginRes.refresh_token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await clearAuthState();
  }, [clearAuthState]);

  const value = {
    user,
    accessToken,
    refreshToken,
    isLoading,
    signInWithEmailPassword,
    signInWithGoogle,
    signOut,
    setLoading: setIsLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
