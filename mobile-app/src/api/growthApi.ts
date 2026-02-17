import { http, authHeaders } from "./http";

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

export async function predictGrowth(params: {
  token?: string | null;
  plant_id: string;
  recent_measurements?: any;
  sensor_data?: any;
}) {
  const res = await http.post<GrowthPredictResponse>(
    "/growth/predict",
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
  const res = await http.post("/growth/predict/save", params.payload, {
    headers: authHeaders(params.token),
  });
  return res.data;
}