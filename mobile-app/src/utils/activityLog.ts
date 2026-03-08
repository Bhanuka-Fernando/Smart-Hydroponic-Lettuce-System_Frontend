import AsyncStorage from "@react-native-async-storage/async-storage";

export type ActivityType =
  | "weight_scan"
  | "growth_forecast"
  | "spoilage_check"
  | "water_quality"
  | "system"
  | "disease_check";

export type ActivityFilterType = ActivityType | "all";
export type ActivityStatus = "success" | "warning" | "info";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  zone?: string;
  status?: ActivityStatus;
  metadata?: Record<string, unknown>;
};

const STORAGE_KEY = "@smart_hydroponic:activity_log:v1";
const MAX_ITEMS = 500;

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function normalizeActivity(item: any): ActivityItem | null {
  if (!item || typeof item !== "object") return null;
  if (!item.id || !item.type || !item.title || !item.description || !item.timestamp) return null;
  return item as ActivityItem;
}

async function saveActivities(items: ActivityItem[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export async function getActivities(): Promise<ActivityItem[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return asArray(parsed)
      .map(normalizeActivity)
      .filter(Boolean)
      .sort((a, b) => new Date(b!.timestamp).getTime() - new Date(a!.timestamp).getTime()) as ActivityItem[];
  } catch {
    return [];
  }
}

export async function addActivity(
  input: Omit<ActivityItem, "id" | "timestamp"> & {
    id?: string;
    timestamp?: string;
    dedupeKey?: string;
  }
): Promise<ActivityItem> {
  const current = await getActivities();
  const {
    dedupeKey: rawDedupeKey,
    metadata: inputMetadata,
    id: inputId,
    timestamp: inputTimestamp,
    ...rest
  } = input;
  const dedupeKey = rawDedupeKey?.trim();
  if (dedupeKey) {
    const existing = current.find(
      (item) =>
        item.type === rest.type &&
        String(item.metadata?.dedupeKey ?? "") === dedupeKey
    );
    if (existing) return existing;
  }

  const metadata = {
    ...(inputMetadata ?? {}),
    ...(dedupeKey ? { dedupeKey } : {}),
  };

  const item: ActivityItem = {
    ...rest,
    metadata,
    id: inputId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: inputTimestamp ?? new Date().toISOString(),
  };
  const next = [item, ...current];
  await saveActivities(next);
  return item;
}

export async function deleteActivity(id: string): Promise<void> {
  const current = await getActivities();
  await saveActivities(current.filter((item) => item.id !== id));
}

export async function clearActivities(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function logDiseaseActivity(params: {
  plantId?: string;
  healthScore?: number;
  status?: string;
  mainIssue?: string;
  capturedAtISO?: string;
}) {
  const normalizedStatus = String(params.status || "").toUpperCase();
  const activityStatus: ActivityStatus =
    normalizedStatus === "WATCH" || normalizedStatus === "ACT NOW" ? "warning" : "success";

  const issue = params.mainIssue || "Unknown";
  const score = Number(params.healthScore ?? 0);

  await addActivity({
    type: "disease_check",
    title: "Disease Scan",
    description: `${issue} • Score ${score}`,
    status: activityStatus,
    zone: params.plantId,
    dedupeKey: `disease:${params.plantId ?? "unknown"}:${params.capturedAtISO ?? "na"}`,
    metadata: {
      plantId: params.plantId,
      issue,
      healthScore: score,
      status: params.status,
      capturedAtISO: params.capturedAtISO,
    },
  });
}

export async function logWeightActivity(params: {
  plantId?: string;
  weightG?: number;
  accuracy?: number;
  capturedAtISO?: string;
}) {
  const weight = Number(params.weightG ?? 0);
  const accuracy = Number(params.accuracy ?? 0);
  const plantId = params.plantId || "Plant";

  await addActivity({
    type: "weight_scan",
    title: "Weight Estimation",
    description: `${plantId} estimated at ${weight.toFixed(2)}g`,
    status: "success",
    zone: params.plantId,
    dedupeKey: `weight:${plantId}:${params.capturedAtISO ?? "na"}`,
    metadata: {
      plantId: params.plantId,
      weightG: weight,
      accuracy,
      capturedAtISO: params.capturedAtISO,
    },
  });
}

export async function logGrowthActivity(params: {
  plantId?: string;
  predictedWeightG?: number;
  dateLabel?: string;
  ageDays?: number;
}) {
  const predictedWeightG = Number(params.predictedWeightG ?? 0);
  const label = params.dateLabel || "next cycle";

  await addActivity({
    type: "growth_forecast",
    title: "Growth Forecast",
    description: `${params.plantId || "Plant"} predicted ${predictedWeightG.toFixed(2)}g (${label})`,
    status: "success",
    zone: params.plantId,
    dedupeKey: `growth:${params.plantId ?? "unknown"}:${params.ageDays ?? "na"}:${label}:${predictedWeightG.toFixed(2)}`,
    metadata: {
      plantId: params.plantId,
      predictedWeightG,
      dateLabel: label,
      ageDays: params.ageDays,
    },
  });
}

export async function logSpoilageActivity(params: {
  plantId?: string;
  stage?: string;
  remainingDays?: number;
  capturedAtISO?: string;
}) {
  const stage = params.stage || "unknown";
  const days = Number(params.remainingDays ?? 0);
  const stageUpper = stage.toUpperCase();
  const status: ActivityStatus =
    stageUpper === "SPOILED" || stageUpper === "NEAR_SPOILAGE"
      ? "warning"
      : "success";

  await addActivity({
    type: "spoilage_check",
    title: "Spoilage Analysis",
    description: `${params.plantId || "Plant"} • ${stage.replace("_", " ")} • ${days.toFixed(1)} days left`,
    status,
    zone: params.plantId,
    dedupeKey: `spoilage:${params.plantId ?? "unknown"}:${params.capturedAtISO ?? "na"}`,
    metadata: {
      plantId: params.plantId,
      stage,
      remainingDays: days,
      capturedAtISO: params.capturedAtISO,
    },
  });
}

export async function logWaterActivity(params: {
  tankId?: string;
  finalStatus?: string;
  healthScore?: number;
  sourceTimestamp?: string;
}) {
  const finalStatus = String(params.finalStatus || "UNKNOWN").toUpperCase();
  const healthScore = Number(params.healthScore ?? 0);
  const status: ActivityStatus = finalStatus === "OK" ? "success" : "warning";

  await addActivity({
    type: "water_quality",
    title: "Water Quality Analysis",
    description: `${params.tankId || "Tank"} • ${finalStatus} • Score ${healthScore}`,
    status,
    zone: params.tankId,
    dedupeKey: `water:${params.tankId ?? "unknown"}:${params.sourceTimestamp ?? "na"}`,
    metadata: {
      tankId: params.tankId,
      finalStatus,
      healthScore,
      sourceTimestamp: params.sourceTimestamp,
    },
  });
}
