import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { WaterQualityStackParamList } from "../../navigation/WaterQualityNavigator";

import { analyzeBatch, getWaterHistory, type AnalyzeResponse } from "../../api/WaterQualityApi";

type Props = NativeStackScreenProps<WaterQualityStackParamList, "WaterQualityDashboard">;

const THEME = "#00368C";
const DEFAULT_TANK = "TANK_01";

type Status = "OK" | "WARNING" | "CRITICAL" | "—";

function statusTheme(status: Status) {
  if (status === "OK") {
    return {
      name: "OK",
      icon: "checkmark-circle" as const,
      bg: "#EAF9F0",
      border: "#C7EFD6",
      text: "#0F7A3D",
      solid: "#18A957",
      glow: "#BFF0D4",
    };
  }
  if (status === "WARNING") {
    return {
      name: "WARNING",
      icon: "warning" as const,
      bg: "#FFF7E0",
      border: "#FFE3A3",
      text: "#8A5B00",
      solid: "#F59E0B",
      glow: "#FFE4B5",
    };
  }
  if (status === "CRITICAL") {
    return {
      name: "CRITICAL",
      icon: "alert-circle" as const,
      bg: "#FFECEE",
      border: "#FFC9D0",
      text: "#B42318",
      solid: "#EF4444",
      glow: "#FFD1D7",
    };
  }
  return {
    name: "—",
    icon: "help-circle" as const,
    bg: "#F3F4F6",
    border: "#E5E7EB",
    text: "#374151",
    solid: THEME,
    glow: "#DCEBFF",
  };
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const size = 110;
  const inner = 84;
  const pct = Math.max(0, Math.min(100, score));

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#EAF4FF",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 10,
        borderColor: color,
      }}
    >
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          backgroundColor: "white",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "#E5EEF9",
        }}
      >
        <Text className="text-[22px] font-extrabold text-gray-900">{pct}</Text>
        <Text className="text-[12px] font-bold text-gray-500">Score</Text>
      </View>
    </View>
  );
}

function StatChip({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View className="bg-white rounded-[18px] border border-[#E5EEF9] px-4 py-3 flex-1 shadow-sm">
      <View className="flex-row items-center justify-between">
        <Text className="text-[12px] font-bold text-gray-500">{label}</Text>
        <Ionicons name={icon} size={16} color={THEME} />
      </View>
      <View className="mt-2 flex-row items-end">
        <Text className="text-[18px] font-extrabold text-gray-900">{value}</Text>
        {unit ? <Text className="ml-1 text-[12px] font-bold text-gray-500">{unit}</Text> : null}
      </View>
    </View>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="bg-white rounded-[24px] border border-[#E5EEF9] p-5 shadow-sm">
      <Text className="text-[16px] font-extrabold text-gray-900">{title}</Text>
      <View className="mt-3">{children}</View>
    </View>
  );
}

