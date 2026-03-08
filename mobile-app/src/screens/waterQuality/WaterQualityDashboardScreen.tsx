// src/screens/waterQuality/WaterQualityDashboardScreen.tsx
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
import Svg, { Polyline, Line, Circle } from "react-native-svg";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { WaterQualityStackParamList } from "../../navigation/WaterQualityNavigator";

import {
  analyzeBatch,
  getWaterHistory,
  type AnalyzeResponse,
  type WaterReading,
} from "../../api/WaterQualityApi";
import { logWaterActivity } from "../../utils/activityLog";

type Props = NativeStackScreenProps<
  WaterQualityStackParamList,
  "WaterQualityDashboard"
>;

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
      hint: "Water conditions look stable.",
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
      hint: "Conditions are drifting. Take preventive action.",
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
      hint: "Immediate attention required.",
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
    hint: "—",
  };
}

function algaeTheme(level: string) {
  if (level === "HIGH") {
    return {
      name: "HIGH",
      bg: "#ECFDF3",
      border: "#A7F3D0",
      text: "#047857",
      solid: "#10B981",
      glow: "#D1FAE5",
      headline: "High algae risk",
    };
  }
  if (level === "MEDIUM") {
    return {
      name: "MEDIUM",
      bg: "#FFFBEB",
      border: "#FDE68A",
      text: "#92400E",
      solid: "#F59E0B",
      glow: "#FEF3C7",
      headline: "Moderate algae risk",
    };
  }
  return {
    name: "LOW",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    text: "#1D4ED8",
    solid: "#3B82F6",
    glow: "#DBEAFE",
    headline: "Low algae risk",
  };
}

