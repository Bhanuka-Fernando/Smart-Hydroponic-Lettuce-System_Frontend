import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

export const HOST = extra.HOST;
export const API_BASE_URL = extra.API_BASE_URL;
export const WATER_BASE_URL = extra.WATER_BASE_URL;
export const ML_BASE_URL = extra.ML_BASE_URL;
export const SPOILAGE_BASE_URL = extra.SPOILAGE_BASE_URL;
export const DEVICE_BASE_URL = extra.DEVICE_BASE_URL;
export const LEAF_HEALTH_BASE_URL = extra.LEAF_HEALTH_BASE_URL;