export default function WaterQualityDashboardScreen({ navigation }: Props) {
  const [tankId] = useState(DEFAULT_TANK);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    try {
      const hist = await getWaterHistory(tankId, 200);
      const readings = hist.readings.map((r) => ({
        timestamp: r.timestamp,
        ph: r.ph,
        temp_c: r.temp_c,
        turb_ntu: r.turb_ntu,
        ec: r.ec,
      }));

      if (readings.length < 10) {
        setErr("Not enough readings in DB. Ingest 10+ readings covering ~1 hour.");
        setResult(null);
        return;
      }

      const res = await analyzeBatch({ tank_id: tankId, readings });
      setResult(res);
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? e?.message ?? "Failed to load water quality status.");
      setResult(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  const finalStatus: Status = (result?.final_status as any) ?? "—";
  const algae = result?.ml_algae ?? "—";
  const healthScore = result?.health_score ?? 0;

  const st = useMemo(() => statusTheme(finalStatus), [finalStatus]);

  // dummy quick stats for now
  const dummyStats = {
    ph: "6.00",
    temp: "21.6",
    turbidity: "1.2",
    ec: "1.54",
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAFF]">
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-5 pt-2">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-11 h-11 rounded-2xl bg-white items-center justify-center border border-[#E6EEF9]"
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-back" size={22} color="#111827" />
            </TouchableOpacity>

            <View className="items-center">
              <Text className="text-[18px] font-extrabold text-gray-900">Water Quality</Text>
              <Text className="text-[12px] font-bold text-gray-500 mt-1">Tank: {tankId}</Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate("WaterQualityHistory", { tank_id: tankId })}
              className="w-11 h-11 rounded-2xl items-center justify-center border border-[#E6EEF9] bg-white"
              activeOpacity={0.85}
            >
              <Ionicons name="time-outline" size={20} color={THEME} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-5 mt-5">
          <View
            className="rounded-[28px] overflow-hidden border shadow-sm"
            style={{
              borderColor: st.border,
              backgroundColor: "white",
            }}
          >
            <View style={{ backgroundColor: st.glow }} className="px-5 py-5">
              {/* FIXED LAYOUT SO RING DOES NOT MOVE */}
              <View className="flex-row items-start">
                <View className="flex-1 pr-4">
                  <Text className="text-[12px] font-bold text-gray-600">Final Status</Text>

                  <View
                    className="mt-3 flex-row items-center self-start px-5 py-3 rounded-full"
                    style={{
                      backgroundColor: st.bg,
                      borderColor: st.border,
                      borderWidth: 1,
                      minWidth: 150, // keeps pill area more stable
                    }}
                  >
                    <Ionicons name={st.icon} size={24} color={st.text} />
                    <Text
                      className="ml-3 text-[18px] font-extrabold"
                      style={{ color: st.text }}
                    >
                      {st.name}
                    </Text>
                  </View>

                  <Text className="mt-3 text-[13px] text-gray-700">
                    {finalStatus === "OK"
                      ? "Water conditions look stable."
                      : finalStatus === "WARNING"
                      ? "Conditions are drifting. Take preventive action."
                      : finalStatus === "CRITICAL"
                      ? "Immediate attention required."
                      : "—"}
                  </Text>
                </View>

                {/* fixed-width container for ring */}
                <View className="w-[120px] items-center justify-start">
                  <ScoreRing score={healthScore} color={st.solid} />
                </View>
              </View>

              <View className="mt-5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[13px] font-bold text-gray-700">Status Strength</Text>
                  <Text className="text-[13px] font-extrabold" style={{ color: st.solid }}>
                    {healthScore}%
                  </Text>
                </View>

                <View className="mt-3 bg-white rounded-full h-4 overflow-hidden border border-[#E5EEF9]">
                  <View
                    style={{
                      width: `${Math.max(0, Math.min(100, healthScore))}%`,
                      backgroundColor: st.solid,
                    }}
                    className="h-4 rounded-full"
                  />
                </View>

                <View className="mt-2 flex-row items-center">
                  <Ionicons name="sparkles" size={14} color={THEME} />
                  <Text className="ml-2 text-[12px] text-gray-600">
                    Score is stable (rule-based). Status is safety-first.
                  </Text>
                </View>
              </View>
            </View>

            <View className="px-5 py-4 border-t border-[#E5EEF9] flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: "#EAF4FF" }}
                >
                  <Ionicons name="leaf" size={20} color={THEME} />
                </View>
                <View className="ml-3">
                  <Text className="text-[12px] font-bold text-gray-500">Algae Warning</Text>
                  <Text className="text-[16px] font-extrabold text-gray-900 mt-1">{algae}</Text>
                </View>
              </View>

              <TouchableOpacity
                className="px-4 py-3 rounded-2xl"
                style={{ backgroundColor: THEME }}
                onPress={onRefresh}
                activeOpacity={0.85}
              >
                <Text className="text-white text-[13px] font-extrabold">Refresh</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="px-5 mt-5 pb-10">
          {loading ? (
            <View className="mt-8 items-center">
              <ActivityIndicator size="large" color={THEME} />
              <Text className="mt-3 text-gray-600 text-[13px]">Loading…</Text>
            </View>
          ) : err ? (
            <View className="bg-white rounded-[24px] p-5 border border-[#FFE4E6]">
              <Text className="text-[16px] font-extrabold text-red-700">Cannot load status</Text>
              <Text className="text-[13px] text-gray-700 mt-2">{err}</Text>
              <Text className="text-[12px] text-gray-500 mt-2">
                Tip: Use Postman ingest for TANK_01 (10+ readings) or start ESP32 sending.
              </Text>
            </View>
          ) : result ? (
            <>
              <Text className="text-[14px] font-extrabold text-gray-900 mb-3">Quick Stats</Text>
              <View className="flex-row gap-3">
                <StatChip label="pH" value={dummyStats.ph} icon="water-outline" />
                <StatChip label="Temp" value={dummyStats.temp} unit="°C" icon="thermometer-outline" />
              </View>
              <View className="flex-row gap-3 mt-3">
                <StatChip label="Turbidity" value={dummyStats.turbidity} unit="NTU" icon="eye-outline" />
                <StatChip label="EC" value={dummyStats.ec} icon="flash-outline" />
              </View>

              <View className="mt-5">
                <Card title="Reasons">
                  {result.reasons.length === 0 ? (
                    <Text className="text-[13px] text-gray-600">No issues detected.</Text>
                  ) : (
                    result.reasons.map((r, idx) => (
                      <View key={idx} className="flex-row mt-2">
                        <Text className="text-[14px] text-gray-900">• </Text>
                        <Text className="text-[13px] text-gray-800 flex-1">{r}</Text>
                      </View>
                    ))
                  )}
                </Card>
              </View>

              <View className="mt-4">
                <Card title="Recommended Actions">
                  {result.actions.length === 0 ? (
                    <Text className="text-[13px] text-gray-600">No action needed.</Text>
                  ) : (
                    result.actions.map((a, idx) => (
                      <View key={idx} className="flex-row mt-2">
                        <Text className="text-[14px] text-gray-900">• </Text>
                        <Text className="text-[13px] text-gray-800 flex-1">{a}</Text>
                      </View>
                    ))
                  )}
                </Card>
              </View>

              <View className="mt-4">
                <Card title="Algae Notes">
                  {result.algae_reasons.length === 0 ? (
                    <Text className="text-[13px] text-gray-600">No algae risk indicators.</Text>
                  ) : (
                    result.algae_reasons.map((a, idx) => (
                      <View key={idx} className="flex-row mt-2">
                        <Text className="text-[14px] text-gray-900">• </Text>
                        <Text className="text-[13px] text-gray-800 flex-1">{a}</Text>
                      </View>
                    ))
                  )}

                  {result.algae_actions.length > 0 && (
                    <>
                      <Text className="mt-4 text-[14px] font-extrabold text-gray-900">Algae Actions</Text>
                      {result.algae_actions.map((a, idx) => (
                        <View key={idx} className="flex-row mt-2">
                          <Text className="text-[14px] text-gray-900">• </Text>
                          <Text className="text-[13px] text-gray-800 flex-1">{a}</Text>
                        </View>
                      ))}
                    </>
                  )}
                </Card>
              </View>

              <View className="mt-5 bg-white rounded-[24px] border border-[#E5EEF9] p-5">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-2xl items-center justify-center" style={{ backgroundColor: "#EAF4FF" }}>
                    <Ionicons name="information-circle" size={22} color={THEME} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-[14px] font-extrabold text-gray-900">Tip</Text>
                    <Text className="text-[12px] text-gray-600 mt-1">
                      For best stability, use batch/time-series readings (15-min intervals).
                    </Text>
                  </View>
                </View>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}