// src/api/spoilageApi.ts
import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

export type SpoilageStage =
  | "fresh"
  | "slightly_aged"
  | "near_spoilage"
  | "spoiled";

export type SpoilageClassifyResponse = {
  stage: SpoilageStage;
  confidence: number;
  probs: Record<SpoilageStage, number>;
};

export async function classifySpoilage(
  accessToken: string,
  imageUri: string,
  temp_c: number,
  humidity_pct: number
): Promise<SpoilageClassifyResponse> {
  if (!accessToken) throw new Error("No access token in auth state. Please login again.");

  const form = new FormData();
  form.append("image", {
    uri: imageUri,
    name: "leaf.jpg",
    type: "image/jpeg",
  } as any);
  form.append("temp_c", String(temp_c));
  form.append("humidity_pct", String(humidity_pct));

  const res = await axios.post(`${API_BASE_URL}/spoilage/classify`, form, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "multipart/form-data",
      Accept: "application/json",
    },
  });

  return res.data;
}
