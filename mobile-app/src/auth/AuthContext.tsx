import React, {createContext} from "react";
import type { AuthUser } from "./types";

export interface AuthContextValue{
    user: AuthUser | null;
    accessToken: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    signIn: (params: {
        user: AuthUser;
        accessToken: string;
        refreshToken: string | null;
    }) => void;
    signOut: () => void;
    setLoading: (value: boolean) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);