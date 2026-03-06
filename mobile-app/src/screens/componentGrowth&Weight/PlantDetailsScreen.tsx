import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import Svg, { Path, Circle, Line, Text as SvgText } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "../../auth/useAuth";
import { getPlantDetails } from "../../api/plantsApi";

type HistoryItem = {
  id: string;
  ts: number;
  dateLabel: string;
  ageDays?: number;
  weightG: number; // actual
  predG: number; // predicted
  kind: "scan" | "prediction";
};

type RouteParams = { plant_id: string };

const START_W_KEY = (plantId: string) => `plant_start_weight_g:${String(plantId).toLowerCase()}`;
const CURRENT_W_KEY = (plantId: string) => `plant_current_weight_g:${String(plantId).toLowerCase()}`;

async function getCachedStartWeight(plantId: string): Promise<number | null> {
  try {
    const v = await AsyncStorage.getItem(START_W_KEY(plantId));
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

async function getCachedCurrentWeight(plantId: string): Promise<number | null> {
  try {
    const v = await AsyncStorage.getItem(CURRENT_W_KEY(plantId));
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

async function setCachedStartWeightIfMissing(plantId: string, w: number) {
  try {
    if (!Number.isFinite(w) || w <= 0) return;
    const key = START_W_KEY(plantId);
    const existing = await AsyncStorage.getItem(key);
    if (existing) return; // do not overwrite
    await AsyncStorage.setItem(key, String(w));
  } catch {
    // ignore
  }
}

function TopStat({
  icon,
  label,
  value,
  subValue,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <View className="flex-1 bg-white rounded-[14px] border border-gray-100 px-3 py-3">
      <View className="flex-row items-center">
        <Ionicons name={icon} size={16} color="#003B8F" />
        <Text className="ml-2 text-[10px] font-extrabold text-gray-500 tracking-[0.4px]">
          {label}
        </Text>
      </View>
      <Text className="text-[18px] font-extrabold text-gray-900 mt-2">{value}</Text>
      {subValue ? <Text className="text-[10px] font-bold text-green-600 mt-1">{subValue}</Text> : null}
    </View>
  );
}

function SegButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className={`px-4 py-2 rounded-full ${
        active ? "bg-[#EAF4FF] border border-[#B6C8F0]" : "bg-[#EEF2F7]"
      }`}
    >
      <Text className={`text-[10px] font-extrabold ${active ? "text-[#003B8F]" : "text-gray-600"}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function HistoryRow({ item, highlight }: { item: HistoryItem; highlight?: boolean }) {
  const isPred = item.kind === "prediction";

  return (
    <View
      className={`bg-white rounded-[16px] border ${
        highlight ? "border-[#003B8F]" : "border-gray-100"
      } px-4 py-3 mb-3`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View
            className={`w-9 h-9 rounded-full ${
              highlight ? "bg-[#EAF4FF]" : "bg-[#EEF2F7]"
            } items-center justify-center`}
          >
            <Ionicons
              name={highlight ? "checkmark-circle-outline" : isPred ? "analytics-outline" : "camera-outline"}
              size={18}
              color={highlight ? "#003B8F" : "#64748B"}
            />
          </View>

          <View className="ml-3">
            <Text className="text-[12px] font-extrabold text-gray-900">
              {item.dateLabel}
              {item.ageDays != null ? `  •  Age ${item.ageDays}d` : ""}
            </Text>
            <Text className="text-[10px] font-bold text-gray-500 mt-1">Pred: {item.predG.toFixed(2)}g</Text>
          </View>
        </View>

        <View className="items-end">
          <Text className="text-[14px] font-extrabold text-gray-900">{item.weightG.toFixed(2)}g</Text>

          <View className={`mt-2 px-3 py-1 rounded-full self-end ${isPred ? "bg-[#EEF2F7]" : "bg-[#EAF4FF]"}`}>
            <Text className={`text-[10px] font-extrabold ${isPred ? "text-gray-600" : "text-[#003B8F]"}`}>
              {isPred ? "Predicted" : "Scan"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function parseTs(x: any) {
  const d = new Date(x);
  const t = d.getTime();
  return Number.isFinite(t) ? t : 0;
}

function prettyDayLabel(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "2-digit" });
}

function GrowthTrendChart({
  labels,
  actual,
  predicted,
}: {
  labels: string[];
  actual: number[];
  predicted: number[];
}) {
  const w = 340;
  const h = 180;
  const pad = 22;

  const safeActual = actual.map((v) => (Number.isFinite(v) ? v : NaN));
  const safePred = predicted.map((v) => (Number.isFinite(v) ? v : NaN));

  const all = [...safeActual, ...safePred].filter((x) => Number.isFinite(x));
  const min = all.length ? Math.min(...all) : 0;
  const max = all.length ? Math.max(...all) : 1;

  const scaleX = (i: number) => pad + (i * (w - pad * 2)) / Math.max(1, labels.length - 1);
  const scaleY = (v: number) => {
    if (!Number.isFinite(v)) return h - pad; // drop NaNs to bottom (won't be drawn anyway)
    if (max === min) return h / 2;
    const t = (v - min) / (max - min);
    return h - pad - t * (h - pad * 2);
  };

  const toPath = (vals: number[]) => {
    let started = false;
    let d = "";
    vals.forEach((v, i) => {
      if (!Number.isFinite(v)) return;
      d += `${started ? " L" : " M"} ${scaleX(i)} ${scaleY(v)}`;
      started = true;
    });
    return d;
  };

  return (
    <View className="mt-4 bg-white rounded-[18px] shadow-sm px-4 py-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[12px] font-extrabold text-gray-700">Growth Trajectory</Text>
        <Text className="text-[10px] font-bold text-gray-400">Predicted</Text>
      </View>

      <Svg width={w} height={h}>
        {[0, 1, 2, 3].map((k) => {
          const y = pad + (k * (h - pad * 2)) / 3;
          return <Line key={k} x1={pad} y1={y} x2={w - pad} y2={y} stroke="#D8E3FF" strokeWidth={1} />;
        })}

        <Path d={toPath(safeActual)} stroke="#111827" strokeWidth={3} fill="none" />
        <Path d={toPath(safePred)} stroke="#003B8F" strokeWidth={3} fill="none" strokeDasharray="6 6" />

        {safeActual.map((v, i) =>
          Number.isFinite(v) ? <Circle key={`a-${i}`} cx={scaleX(i)} cy={scaleY(v)} r={3} fill="#111827" /> : null
        )}
        {safePred.map((v, i) =>
          Number.isFinite(v) ? <Circle key={`p-${i}`} cx={scaleX(i)} cy={scaleY(v)} r={3} fill="#003B8F" /> : null
        )}

        {labels.map((t, i) => (
          <SvgText key={`x-${i}`} x={scaleX(i)} y={h - 4} fontSize="9" fill="#6B7280" textAnchor="middle">
            {t}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

export default function PlantDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { accessToken } = useAuth();

  const params: RouteParams | undefined = route.params;
  const plant_id = params?.plant_id;

  const [range, setRange] = useState<"7d" | "month" | "all">("7d");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  // ✅ cached start weight override (first-ever scan)
  const [startOverride, setStartOverride] = useState<number | null>(null);
  const [currentOverride, setCurrentOverride] = useState<number | null>(null); // NEW

  useEffect(() => {
    if (!plant_id) return;
    (async () => {
      const cachedStart = await getCachedStartWeight(plant_id);
      const cachedCurrent = await getCachedCurrentWeight(plant_id);
      setStartOverride(cachedStart);
      setCurrentOverride(cachedCurrent);
    })();
  }, [plant_id]);

  useEffect(() => {
    if (!plant_id) return;

    (async () => {
      try {
        setLoading(true);
        const res = await getPlantDetails({ token: accessToken, plant_id, range } as any);
        setData(res);
      } catch (e: any) {
        Alert.alert("Error", e?.message || "Failed to load plant details");
      } finally {
        setLoading(false);
      }
    })();
  }, [plant_id, range, accessToken]);

  // If backend returns a valid start weight and we don't have cached start yet, lock it in.
  useEffect(() => {
    if (!plant_id) return;
    const backendStart = Number(data?.start_weight_g ?? 0);
    if (startOverride == null && Number.isFinite(backendStart) && backendStart > 0) {
      (async () => {
        await setCachedStartWeightIfMissing(plant_id, backendStart);
        const cached = await getCachedStartWeight(plant_id);
        setStartOverride(cached);
      })();
    }
  }, [data, plant_id, startOverride]);

  const ui = useMemo(() => {
    console.log("🔍 Raw backend data:", JSON.stringify(data, null, 2));

    const fmt2 = (n: any) => {
      const x = Number(n);
      return Number.isFinite(x) ? Number(x.toFixed(2)) : 0;
    };

    const name = data?.display_name ?? `Plant ${plant_id ?? ""}`;
    const plantedOn = data?.planted_on ?? "Planted --";
    const ageDays = Number(data?.age_days ?? 0);

    // Backend values
    const backendStartWeight = fmt2(data?.start_weight_g ?? 0);
    const backendCurrentWeight = fmt2(data?.current_weight_g ?? 0);

    console.log("🔝 Backend top-level:", {
      start_weight_g: backendStartWeight,
      current_weight_g: backendCurrentWeight,
    });

    // Build history
    const items: HistoryItem[] = [];

    const scans = Array.isArray(data?.scans) ? data.scans : [];
    for (const s of scans) {
      const ts = parseTs(s?.ts || s?.created_at || s?.captured_at || s?.time);
      const age = s?.plant_age_days ?? s?.age_days ?? undefined;
      const w = fmt2(s?.weight_est_g ?? s?.weight_g ?? s?.actual_weight_g ?? 0);
      items.push({
        id: `scan-${s?.id ?? ts}`,
        ts,
        dateLabel: prettyDayLabel(ts) || "Scan",
        ageDays: age != null ? Number(age) : undefined,
        weightG: w,
        predG: fmt2(s?.predicted_g ?? s?.predicted_weight_g ?? 0),
        kind: "scan",
      });
    }

    const preds = Array.isArray(data?.growth_predictions) ? data.growth_predictions : [];
    for (const p of preds) {
      const ts = parseTs(p?.created_at || p?.ts || p?.time || p?.date);
      const age = p?.age_days ?? p?.plant_age_days ?? undefined;
      const predW = fmt2(p?.predicted_weight_g ?? p?.predicted_g ?? 0);
      items.push({
        id: `pred-${p?.id ?? ts}`,
        ts,
        dateLabel: p?.date_label ?? (prettyDayLabel(ts) || "Prediction"),
        ageDays: age != null ? Number(age) : undefined,
        weightG: 0,
        predG: predW,
        kind: "prediction",
      });
    }

    // fallback "history"
    const fallbackHistory = Array.isArray(data?.history) ? data.history : [];
    if (items.length === 0 && fallbackHistory.length > 0) {
      fallbackHistory.forEach((h: any, idx: number) => {
        const ts = parseTs(h?.ts || h?.created_at || h?.date || Date.now() - idx * 1000);
        items.push({
          id: `h-${idx}`,
          ts,
          dateLabel: h?.date_label ?? h?.date ?? prettyDayLabel(ts),
          ageDays: h?.age_days ?? undefined,
          weightG: h?.actual_weight_g == null ? 0 : fmt2(h.actual_weight_g),
          predG: h?.predicted_weight_g == null ? 0 : fmt2(h.predicted_weight_g),
          kind: h?.kind === "scan" ? "scan" : "prediction",
        });
      });
    }

    console.log("📊 Total items parsed:", items.length);

    const sortedAsc = [...items].sort((a, b) => a.ts - b.ts);
    const sortedDesc = [...items].sort((a, b) => b.ts - a.ts);

    const scanPoints = sortedAsc.filter((x) => x.kind === "scan" && x.weightG > 0);
    const predPoints = sortedAsc.filter((x) => x.kind === "prediction" && x.predG > 0);

    console.log("📈 Scan points:", scanPoints.map((s) => ({ w: s.weightG, age: s.ageDays })));

    // ✅ ONLY use actual scanned weights for START and CURRENT
    const startFromCache = startOverride != null && Number.isFinite(startOverride) ? startOverride : 0;
    const currentFromCache = currentOverride != null && Number.isFinite(currentOverride) ? currentOverride : 0;

    // START: Use cached first scan, then backend, then first scan in history, else 0
    const startWeightG =
      startFromCache > 0
        ? fmt2(startFromCache)
        : backendStartWeight > 0
        ? backendStartWeight
        : scanPoints.length > 0
        ? scanPoints[0].weightG
        : 0;

    // CURRENT: Use cached current scan, then backend, then last scan in history, else 0
    const currentWeightG =
      currentFromCache > 0
        ? fmt2(currentFromCache)
        : backendCurrentWeight > 0
        ? backendCurrentWeight
        : scanPoints.length > 0
        ? scanPoints[scanPoints.length - 1].weightG
        : 0;

    // Predicted value (not used in START/CURRENT, only for display elsewhere if needed)
    const predictedToday = predPoints.length > 0 ? predPoints[predPoints.length - 1].predG : 0;

    console.log("📊 Final weights:", { START: startWeightG, CURRENT: currentWeightG, PREDICTED: predictedToday });

    // Chart series
    const chartLabels: string[] = [];
    const actualSeries: number[] = [];
    const predictedSeries: number[] = [];

    scanPoints.forEach((s) => {
      chartLabels.push(s.ageDays != null ? `D${s.ageDays}` : "Scan");
      actualSeries.push(s.weightG);
      predictedSeries.push(s.predG > 0 ? s.predG : s.weightG);
    });

    predPoints.forEach((p) => {
      const alreadyHasScanAtSameTime = scanPoints.some((s) => Math.abs(s.ts - p.ts) < 60000);
      if (!alreadyHasScanAtSameTime) {
        chartLabels.push(p.ageDays != null ? `D${p.ageDays}` : "Pred");
        actualSeries.push(NaN);
        predictedSeries.push(p.predG);
      }
    });

    const growthPctLabel =
      startWeightG > 0 && currentWeightG > startWeightG
        ? `+${(((currentWeightG - startWeightG) / startWeightG) * 100).toFixed(0)}%`
        : "";

    return {
      name,
      plantedOn,
      ageDays,
      startWeightG,
      currentWeightG,
      predictedToday,
      growthPctLabel,
      historyAsc: sortedAsc,
      historyDesc: sortedDesc,
      chart: { labels: chartLabels, actual: actualSeries, predicted: predictedSeries },
    };
  }, [data, plant_id, startOverride, currentOverride]); // include currentOverride

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      <View className="px-4 pt-2 pb-2">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <View className="items-center">
            <Text className="text-[13px] font-extrabold text-gray-900">{ui.name}</Text>
            <Text className="text-[10px] font-bold text-gray-500 mt-1">{ui.plantedOn}</Text>
          </View>

          <View className="w-10 h-10" />
        </View>
      </View>

      {!plant_id ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[12px] font-semibold text-gray-600">Missing plant_id.</Text>
        </View>
      ) : loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-2 text-[11px] text-gray-500 font-semibold">Loading plant details...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        >
          <View className="flex-row mt-4" style={{ gap: 10 }}>
            <TopStat icon="calendar-outline" label="AGE" value={`${ui.ageDays} Days`} />
            <TopStat icon="hourglass-outline" label="START" value={`${ui.startWeightG.toFixed(2)}g`} />
            <TopStat
              icon="bar-chart-outline"
              label="CURRENT"
              value={`${ui.currentWeightG.toFixed(2)}g`}
              subValue={ui.growthPctLabel}
            />
          </View>

          <GrowthTrendChart labels={ui.chart.labels} actual={ui.chart.actual} predicted={ui.chart.predicted} />

          <View className="flex-row mt-4" style={{ gap: 10 }}>
            <SegButton label="Last 7 Days" active={range === "7d"} onPress={() => setRange("7d")} />
            <SegButton label="Last Month" active={range === "month"} onPress={() => setRange("month")} />
            <SegButton label="All Time" active={range === "all"} onPress={() => setRange("all")} />
          </View>

          <View className="flex-row items-center justify-between mt-6 mb-3">
            <Text className="text-[13px] font-extrabold text-gray-900">History Log</Text>
            <TouchableOpacity activeOpacity={0.9} onPress={() => {}} className="flex-row items-center">
              <Text className="text-[11px] font-bold text-gray-500 mr-1">Filter</Text>
              <Ionicons name="filter-outline" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {ui.historyDesc.length === 0 ? (
            <View className="bg-white rounded-[16px] border border-gray-100 px-4 py-4">
              <Text className="text-[11px] font-semibold text-gray-500">No history yet.</Text>
            </View>
          ) : (
            ui.historyDesc.map((h, idx) => <HistoryRow key={h.id} item={h} highlight={idx === 0} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}