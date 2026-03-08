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

type PredictionItem = {
  id: string;
  plantId: string;
  shelfLifeDays: number;
  stageLabel: "Fresh" | "Slightly Aged" | "Near Spoilage" | "Critical";
  actionText?: string;
  severity: "monitoring" | "warning" | "critical";
  imageUrl?: string | null;
};

type Props = NativeStackScreenProps<SpoilageStackParamList, "SpoilageDetails">;

const COLORS = {
  bg: "#F4F6FA",
  card: "#FFFFFF",
  primary: "#0046AD",
  primaryDark: "#003B8F",
  navyAction: "#5F7396",
  scanAccent: "",
  primarySoft: "#FFFFFF",
  text: "#111827",
  subtext: "#6B7280",
  line: "#E5E7EB",

  green: "#22C55E",
  greenSoft: "#ECFDF3",

  amber: "#F59E0B",
  amberSoft: "#FFF7E8",

  red: "#EF4444",
  redSoft: "#FEF2F2",

  blueSoft: "#EEF4FF",
  cyanSoft: "#ECFEFF",
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
  if (stage === "near_spoilage") return "Inspect now";
  if (stage === "spoiled") return "Discard now";
  return undefined;
}

function recheckActionText(item: RecheckReminderRow) {
  if (item.stage === "spoiled") return "Take action now";
  if (item.stage === "near_spoilage") return "Rescan now";
  if (item.remaining_days <= 1) return "Rescan today";
  return "Rescan tomorrow";
}

function getInitialDemoDayIndex(stage?: string | null) {
  const s = String(stage || "").trim().toLowerCase();

  if (s === "fresh") return 0;
  if (s === "slightly_aged") return 1;
  if (s === "near_spoilage") return 2;
  if (s === "spoiled") return 3;

  return 0;
}

function statusTheme(riskPercent: number, spoiledCount: number, riskyPlants: number) {
  if (riskyPlants === 0) {
    return {
      label: "Stable",
      message: "Most plants are currently in acceptable condition.",
      color: COLORS.green,
      chipBg: COLORS.greenSoft,
      chipText: "#15803D",
      icon: "checkmark-circle-outline" as const,
    };
  }

  if (spoiledCount > 0 || riskPercent >= 50) {
    return {
      label: "High Risk",
      message: "Immediate review is needed for affected plants.",
      color: COLORS.red,
      chipBg: COLORS.redSoft,
      chipText: "#B91C1C",
      icon: "alert-circle-outline" as const,
    };
  }

  return {
    label: "Needs Attention",
    message: "Some plants are nearing spoilage and should be reviewed soon.",
    color: COLORS.amber,
    chipBg: COLORS.amberSoft,
    chipText: "#B45309",
    icon: "warning-outline" as const,
  };
}

function formatCapturedTime(iso?: string | null) {
  if (!iso) return "No reading for today";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "No reading for today";
  return d.toLocaleString();
}

