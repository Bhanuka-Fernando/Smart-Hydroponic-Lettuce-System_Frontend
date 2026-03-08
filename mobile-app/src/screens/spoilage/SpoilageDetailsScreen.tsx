import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
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
import { useAuth } from "../../auth/useAuth";

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
  const [profileOpen, setProfileOpen] = useState(false);

  const { user, signOut } = useAuth();

  const { rows, loading, error } = useSpoilagePolling(10, 8000);

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
    return out;
  }, [rows]);

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

  const totalPlants = latestRows.length;
  const riskPlants = batchStats.risk + batchStats.spoiled;
  const healthyPlants = batchStats.fresh + batchStats.aged;

  const riskPercent =
    totalPlants > 0 ? Math.round((riskPlants / totalPlants) * 100) : 0;

  const shelfLifeSummary = useMemo(() => {
    const nums = latestRows
      .map((r) => Number(r.remaining_days ?? 0))
      .filter((n) => !Number.isNaN(n));

    if (!nums.length) {
      return { low: 0, medium: 0, good: 0 };
    }

    let low = 0;
    let medium = 0;
    let good = 0;

    nums.forEach((n) => {
      if (n <= 1) low += 1;
      else if (n <= 3) medium += 1;
      else good += 1;
    });

    return { low, medium, good };
  }, [latestRows]);

  const openSpoilageScan = () =>
    navigation.navigate("SpoilageScan", { demoMode: true });

  const handleLogout = async () => {
    try {
      setProfileOpen(false);
      await signOut();
    } catch {
      Alert.alert("Logout failed", "Please try again.");
    }
  };

  const ListHeader = (
    <>
      <View className="px-4 pt-3 pb-2">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
            }}
            activeOpacity={0.8}
            className="w-10 h-10 items-center justify-center rounded-full bg-white"
            style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
          >
            <Ionicons name="chevron-back" size={20} color="#111827" />
          </TouchableOpacity>

          <Text className="text-[16px] font-extrabold text-gray-900">
            Spoilage Dashboard
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setProfileOpen(true)}
            className="relative"
          >
            <Image
              source={{ uri: "https://i.pravatar.cc/100?img=12" }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
            <View
              style={{
                position: "absolute",
                bottom: -1,
                right: -1,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#22C55E",
                borderWidth: 2,
                borderColor: "#FFFFFF",
              }}
            />
          </TouchableOpacity>
        </View>

        <View
          className="mt-4 rounded-[24px] px-4 py-4 bg-white"
          style={{ borderWidth: 1, borderColor: "#E6EEF8" }}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-[11px] text-[#6B7280] font-semibold">
                CURRENT LOCATION
              </Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-[17px] font-extrabold text-gray-900">
                  {currentLocation}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={15}
                  color="#94A3B8"
                  style={{ marginLeft: 6 }}
                />
              </View>

              <Text className="text-[12px] text-gray-500 mt-3 leading-5">
                Monitor spoilage risk, review urgent plants, and rescan only the
                ones that need attention.
              </Text>
            </View>

            <View className="w-14 h-14 rounded-full bg-[#EAF4FF] items-center justify-center">
              <Ionicons name="business-outline" size={24} color="#0046AD" />
            </View>
          </View>

          <View className="flex-row mt-4">
            <HeroMetricLight
              label="Tracked Plants"
              value={totalPlants}
              valueColor="#111827"
              bg="#F8FAFC"
            />
            <View className="w-3" />
            <HeroMetricLight
              label="Risk Plants"
              value={riskPlants}
              valueColor={riskPlants > 0 ? "#DC2626" : "#111827"}
              bg="#FFF7ED"
            />
          </View>

          <View className="mt-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[12px] font-bold text-gray-700">
                Current Risk Level
              </Text>
              <Text className="text-[12px] font-extrabold text-gray-900">
                {riskPercent}%
              </Text>
            </View>

            <View className="h-3 rounded-full bg-[#E5E7EB] overflow-hidden">
              <View
                style={{
                  width: `${riskPercent}%`,
                  height: "100%",
                  backgroundColor:
                    riskPercent >= 60
                      ? "#DC2626"
                      : riskPercent >= 30
                      ? "#F59E0B"
                      : "#16A34A",
                }}
              />
            </View>

            <Text className="text-[11px] text-gray-500 mt-2">
              {healthyPlants} healthy/aged plants • {riskPlants} plants needing
              attention
            </Text>
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
        <View className="flex-row items-center justify-between mt-2 mb-3">
          <Text className="text-[14px] font-extrabold text-gray-900">
            Batch Overview
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

        <View className="mt-4 bg-white rounded-[20px] px-4 py-4 shadow-sm">
          <Text className="text-[13px] font-extrabold text-gray-900">
            Shelf-Life Summary
          </Text>
          <Text className="text-[11px] text-gray-500 mt-1">
            Latest estimated remaining days across tracked plants
          </Text>

          <View className="flex-row justify-between mt-4">
            <ShelfLifeMiniCard
              label="Low"
              value={shelfLifeSummary.low}
              subtitle="≤ 1 day"
              bg="#FEF2F2"
              text="#DC2626"
              icon="alert-circle-outline"
            />
            <ShelfLifeMiniCard
              label="Medium"
              value={shelfLifeSummary.medium}
              subtitle="2 - 3 days"
              bg="#FFF7ED"
              text="#F59E0B"
              icon="time-outline"
            />
            <ShelfLifeMiniCard
              label="Good"
              value={shelfLifeSummary.good}
              subtitle="> 3 days"
              bg="#ECFDF5"
              text="#16A34A"
              icon="checkmark-circle-outline"
            />
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.92}
          onPress={openSpoilageScan}
          className="mt-4 rounded-[22px] px-4 py-4 shadow-sm"
          style={{ backgroundColor: "#0B1220" }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-white text-[16px] font-extrabold">
                Scan Spoilage
              </Text>
              <Text className="text-white/70 text-[12px] mt-1">
                Analyze single plant health
              </Text>

              <View className="mt-3 flex-row items-center">
                <View className="px-3 py-1 rounded-full bg-white/10">
                  <Text className="text-[10px] font-bold text-white/90">
                    Demo Scan
                  </Text>
                </View>
                <View className="w-2" />
                <View className="px-3 py-1 rounded-full bg-white/10">
                  <Text className="text-[10px] font-bold text-white/90">
                    Stage + Shelf Life
                  </Text>
                </View>
              </View>
            </View>

            <View className="w-14 h-14 rounded-full bg-[#16A34A] items-center justify-center">
              <Ionicons name="scan" size={24} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>

        <View className="flex-row justify-between mt-3">
          <SmallActionCard
            title="Today's Alerts"
            value={activeAlertCount}
            tone="amber"
            icon={<Ionicons name="warning-outline" size={18} color="#F59E0B" />}
            onPress={() => navigation.navigate("SpoilageAlerts")}
          />
          <SmallActionCard
            title="Recheck Soon"
            value={recheckCount}
            tone="blue"
            icon={<Ionicons name="time-outline" size={18} color="#2563EB" />}
            onPress={() =>
              Alert.alert(
                "Recheck Soon",
                `${recheckCount} plants should be rescanned soon.`
              )
            }
          />
        </View>

        <View className="mt-4 bg-white rounded-[20px] px-4 py-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="text-[13px] font-extrabold text-gray-900">
              Urgency Summary
            </Text>
            <Text className="text-[11px] text-gray-500 font-semibold">
              Quick priority guide
            </Text>
          </View>

          <View className="mt-4">
            <UrgencyRow
              color="#DC2626"
              title="Critical"
              subtitle={`${batchStats.spoiled} plants require immediate action`}
              bg="#FEF2F2"
            />
            <View className="h-3" />
            <UrgencyRow
              color="#F59E0B"
              title="Warning"
              subtitle={`${batchStats.risk} plants are nearing spoilage`}
              bg="#FFF7ED"
            />
            <View className="h-3" />
            <UrgencyRow
              color="#16A34A"
              title="Monitoring"
              subtitle={`${batchStats.fresh + batchStats.aged} plants currently stable`}
              bg="#ECFDF5"
            />
          </View>
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
          <EmptyPanel text="No urgent rescans right now." />
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
              className="bg-white rounded-[20px] px-4 py-4 shadow-sm mb-3"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center">
                    <View
                      className="w-9 h-9 rounded-full items-center justify-center mr-3"
                      style={{
                        backgroundColor:
                          item.stage === "spoiled"
                            ? "#FEE2E2"
                            : item.stage === "near_spoilage"
                            ? "#FFF7ED"
                            : "#EFF6FF",
                      }}
                    >
                      <Ionicons
                        name={
                          item.stage === "spoiled"
                            ? "alert-circle-outline"
                            : item.stage === "near_spoilage"
                            ? "warning-outline"
                            : "time-outline"
                        }
                        size={18}
                        color={
                          item.stage === "spoiled"
                            ? "#DC2626"
                            : item.stage === "near_spoilage"
                            ? "#F59E0B"
                            : "#2563EB"
                        }
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-[13px] font-extrabold text-gray-900">
                        {displayPlantId(item.plant_id)}
                        {isSimPlantId(item.plant_id) ? (
                          <Text className="text-[11px] text-gray-400"> (Sim)</Text>
                        ) : null}
                      </Text>
                      <Text className="text-[11px] text-gray-500 mt-1">
                        Stage: {mapStageLabel(item.stage)} • Shelf Life:{" "}
                        {Math.max(0, Math.round(item.remaining_days))} days
                      </Text>
                    </View>
                  </View>

                  <Text className="text-[11px] font-semibold text-[#1D4ED8] mt-3">
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
            Loading dashboard...
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

      <Modal
        visible={profileOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setProfileOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setProfileOpen(false)}
        />

        <View className="bg-white rounded-t-3xl px-5 pt-4 pb-6">
          <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-4" />

          <View className="flex-row items-center">
            <Image
              source={{ uri: "https://i.pravatar.cc/100?img=12" }}
              style={{ width: 48, height: 48, borderRadius: 24 }}
            />
            <View className="ml-3 flex-1">
              <Text className="text-[16px] font-extrabold text-gray-900">
                {user?.name ?? "Farmer"}
              </Text>
              <Text className="text-[12px] text-gray-500 mt-0.5">
                {user?.email ?? "farmer@example.com"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setProfileOpen(false)}
              className="w-9 h-9 rounded-full bg-[#F3F4F6] items-center justify-center"
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <View className="h-px bg-gray-100 my-4" />

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleLogout}
            className="h-[52px] rounded-2xl bg-[#EF4444] items-center justify-center"
          >
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={18} color="white" />
              <Text className="text-white text-[14px] font-extrabold ml-2">
                Log out
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function HeroMetricLight({
  label,
  value,
  valueColor,
  bg,
}: {
  label: string;
  value: number;
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
      ? "#E9FBEF"
      : tone === "yellow"
      ? "#FEF9C3"
      : tone === "orange"
      ? "#FFF6E5"
      : "#FEE2E2";

  const num =
    tone === "green"
      ? "#16A34A"
      : tone === "yellow"
      ? "#CA8A04"
      : tone === "orange"
      ? "#F59E0B"
      : "#DC2626";

  return (
    <View
      className="w-[23%] rounded-[18px] py-3 items-center"
      style={{ backgroundColor: bg }}
    >
      <Text className="text-[16px] font-extrabold" style={{ color: num }}>
        {value}
      </Text>
      <Text className="text-[11px] text-gray-700 font-semibold mt-1">
        {label}
      </Text>
    </View>
  );
}

function ShelfLifeMiniCard({
  label,
  value,
  subtitle,
  bg,
  text,
  icon,
}: {
  label: string;
  value: number;
  subtitle: string;
  bg: string;
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      className="w-[31%] rounded-[18px] px-3 py-3"
      style={{ backgroundColor: bg }}
    >
      <View className="flex-row items-center justify-between">
        <Ionicons name={icon} size={16} color={text} />
        <Text className="text-[18px] font-extrabold" style={{ color: text }}>
          {value}
        </Text>
      </View>
      <Text className="text-[12px] font-extrabold text-gray-900 mt-3">
        {label}
      </Text>
      <Text className="text-[10px] text-gray-500 mt-1">{subtitle}</Text>
    </View>
  );
}

function SmallActionCard({
  title,
  value,
  tone,
  icon,
  onPress,
}: {
  title: string;
  value: number;
  tone: "amber" | "blue";
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const iconBg = tone === "amber" ? "#FFF7ED" : "#EFF6FF";
  const border = tone === "amber" ? "#FED7AA" : "#BFDBFE";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="w-[48%] rounded-[18px] px-4 py-4 shadow-sm bg-white"
      style={{ borderWidth: 1, borderColor: border }}
    >
      <View className="flex-row items-center justify-between">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </View>
        <Text className="text-[20px] font-extrabold text-gray-900">{value}</Text>
      </View>

      <Text className="text-[12px] font-extrabold text-gray-900 mt-3">
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function UrgencyRow({
  color,
  title,
  subtitle,
  bg,
}: {
  color: string;
  title: string;
  subtitle: string;
  bg: string;
}) {
  return (
    <View
      className="rounded-[16px] px-4 py-3 flex-row items-center"
      style={{ backgroundColor: bg }}
    >
      <View
        className="w-3 h-3 rounded-full mr-3"
        style={{ backgroundColor: color }}
      />
      <View className="flex-1">
        <Text className="text-[12px] font-extrabold text-gray-900">{title}</Text>
        <Text className="text-[11px] text-gray-500 mt-1">{subtitle}</Text>
      </View>
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
      activeOpacity={0.85}
      onPress={onPress}
      className="mr-2 px-3 py-2 rounded-full"
      style={{
        backgroundColor: active ? "#111827" : "#FFFFFF",
        borderWidth: active ? 0 : 1,
        borderColor: "#E5E7EB",
      }}
    >
      <Text
        className="text-[12px] font-semibold"
        style={{ color: active ? "#FFFFFF" : "#374151" }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <View className="bg-white rounded-[18px] px-4 py-4 shadow-sm">
      <Text className="text-[12px] font-semibold text-gray-500">{text}</Text>
    </View>
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
      ? "#16A34A"
      : item.severity === "warning"
      ? "#F59E0B"
      : "#DC2626";

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
        <View style={{ width: 6, backgroundColor: leftBar }} />

        <View className="flex-1 px-3 py-3 flex-row items-center">
          {imgUri ? (
            <Image
              source={{ uri: imgUri }}
              style={{ width: 50, height: 50, borderRadius: 14 }}
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