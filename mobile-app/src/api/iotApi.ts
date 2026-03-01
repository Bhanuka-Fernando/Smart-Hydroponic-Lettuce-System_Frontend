// src/api/iotApi.ts
import { ML_BASE_URL } from "../utils/constants";
import { authHeaders } from "./http";

export type IoTSensorPayload = {
  zone_id: string;
  temperature_c: number;
  humidity_pct: number;
  ec_ms_cm: number;
  ph: number;
  timestamp?: string; // ISO 8601 format, optional - server can use current time
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
 * POST /infer/iot/ingest
 * Submit IoT sensor readings to the backend
 */
export async function ingestIoTData(params: {
  token?: string | null;
  data: IoTSensorPayload;
}) {
  const res = await fetch(`${ML_BASE_URL}/infer/iot/ingest`, {
    method: "POST",
    headers: {
      ...authHeaders(params.token),
      "Content-Type": "application/json",
    } as any,
    body: JSON.stringify(params.data),
  });

  if (!res.ok) throw new Error(await readError(res));
  return await res.json();
}
