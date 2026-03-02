// src/api/plantsApi.ts
import { ML_BASE_URL } from "../utils/constants";
import { authHeaders } from "./http";

export type PlantListItem = {
  plant_id: string;
  name: string;
  age_days: number;
  area_cm2?: number | null;
  diameter_cm?: number | null;
  estimated_weight_g?: number | null;
  status: "NOT_READY" | "HARVEST_READY";
  image_url?: string | null;
};

export type PlantHistoryItem = {
  date: string;
  date_label: string;
  actual_weight_g?: number | null;
  predicted_weight_g?: number | null;
  delta_g?: number | null;
  status: string;
};

export type PlantDetailsResponse = {
  plant_id: string;
  display_name: string;
  planted_on: string;
  age_days: number;
  start_weight_g: number;
  current_weight_g: number;
  growth_pct: number;
  predicted_today_g?: number | null;
  trajectory?: { labels: string[]; values: number[] } | null;
  history?: PlantHistoryItem[] | null;
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
 * GET /plants?filter=all|growing|harvest_ready&zone_id=z01
 */
export async function getPlants(params: {
  token?: string | null;
  filter?: "all" | "growing" | "harvest_ready";
  zone_id?: string;
}) {
  const qs = new URLSearchParams();
  qs.set("filter", params.filter ?? "all");
  if (params.zone_id) qs.set("zone_id", params.zone_id);

  const res = await fetch(`${ML_BASE_URL}/plants?${qs.toString()}`, {
    headers: { ...authHeaders(params.token) } as any,
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as PlantListItem[];
}

/**
 * GET /infer/plants/{plant_id}?zone_id=z01
 */
export async function getPlantDetails(params: {
  token?: string | null;
  plant_id: string;
  zone_id?: string;
  range?: "7d" | "month" | "all";
}) {
  const qs = new URLSearchParams();
  if (params.zone_id) qs.set("zone_id", params.zone_id);
  if (params.range) qs.set("range", params.range);

  const res = await fetch(
    `${ML_BASE_URL}/infer/plants/${encodeURIComponent(params.plant_id)}?${qs.toString()}`,
    {
      method: "GET",
      headers: { ...authHeaders(params.token) } as any,
    }
  );

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as PlantDetailsResponse;
}

/**
 * DELETE /plants/{plant_id}
 */
export async function deletePlant(params: { token?: string | null; plant_id: string }) {
  const res = await fetch(`${ML_BASE_URL}/plants/${encodeURIComponent(params.plant_id)}`, {
    method: "DELETE",
    headers: { ...authHeaders(params.token) } as any,
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}