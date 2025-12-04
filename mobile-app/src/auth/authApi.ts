import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

export interface LoginRequest{
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface RefreshRequest {
    refresh_token: string;
}

export interface RefreshResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface BackendUser {
    id: number;
    email: string;
    full_name: string;
    is_active: boolean;
    is_admin: boolean;
}

const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

// AUTH CALLS

export async function login(data: LoginRequest): Promise<LoginResponse> {
    const res = await client.post<LoginResponse>("/auth/login", data);
    return res.data;
}

export async function getCurrentUser(accessToken:string): Promise<BackendUser> {
    const res = await client.get<BackendUser>("/auth/me", {
        headers:{
            Authorization: `Bearer ${accessToken}`,
        },
    });
    return res.data;
}

export async function refreshToken(data:RefreshRequest): Promise<RefreshResponse> {
    const res = await client.post<RefreshResponse>("/auth/refresh", data);
    return res.data;  
}