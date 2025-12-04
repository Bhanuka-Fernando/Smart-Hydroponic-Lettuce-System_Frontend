// src/auth/AuthProvider.tsx
import React, { useState, useCallback, PropsWithChildren } from "react";
import { AuthContext } from "./AuthContext";
import type { AuthUser } from "./types";

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const signIn = useCallback(
    (params: { user: AuthUser; accessToken: string; refreshToken: string | null }) => {
      setUser(params.user);
      setAccessToken(params.accessToken);
      setRefreshToken(params.refreshToken);
    },
    []
  );

  const signOut = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  }, []);

  const value = {
    user,
    accessToken,
    refreshToken,
    isLoading,
    signIn,
    signOut,
    setLoading: setIsLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
