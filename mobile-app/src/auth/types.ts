export type UserRole = "farmer" | "admin";

export interface AuthUser{
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

export interface AuthState{
    user: AuthUser | null;
    accessToken: string | null;
    refreshToken: string | null;
    isLoading: boolean;
}