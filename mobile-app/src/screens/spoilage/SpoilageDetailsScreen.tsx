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

import { useSpoilagePolling } from "../../hooks/useSpoilagePolling";
import {
  type SpoilagePredictionRow,
  type RecheckReminderRow,
  getSpoilageAlerts,
  getRecheckReminders,
} from "../../api/SpoilageApi";
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

function isSimPlantId(id: string) {
  return String(id || "").startsWith("SIM-");
}

function displayPlantId(id: string) {
  return isSimPlantId(id) ? String(id).replace(/^SIM-/, "") : String(id);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function mapStageLabel(
  stage: SpoilagePredictionRow["stage"] | RecheckReminderRow["stage"]
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
  if (stage === "near_spoilage") return "Action: Inspect now";
  if (stage === "spoiled") return "Action: Discard";
  return undefined;
}

function recheckActionText(item: RecheckReminderRow) {
  if (item.stage === "spoiled") return "Take action now";
  if (item.stage === "near_spoilage") return "Rescan now";
  if (item.remaining_days <= 1) return "Rescan today";
  return "Rescan tomorrow";
}

type Props = NativeStackScreenProps<SpoilageStackParamList, "SpoilageDetails">;

export default function SpoilageDetailsScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<StatusFilter>("All Status");
  const currentLocation = "Farm A - Chiller 3";

  const { rows, loading, error, refresh: reloadNow } = useSpoilagePolling(10, 8000);

  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [recheckCount, setRecheckCount] = useState(0);
  const [recheckItems, setRecheckItems] = useState<RecheckReminderRow[]>([]);

  const loadExtras = async () => {
    try {
      const [alerts, rechecks] = await Promise.all([
        getSpoilageAlerts({ acknowledged: false, limit: 100 }),
        getRecheckReminders({ limit: 100, max_remaining_days: 3 }),
      ]);

      setActiveAlertCount(alerts.length);
      setRecheckCount(rechecks.length);
      setRecheckItems(rechecks);
    } catch (e: any) {
      console.log("Load extras error:", e?.message, e?.response?.data);
    }
  };

  useEffect(() => {
    loadExtras();
    const unsub = navigation.addListener("focus", loadExtras);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const latestRows = useMemo(() => {
    const seen = new Set<string>();
    const out: SpoilagePredictionRow[] = [];
    for (const r of rows) {
      if (!seen.has(r.plant_id)) {
        seen.add(r.plant_id);
        out.push(r);
      }
    }
    return out;
  }, [rows]);

  const predictions: PredictionItem[] = useMemo(() => {
    return latestRows.map((r) => ({
      id: String(r.id),
      plantId: r.plant_id,
      shelfLifeDays: Math.round(Number(r.remaining_days ?? 0)),
      stageLabel: mapStageLabel(r.stage),
      severity: mapSeverity(r.stage),
      actionText: mapAction(r.stage),
      imageUrl: r.image_url ?? null,
    }));
  }, [latestRows]);

  const filtered: PredictionItem[] = useMemo(() => {
    if (filter === "All Status") return predictions;
    if (filter === "Monitoring") {
      return predictions.filter((p) => p.severity === "monitoring");
    }
    if (filter === "Warning") {
      return predictions.filter((p) => p.severity === "warning");
    }
    return predictions.filter((p) => p.severity === "critical");
  }, [filter, predictions]);

  const batchStats = useMemo(() => {
    const fresh = latestRows.filter((r) => r.stage === "fresh").length;
    const aged = latestRows.filter((r) => r.stage === "slightly_aged").length;
    const risk = latestRows.filter((r) => r.stage === "near_spoilage").length;
    const spoiled = latestRows.filter((r) => r.stage === "spoiled").length;
    return { fresh, aged, risk, spoiled };
  }, [latestRows]);

  const openSpoilageScan = () =>
    navigation.navigate("SpoilageScan", { demoMode: true });

  const handleRefresh = async () => {
    reloadNow();
    await loadExtras();
  };

  const ListHeader = (
    <>
      <View className="px-4 pt-3 pb-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
              else navigation.navigate("SpoilageDetails");
            }}
            activeOpacity={0.8}
            className="w-10 h-10 items-center justify-center rounded-full bg-white"
            style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
          >
            <Ionicons name="chevron-back" size={20} color="#111827" />
          </TouchableOpacity>

          <Text className="text-[16px] font-extrabold text-gray-900">
            Spoilage Details
          </Text>

          <TouchableOpacity
            onPress={handleRefresh}
            activeOpacity={0.85}
            className="w-10 h-10 items-center justify-center rounded-full bg-white"
            style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
          >
            <Ionicons name="refresh" size={18} color="#111827" />
          </TouchableOpacity>
        </View>

        <View className="mt-4 bg-[#0B1220] rounded-[22px] px-4 py-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-[11px] text-white/60 font-semibold">
                CURRENT LOCATION
              </Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-[16px] font-extrabold text-white">
                  {currentLocation}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={15}
                  color="#CBD5E1"
                  style={{ marginLeft: 6 }}
                />
              </View>

              <Text className="text-[12px] text-white/75 mt-3 leading-5">
                Monitor spoilage risk, check urgent plants, and rescan only the
                ones that need attention.
              </Text>
            </View>

            <View className="w-12 h-12 rounded-full bg-[#16A34A] items-center justify-center">
              <Ionicons name="leaf-outline" size={22} color="#fff" />
            </View>
          </View>
        </View>

        {error ? (
          <View
            className="mt-3 rounded-[16px] px-4 py-3 bg-[#FEF2F2]"
            style={{ borderWidth: 1, borderColor: "#FECACA" }}
          >
            <Text className="text-[12px] text-red-600 font-semibold">
              {error}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <View className="flex-row items-center justify-between mt-1 mb-3">
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

        <TouchableOpacity
          activeOpacity={0.92}
          onPress={openSpoilageScan}
          className="mt-4 rounded-[22px] px-4 py-4 shadow-sm"
          style={{
            backgroundColor: "#0B1220",
          }}
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

        <View className="flex-row justify-between mt-3">
          <SmallActionCard
            title="Today's Alerts"
            value={activeAlertCount}
            icon={<Ionicons name="warning-outline" size={18} color="#F59E0B" />}
            onPress={() => navigation.navigate("SpoilageAlerts")}
          />
          <SmallActionCard
            title="Recheck Soon"
            value={recheckCount}
            icon={<Ionicons name="time-outline" size={18} color="#2563EB" />}
            onPress={() =>
              Alert.alert(
                "Recheck Soon",
                `${recheckCount} plants should be rescanned soon.`
              )
            }
          />
        </View>

        <View className="flex-row items-center justify-between mt-6 mb-3">
          <Text className="text-[14px] font-extrabold text-gray-900">
            Priority Recheck Queue
          </Text>
          {recheckItems.length > 0 ? (
            <Text className="text-[11px] text-gray-500 font-semibold">
              Top 3 urgent plants
            </Text>
          ) : null}
        </View>

        {recheckItems.length === 0 ? (
          <View className="bg-white rounded-[18px] px-4 py-4 shadow-sm">
            <Text className="text-[12px] font-semibold text-gray-500">
              No urgent rescans right now.
            </Text>
          </View>
        ) : (
          recheckItems.slice(0, 3).map((item) => (
            <TouchableOpacity
              key={`${item.plant_id}-${item.captured_at}`}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate("SpoilagePlantDetails", {
                  plantId: item.plant_id,
                })
              }
              className="bg-white rounded-[18px] px-4 py-4 shadow-sm mb-3"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center">
                    <Text className="text-[13px] font-extrabold text-gray-900">
                      {displayPlantId(item.plant_id)}
                    </Text>
                    {isSimPlantId(item.plant_id) ? (
                      <Text className="text-[11px] text-gray-400 ml-1">
                        (Sim)
                      </Text>
                    ) : null}
                  </View>

                  <Text className="text-[11px] text-gray-500 mt-1">
                    Stage: {mapStageLabel(item.stage)} • Shelf Life:{" "}
                    {Math.max(0, Math.round(item.remaining_days))} days
                  </Text>

                  <Text className="text-[11px] font-semibold text-[#1D4ED8] mt-2">
                    {recheckActionText(item)}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() =>
                    navigation.navigate("SpoilageScan", {
                      plantId: item.plant_id,
                      demoMode: false,
                    })
                  }
                  className="px-4 py-2 rounded-full"
                  style={{ backgroundColor: "#0046AD" }}
                >
                  <Text className="text-[11px] font-extrabold text-white">
                    Rescan
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View className="flex-row items-center justify-between mt-6 mb-3">
          <Text className="text-[14px] font-extrabold text-gray-900">
            Recent Predictions
          </Text>
          <Text className="text-[11px] text-gray-500 font-semibold">
            Latest result per plant
          </Text>
        </View>

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
        onPress={() =>
          navigation.navigate("SpoilagePlantDetails", {
            plantId: item.plantId,
          })
        }
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
          contentContainerStyle={{ paddingBottom: 24 }}
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
  value,
  icon,
  onPress,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="bg-white w-[48%] rounded-[18px] px-4 py-4 shadow-sm"
    >
      <View className="flex-row items-center justify-between">
        <View className="w-10 h-10 rounded-full bg-[#EEF2FF] items-center justify-center">
          {icon}
        </View>
        <Text className="text-[18px] font-extrabold text-gray-900">{value}</Text>
      </View>

      <Text className="text-[12px] font-extrabold text-gray-900 mt-3">
        {title}
      </Text>
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
  const sim = isSimPlantId(item.plantId);

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
                {displayPlantId(item.plantId)}
                {sim ? (
                  <Text className="text-[11px] text-gray-400"> (Sim)</Text>
                ) : null}
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
              Shelf Life: {clamp(item.shelfLifeDays, 0, 99)} Days
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