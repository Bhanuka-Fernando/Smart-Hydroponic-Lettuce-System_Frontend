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
  A_des_tmr_cm2?: number; 
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
  plant_id: string;     // make required (or default it)
  zone_id: string;      // add this
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

  // ✅ MUST match InferRequest
  const payload = {
    plant_id: params.plant_id,
    zone_id: params.zone_id,
    dap: params.dap ?? 25,
    A_prev_cm2: params.A_prev_cm2 ?? null,
    sensors: params.sensors ?? null,
  };

  fd.append("payload_json", JSON.stringify(payload));

  const res = await fetch(`${ML_BASE_URL}/infer/today`, {
    method: "POST",
    headers: { ...authHeaders(params.token) } as any,
    body: fd as any,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "infer/today failed");
  }

  const data = (await res.json()) as InferTodayResponse;
    console.log("estimateWeight payload", {
    plant_id: params.plant_id,
    zone_id: params.zone_id,
    dap: params.dap ?? 25,
    A_prev_cm2: params.A_prev_cm2 ?? null,
    sensors: params.sensors ?? null,
  });


  return {
    ...data,
    plant_id: params.plant_id,
    captured_at: params.captured_at,
  };


}