export default function SpoilageDetailsScreen({ navigation }: Props) {
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
  };

  useEffect(() => {
    loadExtras();
    const unsub = navigation.addListener("focus", loadExtras);
    return unsub;
  }, [navigation]);

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

  const freshCount = latestRows.filter((r) => r.stage === "fresh").length;
  const agedCount = latestRows.filter((r) => r.stage === "slightly_aged").length;
  const riskCount = latestRows.filter((r) => r.stage === "near_spoilage").length;
  const spoiledCount = latestRows.filter((r) => r.stage === "spoiled").length;

  const totalPlants = latestRows.length;
  const riskyPlants = riskCount + spoiledCount;
  const stablePlants = freshCount + agedCount;

  const riskPercent =
    totalPlants > 0 ? Math.round((riskyPlants / totalPlants) * 100) : 0;

  const dashboardStatus = useMemo(
    () => statusTheme(riskPercent, spoiledCount, riskyPlants),
    [riskPercent, spoiledCount, riskyPlants]
  );

  const latestSensorReading = useMemo(() => {
    const now = new Date();

    const todayRows = rows.filter((r) => {
      const d = new Date(r.captured_at);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    });

    if (!todayRows.length) {
      return {
        temperature: 6.5,
        humidity: 91,
        capturedAt: null as string | null,
      };
    }

    const sorted = [...todayRows].sort(
      (a, b) =>
        new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime()
    );

    const latest = sorted[0];

    return {
      temperature: Number(latest.temperature ?? 6.5),
      humidity: Number(latest.humidity ?? 91),
      capturedAt: latest.captured_at ?? null,
    };
  }, [rows]);

  const envStatus = useMemo(() => {
    const tempOk =
      latestSensorReading.temperature >= 2 &&
      latestSensorReading.temperature <= 8;

    const humidityOk =
      latestSensorReading.humidity >= 85 &&
      latestSensorReading.humidity <= 95;

    if (tempOk && humidityOk) {
      return {
        label: "Normal",
        bg: COLORS.greenSoft,
        text: "#15803D",
      };
    }

    return {
      label: "Watch",
      bg: COLORS.amberSoft,
      text: "#B45309",
    };
  }, [latestSensorReading]);

  const topRechecks = useMemo(() => recheckItems.slice(0, 3), [recheckItems]);
  const recentPredictions = useMemo(() => predictions.slice(0, 5), [predictions]);

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
      <View className="px-4 pt-3">
        
        {/* ✅ Centered Header */}
              <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 }}>
                <View className="flex-row items-center justify-between mb-[-4]">
                  {/* Back Button */}
                  <TouchableOpacity
                    onPress={() => {
                      if (navigation.canGoBack()) {
                        navigation.goBack();
                      } else {
                        navigation.navigate("SpoilageAlerts");
                      }
                    }}
                    activeOpacity={0.8}
                    className="w-10 h-10 items-center justify-center rounded-full bg-white"
                    style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
                  >
                    <Ionicons name="chevron-back" size={20} color="#111827" />
                  </TouchableOpacity>
        
                  {/* ✅ Centered Title */}
                  <View className="absolute left-0 right-0 items-center" style={{ pointerEvents: 'none' }}>
                    <Text className="text-[16px] font-extrabold text-gray-900">
                      Spoilage Monitoring
                    </Text>
                  </View>
        
                  {/* Empty spacer for balance */}
                  <View className="w-10 h-10" />
                </View>
        
              
              </View>

        <Text className="text-[12px] mt-1 text-center" style={{ color: COLORS.subtext }}>
          {currentLocation}
        </Text>

        {error ? (
          <View
            className="mt-4 rounded-[16px] px-4 py-3"
            style={{ backgroundColor: COLORS.redSoft, borderWidth: 1, borderColor: "#FECACA" }}
          >
            <Text className="text-[12px] font-semibold" style={{ color: COLORS.red }}>
              {error}
            </Text>
          </View>
        ) : null}

        <View
          className="mt-4 rounded-[28px] p-5"
          style={{ backgroundColor: COLORS.primarySoft }}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <View
                className="self-start px-3 py-1 rounded-full"
                style={{ backgroundColor: dashboardStatus.chipBg }}
              >
                <Text
                  className="text-[11px] font-extrabold"
                  style={{ color: dashboardStatus.chipText }}
                >
                  {dashboardStatus.label}
                </Text>
              </View>

              <Text
                className="text-[28px] font-extrabold mt-3"
                style={{ color: COLORS.primary }}
              >
                {riskPercent}%
              </Text>
              <Text className="text-[12px] mt-1" style={{ color: COLORS.subtext }}>
                Overall spoilage risk exposure
              </Text>

              <Text className="text-[12px] mt-3 leading-5" style={{ color: COLORS.subtext }}>
                {dashboardStatus.message}
              </Text>
            </View>

            <View
              className="w-14 h-14 rounded-full items-center justify-center"
              style={{ backgroundColor: dashboardStatus.color }}
            >
              <Ionicons name={dashboardStatus.icon} size={24} color="#fff" />
            </View>
          </View>

          <View className="mt-5">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[12px] font-semibold" style={{ color: COLORS.subtext }}>
                Live Risk Level
              </Text>
              <Text className="text-[12px] font-extrabold" style={{ color: COLORS.text }}>
                {riskPercent}%
              </Text>
            </View>

            <View
              className="h-3 rounded-full overflow-hidden"
              style={{ backgroundColor: "#D9E4FF" }}
            >
              <View
                style={{
                  width: `${riskPercent}%`,
                  height: "100%",
                  backgroundColor:
                    riskPercent >= 60
                      ? COLORS.red
                      : riskPercent >= 30
                      ? COLORS.amber
                      : COLORS.green,
                }}
              />
            </View>
          </View>
        </View>

        <View className="mt-4 flex-row justify-between">
          <MetricCard
            title="Tracked"
            value={totalPlants}
            subtitle="Plants"
            icon="leaf-outline"
            iconBg={COLORS.blueSoft}
            iconColor={COLORS.primary}
          />
          <MetricCard
            title="Stable"
            value={stablePlants}
            subtitle="Fresh / Aged"
            icon="checkmark-circle-outline"
            iconBg={COLORS.greenSoft}
            iconColor={COLORS.green}
          />
        </View>

        <View className="mt-3 flex-row justify-between">
          <MetricCard
            title="Risk"
            value={riskCount}
            subtitle="Near Spoilage"
            icon="warning-outline"
            iconBg={COLORS.amberSoft}
            iconColor={COLORS.amber}
          />
          <MetricCard
            title="Critical"
            value={spoiledCount}
            subtitle="Spoiled"
            icon="alert-circle-outline"
            iconBg={COLORS.redSoft}
            iconColor={COLORS.red}
          />
        </View>

        <View
          className="mt-4 rounded-[22px] px-4 py-4"
          style={{ backgroundColor: COLORS.card }}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[14px] font-extrabold" style={{ color: COLORS.text }}>
                Storage Environment
              </Text>
              <Text className="text-[11px] mt-1" style={{ color: COLORS.subtext }}>
                Latest captured sensor values for today
              </Text>
            </View>

            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: envStatus.bg }}
            >
              <Text
                className="text-[11px] font-extrabold"
                style={{ color: envStatus.text }}
              >
                {envStatus.label}
              </Text>
            </View>
          </View>

          <Text className="text-[10px] mt-3" style={{ color: COLORS.subtext }}>
            Updated: {formatCapturedTime(latestSensorReading.capturedAt)}
          </Text>

          <View className="flex-row mt-4">
            <EnvCard
              title="Temperature"
              value={`${latestSensorReading.temperature.toFixed(1)}°C`}
              hint="Ideal: 2°C - 8°C"
              icon="thermometer-outline"
              bg={COLORS.blueSoft}
              iconColor={COLORS.primary}
            />
            <View className="w-3" />
            <EnvCard
              title="Humidity"
              value={`${latestSensorReading.humidity.toFixed(0)}%`}
              hint="Ideal: 85% - 95%"
              icon="water-outline"
              bg={COLORS.cyanSoft}
              iconColor="#0891B2"
            />
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.92}
          onPress={openSpoilageScan}
          className="mt-4 rounded-[24px] px-4 py-4"
          style={{ backgroundColor: COLORS.primaryDark }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-white text-[17px] font-extrabold">
                Scan Spoilage
              </Text>
              <Text className="text-white/85 text-[12px] mt-1">
                Analyze single plant health
              </Text>
            </View>

            <View
              className="w-14 h-14 rounded-full items-center justify-center"
              style={{ backgroundColor: COLORS.scanAccent }}
            >
              <Ionicons name="scan-outline" size={24} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>

        <View className="mt-4 flex-row justify-between">
          <MiniActionCard
            title="Alerts"
            value={activeAlertCount}
            icon="notifications-outline"
            iconColor={COLORS.amber}
            iconBg={COLORS.amberSoft}
            onPress={() => navigation.navigate("SpoilageAlerts")}
          />
          <MiniActionCard
            title="Recheck"
            value={recheckCount}
            icon="time-outline"
            iconColor={COLORS.primary}
            iconBg={COLORS.blueSoft}
            onPress={() =>
              Alert.alert(
                "Recheck Queue",
                `${recheckCount} plants are currently waiting for recheck.`
              )
            }
          />
        </View>

        <SectionHeader
          title="Priority Recheck Queue"
          actionLabel={topRechecks.length ? "Top 3" : undefined}
          onPress={() => {}}
          hideAction={!topRechecks.length}
        />
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
    <SafeAreaView edges={["top"]} className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-2 text-[12px] font-semibold" style={{ color: COLORS.subtext }}>
            Loading dashboard...
          </Text>
        </View>
      ) : (
        <FlatList
          data={recentPredictions}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          ListHeaderComponent={
            <>
              {ListHeader}

              <View style={{ paddingHorizontal: 16 }}>
                {topRechecks.length === 0 ? (
                  <EmptyPanel text="No urgent rescans right now." />
                ) : (
                  topRechecks.map((item) => {
                    const sim = isSimPlantId(item.plant_id);

                    return (
                      <TouchableOpacity
                        key={`${item.plant_id}-${item.captured_at}`}
                        activeOpacity={0.9}
                        onPress={() =>
                          navigation.navigate("SpoilagePlantDetails", {
                            plantId: item.plant_id,
                          })
                        }
                        className="rounded-[20px] px-4 py-4 mb-3"
                        style={{ backgroundColor: COLORS.card }}
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1 pr-3">
                            <View className="flex-row items-center">
                              <View
                                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                                style={{
                                  backgroundColor:
                                    item.stage === "spoiled"
                                      ? COLORS.redSoft
                                      : item.stage === "near_spoilage"
                                      ? COLORS.amberSoft
                                      : COLORS.blueSoft,
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
                                      ? COLORS.red
                                      : item.stage === "near_spoilage"
                                      ? COLORS.amber
                                      : COLORS.primary
                                  }
                                />
                              </View>

                              <View className="flex-1">
                                <Text className="text-[13px] font-extrabold" style={{ color: COLORS.text }}>
                                  {displayPlantId(item.plant_id)}
                                  {sim ? (
                                    <Text className="text-[11px]" style={{ color: "#9CA3AF" }}>
                                      {" "}
                                      (Sim)
                                    </Text>
                                  ) : null}
                                </Text>
                                <Text className="text-[11px] mt-1" style={{ color: COLORS.subtext }}>
                                  {mapStageLabel(item.stage)} •{" "}
                                  {Math.max(0, Math.round(item.remaining_days))} days left
                                </Text>
                              </View>
                            </View>

                            <Text
                              className="text-[11px] font-semibold mt-3"
                              style={{ color: COLORS.primary }}
                            >
                              {recheckActionText(item)}
                            </Text>
                          </View>

                          <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() =>
                              navigation.navigate("SpoilageScan", {
                                plantId: item.plant_id,
                                demoMode: sim,
                                initialDemoDayIndex: sim
                                  ? getInitialDemoDayIndex(item.stage)
                                  : undefined,
                              })
                            }
                            className="px-4 py-2 rounded-full"
                            style={{ backgroundColor: COLORS.navyAction }}
                          >
                            <Text className="text-[11px] font-extrabold text-white">
                              Rescan
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}

                <SectionHeader
                  title="Recent Plant Results"
                  actionLabel="View All"
                  onPress={() => navigation.navigate("SpoilagePlants")}
                />
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
              <Text className="text-[12px] font-semibold" style={{ color: COLORS.subtext }}>
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
              <Text className="text-[16px] font-extrabold" style={{ color: COLORS.text }}>
                {user?.name ?? "Farmer"}
              </Text>
              <Text className="text-[12px] mt-0.5" style={{ color: COLORS.subtext }}>
                {user?.email ?? "farmer@example.com"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setProfileOpen(false)}
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: "#F3F4F6" }}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <View className="h-px bg-gray-100 my-4" />

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleLogout}
            className="h-[52px] rounded-2xl items-center justify-center"
            style={{ backgroundColor: COLORS.red }}
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

function SectionHeader({
  title,
  actionLabel,
  onPress,
  hideAction,
}: {
  title: string;
  actionLabel?: string;
  onPress?: () => void;
  hideAction?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between mt-6 mb-3">
      <Text className="text-[15px] font-extrabold" style={{ color: COLORS.text }}>
        {title}
      </Text>
      {!hideAction && actionLabel ? (
        <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
          <Text className="text-[12px] font-semibold" style={{ color: COLORS.primary }}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : (
        <View />
      )}
    </View>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <View
      className="w-[48.5%] rounded-[20px] px-4 py-4"
      style={{ backgroundColor: COLORS.card }}
    >
      <View className="flex-row items-center justify-between">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text className="text-[24px] font-extrabold" style={{ color: COLORS.text }}>
          {value}
        </Text>
      </View>

      <Text className="text-[13px] font-extrabold mt-4" style={{ color: COLORS.text }}>
        {title}
      </Text>
      <Text className="text-[11px] mt-1" style={{ color: COLORS.subtext }}>
        {subtitle}
      </Text>
    </View>
  );
}

function EnvCard({
  title,
  value,
  hint,
  icon,
  bg,
  iconColor,
}: {
  title: string;
  value: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  iconColor: string;
}) {
  return (
    <View className="flex-1 rounded-[18px] px-4 py-4" style={{ backgroundColor: bg }}>
      <View className="flex-row items-center justify-between">
        <Ionicons name={icon} size={18} color={iconColor} />
        <Text className="text-[18px] font-extrabold" style={{ color: COLORS.text }}>
          {value}
        </Text>
      </View>

      <Text className="text-[12px] font-extrabold mt-4" style={{ color: COLORS.text }}>
        {title}
      </Text>
      <Text className="text-[10px] mt-1" style={{ color: COLORS.subtext }}>
        {hint}
      </Text>
    </View>
  );
}

function MiniActionCard({
  title,
  value,
  icon,
  iconColor,
  iconBg,
  onPress,
}: {
  title: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="w-[48.5%] rounded-[20px] px-4 py-4"
      style={{ backgroundColor: COLORS.card }}
    >
      <View className="flex-row items-center justify-between">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text className="text-[22px] font-extrabold" style={{ color: COLORS.text }}>
          {value}
        </Text>
      </View>

      <Text className="text-[13px] font-extrabold mt-4" style={{ color: COLORS.text }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <View
      className="rounded-[18px] px-4 py-4"
      style={{ backgroundColor: COLORS.card }}
    >
      <Text className="text-[12px] font-semibold" style={{ color: COLORS.subtext }}>
        {text}
      </Text>
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
      ? COLORS.green
      : item.severity === "warning"
      ? COLORS.amber
      : COLORS.red;

  const badge = (() => {
    if (item.stageLabel === "Fresh")
      return { bg: COLORS.greenSoft, text: "#15803D", label: "Fresh" };
    if (item.stageLabel === "Slightly Aged")
      return { bg: "#F0FDF4", text: "#16A34A", label: "Slightly Aged" };
    if (item.stageLabel === "Near Spoilage")
      return { bg: COLORS.amberSoft, text: "#B45309", label: "Near Spoilage" };
    return { bg: COLORS.redSoft, text: "#B91C1C", label: "Critical" };
  })();

  const imgUri = item.imageUrl
    ? `${SPOILAGE_BASE_URL}${item.imageUrl}`
    : undefined;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="rounded-[18px] overflow-hidden"
      style={{ backgroundColor: COLORS.card }}
    >
      <View className="flex-row">
        <View style={{ width: 6, backgroundColor: leftBar }} />

        <View className="flex-1 px-3 py-3 flex-row items-center">
          {imgUri ? (
            <Image
              source={{ uri: imgUri }}
              style={{ width: 54, height: 54, borderRadius: 14 }}
              resizeMode="cover"
              resizeMethod="resize"
            />
          ) : (
            <View
              className="w-[54px] h-[54px] rounded-[14px] items-center justify-center"
              style={{ backgroundColor: "#F3F4F6" }}
            >
              <Ionicons name="image-outline" size={18} color="#9CA3AF" />
            </View>
          )}

          <View className="flex-1 ml-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-[13px] font-extrabold" style={{ color: COLORS.text }}>
                {displayPlantId(item.plantId)}
                {sim ? (
                  <Text className="text-[11px]" style={{ color: "#9CA3AF" }}>
                    {" "}
                    (Sim)
                  </Text>
                ) : null}
              </Text>

              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: badge.bg }}
              >
                <Text className="text-[11px] font-extrabold" style={{ color: badge.text }}>
                  {badge.label}
                </Text>
              </View>
            </View>

            <Text className="text-[11px] mt-1" style={{ color: COLORS.subtext }}>
              Shelf Life: {clamp(item.shelfLifeDays, 0, 99)} days
            </Text>

            {item.actionText ? (
              <Text className="text-[11px] mt-1 font-semibold" style={{ color: "#374151" }}>
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