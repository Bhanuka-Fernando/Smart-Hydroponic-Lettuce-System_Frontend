import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, {
  Polyline,
  Line,
  Circle,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { WaterQualityStackParamList } from "../../navigation/WaterQualityNavigator";

import {
  analyzeBatch,
  deleteAllHistory,
  deleteTankHistory,
  getWaterHistory,
  type AnalyzeResponse,
  type WaterReading,
} from "../../api/WaterQualityApi";
import { logWaterActivity } from "../../utils/activityLog";

type Props = NativeStackScreenProps<
  WaterQualityStackParamList,
  "WaterQualityDashboard"
>;

type Status = "OK" | "WARNING" | "CRITICAL" | "—";
type IonIconName = keyof typeof Ionicons.glyphMap;

const THEME = "#00368C";
const INK = "#0F172A";
const MUTED = "#64748B";
const DEFAULT_TANK = "TANK_01";
const TANK_OPTIONS = ["TANK_01", "TANK_02", "TANK_03", "TANK_08"];

function statusTheme(status: Status) {
  if (status === "OK") {
    return {
      name: "OK",
      icon: "checkmark-circle" as IonIconName,
      bg: "#EAF9F0",
      border: "#BBF7D0",
      text: "#047857",
      solid: "#16A34A",
      light: "#F0FDF4",
      hint: "Water condition is stable.",
    };
  }

  if (status === "WARNING") {
    return {
      name: "WARNING",
      icon: "warning" as IonIconName,
      bg: "#FFF3D6",
      border: "#F9C74F",
      text: "#7A3E00",
      solid: "#D97706",
      light: "#FFF8E8",
      hint: "Water condition needs attention.",
    };
  }

  if (status === "CRITICAL") {
    return {
      name: "CRITICAL",
      icon: "alert-circle" as IonIconName,
      bg: "#FFECEE",
      border: "#FECACA",
      text: "#B42318",
      solid: "#EF4444",
      light: "#FEF2F2",
      hint: "Immediate action is required.",
    };
  }

  return {
    name: "—",
    icon: "help-circle" as IonIconName,
    bg: "#F3F4F6",
    border: "#E5E7EB",
    text: "#374151",
    solid: THEME,
    light: "#F8FAFC",
    hint: "No result available.",
  };
}

function algaeTheme(level: string) {
  if (level === "HIGH") {
    return {
      name: "HIGH",
      icon: "leaf" as IonIconName,
      bg: "#ECFDF3",
      border: "#A7F3D0",
      text: "#047857",
      solid: "#10B981",
      light: "#F0FDF4",
      hint: "High algae risk detected.",
    };
  }

  if (level === "MEDIUM") {
    return {
      name: "MEDIUM",
      icon: "leaf" as IonIconName,
      bg: "#FFF3D6",
      border: "#F9C74F",
      text: "#7A3E00",
      solid: "#D97706",
      light: "#FFF8E8",
      hint: "Moderate algae risk detected.",
    };
  }

  return {
    name: "LOW",
    icon: "leaf" as IonIconName,
    bg: "#EFF6FF",
    border: "#BFDBFE",
    text: "#1D4ED8",
    solid: "#3B82F6",
    light: "#EFF6FF",
    hint: "Algae risk is low.",
  };
}

function algaeDefaults(level: string) {
  if (level === "HIGH") {
    return {
      reason: "High algae risk detected from water clarity and recent patterns.",
      action:
        "Reduce light on the water surface, clean tank walls or filters, increase circulation, and recheck within 15 minutes.",
    };
  }

  if (level === "MEDIUM") {
    return {
      reason: "Moderate algae risk. Early prevention is recommended.",
      action:
        "Reduce light exposure, inspect filtration and circulation, and recheck within 30 minutes.",
    };
  }

  return {
    reason: "Low algae risk. Water clarity appears stable.",
    action:
      "Continue monitoring and keep the water surface protected from direct light.",
  };
}

function ScreenDecor() {
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      <View
        className="absolute top-[-80px] right-[-70px] w-[220px] h-[220px] rounded-full"
        style={{ backgroundColor: "#BEE3FF", opacity: 0.45 }}
      />
      <View
        className="absolute bottom-[-100px] left-[-80px] w-[230px] h-[230px] rounded-full"
        style={{ backgroundColor: "#D1FAE5", opacity: 0.35 }}
      />
    </View>
  );
}

