// src/api/weightApi.ts
import { ML_BASE_URL } from "../utils/constants";
import { authHeaders } from "./http";

export type InferTodayResponse = {
  A_proj_cm2: number;
  D_proj_cm: number;
  A_des_cm2: number;

  W_today_g: number;
  A_proj_tmr_cm2: number;
  D_proj_tmr_cm: number;
  W_tmr_g: number;

  mask_overlay_b64?: string;
  image_url?: string;
  captured_at?: string;
  plant_id?: string;
  zone_id?: string;
};

export type WeightSavePayload = {
  plant_id: string;
  zone_id: string;
  captured_at: string;

  A_proj_cm2: number;
  D_proj_cm: number;
  A_des_cm2: number;
  W_today_g: number;

  image_url?: string | null;
};

export type WeightSaveResponse = {
  ok: boolean;
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

export async function estimateWeight(params: {
  rgbUri: string;
  depthUri: string;
  token?: string | null;

  plant_id: string;
  zone_id: string;

  captured_at?: string;
  dap?: number;
  A_prev_cm2?: number | null;
  sensors?: any;
}): Promise<InferTodayResponse> {
  if (!params.plant_id || !params.zone_id) {
    throw new Error(`Missing plant_id or zone_id. plant_id=${params.plant_id} zone_id=${params.zone_id}`);
  }

  const fd = new FormData();

  fd.append("image" as any, {
    uri: params.rgbUri,
    name: `rgb_${Date.now()}.jpg`,
    type: "image/jpeg",
  } as any);

  fd.append("depth" as any, {
    uri: params.depthUri,
    name: `depth_${Date.now()}.png`,
    type: "image/png",
  } as any);

  fd.append(
    "payload_json",
    JSON.stringify({
      plant_id: params.plant_id,
      zone_id: params.zone_id,
      dap: params.dap ?? 25,
      A_prev_cm2: params.A_prev_cm2 ?? null,
      sensors: params.sensors ?? null,
    })
  );

  const res = await fetch(`${ML_BASE_URL}/infer/today`, {
    method: "POST",
    headers: { ...authHeaders(params.token) } as any,
    body: fd as any,
  });

  if (!res.ok) throw new Error(await readError(res));

  const data = (await res.json()) as InferTodayResponse;

  return {
    ...data,
    plant_id: params.plant_id,
    zone_id: params.zone_id,
    captured_at: params.captured_at ?? data.captured_at ?? new Date().toISOString(),
  };
}

export async function saveWeightResult(params: {
  token?: string | null;
  payload: WeightSavePayload;
}): Promise<WeightSaveResponse> {
  const res = await fetch(`${ML_BASE_URL}/infer/weights/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(params.token),
    } as any,
    body: JSON.stringify(params.payload),
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as WeightSaveResponse;
}