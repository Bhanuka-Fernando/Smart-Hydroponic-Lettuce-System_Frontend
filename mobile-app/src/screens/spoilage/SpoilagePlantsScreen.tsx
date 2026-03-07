// src/screens/spoilage/SpoilagePlantsScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SpoilageStackParamList } from "../../navigation/SpoilageNavigator";

import {
  getRecentPredictions,
  type SpoilagePredictionRow,
} from "../../api/SpoilageApi";
import { SPOILAGE_BASE_URL } from "../../utils/constants";

type Props = NativeStackScreenProps<SpoilageStackParamList, "SpoilagePlants">;

type Filter = "All Plants" | "Fresh" | "Slightly Aged" | "Spoiled";

type PlantItem = {
  id: string;
  plantId: string;
  day: string;
  remainingDays: number;
  temperature: string;
  humidity: string;
  status: "FRESH" | "SLIGHTLY AGED" | "NEAR SPOILAGE" | "SPOILED";
  imageUrl?: string | null; // db path "/uploads/..jpg" or "/sim-images/..jpg"
};

function formatDay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

function mapStatus(stage: SpoilagePredictionRow["stage"]): PlantItem["status"] {
  if (stage === "fresh") return "FRESH";
  if (stage === "slightly_aged") return "SLIGHTLY AGED";
  if (stage === "near_spoilage") return "NEAR SPOILAGE";
  return "SPOILED";
}

export default function SpoilagePlantsScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<Filter>("All Plants");

  const [rows, setRows] = useState<SpoilagePredictionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);

      // ✅ FIX: reduce load (ScrollView+200+images can crash)
      const data = await getRecentPredictions(50);

      setRows(data);
    } catch (e: any) {
      console.log("Load plants error:", e?.message, e?.response?.data);
      Alert.alert("Error", e?.response?.data?.detail || "Failed to load plants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ✅ FIX: do not double-call too aggressively
    load();
    const unsub = navigation.addListener("focus", load);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Convert DB rows -> PlantItem list
  const plants: PlantItem[] = useMemo(() => {
    return rows.map((r) => ({
      id: String(r.id),
      plantId: r.plant_id,
      day: formatDay(r.captured_at),
      remainingDays: Math.max(0, Math.round(Number(r.remaining_days ?? 0))),
      temperature: `${Math.round(Number(r.temperature ?? 0))}°C`,
      humidity: `${Math.round(Number(r.humidity ?? 0))}%`,
      status: mapStatus(r.stage),
      imageUrl: (r as any).image_url ?? null,
    }));
  }, [rows]);

  const filtered = useMemo(() => {
    if (filter === "All Plants") return plants;
    if (filter === "Fresh") return plants.filter((p) => p.status === "FRESH");
    if (filter === "Slightly Aged")
      return plants.filter((p) => p.status === "SLIGHTLY AGED");
    return plants.filter((p) => p.status === "SPOILED");
  }, [filter, plants]);

  const totalPlants = plants.length;
  const avgShelf = Math.round(
    plants.reduce((sum, p) => sum + p.remainingDays, 0) /
      Math.max(1, plants.length)
  );

  const totalAlerts = plants.filter(
    (p) => p.status === "NEAR SPOILAGE" || p.status === "SPOILED"
  ).length;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#EAF4FF]">
      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => {
                  // ✅ FIX: don’t exit app if this is root
                  if (navigation.canGoBack()) navigation.goBack();
                  else navigation.navigate("SpoilageDetails");
                }}
                activeOpacity={0.85}
                className="w-10 h-10 items-center justify-center"
              >
                <Ionicons name="chevron-back" size={22} color="#111827" />
              </TouchableOpacity>

              <Text className="text-[14px] font-extrabold text-gray-900">
                All Plants
              </Text>

              <TouchableOpacity
                onPress={load}
                activeOpacity={0.85}
                className="w-10 h-10 items-center justify-center"
              >
                <Ionicons name="refresh" size={18} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Filter chips */}
            <View className="mt-3 bg-white rounded-full p-1 flex-row">
              <Chip
                label="All Plants"
                active={filter === "All Plants"}
                onPress={() => setFilter("All Plants")}
              />
              <Chip
                label="Fresh"
                active={filter === "Fresh"}
                onPress={() => setFilter("Fresh")}
              />
              <Chip
                label="Slightly Aged"
                active={filter === "Slightly Aged"}
                onPress={() => setFilter("Slightly Aged")}
              />
              <Chip
                label="Spoiled"
                active={filter === "Spoiled"}
                onPress={() => setFilter("Spoiled")}
              />
            </View>

            {/* Stats summary */}
            <View className="mt-4 bg-white rounded-[18px] p-4 shadow-sm">
              <Text className="text-[14px] font-extrabold text-gray-900">
                Stats Summary
              </Text>

              <View className="flex-row justify-between mt-3">
                <StatBox
                  title="Total Plants"
                  value={String(totalPlants)}
                  bg="#7DE9D9"
                />
                <StatBox
                  title="Avg Shelf-life"
                  value={`${avgShelf} Days`}
                  bg="#AFC8FF"
                />
              </View>

              <View className="mt-3 items-center">
                <View
                  className="rounded-[14px] px-6 py-3"
                  style={{ backgroundColor: "#FAD1D1" }}
                >
                  <Text className="text-[10px] font-semibold text-gray-700 text-center">
                    Total Alerts
                  </Text>
                  <Text className="text-[16px] font-extrabold text-gray-900 text-center mt-1">
                    {totalAlerts}
                  </Text>
                </View>
              </View>
            </View>

            {/* Loading / empty states */}
            {loading ? (
              <View className="py-10 items-center">
                <ActivityIndicator />
                <Text className="mt-2 text-[12px] text-gray-500 font-semibold">
                  Loading...
                </Text>
              </View>
            ) : filtered.length === 0 ? (
              <View className="py-10 items-center">
                <Text className="text-[12px] text-gray-500 font-semibold">
                  No plants yet
                </Text>
              </View>
            ) : null}

            <View className="h-4" />
          </>
        }
        renderItem={({ item }) => (
          <PlantCard
            plant={item}
            onPress={() =>
              navigation.navigate("SpoilagePlantDetails", { plantId: item.plantId })
            }
          />
        )}
        // ✅ performance props
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}

