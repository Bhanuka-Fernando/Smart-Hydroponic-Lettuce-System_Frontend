import axios from "axios";
import { SPOILAGE_BASE_URL } from "../utils/constants";



const client = axios.create({
  baseURL: SPOILAGE_BASE_URL,
  timeout: 20000,
});

export type StageProbs = {
  fresh: number;
  slightly_aged: number;
  near_spoilage: number;
  spoiled: number;
};

export type StageOnlyResponse = {
  plant_id: string;       // "P-001"
  captured_at: string;    // ISO
  stage: string;          // label
  stage_probs: StageProbs;
  status: string;         // from make_status()
};

export type SpoilagePredictResponse = StageOnlyResponse & {
  remaining_days: number;
};

function makeFormData(input: {
  imageUri: string;
  temperature: number;
  humidity: number;
  plant_id: string;
  captured_at?: string;
}) {
  const form = new FormData();

  form.append("image", {
    uri: input.imageUri,
    name: "spoilage.jpg",
    type: "image/jpeg",
  } as any);

  form.append("temperature", String(input.temperature));
  form.append("humidity", String(input.humidity));
  form.append("plant_id", input.plant_id);
  if (input.captured_at) form.append("captured_at", input.captured_at);

  return form;
}

// AUTH_ENABLED=false => no token needed.
// If later you enable auth, add Authorization header here.
export async function predictAll(input: {
  imageUri: string;
  temperature: number;
  humidity: number;
  plant_id: string;
  captured_at?: string;
}) {
  const res = await client.post<SpoilagePredictResponse>(
    "/spoilage/predict",
    makeFormData(input),
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}

export async function stageOnly(input: {
  imageUri: string;
  temperature: number;
  humidity: number;
  plant_id: string;
  captured_at?: string;
}) {
  const res = await client.post<StageOnlyResponse>(
    "/spoilage/stage-only",
    makeFormData(input),
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}

export async function remainingDaysOnly(payload: {
  plant_id?: string;
  captured_at?: string;
  stage_probs: StageProbs;
  temperature: number;
  humidity: number;
}) {
  const res = await client.post<{ remaining_days: number }>(
    "/spoilage/remaining-days-only",
    payload,
    { headers: { "Content-Type": "application/json" } }
  );
  return res.data;
}

export type SpoilagePredictionRow = {
  id: number;
  plant_id: string;
  captured_at: string;
  temperature: number;
  humidity: number;
  stage: string;
  status: string;
  remaining_days: number;
  p_fresh: number;
  p_slightly_aged: number;
  p_near_spoilage: number;
  p_spoiled: number;
  image_url?: string | null;
  
};

export async function getRecentPredictions(limit = 20) {
  const res = await client.get<SpoilagePredictionRow[]>(
    `/spoilage/predictions?limit=${limit}`
  );
  return res.data;
}