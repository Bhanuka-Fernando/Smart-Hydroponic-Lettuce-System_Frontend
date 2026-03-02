import { http, authHeaders } from "./http";
import { ML_BASE_URL } from "../utils/constants";

export type GrowthPredictResponse = {
  plant_id: string;
  date_label: string;
  predicted_weight_g: number;
  predicted_area_cm2: number;
  predicted_diameter_cm: number;
  change_pct?: number;
  series?: {
    labels: string[];
    actual: number[];
    predicted: number[];
  };
  insight?: { title: string; message: string };
};

export type ForecastPoint = {
  step: number;
  DAP_pred: number;
  A_pred_cm2: number;
  D_pred_cm: number;
  W_pred_g: number;
  A_leaf_pred_cm2: number; 
};

export async function predictGrowth(params: {
  token?: string | null;
  plant_id: string;
  recent_measurements?: any;
  sensor_data?: any;
}) {
  const res = await http.post<GrowthPredictResponse>(
    "/infer/growth/predict",
    {
      plant_id: params.plant_id,
      recent_measurements: params.recent_measurements,
      sensor_data: params.sensor_data,
    },
    { headers: authHeaders(params.token) }
  );
  return res.data;
}

export async function saveGrowthPrediction(params: {
  token?: string | null;
  payload: GrowthPredictResponse;
}) {
  const res = await fetch(`${ML_BASE_URL}/infer/growth/predict/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(params.token),
    } as any,
    body: JSON.stringify(params.payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return await res.json();
}


export async function getGrowthForecast(params: {
  token?: string | null;
  plant_id: string;
  zone_id: string;
  dap: number;
  n_days: number;
  A_prev_cm2?: number | null;
  A_t_cm2: number;
  D_t_cm: number;
  sensors?: any; // instant {airT, RH, EC, pH}
}): Promise<ForecastPoint[]> {
  const res = await fetch(`${ML_BASE_URL}/infer/forecast`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(params.token),
    } as any,
    body: JSON.stringify({
      plant_id: params.plant_id,
      zone_id: params.zone_id,
      dap: params.dap,
      n_days: params.n_days,
      A_prev_cm2: params.A_prev_cm2 ?? null,
      A_t_cm2: params.A_t_cm2,
      D_t_cm: params.D_t_cm,
      sensors: params.sensors ?? null, // instant
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "infer/forecast failed");
  }

  const data = await res.json();
  return data.points as ForecastPoint[];
}