function algaeDefaults(level: string) {
  if (level === "HIGH") {
    return {
      reason: "High algae risk detected from water clarity and recent patterns.",
      action:
        "Reduce light on water surface, clean tank walls/filters, increase circulation, and recheck within 15 minutes.",
    };
  }
  if (level === "MEDIUM") {
    return {
      reason: "Moderate algae risk. Early prevention recommended.",
      action:
        "Reduce light exposure, inspect filtration/circulation, and recheck within 30 minutes.",
    };
  }
  return {
    reason: "Low algae risk. Water clarity appears stable.",
    action:
      "Continue monitoring and keep water surface protected from direct light.",
  };
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const size = 112;
  const inner = 86;
  const pct = Math.max(0, Math.min(90, score)); // ✅ cap at 90

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

function StatusPill({ label }: { label: Status }) {
  const st = statusTheme(label);
  return (
    <View
      className="flex-row items-center px-4 py-2 rounded-full"
      style={{ backgroundColor: st.bg, borderColor: st.border, borderWidth: 1 }}
    >
      <Ionicons name={st.icon} size={18} color={st.text} />
      <Text className="ml-2 text-[14px] font-extrabold" style={{ color: st.text }}>
        {st.name}
      </Text>
    </View>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-white rounded-[24px] border border-[#E5EEF9] p-5 shadow-sm">
      <View className="flex-row items-center justify-between">
        <Text className="text-[16px] font-extrabold text-gray-900">{title}</Text>
        <View className="w-10 h-10 rounded-2xl items-center justify-center bg-[#EAF4FF] border border-[#E5EEF9]">
          <Ionicons name={icon} size={18} color={THEME} />
        </View>
      </View>
      <View className="mt-4">{children}</View>
    </View>
  );
}

function StatTile({
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
        {unit ? (
          <Text className="ml-1 text-[12px] font-bold text-gray-500">{unit}</Text>
        ) : null}
      </View>
    </View>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
}) {
  return (
    <View className="bg-white rounded-[20px] border border-[#E5EEF9] p-4 mr-3 w-[170px] shadow-sm">
      <View className="flex-row items-center justify-between">
        <Text className="text-[12px] font-bold text-gray-500">{title}</Text>
        <View className="w-9 h-9 rounded-2xl items-center justify-center bg-[#EAF4FF] border border-[#E5EEF9]">
          <Ionicons name={icon} size={18} color={accent} />
        </View>
      </View>

      <Text className="mt-3 text-[18px] font-extrabold" style={{ color: accent }}>
        {value}
      </Text>

      {subtitle ? (
        <Text className="mt-1 text-[12px] text-gray-500">{subtitle}</Text>
      ) : null}
    </View>
  );
}

function ProbBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const pct = Math.round(((value ?? 0) * 100 + Number.EPSILON) * 10) / 10;
  return (
    <View className="mt-2">
      <View className="flex-row justify-between">
        <Text className="text-[12px] font-bold text-gray-700">{label}</Text>
        <Text className="text-[12px] font-extrabold text-gray-900">{pct}%</Text>
      </View>
      <View className="mt-2 h-3 rounded-full bg-[#EAF4FF] overflow-hidden border border-[#E5EEF9]">
        <View
          style={{
            width: `${Math.max(0, Math.min(100, pct))}%`,
            backgroundColor: color,
          }}
          className="h-3 rounded-full"
        />
      </View>
    </View>
  );
}

function oneLine(s?: string) {
  if (!s) return "—";
  return s.length > 130 ? `${s.slice(0, 130)}…` : s;
}

function MiniLineChart({
  values,
  height = 90,
  color = THEME,
}: {
  values: number[];
  height?: number;
  color?: string;
}) {
  const width = 340;
  const pad = 14;

  if (!values || values.length < 2) {
    return (
      <View className="h-[90px] rounded-[18px] bg-[#F5FAFF] border border-[#E5EEF9] items-center justify-center">
        <Text className="text-[12px] text-gray-500">Not enough data</Text>
      </View>
    );
  }

  const clean = values.map((v) => (Number.isFinite(v) ? v : 0));
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const span = max - min || 1;

  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const points = clean
    .map((v, i) => {
      const x = pad + (i / (clean.length - 1)) * innerW;
      const y = pad + (1 - (v - min) / span) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const last = clean[clean.length - 1];
  const lastX = pad + innerW;
  const lastY = pad + (1 - (last - min) / span) * innerH;

  return (
    <View className="rounded-[18px] bg-[#F5FAFF] border border-[#E5EEF9] overflow-hidden">
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line x1={pad} y1={pad} x2={width - pad} y2={pad} stroke="#D7E6FF" strokeWidth="1" />
        <Line
          x1={pad}
          y1={height - pad}
          x2={width - pad}
          y2={height - pad}
          stroke="#D7E6FF"
          strokeWidth="1"
        />

        <Polyline points={points} fill="none" stroke={color} strokeWidth="3" />
        <Circle cx={lastX} cy={lastY} r="5" fill="#FFFFFF" stroke={color} strokeWidth="3" />
      </Svg>
    </View>
  );
}

export default function WaterQualityDashboardScreen({ navigation }: Props) {
  const [tankId] = useState(DEFAULT_TANK);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [latestRow, setLatestRow] = useState<WaterReading | null>(null);

  const [chartSeries, setChartSeries] = useState<{ ph: number[]; turb: number[] }>({
    ph: [],
    turb: [],
  });

  const load = async () => {
    setErr(null);
    try {
      const hist = await getWaterHistory(tankId, 200);
      const readings: WaterReading[] = hist.readings.map((r) => ({
        timestamp: r.timestamp,
        ph: r.ph,
        temp_c: r.temp_c,
        turb_ntu: r.turb_ntu,
        ec: r.ec,
      }));

      if (readings.length < 10) {
        setErr("Not enough readings in DB. Ingest 10+ readings covering ~1 hour.");
        setResult(null);
        setLatestRow(null);
        setChartSeries({ ph: [], turb: [] });
        return;
      }

      const chartSlice = readings.slice(-30);
      setChartSeries({
        ph: chartSlice.map((r) => r.ph),
        turb: chartSlice.map((r) => r.turb_ntu),
      });

      setLatestRow(readings[readings.length - 1]);
      const res = await analyzeBatch(tankId, readings);
      setResult(res);

      // activity log (non-blocking)
      try {
        await logWaterActivity({
          tankId,
          finalStatus: res?.final_status,
          healthScore: res?.health_score,
          sourceTimestamp: String(res?.timestamp ?? readings[readings.length - 1]?.timestamp ?? ""),
        });
      } catch (error) {
        console.error("Failed to log water activity:", error);
      }
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? e?.message ?? "Failed to load water quality status.");
      setResult(null);
      setLatestRow(null);
      setChartSeries({ ph: [], turb: [] });
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
  const st = useMemo(() => statusTheme(finalStatus), [finalStatus]);

  const waterProbs = result?.ml_probs ?? {};
  const algaeLevel = result?.ml_algae ?? "LOW";
  const at = useMemo(() => algaeTheme(algaeLevel), [algaeLevel]);
  const algaeProbs = result?.ml_algae_probs ?? {};

  const defaults = algaeDefaults(algaeLevel);
  const algaeMainReason = result?.algae_reasons?.[0] ?? defaults.reason;
  const algaeMainAction = result?.algae_actions?.[0] ?? defaults.action;

  const healthScore = result?.health_score ?? 0;
  const cappedScore = Math.max(0, Math.min(90, healthScore)); // ✅ cap at 90 everywhere
  const sensorQuality = result?.sensor_quality ?? "OK";

  const lastUpdated = result?.timestamp ? String(result.timestamp) : "—";
  const lastUpdatedHHMM =
    lastUpdated !== "—" && lastUpdated.length >= 16 ? lastUpdated.slice(11, 16) : "—";

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAFF]">
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top Header */}
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

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => navigation.navigate("WaterQualityCharts", { tank_id: tankId })}
                className="w-11 h-11 rounded-2xl items-center justify-center border border-[#E6EEF9] bg-white"
                activeOpacity={0.85}
              >
                <Ionicons name="stats-chart" size={20} color={THEME} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("WaterQualityHistory", { tank_id: tankId })}
                className="w-11 h-11 rounded-2xl items-center justify-center border border-[#E6EEF9] bg-white"
                activeOpacity={0.85}
              >
                <Ionicons name="time-outline" size={20} color={THEME} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Loading / Error */}
        <View className="px-5 mt-5">
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
                Tip: Postman ingest 10+ readings for TANK_01 (15-min gaps), then pull down to refresh.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Main content */}
        {!loading && !err && result ? (
          <>
            {/* Hero */}
            <View className="px-5 mt-5">
              <View className="rounded-[28px] overflow-hidden border shadow-sm bg-white" style={{ borderColor: st.border }}>
                <View style={{ backgroundColor: st.glow }} className="px-5 py-5">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-4">
                      <Text className="text-[12px] font-bold text-gray-600">Final Status</Text>

                      <View className="mt-3 flex-row items-center justify-between">
                        <StatusPill label={finalStatus} />
                      </View>

                      <Text className="mt-3 text-[13px] text-gray-700">{st.hint}</Text>

                      <View className="mt-4 bg-white rounded-[18px] border border-[#E5EEF9] p-4">
                        <Text className="text-[12px] font-bold text-gray-500">Main reason</Text>
                        <Text className="mt-2 text-[13px] text-gray-800">{oneLine(result.main_reason)}</Text>

                        <Text className="mt-4 text-[12px] font-bold text-gray-500">Main action</Text>
                        <Text className="mt-2 text-[13px] font-extrabold text-gray-900">{oneLine(result.main_action)}</Text>
                      </View>
                    </View>

                    <ScoreRing score={cappedScore} color={st.solid} />
                  </View>

                  <View className="mt-5">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[13px] font-bold text-gray-700">Status Strength</Text>
                      <Text className="text-[13px] font-extrabold" style={{ color: st.solid }}>
                        {cappedScore}%
                      </Text>
                    </View>

                    <View className="mt-3 bg-white rounded-full h-4 overflow-hidden border border-[#E5EEF9]">
                      <View
                        className="h-4 rounded-full"
                        style={{
                          width: `${Math.max(0, Math.min(90, cappedScore))}%`,
                          backgroundColor: st.solid,
                        }}
                      />
                    </View>

                    <View className="mt-2 flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Ionicons name="time" size={14} color={THEME} />
                        <Text className="ml-2 text-[12px] text-gray-600">Updated: {lastUpdatedHHMM}</Text>
                      </View>

                      <View className="flex-row items-center">
                        <Ionicons
                          name="hardware-chip"
                          size={14}
                          color={sensorQuality === "SUSPECT" ? "#EF4444" : "#18A957"}
                        />
                        <Text className="ml-2 text-[12px] text-gray-600">Sensor: {sensorQuality}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* KPI strip (✅ healthscore removed) */}
            <View className="mt-5">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5">
                <SummaryCard title="Final Status" value={finalStatus} subtitle="System decision" icon="pulse" accent={st.solid} />
                <SummaryCard title="Algae Level" value={algaeLevel} subtitle="ML prediction" icon="leaf" accent={at.solid} />
                <SummaryCard
                  title="Sensor Quality"
                  value={sensorQuality}
                  subtitle={sensorQuality === "SUSPECT" ? "Check probes" : "Stable"}
                  icon="hardware-chip"
                  accent={sensorQuality === "SUSPECT" ? "#EF4444" : "#18A957"}
                />
                <SummaryCard
                  title="Water Conf."
                  value={Math.max(waterProbs.OK ?? 0, waterProbs.WARNING ?? 0, waterProbs.CRITICAL ?? 0).toFixed(2)}
                  subtitle="ML probability"
                  icon="shield-checkmark"
                  accent={THEME}
                />
                <SummaryCard title="Last Updated" value={lastUpdatedHHMM} subtitle="HH:MM" icon="time" accent={THEME} />
              </ScrollView>
            </View>

            {/* Mini charts */}
            <View className="px-5 mt-5">
              <View className="bg-white rounded-[24px] border border-[#E5EEF9] p-5 shadow-sm">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-[16px] font-extrabold text-gray-900">Trend Overview</Text>
                    <Text className="text-[12px] font-bold text-gray-500 mt-1">Last {chartSeries.turb.length} readings</Text>
                  </View>
                  <View className="w-10 h-10 rounded-2xl items-center justify-center bg-[#EAF4FF] border border-[#E5EEF9]">
                    <Ionicons name="trending-up" size={18} color={THEME} />
                  </View>
                </View>

                <View className="mt-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-[13px] font-extrabold text-gray-900">Turbidity Trend</Text>
                    <Text className="text-[13px] font-extrabold" style={{ color: "#10B981" }}>
                      {chartSeries.turb.length ? chartSeries.turb[chartSeries.turb.length - 1].toFixed(1) : "—"} NTU
                    </Text>
                  </View>
                  <MiniLineChart values={chartSeries.turb} color="#10B981" />
                </View>

                <View className="mt-5">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-[13px] font-extrabold text-gray-900">pH Trend</Text>
                    <Text className="text-[13px] font-extrabold" style={{ color: THEME }}>
                      {chartSeries.ph.length ? chartSeries.ph[chartSeries.ph.length - 1].toFixed(2) : "—"}
                    </Text>
                  </View>
                  <MiniLineChart values={chartSeries.ph} color={THEME} />
                </View>
              </View>
            </View>

            {/* Water confidence */}
            <View className="px-5 mt-5">
              <Section title="Water Model Confidence" icon="shield-checkmark">
                <Text className="text-[12px] text-gray-600">Probabilities For Water Quality .</Text>
                <View className="mt-3 bg-[#F5FAFF] rounded-[18px] border border-[#E5EEF9] p-4">
                  <ProbBar label="OK" value={waterProbs.OK ?? 0} color="#18A957" />
                  <ProbBar label="WARNING" value={waterProbs.WARNING ?? 0} color="#F59E0B" />
                  <ProbBar label="CRITICAL" value={waterProbs.CRITICAL ?? 0} color="#EF4444" />
                </View>
              </Section>
            </View>

            {/* Live sensor snapshot */}
            <View className="px-5 mt-5">
              <Text className="text-[16px] font-extrabold text-gray-900 mb-3">Live Sensor Snapshot</Text>
              <View className="flex-row gap-3">
                <StatTile label="pH" value={latestRow ? latestRow.ph.toFixed(2) : "—"} icon="water-outline" />
                <StatTile label="Temp" value={latestRow ? latestRow.temp_c.toFixed(1) : "—"} unit="°C" icon="thermometer-outline" />
              </View>
              <View className="flex-row gap-3 mt-3">
                <StatTile label="Turbidity" value={latestRow ? latestRow.turb_ntu.toFixed(1) : "—"} unit="NTU" icon="eye-outline" />
                <StatTile label="EC" value={latestRow ? latestRow.ec.toFixed(2) : "—"} icon="flash-outline" />
              </View>
            </View>

            {/* Algae (vivid) */}
            <View className="px-5 mt-5">
              <View className="rounded-[26px] overflow-hidden border shadow-sm bg-white" style={{ borderColor: at.border }}>
                <View style={{ backgroundColor: at.glow }} className="px-5 py-5">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-4">
                      <Text className="text-[12px] font-bold text-gray-700">Algae Warning</Text>

                      <View className="mt-3 flex-row items-center self-start px-5 py-3 rounded-full" style={{ backgroundColor: at.bg, borderColor: at.border, borderWidth: 1 }}>
                        <Ionicons name="leaf" size={20} color={at.text} />
                        <Text className="ml-3 text-[18px] font-extrabold" style={{ color: at.text }}>
                          {at.name}
                        </Text>
                      </View>

                      <Text className="mt-3 text-[13px] text-gray-700">{at.headline}</Text>
                    </View>

                    <View className="items-end">
                      <Text className="text-[12px] font-bold text-gray-700">Confidence</Text>
                      <Text className="mt-1 text-[18px] font-extrabold" style={{ color: at.solid }}>
                        {Math.max(algaeProbs.LOW ?? 0, algaeProbs.MEDIUM ?? 0, algaeProbs.HIGH ?? 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-4 bg-white rounded-[18px] border border-[#E5EEF9] p-4">
                    <Text className="text-[13px] font-extrabold text-gray-900">Model confidence</Text>
                    <ProbBar label="LOW" value={algaeProbs.LOW ?? 0} color="#3B82F6" />
                    <ProbBar label="MEDIUM" value={algaeProbs.MEDIUM ?? 0} color="#F59E0B" />
                    <ProbBar label="HIGH" value={algaeProbs.HIGH ?? 0} color="#10B981" />
                  </View>

                  <View className="mt-4 bg-white rounded-[18px] border border-[#E5EEF9] p-4">
                    <Text className="text-[12px] font-bold text-gray-500">Main reason</Text>
                    <Text className="mt-2 text-[13px] text-gray-800">{oneLine(algaeMainReason)}</Text>

                    <Text className="mt-4 text-[12px] font-bold text-gray-500">Main action</Text>
                    <Text className="mt-2 text-[13px] font-extrabold text-gray-900">{oneLine(algaeMainAction)}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Details toggle */}
            <View className="px-5 mt-5 pb-10">
              <TouchableOpacity
                onPress={() => setShowDetails((v) => !v)}
                className="bg-white rounded-[22px] border border-[#E5EEF9] p-4 flex-row items-center justify-between"
                activeOpacity={0.85}
              >
                <Text className="text-[14px] font-extrabold text-gray-900">{showDetails ? "Hide details" : "See details"}</Text>
                <Ionicons name={showDetails ? "chevron-up" : "chevron-down"} size={20} color={THEME} />
              </TouchableOpacity>

              {showDetails && (
                <View className="mt-4">
                  <Section title="Water Reasons" icon="list">
                    {result.reasons?.length ? (
                      result.reasons.map((r, idx) => (
                        <Text key={idx} className="text-[13px] text-gray-800 mt-2">• {r}</Text>
                      ))
                    ) : (
                      <Text className="text-[13px] text-gray-600">No issues detected.</Text>
                    )}
                  </Section>

                  <View className="h-4" />

                  <Section title="Water Actions" icon="checkmark-done">
                    {result.actions?.length ? (
                      result.actions.map((a, idx) => (
                        <Text key={idx} className="text-[13px] text-gray-800 mt-2">• {a}</Text>
                      ))
                    ) : (
                      <Text className="text-[13px] text-gray-600">No action needed.</Text>
                    )}
                  </Section>

                  <View className="h-4" />

                  <Section title="More Algae Details" icon="leaf">
                    {(result.algae_reasons?.length ?? 0) > 0 ? (
                      result.algae_reasons.map((r, idx) => (
                        <Text key={idx} className="text-[13px] text-gray-800 mt-2">• {r}</Text>
                      ))
                    ) : (
                      <Text className="text-[13px] text-gray-600">No extra algae signals from rules (stable readings).</Text>
                    )}

                    {(result.algae_actions?.length ?? 0) > 0 && (
                      <>
                        <Text className="mt-4 text-[14px] font-extrabold text-gray-900">Actions</Text>
                        {result.algae_actions.map((a, idx) => (
                          <Text key={idx} className="text-[13px] text-gray-800 mt-2">• {a}</Text>
                        ))}
                      </>
                    )}
                  </Section>
                </View>
              )}
            </View>
          </>
        ) : (
          <View className="h-10" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}