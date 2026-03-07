import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import Svg, { Path, Circle, Line, Text as SvgText } from "react-native-svg";
import { useAuth } from "../../auth/useAuth";
import { saveGrowthPrediction } from "../../api/growthApi";
import { getPlants } from "../../api/plantsApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addScanToCache } from "../componentGrowth&Weight/PlantDetailsScreen";

type RouteParams = {
  dateLabel?: string;
  predictedWeight?: number;
  predictedArea?: number;
  predictedDiameter?: number;
  changePct?: number;
  labels?: string[];
  actual?: number[];
  predicted?: number[];
  analyzedWeight?: number;
};

type PlantListItem = {
  plant_id: string;
  listKey: string;
  zone_id?: string;
  planted_at?: string | null;
  latest_age_days?: number | null;
};

const normalizePlantId = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^[^a-z0-9_-]+/i, "");

function StatCard({
  title,
  value,
  unit,
  changePct,
  icon,
}: {
  title: string;
  value: string;
  unit?: string;
  changePct: number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-100">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
          {title}
        </Text>
        <View className="w-8 h-8 rounded-full bg-[#EAF4FF] items-center justify-center">
          <Ionicons name={icon} size={16} color="#003B8F" />
        </View>
      </View>

      <View className="flex-row items-end mb-2">
        <Text className="text-[22px] font-extrabold text-gray-900">{value}</Text>
        {unit && (
          <Text className="text-[12px] font-bold text-gray-500 ml-1 mb-1">
            {unit}
          </Text>
        )}
      </View>

      <View className="self-start px-2.5 py-1 rounded-full bg-green-100 flex-row items-center">
        <Ionicons name="trending-up" size={12} color="#16A34A" />
        <Text className="ml-1 text-[10px] font-extrabold text-green-700">
          +{changePct.toFixed(1)}%
        </Text>
      </View>
    </View>
  );
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
  const w = 320;
  const h = 160;
  const pad = 20;

  const all = [...actual, ...predicted].filter((x) => Number.isFinite(x));
  const min = all.length ? Math.min(...all) : 0;
  const max = all.length ? Math.max(...all) : 1;

  const scaleX = (i: number) => pad + (i * (w - pad * 2)) / Math.max(1, labels.length - 1);

  const scaleY = (v: number) => {
    if (max === min) return h / 2;
    const t = (v - min) / (max - min);
    return h - pad - t * (h - pad * 2);
  };

  const toPath = (vals: number[]) =>
    vals
      .map((v, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(v)}`)
      .join(" ");

  const pathActual = toPath(actual);
  const pathPred = toPath(predicted);

  const lastIdx = labels.length - 1;

  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-100">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-[13px] font-extrabold text-gray-900">Growth Trend</Text>

        <View className="flex-row items-center" style={{ gap: 12 }}>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-gray-900" />
            <Text className="ml-1.5 text-[10px] font-bold text-gray-600">Actual</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-[#003B8F]" />
            <Text className="ml-1.5 text-[10px] font-bold text-gray-600">Predicted</Text>
          </View>
        </View>
      </View>

      <Svg width={w} height={h}>
        {[0, 1, 2, 3].map((k) => {
          const y = pad + (k * (h - pad * 2)) / 3;
          return (
            <Line
              key={k}
              x1={pad}
              y1={y}
              x2={w - pad}
              y2={y}
              stroke="#E5E7EB"
              strokeWidth={1}
            />
          );
        })}

        <Path d={pathActual} stroke="#111827" strokeWidth={3} fill="none" />
        <Path d={pathPred} stroke="#003B8F" strokeWidth={3} fill="none" strokeDasharray="5 5" />

        {actual.map((v, i) => (
          <Circle key={`a-${i}`} cx={scaleX(i)} cy={scaleY(v)} r={4} fill="#111827" />
        ))}
        {predicted.map((v, i) => (
          <Circle key={`p-${i}`} cx={scaleX(i)} cy={scaleY(v)} r={4} fill="#003B8F" />
        ))}

        {labels.length > 0 && (
          <>
            <Circle
              cx={scaleX(lastIdx)}
              cy={scaleY(predicted[lastIdx])}
              r={8}
              stroke="#003B8F"
              strokeWidth={3}
              fill="white"
            />
            <Circle cx={scaleX(lastIdx)} cy={scaleY(predicted[lastIdx])} r={4} fill="#003B8F" />
          </>
        )}

        {labels.map((t, i) => (
          <SvgText
            key={`x-${i}`}
            x={scaleX(i)}
            y={h - 4}
            fontSize="10"
            fontWeight="600"
            fill="#6B7280"
            textAnchor="middle"
          >
            {t}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

function parseISODateOnly(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d;
}

function diffDays(from: Date, to: Date) {
  const ms = 1000 * 60 * 60 * 24;
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.max(0, Math.round((b - a) / ms));
}

export default function GrowthPredictionResultsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params: RouteParams = route.params || {};
  const { accessToken } = useAuth();

  const [saving, setSaving] = useState(false);
  const [plantId, setPlantId] = useState("");
  const [plantAge, setPlantAge] = useState("");

  const [plants, setPlants] = useState<PlantListItem[]>([]);
  const [loadingPlants, setLoadingPlants] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : "0.0");

  const toNum = (v: any, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const toNumArray = (arr: any, fallbackLen = 2) => {
    if (!Array.isArray(arr)) return new Array(fallbackLen).fill(0);
    return arr.map((x) => toNum(x, 0));
  };

  const model = useMemo(() => {
    const dateLabel = params.dateLabel ?? "Tomorrow";

    const predictedWeight = toNum(params.predictedWeight, 0);
    const predictedArea = toNum(params.predictedArea, 0);
    const predictedDiameter = toNum(params.predictedDiameter, 0);

    const labels = Array.isArray(params.labels) ? params.labels : ["Today", "D+1"];
    const actual = toNumArray(params.actual, labels.length);
    const predicted = toNumArray(params.predicted, labels.length);

    const L = labels.length;
    const actualFixed = actual
      .slice(0, L)
      .concat(new Array(Math.max(0, L - actual.length)).fill(actual[0] ?? 0));
    const predFixed = predicted
      .slice(0, L)
      .concat(new Array(Math.max(0, L - predicted.length)).fill(predicted[0] ?? 0));

    const changePct =
      params.changePct != null
        ? toNum(params.changePct, 0)
        : predFixed[0] > 0
        ? ((predFixed[1] - predFixed[0]) / predFixed[0]) * 100
        : 0;

    return {
      dateLabel,
      predictedWeight,
      predictedArea,
      predictedDiameter,
      changePct,
      labels,
      actual: actualFixed,
      predicted: predFixed,
    };
  }, [params]);

  const isExistingPlant = useMemo(() => {
    const id = plantId.trim().toLowerCase();
    if (!id) return false;
    return plants.some((p) => String(p.plant_id).trim().toLowerCase() === id);
  }, [plantId, plants]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoadingPlants(true);
        const res = await getPlants({ token: accessToken } as any);
        const list: PlantListItem[] = Array.isArray(res) ? res : (res as any)?.plants ?? [];
        if (!mounted) return;

        const seen = new Set<string>();

        const cleaned = list
          .reduce<PlantListItem[]>((acc, p, index) => {
            if (!p?.plant_id) return acc;

            const normalizedId = normalizePlantId(p.plant_id);
            if (!normalizedId) return acc;

            if (normalizedId === "p04") return acc;
            if (seen.has(normalizedId)) return acc;
            seen.add(normalizedId);

            const cleanId = String(p.plant_id).trim().replace(/^[^a-z0-9_-]+/i, "");

            acc.push({
              plant_id: cleanId || normalizedId.toUpperCase(),
              listKey: `${normalizedId}-${index}`,
              zone_id: p.zone_id ?? "z01",
              planted_at: p.planted_at ?? null,
              latest_age_days: (p as any).latest_age_days ?? (p as any).age_days ?? null,
            });

            return acc;
          }, [])
          .sort((a, b) => a.plant_id.localeCompare(b.plant_id));

        setPlants(cleaned);
      } catch {
        setPlants([]);
      } finally {
        setLoadingPlants(false);
      }
    };

    if (accessToken) load();

    return () => {
      mounted = false;
    };
  }, [accessToken]);

  const onSelectPlant = (p: PlantListItem) => {
    setPlantId(p.plant_id);

    const planted = parseISODateOnly(p.planted_at);
    if (planted) {
      const age = diffDays(planted, new Date());
      setPlantAge(String(age));
    } else if (p.latest_age_days != null) {
      setPlantAge(String(p.latest_age_days));
    } else {
      setPlantAge("");
    }

    setPickerOpen(false);
  };

  const onSave = async () => {
    if (!plantId.trim()) {
      Alert.alert("Missing Input", "Please select or enter a Plant ID.");
      return;
    }

    const todayAge = parseInt(plantAge, 10);
    if (!plantAge.trim() || isNaN(todayAge) || todayAge <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid plant age (days).");
      return;
    }

    const savedAge = isExistingPlant ? todayAge + 1 : todayAge;

    try {
      setSaving(true);

      const cleanPlantId = plantId.trim();

      const payload = {
        plant_id: cleanPlantId,
        zone_id: "z01",
        age_days: savedAge,
        date_label: model.dateLabel,
        predicted_weight_g: model.predictedWeight,
        predicted_area_cm2: model.predictedArea,
        predicted_diameter_cm: model.predictedDiameter,
        change_pct: model.changePct,
        series: {
          labels: model.labels,
          actual: model.actual,
          predicted: model.predicted,
        },
      };

      await saveGrowthPrediction({ token: accessToken, payload });

      const analyzedWeight = Number(params.analyzedWeight ?? model.actual?.[0] ?? 0);

      await cacheAnalysisWeights(cleanPlantId, analyzedWeight);

      if (Number.isFinite(analyzedWeight) && analyzedWeight > 0) {
        await addScanToCache(cleanPlantId, {
          weight_g: analyzedWeight,
          age_days: todayAge,
        });

        console.log("✅ Actual scan saved to cache", {
          plant_id: cleanPlantId,
          weight_g: analyzedWeight,
          age_days: todayAge,
        });
      }

      Alert.alert("Success", `Prediction saved successfully.`, [
        { text: "OK", onPress: () => navigation.navigate("PlantLists") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to save prediction.");
    } finally {
      setSaving(false);
    }
  };

  const savedAgePreview = useMemo(() => {
    if (!plantAge) return "—";
    const todayAge = Number(plantAge);
    if (!Number.isFinite(todayAge)) return "—";
    return String(isExistingPlant ? todayAge + 1 : todayAge);
  }, [plantAge, isExistingPlant]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F8FAFC]">
      {/* Header */}
      <View className="px-4 py-3 bg-[#F8FAFC]">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            className="w-9 h-9 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>

          <Text className="text-[15px] font-bold text-gray-900">Prediction Results</Text>
          
          <View className="w-9 h-9" />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Forecast Header */}
            <View className="mb-4">
              <Text className="text-[20px] font-extrabold text-gray-900 text-center">
                Growth Forecast
              </Text>
              <Text className="text-[11px] font-semibold text-gray-500 text-center mt-1">
                Predicted for {model.dateLabel}
              </Text>
            </View>

            {/* Main Weight Card */}
            <View className="mb-3">
              <StatCard
                title="PREDICTED WEIGHT"
                value={fmt(model.predictedWeight)}
                unit="g"
                changePct={model.changePct}
                icon="leaf-outline"
              />
            </View>

            {/* Secondary Stats */}
            <View className="flex-row mb-3" style={{ gap: 12 }}>
              <View className="flex-1">
                <StatCard
                  title="AREA"
                  value={fmt(model.predictedArea)}
                  unit="cm²"
                  changePct={model.changePct}
                  icon="expand-outline"
                />
              </View>
              <View className="flex-1">
                <StatCard
                  title="DIAMETER"
                  value={fmt(model.predictedDiameter)}
                  unit="cm"
                  changePct={model.changePct}
                  icon="resize-outline"
                />
              </View>
            </View>

            {/* Growth Chart */}
            <View className="mb-4">
              <GrowthTrendChart
                labels={model.labels}
                actual={model.actual}
                predicted={model.predicted}
              />
            </View>

            {/* Plant Information */}
            <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-3">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 rounded-full bg-[#EAF4FF] items-center justify-center mr-2">
                  <Ionicons name="information-circle-outline" size={18} color="#003B8F" />
                </View>
                <Text className="text-[13px] font-extrabold text-gray-900">Plant Information</Text>
              </View>

              {/* Plant ID Input */}
              <Text className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-2">
                PLANT ID
              </Text>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setPickerOpen(true)}
                className="bg-[#F8FAFC] rounded-xl px-4 py-3.5 flex-row items-center justify-between border border-gray-200 mb-3"
              >
                <Text
                  className={`text-[13px] font-semibold ${
                    plantId ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {plantId
                    ? plantId
                    : loadingPlants
                    ? "Loading plants..."
                    : "Tap to select saved plant"}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#6B7280" />
              </TouchableOpacity>

              <TextInput
                value={plantId}
                onChangeText={setPlantId}
                placeholder="Or enter new Plant ID (e.g., P001)"
                placeholderTextColor="#9CA3AF"
                className="bg-[#F8FAFC] rounded-xl px-4 py-3.5 text-[13px] font-semibold text-gray-900 border border-gray-200 mb-4"
                autoCapitalize="characters"
                autoCorrect={false}
              />

              {/* Plant Age Input */}
              <Text className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-2">
                PLANT AGE ({isExistingPlant ? "TODAY" : "START"})
              </Text>
              
              <TextInput
                value={plantAge}
                onChangeText={setPlantAge}
                placeholder={
                  isExistingPlant
                    ? "Auto-filled for saved plants"
                    : "Enter start age (days)"
                }
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                className="bg-[#F8FAFC] rounded-xl px-4 py-3.5 text-[13px] font-semibold text-gray-900 border border-gray-200"
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onSave}
              disabled={saving}
              className="bg-[#003B8F] rounded-2xl py-4 items-center justify-center flex-row"
              style={{ opacity: saving ? 0.6 : 1 }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                  <Text className="ml-2 text-[14px] font-extrabold text-white">
                    Save Prediction
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Plant Picker Modal - Improved Design */}
      <Modal visible={pickerOpen} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <Pressable 
            className="flex-1" 
            onPress={() => setPickerOpen(false)} 
          />
          
          <View className="bg-white rounded-t-[28px]" style={{ maxHeight: '75%' }}>
            {/* Modal Header */}
            <View className="px-5 pt-5 pb-3 border-b border-gray-100">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-[17px] font-extrabold text-gray-900">
                  Select Plant
                </Text>
                <TouchableOpacity
                  onPress={() => setPickerOpen(false)}
                  className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color="#111827" />
                </TouchableOpacity>
              </View>
              <Text className="text-[12px] font-semibold text-gray-500">
                Choose from your saved plants
              </Text>
            </View>

            {/* Plant List */}
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
            >
              {plants.length === 0 ? (
                <View className="py-16 items-center">
                  <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
                    <Ionicons name="leaf-outline" size={32} color="#9CA3AF" />
                  </View>
                  <Text className="text-[14px] font-extrabold text-gray-900 mb-1">
                    No Plants Yet
                  </Text>
                  <Text className="text-[12px] font-semibold text-gray-500 text-center">
                    You haven't saved any plants yet.{"\n"}Add your first plant to get started!
                  </Text>
                </View>
              ) : (
                plants.map((p, index) => (
                  <TouchableOpacity
                    key={p.listKey}
                    activeOpacity={0.9}
                    onPress={() => onSelectPlant(p)}
                    className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
                  >
                    <View className="flex-row items-center">
                      {/* Plant Icon */}
                      <View className="w-12 h-12 rounded-full bg-[#EAF4FF] items-center justify-center mr-3">
                        <Ionicons name="leaf" size={22} color="#003B8F" />
                      </View>

                      {/* Plant Details */}
                      <View className="flex-1">
                        <Text className="text-[14px] font-extrabold text-gray-900 mb-1">
                          {p.plant_id}
                        </Text>
                        <View className="flex-row items-center">
                          <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                          <Text className="text-[11px] font-semibold text-gray-500 ml-1">
                            {p.planted_at
                              ? new Date(p.planted_at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : p.latest_age_days != null
                              ? `Day ${p.latest_age_days}`
                              : "No age data"}
                          </Text>
                        </View>
                      </View>

                      {/* Arrow */}
                      <View className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center">
                        <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const START_W_KEY = (plantId: string) =>
  `plant_start_weight_g:${String(plantId).toLowerCase()}`;
const CURRENT_W_KEY = (plantId: string) =>
  `plant_current_weight_g:${String(plantId).toLowerCase()}`;

async function cacheAnalysisWeights(plantId: string, currentWeightG: number) {
  if (!Number.isFinite(currentWeightG) || currentWeightG <= 0) return;

  const startKey = START_W_KEY(plantId);
  const currentKey = CURRENT_W_KEY(plantId);

  await AsyncStorage.setItem(currentKey, String(currentWeightG));

  const existingStart = await AsyncStorage.getItem(startKey);
  if (!existingStart) {
    await AsyncStorage.setItem(startKey, String(currentWeightG));
  }
}