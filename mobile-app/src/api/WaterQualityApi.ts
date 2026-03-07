import axios from "axios";
import { WATER_BASE_URL } from "../utils/constants";

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

export async function getWaterHistory(tank_id: string, limit = 200): Promise<HistoryResponse> {
  const res = await client.get("/water/history", { params: { tank_id, limit } });
  return res.data;
}

export async function analyzeBatch(tank_id: string, readings: WaterReading[]): Promise<AnalyzeResponse> {
  const res = await client.post("/water/analyze_batch", { tank_id, readings });
  return res.data;
}