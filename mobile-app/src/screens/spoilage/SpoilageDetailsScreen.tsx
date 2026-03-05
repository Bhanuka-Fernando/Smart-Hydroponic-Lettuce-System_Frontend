// src/screens/spoilage/SpoilageDetailsScreen.tsx
import React, { useMemo, useState } from "react";
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

import { useSpoilagePolling } from "../../hooks/useSpoilagePolling";
import { type SpoilagePredictionRow } from "../../api/SpoilageApi";
import { SPOILAGE_BASE_URL } from "../../utils/constants";

type StatusFilter = "All Status" | "Monitoring" | "Warning" | "Critical";

type PredictionItem = {
  id: string;
  plantId: string;
  shelfLifeDays: number;
  stageLabel: "Fresh" | "Slightly Aged" | "Near Spoilage" | "Critical";
  actionText?: string;
  severity: "monitoring" | "warning" | "critical";
  imageUrl?: string | null;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function mapStageLabel(
  stage: SpoilagePredictionRow["stage"]
): PredictionItem["stageLabel"] {
  if (stage === "fresh") return "Fresh";
  if (stage === "slightly_aged") return "Slightly Aged";
  if (stage === "near_spoilage") return "Near Spoilage";
  return "Critical";
}

function mapSeverity(
  stage: SpoilagePredictionRow["stage"]
): PredictionItem["severity"] {
  if (stage === "fresh" || stage === "slightly_aged") return "monitoring";
  if (stage === "near_spoilage") return "warning";
  return "critical";
}

function mapAction(stage: SpoilagePredictionRow["stage"]): string | undefined {
  if (stage === "near_spoilage") return "Action : Inspect Now";
  if (stage === "spoiled") return "Action : Discard";
  return undefined;
}

type Props = NativeStackScreenProps<SpoilageStackParamList, "SpoilageDetails">;

export default function SpoilageDetailsScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<StatusFilter>("All Status");
  const currentLocation = "Farm A - Chiller 3";

  // 🔥 Reduce load to avoid OS kill (tune if you want)
  const { rows, loading, error, refresh: reloadNow } = useSpoilagePolling(10, 8000);

  const predictions: PredictionItem[] = useMemo(() => {
    return rows.map((r) => {
      const stageLabel = mapStageLabel(r.stage);
      const severity = mapSeverity(r.stage);
      return {
        id: String(r.id),
        plantId: r.plant_id,
        shelfLifeDays: Math.round(Number(r.remaining_days ?? 0)),
        stageLabel,
        severity,
        actionText: mapAction(r.stage),
        imageUrl: (r as any).image_url ?? null,
      };
    });
  }, [rows]);

  const filtered: PredictionItem[] = useMemo(() => {
    if (filter === "All Status") return predictions;
    if (filter === "Monitoring")
      return predictions.filter((p) => p.severity === "monitoring");
    if (filter === "Warning")
      return predictions.filter((p) => p.severity === "warning");
    return predictions.filter((p) => p.severity === "critical");
  }, [filter, predictions]);

  const batchStats = useMemo(() => {
    const fresh = rows.filter((r) => r.stage === "fresh").length;
    const aged = rows.filter((r) => r.stage === "slightly_aged").length;
    const risk = rows.filter((r) => r.stage === "near_spoilage").length;
    const spoiled = rows.filter((r) => r.stage === "spoiled").length;
    return { fresh, aged, risk, spoiled };
  }, [rows]);

  const openSpoilageScan = () => navigation.navigate("SpoilageScan");

  const ListHeader = (
    <>
      {/* Header + Location */}
      <View className="px-4 pt-3 pb-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
              else navigation.navigate("SpoilageDetails");
            }}
            activeOpacity={0.8}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Text className="text-[16px] font-extrabold text-gray-900">
            Spoilage Details
          </Text>

          <TouchableOpacity
            onPress={reloadNow}
            activeOpacity={0.85}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="refresh" size={18} color="#111827" />
          </TouchableOpacity>
        </View>

        <View className="mt-2">
          <Text className="text-[11px] text-gray-500 font-semibold">
            CURRENT LOCATION
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-[14px] font-extrabold text-gray-900">
              {currentLocation}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color="#6B7280"
              style={{ marginLeft: 6 }}
            />
          </View>
        </View>

        {error ? (
          <Text className="text-[12px] text-red-600 font-semibold mt-2">
            {error}
          </Text>
        ) : (
          <Text className="text-[11px] text-gray-500 font-semibold mt-2">
            Live updates from DB (optimized)
          </Text>
        )}
      </View>

      {/* Body padding */}
      <View style={{ paddingHorizontal: 16 }}>
        {/* Current Batch Status */}
        <View className="flex-row items-center justify-between mt-2 mb-2">
          <Text className="text-[14px] font-extrabold text-gray-900">
            Current Batch Status
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("SpoilagePlants")}
          >
            <Text className="text-[12px] font-semibold text-[#1D4ED8]">
              View Details
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between">
          <StatPill label="Fresh" value={batchStats.fresh} tone="green" />
          <StatPill label="Aged" value={batchStats.aged} tone="yellow" />
          <StatPill label="Risk" value={batchStats.risk} tone="orange" />
          <StatPill label="Spoiled" value={batchStats.spoiled} tone="red" />
        </View>

        {/* Scan Spoilage card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={openSpoilageScan}
          className="mt-4 bg-[#0B1220] rounded-[18px] px-4 py-4 shadow-sm"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-white text-[16px] font-extrabold">
                Scan Spoilage
              </Text>
              <Text className="text-white/70 text-[12px] mt-1">
                Analyze single plant health
              </Text>
            </View>

            <View className="w-12 h-12 rounded-full bg-[#16A34A] items-center justify-center">
              <Ionicons name="scan" size={22} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Two action buttons */}
        <View className="flex-row justify-between mt-3">
          <SmallActionCard
            title="Batch Scan"
            icon={<Ionicons name="layers-outline" size={18} color="#2563EB" />}
            onPress={openSpoilageScan}
          />
          <SmallActionCard
            title="Today's Alerts"
            icon={<Ionicons name="warning-outline" size={18} color="#F59E0B" />}
            onPress={() => navigation.navigate("SpoilageAlerts")}
          />
        </View>

        {/* Recent predictions */}
        <Text className="text-[14px] font-extrabold text-gray-900 mt-5 mb-3">
          Recent Predictions
        </Text>

        {/* Filter chips */}
        <View className="flex-row mb-3">
          <Chip
            label="All Status"
            active={filter === "All Status"}
            onPress={() => setFilter("All Status")}
          />
          <Chip
            label="Monitoring"
            active={filter === "Monitoring"}
            onPress={() => setFilter("Monitoring")}
          />
          <Chip
            label="Warning"
            active={filter === "Warning"}
            onPress={() => setFilter("Warning")}
          />
          <Chip
            label="Critical"
            active={filter === "Critical"}
            onPress={() => setFilter("Critical")}
          />
        </View>
      </View>
    </>
  );

  const renderItem = ({ item }: { item: PredictionItem }) => (
    <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
      <PredictionRow
        item={item}
        onPress={() => Alert.alert("Open", `Open details for ${item.plantId}`)}
      />
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-2 text-[12px] text-gray-500 font-semibold">
            Loading...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
              <Text className="text-[12px] text-gray-500 font-semibold">
                No predictions yet
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 18 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={6}
          windowSize={7}
          maxToRenderPerBatch={6}
          updateCellsBatchingPeriod={50}
        />
      )}
    </SafeAreaView>
  );
}

