// src/auth/AuthContext.tsx
import React, { createContext } from "react";
import type { AuthUser } from "./types";
import type { LoginRequest } from "../api/authApi";

export interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;

  signInWithEmailPassword: (credentials: LoginRequest) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;

  signOut: () => Promise<void>;
  setLoading: (value: boolean) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);
