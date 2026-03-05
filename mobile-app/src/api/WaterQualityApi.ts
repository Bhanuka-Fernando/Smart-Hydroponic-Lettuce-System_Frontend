import axios from "axios";
import { WATER_BASE_URL } from "../utils/constants";

const client = axios.create({
  baseURL: WATER_BASE_URL,
  timeout: 20000,
});

// ---------- TYPES ----------
export type WaterStatus = "OK" | "WARNING" | "CRITICAL";
export type AlgaeLevel = "LOW" | "MEDIUM" | "HIGH";

export type WaterReading = {
  timestamp: string;
  ph: number;
  temp_c: number;
  turb_ntu: number;
  ec: number;
};

export type AnalyzeBatchRequest = {
  tank_id: string;
  readings: WaterReading[];
};

export type AnalyzeResponse = {
  tank_id: string;
  timestamp: string;
  mode: "single" | "batch_timeseries";

  ml_status: WaterStatus;
  ml_probs: Record<string, number>;

  ml_algae: AlgaeLevel;
  ml_algae_probs: Record<string, number>;

  rule_status: WaterStatus;
  health_score: number;
  score_status: WaterStatus;
  final_status: WaterStatus;

  reasons: string[];
  actions: string[];

  algae_reasons: string[];
  algae_actions: string[];

  sensor_quality: "OK" | "SUSPECT";
  sensor_notes: string[];

  meta: Record<string, any>;
};

export type LatestResponse = {
  tank_id: string;
  timestamp: string;
  ph: number;
  temp_c: number;
  turb_ntu: number;
  ec: number;
};

export type HistoryResponse = {
  tank_id: string;
  count: number;
  readings: LatestResponse[];
};

// ---------- CALLS ----------
export async function waterHealth() {
  const res = await client.get("/health"); // your service has /health and /water/health; keep this simple
  return res.data;
}

export async function getWaterLatest(tank_id: string): Promise<LatestResponse> {
  const res = await client.get(`/water/latest`, { params: { tank_id } });
  return res.data;
}

export async function getWaterHistory(tank_id: string, limit = 50): Promise<HistoryResponse> {
  const res = await client.get(`/water/history`, { params: { tank_id, limit } });
  return res.data;
}

export async function analyzeBatch(body: AnalyzeBatchRequest): Promise<AnalyzeResponse> {
  const res = await client.post(`/water/analyze_batch`, body);
  return res.data;
}

export async function ingestWaterReadings(tank_id: string, readings: WaterReading[]) {
  const res = await client.post(`/water/ingest`, { tank_id, readings });
  return res.data;
}