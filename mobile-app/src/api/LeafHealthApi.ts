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
  classifier_mode: string;
  probs: Record<string, number>;
  tipburn: LeafHealthTipburn;

  health_score: number;
  status: "OK" | "WATCH" | "ACT NOW";

  primary_issue: string;
  main_issue?: string;

  classification_label?: string;
  classification_confidence?: number;

  reason?: string;
  top3_probs?: Record<string, number>;

  plant_id: string;
  captured_at: string;
  image_name?: string;
};

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

// optional: returns image bytes -> you can display using base64 later if needed
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

export async function getLeafHealthPlantLogs(plantId: string, limit = 50) {
  const res = await client.get(`/plants/${encodeURIComponent(plantId)}/logs?limit=${limit}`);
  return res.data;
}

export async function getLeafHealthDashboardCritical(limit = 5) {
  const res = await client.get(`/dashboard/recent?limit=${limit}`);
  return res.data;
}