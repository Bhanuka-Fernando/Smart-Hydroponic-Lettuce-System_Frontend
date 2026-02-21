import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SpoilageStackParamList } from "../../navigation/SpoilageNavigator";

type StatusFilter = "All Status" | "Monitoring" | "Warning" | "Critical";

type PredictionItem = {
  id: string;
  plantId: string;
  shelfLifeDays: number;
  stageLabel: string;
  actionText?: string;
  severity: "monitoring" | "warning" | "critical";
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type Props = NativeStackScreenProps<SpoilageStackParamList, "SpoilageDetails">;

export default function SpoilageDetailsScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<StatusFilter>("All Status");

  const currentLocation = "Farm A - Chiller 3";

  const batchStats = useMemo(
    () => ({ fresh: 42, aged: 15, risk: 5, spoiled: 2 }),
    []
  );

  const predictions: PredictionItem[] = useMemo(
    () => [
      { id: "1", plantId: "P-001", shelfLifeDays: 7, stageLabel: "Fresh", severity: "monitoring" },
      { id: "2", plantId: "P-020", shelfLifeDays: 5, stageLabel: "Slightly Aged", severity: "monitoring" },
      { id: "3", plantId: "P-050", shelfLifeDays: 2, stageLabel: "Near Spoilage", actionText: "Action: Inspect Now", severity: "warning" },
      { id: "4", plantId: "P-060", shelfLifeDays: 0, stageLabel: "Spoiled", actionText: "Action: Discard", severity: "critical" },
      { id: "5", plantId: "P-061", shelfLifeDays: 0, stageLabel: "Spoiled", actionText: "Action: Discard", severity: "critical" },
    ],
    []
  );

  const filtered = useMemo(() => {
    if (filter === "All Status") return predictions;
    if (filter === "Monitoring") return predictions.filter((p) => p.severity === "monitoring");
    if (filter === "Warning") return predictions.filter((p) => p.severity === "warning");
    return predictions.filter((p) => p.severity === "critical");
  }, [filter, predictions]);

  const openSpoilageScan = () => navigation.navigate("SpoilageScan");

  const go = (routeName: string) => {
    Alert.alert("Todo", `Add "${routeName}" screen first.`);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      {/* Header */}
      <View className="px-4 pt-3 pb-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Text className="text-[16px] font-extrabold text-gray-900">
            Spoilage Details
          </Text>

          <View className="w-10 h-10" />
        </View>

        {/* Location */}
        <View className="mt-2">
          <Text className="text-[11px] text-gray-500 font-semibold">
            CURRENT LOCATION
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-[14px] font-extrabold text-gray-900">
              {currentLocation}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#6B7280" style={{ marginLeft: 6 }} />
          </View>
        </View>

        {/* Search */}
        <View className="mt-3 bg-white rounded-[14px] px-3 py-2 flex-row items-center shadow-sm">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <Text className="text-gray-400 text-[13px] ml-2 flex-1">
            Search by Plant ID ...
          </Text>
          <Feather name="sliders" size={16} color="#9CA3AF" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 18 }}
      >
        {/* Batch status row */}
        <View className="flex-row items-center justify-between mt-2 mb-2">
          <Text className="text-[14px] font-extrabold text-gray-900">
            Current Batch Status
          </Text>
          <TouchableOpacity activeOpacity={0.8} onPress={() => go("Plants")}>
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
                Analyze a single plant health
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
            icon={<Ionicons name="grid-outline" size={18} color="#2563EB" />}
            onPress={openSpoilageScan}
          />
          <SmallActionCard
            title="Today's Alerts"
            icon={<Ionicons name="warning-outline" size={18} color="#F59E0B" />}
            onPress={() => go("Alerts")}
          />
        </View>

        {/* Recent predictions */}
        <Text className="text-[14px] font-extrabold text-gray-900 mt-5 mb-3">
          Recent Predictions
        </Text>

        {/* Filter chips */}
        <View className="flex-row mb-3">
          <Chip label="All Status" active={filter === "All Status"} onPress={() => setFilter("All Status")} />
          <Chip label="Monitoring" active={filter === "Monitoring"} onPress={() => setFilter("Monitoring")} />
          <Chip label="Warning" active={filter === "Warning"} onPress={() => setFilter("Warning")} />
          <Chip label="Critical" active={filter === "Critical"} onPress={() => setFilter("Critical")} />
        </View>

        <View className="space-y-3">
          {filtered.map((item) => (
            <PredictionRow
              key={item.id}
              item={item}
              onPress={() => Alert.alert("Open", `Open details for ${item.plantId}`)}
            />
          ))}
        </View>

        <View className="h-8" />
      </ScrollView>
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
      className={`mr-2 px-3 py-2 rounded-full ${active ? "bg-[#111827]" : "bg-white"}`}
      style={{ borderWidth: active ? 0 : 1, borderColor: "#E5E7EB" }}
    >
      <Text className={`text-[12px] font-semibold ${active ? "text-white" : "text-gray-700"}`}>
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

  const badgeBg =
    item.severity === "monitoring"
      ? "bg-[#E9FBEF]"
      : item.severity === "warning"
      ? "bg-[#FFF6E5]"
      : "bg-[#FEE2E2]";

  const badgeText =
    item.severity === "monitoring"
      ? "text-[#16A34A]"
      : item.severity === "warning"
      ? "text-[#F59E0B]"
      : "text-[#DC2626]";

  const badgeLabel =
    item.stageLabel === "Fresh"
      ? "Fresh"
      : item.stageLabel === "Slightly Aged"
      ? "Slightly Aged"
      : item.stageLabel === "Near Spoilage"
      ? "Near Spoilage"
      : "Critical";

  const imgUrl =
    "https://images.unsplash.com/photo-1557844352-761f2565b576?auto=format&fit=crop&w=200&q=60";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="bg-white rounded-[18px] overflow-hidden shadow-sm"
    >
      <View className="flex-row">
        <View className={`w-1.5 ${leftBar}`} />
        <View className="flex-1 px-3 py-3 flex-row items-center">
          <Image
            source={{ uri: imgUrl }}
            className="w-12 h-12 rounded-[14px] bg-gray-100"
          />

          <View className="flex-1 ml-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-[13px] font-extrabold text-gray-900">
                {item.plantId}
              </Text>

              <View className={`px-3 py-1 rounded-full ${badgeBg}`}>
                <Text className={`text-[11px] font-bold ${badgeText}`}>
                  {badgeLabel}
                </Text>
              </View>
            </View>

            <Text className="text-[11px] text-gray-500 mt-1">
              🕒 Shelf Life: {clamp(item.shelfLifeDays, 0, 99)} Days
            </Text>

            {item.actionText ? (
              <Text className="text-[11px] text-red-500 mt-1 font-semibold">
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