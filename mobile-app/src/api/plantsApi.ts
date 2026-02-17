import { http, authHeaders } from "./http";

export type PlantListItem = {
  plant_id: string;
  name: string;
  age_days: number;
  area_cm2: number;
  diameter_cm: number;
  estimated_weight_g: number;
  status: "NOT_READY" | "HARVEST_READY";
  image_url?: string;
};

export type PlantDetailsResponse = {
  plant_id: string;
  display_name: string;
  planted_on: string;
  age_days: number;
  start_weight_g: number;
  current_weight_g: number;
  growth_pct: number;
  predicted_today_g?: number;
  trajectory?: { labels: string[]; values: number[] };
  history?: Array<{
    date: string;
    date_label: string;
    actual_weight_g?: number | null;
    predicted_weight_g?: number | null;
    delta_g?: number | null;
    status: string;
  }>;
};

export async function getPlants(params: {
  token?: string | null;
  filter?: "all" | "growing" | "harvest_ready";
}) {
  const res = await http.get<PlantListItem[]>("/plants", {
    params: { filter: params.filter ?? "all" },
    headers: authHeaders(params.token),
  });
  return res.data;
}

export async function getPlantDetails(params: {
  token?: string | null;
  plant_id: string;
}) {
  const res = await http.get<PlantDetailsResponse>(`/plants/${params.plant_id}`, {
    headers: authHeaders(params.token),
  });
  return res.data;
}