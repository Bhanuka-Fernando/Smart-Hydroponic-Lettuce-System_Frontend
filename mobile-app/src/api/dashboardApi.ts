// src/api/dashboardApi.ts
import { API_BASE_URL } from "../utils/constants";
import { authHeaders } from "./http";

export type DashboardMetricsResponse = {
  zone_id: string;
  zone_name: string;
  plant_count: number;
  harvest_ready_count: number;
  avg_growth_pct: number;
  temperature_c: number;
  humidity_pct: number;
  ec_ms_cm: number;
  ph: number;
  last_updated: string;
};

async function readError(res: Response) {
  const text = await res.text();
  try {
    const j = JSON.parse(text);
    return j?.detail ? JSON.stringify(j.detail) : text;
  } catch {
    return text || `HTTP ${res.status}`;
  }
}

/**
 * GET /dashboard/latest?zone_id=z01
 * Fetch latest dashboard metrics for a specific zone
 */
export async function getDashboardLatest(params: {
  token?: string | null;
  zone_id?: string;
}) {
  const qs = new URLSearchParams();
  if (params.zone_id) qs.set("zone_id", params.zone_id);

  const res = await fetch(`${API_BASE_URL}/dashboard/latest?${qs.toString()}`, {
    method: "GET",
    headers: { ...authHeaders(params.token) } as any,
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as DashboardMetricsResponse;
}
