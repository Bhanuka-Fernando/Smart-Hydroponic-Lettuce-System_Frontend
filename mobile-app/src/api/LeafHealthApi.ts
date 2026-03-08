import axios from "axios";
import { LEAF_HEALTH_BASE_URL } from "../utils/constants";

const client = axios.create({
  baseURL: LEAF_HEALTH_BASE_URL,
  timeout: 60000,
});

export type LeafHealthTipburn = {
  num_boxes: number;
  A: number;
  C: number;
};

export type LeafHealthResponse = {
  classifier_mode?: string;
  probs: Record<string, number>;
  tipburn: LeafHealthTipburn;

  health_score: number;
  status: "OK" | "WATCH" | "ACT NOW";

  primary_issue?: string;
  main_issue?: string;

  classification_label?: string;
  classification_confidence?: number;

  reason?: string;
  top3_probs?: Record<string, number>;

  plant_id: string;
  captured_at: string;
  image_name?: string;
  image_path?: string;
  raw_result?: Record<string, any> | null;
};

export type LeafHealthRecentItem = {
  id: number;
  plant_id: string;
  captured_at: string;
  health_score: number;
  status: "OK" | "WATCH" | "ACT NOW";
  main_issue: string;
  image_name?: string;
  image_path?: string;
  reason?: string;
  classification_label?: string;
  classification_confidence?: number;
};

export function buildLeafHealthImageUrl(imagePath?: string) {
  if (!imagePath) return undefined;
  const normalized = imagePath.replace(/^\/+/, "");
  return `${LEAF_HEALTH_BASE_URL}/${normalized}`;
}

export async function predictLeafHealth(imageUri: string): Promise<LeafHealthResponse> {
  const form = new FormData();

  form.append("image", {
    uri: imageUri,
    name: "leaf.jpg",
    type: "image/jpeg",
  } as any);

  const res = await client.post("/predict", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}

export async function predictLeafHealthAnnotated(imageUri: string): Promise<ArrayBuffer> {
  const form = new FormData();

  form.append("image", {
    uri: imageUri,
    name: "leaf.jpg",
    type: "image/jpeg",
  } as any);

  const res = await client.post("/predict-annotated", form, {
    headers: { "Content-Type": "multipart/form-data" },
    responseType: "arraybuffer",
  });

  return res.data;
}

export async function saveLeafHealthLog(payload: any) {
  const res = await client.post("/logs", payload);
  return res.data;
}

export async function getLeafHealthAllLogs(limit = 50, offset = 0) {
  const res = await client.get(`/logs?limit=${limit}&offset=${offset}`);
  return res.data;
}

export async function getLeafHealthPlantLogs(plantId: string, limit = 50) {
  const res = await client.get(`/plants/${encodeURIComponent(plantId)}/logs?limit=${limit}`);
  return res.data;
}

export async function getLeafHealthPlantLatest(plantId: string) {
  const res = await client.get(`/plants/${encodeURIComponent(plantId)}/latest`);
  return res.data;
}

export async function getLeafHealthDashboardCritical(limit = 3): Promise<{ items: LeafHealthRecentItem[] }> {
  const res = await client.get(`/dashboard/recent?limit=${limit}`);
  return res.data;
}

export async function getLeafHealthLogById(logId: number): Promise<{ item: any }> {
  const res = await client.get(`/logs/${logId}`);
  return res.data;
}
