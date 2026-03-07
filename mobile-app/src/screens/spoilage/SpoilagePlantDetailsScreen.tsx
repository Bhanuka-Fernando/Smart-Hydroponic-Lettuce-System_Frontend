import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SpoilageStackParamList } from "../../navigation/SpoilageNavigator";

import {
  getPlantHistory,
  type SpoilagePredictionRow,
} from "../../api/SpoilageApi";
import { SPOILAGE_BASE_URL } from "../../utils/constants";

type Props = NativeStackScreenProps<
  SpoilageStackParamList,
  "SpoilagePlantDetails"
>;

function isSimPlantId(id: string) {
  return String(id || "").trim().toUpperCase().startsWith("SIM-");
}

function displayPlantId(id: string) {
  return isSimPlantId(id) ? String(id).replace(/^SIM-/i, "") : String(id);
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h === 0 ? 12 : h;

  return `${yyyy}.${mm}.${dd} • ${h}:${m} ${ampm}`;
}

function stageLabel(stage: SpoilagePredictionRow["stage"]) {
  if (stage === "fresh") return "Fresh";
  if (stage === "slightly_aged") return "Slightly Aged";
  if (stage === "near_spoilage") return "Near Spoilage";
  return "Spoiled";
}

function badge(stage: SpoilagePredictionRow["stage"]) {
  if (stage === "fresh") {
    return { bg: "#E9FBEF", text: "#16A34A", label: "Fresh" };
  }
  if (stage === "slightly_aged") {
    return { bg: "#ECFDF5", text: "#22C55E", label: "Slightly Aged" };
  }
  if (stage === "near_spoilage") {
    return { bg: "#FFF7ED", text: "#F59E0B", label: "Near Spoilage" };
  }
  return { bg: "#FEE2E2", text: "#DC2626", label: "Spoiled" };
}

function formatRemainingDays(value: number | null | undefined) {
  const n = Math.max(0, Number(value ?? 0));
  return `${Math.round(n)} days`;
}

function getInitialDemoDayIndex(stage?: string | null) {
  const s = String(stage || "").trim().toLowerCase();

  if (s === "fresh") return 0;          // Day 0
  if (s === "slightly_aged") return 1;  // Day 2
  if (s === "near_spoilage") return 2;  // Day 4
  if (s === "spoiled") return 3;        // Day 7

  return 0;
}

export default function SpoilagePlantDetailsScreen({
  navigation,
  route,
}: Props) {
  const { plantId } = route.params;

  const [rows, setRows] = useState<SpoilagePredictionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPlantHistory(plantId, 30);

      const sorted = [...data].sort((a, b) => {
        const ta = new Date(a.captured_at).getTime();
        const tb = new Date(b.captured_at).getTime();
        return tb - ta;
      });

      setRows(sorted);
    } catch (e: any) {
      console.log("history load error:", e?.message, e?.response?.data);
      Alert.alert("Error", e?.response?.data?.detail || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [plantId]);

  useEffect(() => {
    load();
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [plantId, navigation, load]);

  const current = rows.length > 0 ? rows[0] : null;
  const sim = isSimPlantId(plantId);
  const titlePlant = `${displayPlantId(plantId)}${sim ? " (Sim)" : ""}`;

  const handleRescan = () => {
    navigation.navigate("SpoilageScan", {
      plantId,
      demoMode: sim,
      initialDemoDayIndex: sim ? getInitialDemoDayIndex(current?.stage) : undefined,
    } as never);
  };

  const header = useMemo(() => {
    if (!current) {
      return (
        <View style={{ paddingBottom: 10 }}>
          <Text className="text-[16px] font-extrabold text-gray-900">
            {titlePlant}
          </Text>
          <Text className="text-[12px] text-gray-500 mt-1">No scans yet</Text>
        </View>
      );
    }

    const b = badge(current.stage);
    const imgUri = current.image_url
      ? `${SPOILAGE_BASE_URL}${current.image_url}`
      : undefined;

    return (
      <View>
        <View className="bg-white rounded-[18px] p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="text-[16px] font-extrabold text-gray-900">
              {titlePlant}
            </Text>

            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: b.bg }}
            >
              <Text
                className="text-[11px] font-extrabold"
                style={{ color: b.text }}
              >
                {b.label}
              </Text>
            </View>
          </View>

          <Text className="text-[12px] text-gray-500 mt-1">
            Last scan: {formatDateTime(current.captured_at)}
          </Text>

          <View className="flex-row mt-3">
            {imgUri ? (
              <Image
                source={{ uri: imgUri }}
                style={{ width: 86, height: 86, borderRadius: 18 }}
                resizeMode="cover"
                resizeMethod="resize"
              />
            ) : (
              <View
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: 18,
                  backgroundColor: "#F1F5F9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="image-outline" size={22} color="#9CA3AF" />
              </View>
            )}

            <View className="flex-1 ml-4">
              <Mini
                label="REMAINING DAYS"
                value={formatRemainingDays(current.remaining_days)}
              />
              <View style={{ height: 8 }} />
              <Mini
                label="TEMPERATURE"
                value={`${Number(current.temperature ?? 0).toFixed(1)}°C`}
              />
              <View style={{ height: 8 }} />
              <Mini
                label="HUMIDITY"
                value={`${Math.round(Number(current.humidity ?? 0))}%`}
              />
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleRescan}
            className="mt-4 rounded-[12px] items-center justify-center"
            style={{ backgroundColor: "#0046AD", height: 48 }}
          >
            <View className="flex-row items-center">
              <Ionicons name="scan-outline" size={18} color="#fff" />
              <Text className="ml-2 text-[13px] font-extrabold text-white">
                Rescan This Plant
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text className="text-[14px] font-extrabold text-gray-900 mt-5 mb-3">
          History
        </Text>
      </View>
    );
  }, [current, titlePlant]);

  const renderItem = ({ item }: { item: SpoilagePredictionRow }) => {
    const b = badge(item.stage);

    return (
      <View className="bg-white rounded-[16px] p-4 shadow-sm mb-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-[12px] font-extrabold text-gray-900">
            {formatDateTime(item.captured_at)}
          </Text>

          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: b.bg }}
          >
            <Text
              className="text-[10px] font-extrabold"
              style={{ color: b.text }}
            >
              {stageLabel(item.stage)}
            </Text>
          </View>
        </View>

        <Text className="text-[11px] text-gray-500 mt-2">
          Remaining at scan: {Math.max(0, Number(item.remaining_days ?? 0)).toFixed(0)} days • Temp:{" "}
          {Number(item.temperature ?? 0).toFixed(1)}°C • RH:{" "}
          {Math.round(Number(item.humidity ?? 0))}%
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#EAF4FF]">
      <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>

        <Text className="text-[14px] font-extrabold text-gray-900">
          Plant Details
        </Text>

        <TouchableOpacity
          onPress={load}
          activeOpacity={0.85}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="refresh" size={18} color="#111827" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-2 text-[12px] text-gray-500 font-semibold">
            Loading...
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => String(r.id)}
          renderItem={renderItem}
          ListHeaderComponent={
            <View style={{ padding: 16, paddingBottom: 0 }}>{header}</View>
          }
          contentContainerStyle={{
            padding: 16,
            paddingTop: 0,
            paddingBottom: 24,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-[9px] text-gray-400 font-semibold">{label}</Text>
      <Text className="text-[13px] text-gray-900 font-extrabold mt-0.5">
        {value}
      </Text>
    </View>
  );
}