// src/api/userApi.ts
import { http } from "./http";

// Types
export type UserProfile = {
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  stats: {
    plants_monitored: number;
    forecasts_made: number;
    weight_scans: number;
    disease_checks: number;
  };
};

export type UserPreferences = {
  user_id: string;
  push_notifications: boolean;
  email_notifications: boolean;
  auto_sync: boolean;
  dark_mode: boolean;
  language: string;
  updated_at: string;
};

export type ProfileUpdateRequest = {
  name?: string;
  phone?: string;
  location?: string;
  bio?: string;
};

export type PreferencesUpdateRequest = {
  push_notifications?: boolean;
  email_notifications?: boolean;
  auto_sync?: boolean;
  dark_mode?: boolean;
  language?: string;
};

export type ChangePasswordRequest = {
  current_password: string;
  new_password: string;
};

/**
 * Get current user's profile
 */
export const getUserProfile = async (token: string): Promise<UserProfile> => {
  const response = await http.get("/api/users/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Update current user's profile
 */
export const updateUserProfile = async (
  token: string,
  data: ProfileUpdateRequest
): Promise<{ message: string; user: any }> => {
  const response = await http.put("/api/users/profile", data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

/**
 * Upload user avatar
 */
export const uploadUserAvatar = async (
  token: string,
  file: {
    uri: string;
    name: string;
    type: string;
  }
): Promise<{ message: string; avatar_url: string }> => {
  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any);

  const response = await http.post("/api/users/avatar", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

/**
 * Get user preferences
 */
export const getUserPreferences = async (
  token: string
): Promise<UserPreferences> => {
  const response = await http.get("/api/users/preferences", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (
  token: string,
  data: PreferencesUpdateRequest
): Promise<{ message: string; preferences: UserPreferences }> => {
  const response = await http.put("/api/users/preferences", data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

/**
 * Change user password
 */
export const changePassword = async (
  token: string,
  data: ChangePasswordRequest
): Promise<{ message: string }> => {
  const response = await http.post("/api/users/change-password", data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

/**
 * Delete user account
 */
export const deleteUserAccount = async (
  token: string,
  password: string
): Promise<{ message: string }> => {
  const response = await http.delete("/api/users/account", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: {
      password,
      confirmation: "DELETE",
    },
  });
  return response.data;
};
