import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

export function authHeaders(token?: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// For Expo image uri -> FormData file
export function buildImageFormData(params: {
  imageUri: string;
  fieldName?: string; // default "image"
  plant_id?: string;
  captured_at?: string;
}) {
  const { imageUri, fieldName = "image", plant_id, captured_at } = params;

  const ext = imageUri.split(".").pop()?.toLowerCase() || "jpg";
  const mime =
    ext === "png" ? "image/png" :
    ext === "heic" ? "image/heic" :
    "image/jpeg";

  const fileName = `upload_${Date.now()}.${ext}`;

  const fd = new FormData();
  fd.append(fieldName as any, {
    uri: imageUri,
    name: fileName,
    type: mime,
  } as any);

  if (plant_id) fd.append("plant_id", plant_id);
  if (captured_at) fd.append("captured_at", captured_at);

  return fd;
}