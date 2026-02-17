import { API_BASE_URL } from "../utils/constants";
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
  mask_url?: string;
  image_url?: string;
  plant_id?: string;
  captured_at?: string;
};

export async function estimateWeight(params: {
  rgbUri: string;
  depthUri: string;
  token?: string | null;
  plant_id?: string;
  captured_at?: string;
  dap?: number; // days after planting
  A_prev_cm2?: number | null;
  sensors?: any; // keep any for now
}): Promise<InferTodayResponse> {
  const fd = new FormData();

  // ✅ backend expects "image"
  fd.append("image" as any, {
    uri: params.rgbUri,
    name: `rgb_${Date.now()}.jpg`,
    type: "image/jpeg",
  } as any);

  // ✅ backend expects "depth"
  fd.append("depth" as any, {
    uri: params.depthUri,
    name: `depth_${Date.now()}.png`,
    type: "image/png",
  } as any);

  // ✅ backend expects "payload_json"
  const payload = {
    dap: params.dap ?? 25,
    A_prev_cm2: params.A_prev_cm2 ?? null,
    sensors: params.sensors ?? null,
  };

  fd.append("payload_json", JSON.stringify(payload));

  const res = await fetch(`${ML_BASE_URL}/infer/today`, {
    method: "POST",
    headers: {
      ...authHeaders(params.token),
    } as any,
    body: fd as any,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "infer/today failed");
  }

  const data = (await res.json()) as InferTodayResponse;

  // attach metadata for your UI if you want
  return {
    ...data,
    plant_id: params.plant_id,
    captured_at: params.captured_at,
  };
}