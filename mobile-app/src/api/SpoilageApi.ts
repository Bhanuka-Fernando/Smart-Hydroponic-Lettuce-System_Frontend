import axios from "axios";
import { SPOILAGE_BASE_URL } from "../utils/constants";

const client = axios.create({
  baseURL: SPOILAGE_BASE_URL,
  timeout: 30000,
});

export type SpoilageStage =
  | "fresh"
  | "slightly_aged"
  | "near_spoilage"
  | "spoiled";

export type StageProbs = {
  fresh: number;
  slightly_aged: number;
  near_spoilage: number;
  spoiled: number;
};

export type StageOnlyResponse = {
  plant_id: string;
  captured_at: string;
  stage: SpoilageStage;
  stage_probs: StageProbs;
  status: string;
};

export type SpoilagePredictResponse = StageOnlyResponse & {
  remaining_days: number;
};

export type SpoilagePredictionRow = {
  id: number;
  plant_id: string;
  captured_at: string;
  temperature: number;
  humidity: number;
  stage: SpoilageStage;
  status: string;
  remaining_days: number;
  p_fresh: number;
  p_slightly_aged: number;
  p_near_spoilage: number;
  p_spoiled: number;
  image_url?: string | null;
  sim_source_image?: string | null;
};

export type SpoilageAlertRow = {
  id: number;
  plant_id: string;
  prediction_id?: number | null;
  stage: SpoilageStage;
  severity: "warning" | "critical";
  title: string;
  message: string;
  is_acknowledged: boolean;
  created_at: string;
  acknowledged_at?: string | null;
};

export type RecheckReminderRow = {
  plant_id: string;
  stage: SpoilageStage;
  remaining_days: number;
  captured_at: string;
  image_url?: string | null;
  urgency: "soon" | "urgent";
  message: string;
};

export type SimSampleResponse = {
  plant_id: string;
  temperature: number;
  humidity: number;
  label: SpoilageStage;
  day_id?: number;
  capture_date?: string | null;
  image_name?: string | null;
  image_url?: string | null;
  remaining_days: number;
  mode?: "random" | "time";
  now?: string;
};

export type SimSampleParams = {
  plant_id?: string;
  label?: string;
  mode?: "random" | "time";
  now_iso?: string;
};

function guessMime(uri: string) {
  const u = uri.toLowerCase();
  if (u.endsWith(".png")) return "image/png";
  if (u.endsWith(".jpeg")) return "image/jpeg";
  if (u.endsWith(".jpg")) return "image/jpeg";
  return "image/jpeg";
}

function makeFormData(input: {
  imageUri: string;
  temperature: number;
  humidity: number;
  plant_id: string;
  captured_at?: string;
  sim_source_image?: string;
}) {
  const form = new FormData();
  const mime = guessMime(input.imageUri);

  form.append(
    "image",
    {
      uri: input.imageUri,
      name: mime === "image/png" ? "spoilage.png" : "spoilage.jpg",
      type: mime,
    } as any
  );

  form.append("temperature", String(input.temperature));
  form.append("humidity", String(input.humidity));
  form.append("plant_id", input.plant_id);

  if (input.captured_at) {
    form.append("captured_at", input.captured_at);
  }

  if (input.sim_source_image) {
    form.append("sim_source_image", input.sim_source_image);
  }

  return form;
}

export async function predictAll(input: {
  imageUri: string;
  temperature: number;
  humidity: number;
  plant_id: string;
  captured_at?: string;
  sim_source_image?: string;
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

export async function getRecentPredictions(limit = 20) {
  const res = await client.get<SpoilagePredictionRow[]>(
    `/spoilage/predictions?limit=${limit}`
  );
  return res.data;
}

export async function getSpoilageAlerts(params?: {
  acknowledged?: boolean;
  limit?: number;
}) {
  const res = await client.get<SpoilageAlertRow[]>("/spoilage/alerts", {
    params,
  });
  return res.data;
}

export async function acknowledgeSpoilageAlert(alertId: number) {
  const res = await client.post<SpoilageAlertRow>(
    `/spoilage/alerts/${alertId}/ack`
  );
  return res.data;
}

export async function getRecheckReminders(params?: {
  limit?: number;
  max_remaining_days?: number;
}) {
  const res = await client.get<RecheckReminderRow[]>("/spoilage/recheck", {
    params,
  });
  return res.data;
}

export async function startSimulation(params: {
  plant_id: string;
  interval_sec?: number;
  loop?: boolean;
}) {
  const res = await client.post("/sim/start", null, {
    params: {
      plant_id: params.plant_id,
      interval_sec: params.interval_sec ?? 15,
      loop: params.loop ?? false,
    },
  });
  return res.data;
}

export async function stopSimulation() {
  const res = await client.post("/sim/stop");
  return res.data;
}

export async function getSimulationStatus() {
  const res = await client.get("/sim/status");
  return res.data;
}

export async function getSimSample(params?: SimSampleParams) {
  const res = await client.get<SimSampleResponse>("/sim/sample", { params });
  return res.data;
}

export async function getPlantHistory(plantId: string, limit = 30) {
  const res = await client.get<SpoilagePredictionRow[]>(
    `/spoilage/predictions/by-plant?plant_id=${encodeURIComponent(
      plantId
    )}&limit=${limit}`
  );
  return res.data;
}