function LoadingState() {
  return (
    <View className="mt-5 bg-white rounded-[26px] border border-[#E5EEF9] p-6 items-center shadow-sm">
      <View className="w-16 h-16 rounded-full bg-[#EAF4FF] items-center justify-center border border-[#D7E6FF]">
        <ActivityIndicator size="large" color={THEME} />
      </View>
      <Text className="mt-4 text-[16px] font-extrabold" style={{ color: INK }}>
        Analyzing water status
      </Text>
      <Text className="mt-1 text-[12px] font-semibold text-center" style={{ color: MUTED }}>
        Checking water quality, algae risk, and recommended actions.
      </Text>
    </View>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <View className="mt-5 bg-white rounded-[24px] p-5 border border-[#FECACA] shadow-sm">
      <View className="flex-row items-start">
        <View className="w-12 h-12 rounded-2xl bg-[#FEF2F2] items-center justify-center border border-[#FECACA]">
          <Ionicons name="cloud-offline-outline" size={23} color="#DC2626" />
        </View>

        <View className="flex-1 ml-3">
          <Text className="text-[17px] font-extrabold text-red-700">
            Cannot load water status
          </Text>
          <Text className="text-[13px] leading-5 text-gray-700 mt-2">
            {message}
          </Text>

          <View className="mt-3 bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl px-3 py-2">
            <Text className="text-[12px] leading-4 font-semibold text-[#9A3412]">
              Add at least 10 readings for this tank, then pull down to refresh.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function StatusBadge({
  label,
  icon,
  bg,
  border,
  text,
}: {
  label: string;
  icon: IonIconName;
  bg: string;
  border: string;
  text: string;
}) {
  return (
    <View
      className="self-start flex-row items-center px-3 py-1.5 rounded-full"
      style={{ backgroundColor: bg, borderColor: border, borderWidth: 1 }}
    >
      <Ionicons name={icon} size={16} color={text} />
      <Text className="ml-1.5 text-[12px] font-extrabold" style={{ color: text }}>
        {label}
      </Text>
    </View>
  );
}

function StatusOverviewCard({
  title,
  value,
  subtitle,
  metric,
  metricLabel,
  icon,
  theme,
}: {
  title: string;
  value: string;
  subtitle: string;
  metric: string;
  metricLabel: string;
  icon: IonIconName;
  theme: {
    bg: string;
    border: string;
    text: string;
    solid: string;
    light: string;
  };
}) {
  return (
    <View
      className="flex-1 rounded-[24px] border p-4 shadow-sm overflow-hidden"
      style={{ backgroundColor: "#FFFFFF", borderColor: theme.border }}
    >
      <View
        className="absolute right-[-26px] top-[-26px] w-24 h-24 rounded-full"
        style={{ backgroundColor: theme.solid, opacity: 0.1 }}
      />

      <View className="flex-row items-center justify-between">
        <View
          className="w-11 h-11 rounded-2xl items-center justify-center"
          style={{ backgroundColor: theme.bg }}
        >
          <Ionicons name={icon} size={22} color={theme.solid} />
        </View>

        <StatusBadge
          label={value}
          icon={icon}
          bg={theme.bg}
          border={theme.border}
          text={theme.text}
        />
      </View>

      <Text className="mt-4 text-[12px] font-bold text-gray-500">
        {title}
      </Text>

      <Text className="mt-1 text-[24px] font-extrabold" style={{ color: theme.text }}>
        {value}
      </Text>

      <Text className="mt-1 text-[12px] leading-4 font-semibold text-gray-600">
        {subtitle}
      </Text>

      <View className="mt-4 rounded-2xl px-3 py-2" style={{ backgroundColor: theme.light }}>
        <Text className="text-[11px] font-bold text-gray-500">
          {metricLabel}
        </Text>
        <Text className="mt-0.5 text-[16px] font-extrabold" style={{ color: theme.solid }}>
          {metric}
        </Text>
      </View>
    </View>
  );
}

function HighlightCard({
  title,
  value,
  icon,
  theme,
  strong = false,
}: {
  title: string;
  value?: string;
  icon: IonIconName;
  theme: {
    bg: string;
    border: string;
    text: string;
    solid: string;
    light: string;
  };
  strong?: boolean;
}) {
  return (
    <View
      className="rounded-[22px] border p-4 shadow-sm"
      style={{
        backgroundColor: strong ? theme.bg : "#FFFFFF",
        borderColor: theme.border,
      }}
    >
      <View className="flex-row items-start">
        <View
          className="w-11 h-11 rounded-2xl items-center justify-center"
          style={{ backgroundColor: strong ? "#FFFFFF" : theme.bg }}
        >
          <Ionicons name={icon} size={22} color={theme.solid} />
        </View>

        <View className="flex-1 ml-3">
          <Text className="text-[12px] font-extrabold uppercase" style={{ color: theme.text }}>
            {title}
          </Text>
          <Text
            className="mt-1 text-[15px] leading-6 font-extrabold"
            style={{ color: strong ? theme.text : INK }}
          >
            {value || "No data available."}
          </Text>
        </View>
      </View>
    </View>
  );
}

function DetailLinkCard({
  title,
  subtitle,
  icon,
  theme,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: IonIconName;
  theme: {
    bg: string;
    light?: string;
    border: string;
    text: string;
    solid: string;
  };
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-[20px] border px-4 py-4 shadow-sm flex-row items-center justify-between"
      style={{ borderColor: theme.border }}
      activeOpacity={0.85}
    >
      <View className="flex-row items-center flex-1 pr-3">
        <View
          className="w-11 h-11 rounded-2xl items-center justify-center"
          style={{ backgroundColor: theme.bg }}
        >
          <Ionicons name={icon} size={22} color={theme.solid} />
        </View>

        <View className="flex-1 ml-3">
          <Text className="text-[14px] font-extrabold" style={{ color: INK }}>
            {title}
          </Text>
          <Text className="mt-0.5 text-[11px] leading-4 font-semibold" style={{ color: MUTED }}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View
        className="w-9 h-9 rounded-2xl items-center justify-center"
        style={{ backgroundColor: theme.light ?? theme.bg }}
      >
        <Ionicons name="chevron-forward" size={20} color={theme.solid} />
      </View>
    </TouchableOpacity>
  );
}

function ActionReasonHub({
  waterReason,
  waterAction,
  algaeReason,
  algaeAction,
  waterTheme,
  algaeThemeData,
}: {
  waterReason?: string;
  waterAction?: string;
  algaeReason?: string;
  algaeAction?: string;
  waterTheme: ReturnType<typeof statusTheme>;
  algaeThemeData: ReturnType<typeof algaeTheme>;
}) {
  return (
    <View className="mt-5">
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-[18px] font-extrabold" style={{ color: INK }}>
            What happened & what to do
          </Text>
          <Text className="text-[12px] font-semibold" style={{ color: MUTED }}>
            Main reason, action, and algae details are highlighted here.
          </Text>
        </View>

        <View className="w-11 h-11 rounded-2xl bg-white border border-[#E5EEF9] items-center justify-center">
          <Ionicons name="sparkles" size={20} color={THEME} />
        </View>
      </View>

      <HighlightCard
        title="Water reason"
        value={waterReason}
        icon="information-circle"
        theme={waterTheme}
      />

      <View className="h-3" />

      <HighlightCard
        title="Recommended action"
        value={waterAction}
        icon="checkmark-done-circle"
        theme={waterTheme}
        strong
      />

      <View className="h-3" />

      <HighlightCard
        title="Algae reason"
        value={algaeReason}
        icon="leaf"
        theme={algaeThemeData}
      />

      <View className="h-3" />

      <HighlightCard
        title="Algae action"
        value={algaeAction}
        icon="construct"
        theme={algaeThemeData}
        strong
      />
    </View>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: IonIconName;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-white rounded-[24px] border border-[#E5EEF9] p-5 shadow-sm">
      <View className="flex-row items-center justify-between">
        <Text className="text-[16px] font-extrabold text-gray-900">
          {title}
        </Text>

        <View className="w-10 h-10 rounded-2xl items-center justify-center bg-[#EAF4FF] border border-[#E5EEF9]">
          <Ionicons name={icon} size={18} color={THEME} />
        </View>
      </View>

      <View className="mt-4">{children}</View>
    </View>
  );
}

function ListItem({
  text,
  icon,
  color,
}: {
  text: string;
  icon: IonIconName;
  color: string;
}) {
  return (
    <View className="mt-2 flex-row items-start bg-[#F8FBFF] border border-[#E5EEF9] rounded-2xl px-3 py-3">
      <Ionicons name={icon} size={18} color={color} />
      <Text className="flex-1 ml-2 text-[13px] leading-5 font-semibold text-gray-800">
        {text}
      </Text>
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
  icon: IonIconName;
}) {
  return (
    <View className="bg-white rounded-[18px] border border-[#E5EEF9] px-4 py-3 flex-1 shadow-sm">
      <View className="flex-row items-center justify-between">
        <Text className="text-[12px] font-bold text-gray-500">
          {label}
        </Text>
        <Ionicons name={icon} size={16} color={THEME} />
      </View>

      <View className="mt-2 flex-row items-end">
        <Text className="text-[18px] font-extrabold text-gray-900">
          {value}
        </Text>
        {unit ? (
          <Text className="ml-1 text-[12px] font-bold text-gray-500">
            {unit}
          </Text>
        ) : null}
      </View>
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
    <View className="mt-3">
      <View className="flex-row justify-between">
        <Text className="text-[12px] font-bold text-gray-700">
          {label}
        </Text>
        <Text className="text-[12px] font-extrabold text-gray-900">
          {pct}%
        </Text>
      </View>

      <View className="mt-2 h-3 rounded-full bg-[#EAF4FF] overflow-hidden border border-[#E5EEF9]">
        <View
          className="h-3 rounded-full"
          style={{
            width: `${Math.max(0, Math.min(100, pct))}%`,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

function MiniLineChart({
  values,
  height = 96,
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
      <View className="h-[96px] rounded-[20px] bg-[#F8FBFF] border border-[#E5EEF9] items-center justify-center">
        <Ionicons name="analytics-outline" size={22} color="#94A3B8" />
        <Text className="mt-1 text-[12px] font-bold text-gray-500">
          Not enough trend data
        </Text>
      </View>
    );
  }

  const clean = values.map((v) => (Number.isFinite(v) ? v : 0));
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const span = max - min || 1;

  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const coords = clean.map((v, i) => {
    const x = pad + (i / (clean.length - 1)) * innerW;
    const y = pad + (1 - (v - min) / span) * innerH;
    return { x, y };
  });

  const points = coords.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const linePath = coords
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(
    1
  )} ${height - pad} L${pad} ${height - pad} Z`;

  const gradientId = `chart-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  const last = clean[clean.length - 1];
  const lastX = pad + innerW;
  const lastY = pad + (1 - (last - min) / span) * innerH;

  return (
    <View className="rounded-[20px] bg-[#F8FBFF] border border-[#E5EEF9] overflow-hidden">
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.24" />
            <Stop offset="1" stopColor={color} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        <Line x1={pad} y1={pad} x2={width - pad} y2={pad} stroke="#D7E6FF" strokeWidth="1" />
        <Line x1={pad} y1={height / 2} x2={width - pad} y2={height / 2} stroke="#E8F1FF" strokeWidth="1" />
        <Line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#D7E6FF" strokeWidth="1" />

        <Path d={areaPath} fill={`url(#${gradientId})`} />
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={lastX} cy={lastY} r="6" fill="#FFFFFF" stroke={color} strokeWidth="3" />
      </Svg>
    </View>
  );
}

export default function WaterQualityDashboardScreen({ navigation }: Props) {
  const [tankId, setTankId] = useState(DEFAULT_TANK);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [resetting, setResetting] = useState(false);
  const [showTankDropdown, setShowTankDropdown] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [latestRow, setLatestRow] = useState<WaterReading | null>(null);

  const [chartSeries, setChartSeries] = useState<{ ph: number[]; turb: number[] }>({
    ph: [],
    turb: [],
  });

  const load = async () => {
    setLoading(true);
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
        setErr("Not enough readings. Ingest more data and refresh.");
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

      try {
        await logWaterActivity({
          tankId,
          finalStatus: res?.final_status,
          healthScore: res?.health_score,
          sourceTimestamp: String(
            res?.timestamp ?? readings[readings.length - 1]?.timestamp ?? ""
          ),
        });
      } catch (error) {
        console.error("Failed to log water activity:", error);
      }
    } catch (e: any) {
      setErr(
        e?.response?.data?.detail ??
          (e?.response
            ? e?.message
            : "Water service offline. Check backend connection and refresh.")
      );

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
  }, [tankId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  const resetTank = () => {
    Alert.alert(
      "Clear tank data?",
      `Delete all saved water readings for ${tankId}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Tank",
          style: "destructive",
          onPress: async () => {
            try {
              setResetting(true);
              await deleteTankHistory(tankId);
              await load();
            } catch (e: any) {
              Alert.alert(
                "Reset failed",
                e?.response?.data?.detail ?? e?.message ?? "Could not clear tank data."
              );
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };

  const resetAll = () => {
    Alert.alert(
      "Clear ALL water data?",
      "This deletes every tank history record and cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              setResetting(true);
              await deleteAllHistory();
              await load();
            } catch (e: any) {
              Alert.alert(
                "Reset failed",
                e?.response?.data?.detail ?? e?.message ?? "Could not clear all data."
              );
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };

  const openResetActions = () => {
    Alert.alert("Clear Tank", "Choose which history records to clear.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear Current Tank", style: "destructive", onPress: resetTank },
      { text: "Clear All Data", style: "destructive", onPress: resetAll },
    ]);
  };

  const changeTank = (nextTankId: string) => {
    if (nextTankId === tankId) return;

    setShowDetails(false);
    setResult(null);
    setLatestRow(null);
    setChartSeries({ ph: [], turb: [] });
    setShowTankDropdown(false);
    setTankId(nextTankId);
  };

  const finalStatus: Status = (result?.final_status as Status) ?? "—";
  const waterTheme = useMemo(() => statusTheme(finalStatus), [finalStatus]);

  const algaeLevel = result?.ml_algae ?? "LOW";
  const algaeThemeData = useMemo(() => algaeTheme(algaeLevel), [algaeLevel]);

  const waterProbs = result?.ml_probs ?? {};
  const algaeProbs = result?.ml_algae_probs ?? {};

  const algaeDefaultText = algaeDefaults(algaeLevel);
  const algaeMainReason = result?.algae_reasons?.[0] ?? algaeDefaultText.reason;
  const algaeMainAction = result?.algae_actions?.[0] ?? algaeDefaultText.action;

  const healthScore = result?.health_score ?? 0;
  const cappedScore = Math.max(0, Math.min(100, healthScore));
  const sensorQuality = result?.sensor_quality ?? "OK";
  const ruleStatus = result?.rule_status ?? "—";
  const turbDelta = result?.meta?.turb_delta_30min;
  const severityScore = result?.meta?.final_severity_score;

  const algaeConfidence = Math.max(
    algaeProbs.LOW ?? 0,
    algaeProbs.MEDIUM ?? 0,
    algaeProbs.HIGH ?? 0
  );

  const waterConfidence = Math.max(
    waterProbs.OK ?? 0,
    waterProbs.WARNING ?? 0,
    waterProbs.CRITICAL ?? 0
  );

  const lastUpdated = result?.timestamp ? String(result.timestamp) : "—";
  const lastUpdatedHHMM =
    lastUpdated !== "—" && lastUpdated.length >= 16 ? lastUpdated.slice(11, 16) : "—";

  return (
    <SafeAreaView className="flex-1 bg-[#F3F8FF]">
      <ScreenDecor />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-5 pt-2">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-11 h-11 rounded-2xl bg-white items-center justify-center border border-[#E6EEF9] shadow-sm"
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-back" size={22} color="#111827" />
            </TouchableOpacity>

            <View className="items-center flex-1 px-3">
              <Text className="text-[19px] font-extrabold" style={{ color: INK }}>
                Water Quality
              </Text>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("WaterQualityCharts", { tank_id: tankId })
                }
                className="w-11 h-11 rounded-2xl items-center justify-center border border-[#E6EEF9] bg-white shadow-sm"
                activeOpacity={0.85}
              >
                <Ionicons name="stats-chart" size={20} color={THEME} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("WaterQualityHistory", { tank_id: tankId })
                }
                className="w-11 h-11 rounded-2xl items-center justify-center border border-[#E6EEF9] bg-white shadow-sm"
                activeOpacity={0.85}
              >
                <Ionicons name="time-outline" size={20} color={THEME} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={openResetActions}
                disabled={resetting}
                className="w-11 h-11 rounded-2xl items-center justify-center border border-[#E6EEF9] bg-white shadow-sm"
                activeOpacity={0.85}
                style={{ opacity: resetting ? 0.5 : 1 }}
              >
                {resetting ? (
                  <ActivityIndicator size="small" color={THEME} />
                ) : (
                  <Ionicons name="ellipsis-horizontal" size={22} color={THEME} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View className="mt-5">
            <TouchableOpacity
              onPress={() => setShowTankDropdown((v) => !v)}
              className="bg-white rounded-[20px] border border-[#D7E6FF] px-4 py-3 flex-row items-center justify-between shadow-sm"
              activeOpacity={0.85}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl items-center justify-center bg-[#EAF4FF] mr-3">
                  <Ionicons name="water-outline" size={19} color={THEME} />
                </View>

                <View>
                  <Text className="text-[11px] font-extrabold text-gray-500 uppercase">
                    Selected tank
                  </Text>
                  <Text className="text-[16px] font-extrabold" style={{ color: THEME }}>
                    {tankId}
                  </Text>
                </View>
              </View>

              <Ionicons
                name={showTankDropdown ? "chevron-up" : "chevron-down"}
                size={22}
                color={THEME}
              />
            </TouchableOpacity>

            {showTankDropdown ? (
              <View className="mt-2 bg-white rounded-[18px] border border-[#D7E6FF] p-2 shadow-sm">
                {TANK_OPTIONS.map((id) => {
                  const active = id === tankId;

                  return (
                    <TouchableOpacity
                      key={id}
                      onPress={() => changeTank(id)}
                      className="rounded-[14px] px-4 py-3 flex-row items-center justify-between"
                      style={{ backgroundColor: active ? "#EAF4FF" : "#FFFFFF" }}
                      activeOpacity={0.85}
                    >
                      <View className="flex-row items-center">
                        <Ionicons
                          name={active ? "radio-button-on" : "radio-button-off"}
                          size={18}
                          color={active ? THEME : "#94A3B8"}
                        />

                        <Text
                          className="ml-3 text-[14px] font-extrabold"
                          style={{ color: active ? THEME : "#334155" }}
                        >
                          {id}
                        </Text>
                      </View>

                      {active ? (
                        <Text className="text-[11px] font-bold text-gray-500">
                          Active
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </View>

          {loading ? <LoadingState /> : null}
          {!loading && err ? <ErrorState message={err} /> : null}

          {!loading && !err && result ? (
            <>
              <View className="mt-5">
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="text-[20px] font-extrabold" style={{ color: INK }}>
                      Current tank condition
                    </Text>
                    <Text className="text-[12px] font-semibold" style={{ color: MUTED }}>
                      Water and algae status are shown together.
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-[11px] font-bold text-gray-500">
                      Updated
                    </Text>
                    <Text className="text-[16px] font-extrabold" style={{ color: THEME }}>
                      {lastUpdatedHHMM}
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <StatusOverviewCard
                    title="Water Status"
                    value={finalStatus}
                    subtitle={waterTheme.hint}
                    metric={`${cappedScore}/100`}
                    metricLabel="Health score"
                    icon="water"
                    theme={waterTheme}
                  />

                  <StatusOverviewCard
                    title="Algae Status"
                    value={algaeLevel}
                    subtitle={algaeThemeData.hint}
                    metric={`${Math.round(algaeConfidence * 100)}%`}
                    metricLabel="Confidence"
                    icon="leaf"
                    theme={algaeThemeData}
                  />
                </View>
              </View>

              <View className="mt-5">
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="text-[18px] font-extrabold" style={{ color: INK }}>
                      Main guidance
                    </Text>
                    <Text className="text-[12px] font-semibold" style={{ color: MUTED }}>
                      Key reasons and actions for this tank.
                    </Text>
                  </View>
                </View>

                <HighlightCard
                  title="Main water reason"
                  value={result.main_reason}
                  icon="information-circle"
                  theme={waterTheme}
                />

                <View className="h-3" />

                <HighlightCard
                  title="Recommended water action"
                  value={result.main_action}
                  icon="checkmark-done-circle"
                  theme={waterTheme}
                  strong
                />

                <View className="h-3" />

                <HighlightCard
                  title="Main algae reason"
                  value={algaeMainReason}
                  icon="leaf"
                  theme={algaeThemeData}
                />
              </View>

              <View className="mt-5 bg-white rounded-[24px] border border-[#E5EEF9] p-5 shadow-sm">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-[16px] font-extrabold text-gray-900">
                      Trend overview
                    </Text>
                    <Text className="text-[12px] font-bold text-gray-500 mt-1">
                      Last {chartSeries.turb.length} readings
                    </Text>
                  </View>

                  <View className="w-10 h-10 rounded-2xl items-center justify-center bg-[#EAF4FF] border border-[#E5EEF9]">
                    <Ionicons name="trending-up" size={18} color={THEME} />
                  </View>
                </View>

                <View className="mt-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-[13px] font-extrabold text-gray-900">
                      Turbidity
                    </Text>
                    <Text className="text-[13px] font-extrabold" style={{ color: "#10B981" }}>
                      {chartSeries.turb.length
                        ? chartSeries.turb[chartSeries.turb.length - 1].toFixed(1)
                        : "—"}{" "}
                      NTU
                    </Text>
                  </View>

                  <MiniLineChart values={chartSeries.turb} color="#10B981" />
                </View>

                <View className="mt-5">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-[13px] font-extrabold text-gray-900">
                      pH
                    </Text>
                    <Text className="text-[13px] font-extrabold" style={{ color: THEME }}>
                      {chartSeries.ph.length
                        ? chartSeries.ph[chartSeries.ph.length - 1].toFixed(2)
                        : "—"}
                    </Text>
                  </View>

                  <MiniLineChart values={chartSeries.ph} color={THEME} />
                </View>
              </View>

              <View className="mt-5">
                <Text className="text-[14px] font-extrabold text-gray-900 mb-3">
                  Open full details
                </Text>

                <View>
                  <DetailLinkCard
                    title="Water status details"
                    subtitle="Confidence, all reasons, and actions"
                    icon="water"
                    theme={waterTheme}
                    onPress={() => navigation.navigate("WaterStatus", { tank_id: tankId })}
                  />

                  <View className="h-3" />

                  <DetailLinkCard
                    title="Algae warning details"
                    subtitle="Risk confidence, causes, and prevention"
                    icon="leaf"
                    theme={algaeThemeData}
                    onPress={() => navigation.navigate("AlgaeStatus", { tank_id: tankId })}
                  />
                </View>
              </View>

              <View className="mt-5">
                <Text className="text-[16px] font-extrabold text-gray-900 mb-3">
                  Quick sensor snapshot
                </Text>

                <View className="flex-row gap-3">
                  <StatTile
                    label="pH"
                    value={latestRow ? latestRow.ph.toFixed(2) : "—"}
                    icon="water-outline"
                  />
                  <StatTile
                    label="Temp"
                    value={latestRow ? latestRow.temp_c.toFixed(1) : "—"}
                    unit="°C"
                    icon="thermometer-outline"
                  />
                </View>

                <View className="flex-row gap-3 mt-3">
                  <StatTile
                    label="Turbidity"
                    value={latestRow ? latestRow.turb_ntu.toFixed(1) : "—"}
                    unit="NTU"
                    icon="eye-outline"
                  />
                  <StatTile
                    label="EC"
                    value={latestRow ? latestRow.ec.toFixed(2) : "—"}
                    icon="flash-outline"
                  />
                </View>
              </View>

              <View className="h-10" />
            </>
          ) : (
            <View className="h-10" />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
