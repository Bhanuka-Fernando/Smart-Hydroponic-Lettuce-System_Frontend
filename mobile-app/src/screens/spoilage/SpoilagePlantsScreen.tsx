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

type Filter =
  | "All Plants"
  | "Fresh"
  | "Slightly Aged"
  | "Near Spoilage"
  | "Spoiled";

type PlantItem = {
  id: string;
  plantId: string;
  day: string;
  remainingDays: number;
  temperature: string;
  humidity: string;
  status: "FRESH" | "SLIGHTLY AGED" | "NEAR SPOILAGE" | "SPOILED";
  imageUrl?: string | null;
};

function isSimPlantId(id: string) {
  return String(id || "").startsWith("SIM-");
}

function displayPlantId(id: string) {
  return isSimPlantId(id) ? String(id).replace(/^SIM-/, "") : String(id);
}

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

function storedRemainingDays(rawDays: number | null | undefined) {
  return Math.max(0, Math.round(Number(rawDays ?? 0)));
}

export default function SpoilagePlantsScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<Filter>("All Plants");
  const [rows, setRows] = useState<SpoilagePredictionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getRecentPredictions(50);

      const seen = new Set<string>();
      const latest: SpoilagePredictionRow[] = [];

      for (const r of data) {
        if (!seen.has(r.plant_id)) {
          seen.add(r.plant_id);
          latest.push(r);
        }
      }

      setRows(latest);
    } catch (e: any) {
      console.log("Load plants error:", e?.message, e?.response?.data);
      Alert.alert("Error", e?.response?.data?.detail || "Failed to load plants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsub = navigation.addListener("focus", load);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plants: PlantItem[] = useMemo(() => {
    return rows.map((r) => ({
      id: String(r.id),
      plantId: r.plant_id,
      day: formatDay(r.captured_at),
      remainingDays: storedRemainingDays(r.remaining_days),
      temperature: `${Math.round(Number(r.temperature ?? 0))}°C`,
      humidity: `${Math.round(Number(r.humidity ?? 0))}%`,
      status: mapStatus(r.stage),
      imageUrl: r.image_url ?? null,
    }));
  }, [rows]);

  const filtered = useMemo(() => {
    if (filter === "All Plants") return plants;
    if (filter === "Fresh") return plants.filter((p) => p.status === "FRESH");
    if (filter === "Slightly Aged") {
      return plants.filter((p) => p.status === "SLIGHTLY AGED");
    }
    if (filter === "Near Spoilage") {
      return plants.filter((p) => p.status === "NEAR SPOILAGE");
    }
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

  const simPlants = plants.filter((p) => isSimPlantId(p.plantId)).length;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        ListHeaderComponent={
          <>
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => {
                  if (navigation.canGoBack()) navigation.goBack();
                }}
                activeOpacity={0.85}
                className="w-10 h-10 items-center justify-center rounded-full bg-white"
                style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
              >
                <Ionicons name="chevron-back" size={22} color="#111827" />
              </TouchableOpacity>

              <Text className="text-[16px] font-extrabold text-gray-900">
                All Plants
              </Text>

              <TouchableOpacity
                onPress={load}
                activeOpacity={0.85}
                className="w-10 h-10 items-center justify-center rounded-full bg-white"
                style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
              >
                <Ionicons name="refresh" size={18} color="#111827" />
              </TouchableOpacity>
            </View>

            <View
              className="mt-4 rounded-[24px] px-4 py-4 bg-white"
              style={{ borderWidth: 1, borderColor: "#E6EEF8" }}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-[11px] text-[#6B7280] font-semibold">
                    PLANT OVERVIEW
                  </Text>
                  <Text className="text-[17px] font-extrabold text-gray-900 mt-1">
                    Spoilage Plant Registry
                  </Text>
                  <Text className="text-[12px] text-gray-500 mt-2 leading-5">
                    Browse all tracked plants, review their latest stage, and open
                    individual details for full spoilage history.
                  </Text>
                </View>

                <View className="w-14 h-14 rounded-full bg-[#EAF4FF] items-center justify-center">
                  <Ionicons name="leaf-outline" size={24} color="#0046AD" />
                </View>
              </View>

              <View className="flex-row mt-4">
                <HeroMetricLight
                  label="Total Plants"
                  value={String(totalPlants)}
                  valueColor="#111827"
                  bg="#F8FAFC"
                />
                <View className="w-3" />
                <HeroMetricLight
                  label="Sim Plants"
                  value={String(simPlants)}
                  valueColor="#0046AD"
                  bg="#EFF6FF"
                />
              </View>
            </View>

            <View className="mt-4 bg-white rounded-[20px] p-4 shadow-sm">
              <Text className="text-[14px] font-extrabold text-gray-900">
                Stats Summary
              </Text>

              <View className="flex-row justify-between mt-4">
                <StatBox
                  title="Total Plants"
                  value={String(totalPlants)}
                  bg="#EAF4FF"
                  textColor="#0046AD"
                />
                <StatBox
                  title="Avg Shelf-life"
                  value={`${avgShelf} Days`}
                  bg="#ECFDF5"
                  textColor="#16A34A"
                />
              </View>

              <View className="mt-3">
                <StatWideBox
                  title="Plants Needing Attention"
                  value={String(totalAlerts)}
                  subtitle="Near spoilage + spoiled"
                  bg="#FEF2F2"
                  textColor="#DC2626"
                />
              </View>
            </View>

            <View className="mt-4 bg-white rounded-[20px] p-3 shadow-sm">
              <Text className="text-[12px] font-extrabold text-gray-900 px-1 pb-3">
                Filter by Stage
              </Text>

              <ScrollRow>
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
                  label="Near Spoilage"
                  active={filter === "Near Spoilage"}
                  onPress={() => setFilter("Near Spoilage")}
                />
                <Chip
                  label="Spoiled"
                  active={filter === "Spoiled"}
                  onPress={() => setFilter("Spoiled")}
                />
              </ScrollRow>
            </View>

            {loading ? (
              <View className="py-10 items-center">
                <ActivityIndicator />
                <Text className="mt-2 text-[12px] text-gray-500 font-semibold">
                  Loading plants...
                </Text>
              </View>
            ) : filtered.length === 0 ? (
              <View className="py-10 items-center">
                <Text className="text-[12px] text-gray-500 font-semibold">
                  No plants found for this filter
                </Text>
              </View>
            ) : (
              <View className="mt-5 mb-3 flex-row items-center justify-between">
                <Text className="text-[14px] font-extrabold text-gray-900">
                  Plant List
                </Text>
                <Text className="text-[11px] text-gray-500 font-semibold">
                  {filtered.length} items
                </Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <PlantCard
            plant={item}
            onPress={() =>
              navigation.navigate("SpoilagePlantDetails", {
                plantId: item.plantId,
              })
            }
          />
        )}
        ItemSeparatorComponent={() => <View className="h-3" />}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}

function ScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row flex-wrap">
      {children}
    </View>
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
      className="mr-2 mb-2 px-4 py-2 rounded-full"
      style={{
        backgroundColor: active ? "#111827" : "#FFFFFF",
        borderWidth: 1,
        borderColor: active ? "#111827" : "#E5E7EB",
      }}
    >
      <Text
        className="text-[11px] font-extrabold"
        style={{ color: active ? "#FFFFFF" : "#6B7280" }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function HeroMetricLight({
  label,
  value,
  valueColor,
  bg,
}: {
  label: string;
  value: string;
  valueColor: string;
  bg: string;
}) {
  return (
    <View
      className="flex-1 rounded-[18px] px-4 py-3"
      style={{ backgroundColor: bg }}
    >
      <Text className="text-[11px] font-semibold text-gray-500">{label}</Text>
      <Text
        className="text-[20px] font-extrabold mt-1"
        style={{ color: valueColor }}
      >
        {value}
      </Text>
    </View>
  );
}

function StatBox({
  title,
  value,
  bg,
  textColor,
}: {
  title: string;
  value: string;
  bg: string;
  textColor: string;
}) {
  return (
    <View
      className="rounded-[16px] px-4 py-3"
      style={{ width: "48%", backgroundColor: bg }}
    >
      <Text className="text-[10px] font-semibold text-gray-700">{title}</Text>
      <Text
        className="text-[16px] font-extrabold mt-1"
        style={{ color: textColor }}
      >
        {value}
      </Text>
    </View>
  );
}

function StatWideBox({
  title,
  value,
  subtitle,
  bg,
  textColor,
}: {
  title: string;
  value: string;
  subtitle: string;
  bg: string;
  textColor: string;
}) {
  return (
    <View
      className="rounded-[16px] px-4 py-3"
      style={{ backgroundColor: bg }}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-[10px] font-semibold text-gray-700">{title}</Text>
          <Text className="text-[11px] text-gray-500 mt-1">{subtitle}</Text>
        </View>
        <Text
          className="text-[18px] font-extrabold"
          style={{ color: textColor }}
        >
          {value}
        </Text>
      </View>
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
  const isSim = isSimPlantId(plant.plantId);

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

  const leftBar =
    plant.status === "FRESH"
      ? "#16A34A"
      : plant.status === "SLIGHTLY AGED"
      ? "#22C55E"
      : plant.status === "NEAR SPOILAGE"
      ? "#F59E0B"
      : "#DC2626";

  const imgUri = plant.imageUrl
    ? `${SPOILAGE_BASE_URL}${plant.imageUrl}`
    : undefined;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="bg-white rounded-[20px] overflow-hidden shadow-sm"
    >
      <View className="flex-row">
        <View style={{ width: 6, backgroundColor: leftBar }} />

        <View className="flex-1 p-4 flex-row">
          {imgUri ? (
            <Image
              source={{ uri: imgUri }}
              style={{ width: 82, height: 82, borderRadius: 18 }}
              resizeMode="cover"
              resizeMethod="resize"
            />
          ) : (
            <View
              style={{
                width: 82,
                height: 82,
                borderRadius: 18,
                backgroundColor: "#F1F5F9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="image-outline" size={24} color="#9CA3AF" />
            </View>
          )}

          <View className="flex-1 ml-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px] font-extrabold text-gray-900">
                {displayPlantId(plant.plantId)}
                {isSim ? " (Sim)" : ""}
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

            <View className="mt-3 flex-row justify-between">
              <Mini label="DAY" value={plant.day} />
              <Mini label="REMAINING" value={`${plant.remainingDays} Days`} />
            </View>

            <View className="mt-2 flex-row justify-between">
              <Mini label="TEMP" value={plant.temperature} />
              <Mini label="HUMIDITY" value={plant.humidity} />
            </View>
          </View>

          <View className="ml-2 items-center justify-center">
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </View>
        </View>
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