/* ---------- UI components ---------- */

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "yellow" | "orange" | "red";
}) {
  const bg =
    tone === "green"
      ? "bg-[#E9FBEF]"
      : tone === "yellow"
      ? "bg-[#FEF9C3]"
      : tone === "orange"
      ? "bg-[#FFF6E5]"
      : "bg-[#FEE2E2]";

  const num =
    tone === "green"
      ? "text-[#16A34A]"
      : tone === "yellow"
      ? "text-[#CA8A04]"
      : tone === "orange"
      ? "text-[#F59E0B]"
      : "text-[#DC2626]";

  return (
    <View className={`w-[23%] rounded-[16px] ${bg} py-3 items-center`}>
      <Text className={`text-[16px] font-extrabold ${num}`}>{value}</Text>
      <Text className="text-[11px] text-gray-700 font-semibold mt-1">
        {label}
      </Text>
    </View>
  );
}

function SmallActionCard({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="bg-white w-[48%] rounded-[18px] px-4 py-4 shadow-sm flex-row items-center"
    >
      <View className="w-10 h-10 rounded-full bg-[#EEF2FF] items-center justify-center mr-3">
        {icon}
      </View>
      <Text className="text-[13px] font-extrabold text-gray-900">{title}</Text>
    </TouchableOpacity>
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
      activeOpacity={0.85}
      onPress={onPress}
      className={`mr-2 px-3 py-2 rounded-full ${
        active ? "bg-[#111827]" : "bg-white"
      }`}
      style={{ borderWidth: active ? 0 : 1, borderColor: "#E5E7EB" }}
    >
      <Text
        className={`text-[12px] font-semibold ${
          active ? "text-white" : "text-gray-700"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function PredictionRow({
  item,
  onPress,
}: {
  item: PredictionItem;
  onPress: () => void;
}) {
  const leftBar =
    item.severity === "monitoring"
      ? "bg-[#16A34A]"
      : item.severity === "warning"
      ? "bg-[#F59E0B]"
      : "bg-[#DC2626]";

  const badge = (() => {
    if (item.stageLabel === "Fresh")
      return { bg: "#E9FBEF", text: "#16A34A", label: "Fresh" };
    if (item.stageLabel === "Slightly Aged")
      return { bg: "#ECFDF5", text: "#22C55E", label: "Slightly Aged" };
    if (item.stageLabel === "Near Spoilage")
      return { bg: "#FFF7ED", text: "#F59E0B", label: "Near Spoilage" };
    return { bg: "#FEE2E2", text: "#DC2626", label: "Critical" };
  })();

  const imgUri = item.imageUrl
    ? `${SPOILAGE_BASE_URL}${item.imageUrl}`
    : undefined;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="bg-white rounded-[18px] overflow-hidden shadow-sm"
    >
      <View className="flex-row">
        <View className={`w-1.5 ${leftBar}`} />

        <View className="flex-1 px-3 py-3 flex-row items-center">
          {imgUri ? (
            <Image
              source={{ uri: imgUri }}
              style={{ width: 48, height: 48, borderRadius: 14 }}
              resizeMode="cover"
              resizeMethod="resize"
            />
          ) : (
            <View className="w-12 h-12 rounded-[14px] bg-gray-100 items-center justify-center">
              <Ionicons name="image-outline" size={18} color="#9CA3AF" />
            </View>
          )}

          <View className="flex-1 ml-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-[13px] font-extrabold text-gray-900">
                {item.plantId}
              </Text>

              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: badge.bg }}
              >
                <Text
                  className="text-[11px] font-extrabold"
                  style={{ color: badge.text }}
                >
                  {badge.label}
                </Text>
              </View>
            </View>

            <Text className="text-[11px] text-gray-500 mt-1">
              🕒 Shelf Life: {clamp(item.shelfLifeDays, 0, 99)} Days
            </Text>

            {item.actionText ? (
              <Text className="text-[11px] text-gray-700 mt-1 font-semibold">
                {item.actionText}
              </Text>
            ) : null}
          </View>

          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>
      </View>
    </TouchableOpacity>
  );
}