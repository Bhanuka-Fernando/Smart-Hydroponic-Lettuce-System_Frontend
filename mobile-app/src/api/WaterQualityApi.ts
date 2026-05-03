import axios from "axios";
import { HOST, WATER_BASE_URL as CONFIG_WATER_BASE_URL } from "../utils/constants";

function normalizeBaseUrl(value?: string) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `http://${value}`;
}

const hostHasPort = /:\d+$/.test(HOST ?? "");
export const BASE_URL = normalizeBaseUrl(hostHasPort ? HOST : CONFIG_WATER_BASE_URL || HOST);
export const WATER_BASE_URL = BASE_URL;

const client = axios.create({
  baseURL: WATER_BASE_URL,
  timeout: 20000,
});

export type WaterStatus = "OK" | "WARNING" | "CRITICAL";
export type AlgaeLevel = "LOW" | "MEDIUM" | "HIGH";

export type WaterReading = {
  timestamp: string;
  ph: number;
  temp_c: number;
  turb_ntu: number;
  ec: number;
};

export type HealthResponse = {
  status?: string;
  ok?: boolean;
  service?: string;
  timestamp?: string;
  [key: string]: unknown;
};

export type WaterScoreBreakdown = Record<string, number | string | boolean | null>;

export type WaterAnalyzeMeta = {
  final_severity_score?: number;
  score_breakdown?: WaterScoreBreakdown;
  turb_delta_30min?: number;
  [key: string]: unknown;
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

  // ✅ new
  main_reason: string;
  main_action: string;

  reasons: string[];
  actions: string[];

  algae_reasons: string[];
  algae_actions: string[];

  sensor_quality: "OK" | "SUSPECT";
  sensor_notes: string[];

  meta: WaterAnalyzeMeta;
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

export type DeleteHistoryResponse = {
  deleted?: number;
  tank_id?: string;
  ok?: boolean;
  message?: string;
  [key: string]: unknown;
};

export type IngestResponse = {
  ok?: boolean;
  count?: number;
  message?: string;
  [key: string]: unknown;
};

export async function healthCheck(): Promise<HealthResponse> {
  const res = await client.get("/water/health");
  return res.data;
}

export const getWaterHealth = healthCheck;

export async function getWaterHistory(tankId: string, limit = 200): Promise<HistoryResponse> {
  const res = await client.get("/water/history", { params: { tank_id: tankId, limit } });
  return res.data;
}

export async function analyzeBatch(tankId: string, readings: WaterReading[]): Promise<AnalyzeResponse> {
  const res = await client.post("/water/analyze_batch", { tank_id: tankId, readings });
  return res.data;
}

export async function deleteWaterHistory(
  tankId?: string,
  confirmAll = false
): Promise<DeleteHistoryResponse> {
  const params = confirmAll ? { confirm: true } : { tank_id: tankId };
  const res = await client.delete("/water/history", { params });
  return res.data;
}

export function deleteTankHistory(tankId: string): Promise<DeleteHistoryResponse> {
  return deleteWaterHistory(tankId);
}

export function deleteAllHistory(): Promise<DeleteHistoryResponse> {
  return deleteWaterHistory(undefined, true);
}

export async function ingestWaterReadings(
  tankId: string,
  readings: WaterReading[]
): Promise<IngestResponse> {
  const res = await client.post("/water/ingest", { tank_id: tankId, readings });
  return res.data;
}