function Chip({
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
      className={`flex-1 py-2 rounded-full items-center justify-center ${
        active ? "bg-[#111827]" : "bg-transparent"
      }`}
    >
      <Text
        className={`text-[11px] font-extrabold ${
          active ? "text-white" : "text-gray-500"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function StatBox({
  title,
  value,
  bg,
}: {
  title: string;
  value: string;
  bg: string;
}) {
  return (
    <View
      className="rounded-[16px] px-4 py-3"
      style={{ width: "48%", backgroundColor: bg }}
    >
      <Text className="text-[10px] font-semibold text-gray-700">{title}</Text>
      <Text className="text-[16px] font-extrabold text-gray-900 mt-1">
        {value}
      </Text>
    </View>
  );
}

function PlantCard({
  plant,
  onPress,
}: {
  plant: PlantItem;
  onPress: () => void;
}) {
  const badgeBg =
    plant.status === "FRESH"
      ? "#E9FBEF"
      : plant.status === "SLIGHTLY AGED"
      ? "#ECFDF5"
      : plant.status === "NEAR SPOILAGE"
      ? "#FFF7ED"
      : "#FEE2E2";

  const badgeText =
    plant.status === "FRESH"
      ? "#16A34A"
      : plant.status === "SLIGHTLY AGED"
      ? "#22C55E"
      : plant.status === "NEAR SPOILAGE"
      ? "#F59E0B"
      : "#DC2626";

  // ✅ FIX: no cache-buster query param (prevents constant re-download)
  const imgUri = plant.imageUrl ? `${SPOILAGE_BASE_URL}${plant.imageUrl}` : undefined;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="bg-white rounded-[18px] p-4 shadow-sm flex-row"
    >
      {imgUri ? (
        <Image
          source={{ uri: imgUri }}
          style={{ width: 76, height: 76, borderRadius: 18 }}
        />
      ) : (
        <View
          style={{
            width: 76,
            height: 76,
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
        <View className="flex-row items-center justify-between">
          <Text className="text-[14px] font-extrabold text-gray-900">
            {plant.plantId}
          </Text>
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: badgeBg }}
          >
            <Text
              className="text-[10px] font-extrabold"
              style={{ color: badgeText }}
            >
              {plant.status}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between mt-2">
          <Mini label="DAY" value={plant.day} />
          <Mini label="REMAINING DAYS" value={String(plant.remainingDays)} />
        </View>

        <View className="flex-row justify-between mt-2">
          <Mini label="TEMPERATURE" value={plant.temperature} />
          <Mini label="HUMIDITY" value={plant.humidity} />
        </View>
      </View>

      <View className="ml-2 items-center justify-center">
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: "48%" }}>
      <Text className="text-[9px] text-gray-400 font-semibold">{label}</Text>
      <Text className="text-[11px] text-gray-900 font-extrabold mt-0.5">
        {value}
      </Text>
    </View>
  );
}