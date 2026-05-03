import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { WaterQualityStackParamList } from "../../navigation/WaterQualityNavigator";
import {
  analyzeBatch,
  getWaterHistory,
  type AnalyzeResponse,
  type WaterReading,
} from "../../api/WaterQualityApi";

type Props = NativeStackScreenProps<WaterQualityStackParamList, "AlgaeStatus">;

const THEME = "#00368C";

function algaeTheme(level: string) {
  if (level === "HIGH") return { bg: "#ECFDF3", border: "#A7F3D0", text: "#047857", solid: "#10B981", hint: "High algae risk detected." };
  if (level === "MEDIUM") return { bg: "#FFF3D6", border: "#F9C74F", text: "#7A3E00", solid: "#D97706", hint: "Moderate algae risk detected." };
  return { bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8", solid: "#3B82F6", hint: "Algae risk is low." };
}

function defaults(level: string) {
  if (level === "HIGH") return {
    reason: "High algae risk detected from water clarity and recent patterns.",
    action: "Reduce light on the water surface, clean tank walls or filters, increase circulation, and recheck within 15 minutes.",
  };
  if (level === "MEDIUM") return {
    reason: "Moderate algae risk. Early prevention is recommended.",
    action: "Reduce light exposure, inspect filtration and circulation, and recheck within 30 minutes.",
  };
  return {
    reason: "Low algae risk. Water clarity appears stable.",
    action: "Continue monitoring and keep the water surface protected from direct light.",
  };
}

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(((value ?? 0) * 100 + Number.EPSILON) * 10) / 10;
  return (
    <View className="mt-3">
      <View className="flex-row justify-between">
        <Text className="text-[12px] font-bold text-gray-700">{label}</Text>
        <Text className="text-[12px] font-extrabold text-gray-900">{pct}%</Text>
      </View>
      <View className="mt-2 h-3 rounded-full bg-[#EAF4FF] overflow-hidden border border-[#E5EEF9]">
        <View className="h-3 rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color }} />
      </View>
    </View>
  );
}

function ScreenDecor() {
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      <View
        className="absolute top-[-90px] right-[-80px] w-[230px] h-[230px] rounded-full"
        style={{ backgroundColor: "#BEE3FF", opacity: 0.45 }}
      />
      <View
        className="absolute bottom-[-110px] left-[-80px] w-[240px] h-[240px] rounded-full"
        style={{ backgroundColor: "#D1FAE5", opacity: 0.32 }}
      />
    </View>
  );
}

function Section({ title, icon, children }: { title: string; icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) {
  return (
    <View className="bg-white rounded-[24px] border border-[#E5EEF9] p-5 shadow-sm mb-4">
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

function ListItem({ text, icon, color }: { text: string; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <View className="mt-2 flex-row items-start bg-[#F8FBFF] border border-[#E5EEF9] rounded-2xl px-3 py-3">
      <Ionicons name={icon} size={18} color={color} />
      <Text className="flex-1 ml-2 text-[13px] leading-5 font-semibold text-gray-800">{text}</Text>
    </View>
  );
}

export default function AlgaeStatusScreen({ navigation, route }: Props) {
  const { tank_id } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    try {
      const hist = await getWaterHistory(tank_id, 200);
      const readings: WaterReading[] = hist.readings.map((r) => ({
        timestamp: r.timestamp,
        ph: r.ph,
        temp_c: r.temp_c,
        turb_ntu: r.turb_ntu,
        ec: r.ec,
      }));
      if (readings.length < 10) {
        setResult(null);
        setErr("Not enough readings. Ingest more data and refresh.");
        return;
      }
      setResult(await analyzeBatch(tank_id, readings));
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? e?.message ?? "Failed to load algae details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [tank_id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  const level = result?.ml_algae ?? "LOW";
  const theme = algaeTheme(level);
  const fallback = defaults(level);
  const mainReason = result?.algae_reasons?.[0] ?? fallback.reason;
  const mainAction = result?.algae_actions?.[0] ?? fallback.action;

  return (
    <SafeAreaView className="flex-1 bg-[#F3F8FF]">
      <ScreenDecor />
      <ScrollView className="flex-1 px-5" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View className="pt-2 pb-4 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-11 h-11 rounded-2xl bg-white items-center justify-center border border-[#E6EEF9]">
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-[19px] font-extrabold text-gray-900">Algae Warning</Text>
            <Text className="text-[12px] font-bold text-gray-500 mt-1">{tank_id}</Text>
          </View>
          <View className="w-11 h-11" />
        </View>

        {loading ? (
          <View className="mt-8 items-center"><ActivityIndicator size="large" color={THEME} /></View>
        ) : err ? (
          <Section title="Cannot load details" icon="alert-circle">
            <Text className="text-[13px] text-red-700 font-semibold">{err}</Text>
          </Section>
        ) : result ? (
          <>
            <View className="rounded-[26px] border p-5 mb-4 shadow-sm" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
              <Text className="text-[12px] font-extrabold uppercase" style={{ color: theme.text }}>Algae level</Text>
              <Text className="mt-2 text-[30px] font-extrabold" style={{ color: theme.text }}>{level}</Text>
              <Text className="mt-1 text-[13px] font-semibold text-gray-700">{theme.hint}</Text>
            </View>

            <Section title="Algae guidance" icon="leaf">
              <Text className="text-[12px] font-bold text-gray-500">Main reason</Text>
              <Text className="mt-1 text-[14px] leading-5 font-extrabold text-gray-900">{mainReason}</Text>
              <Text className="mt-4 text-[12px] font-bold text-gray-500">Main action</Text>
              <Text className="mt-1 text-[14px] leading-5 font-extrabold text-gray-900">{mainAction}</Text>
            </Section>

            <Section title="Algae confidence" icon="shield-checkmark">
              <ProbBar label="LOW" value={result.ml_algae_probs.LOW ?? 0} color="#3B82F6" />
              <ProbBar label="MEDIUM" value={result.ml_algae_probs.MEDIUM ?? 0} color="#F59E0B" />
              <ProbBar label="HIGH" value={result.ml_algae_probs.HIGH ?? 0} color="#10B981" />
            </Section>

            <Section title="Reasons" icon="list">
              {result.algae_reasons?.length ? result.algae_reasons.map((r, idx) => (
                <ListItem key={idx} text={r} icon="leaf" color={theme.solid} />
              )) : <Text className="text-[13px] text-gray-600">No extra algae signals from rules.</Text>}
            </Section>

            <Section title="Actions" icon="construct">
              {result.algae_actions?.length ? result.algae_actions.map((a, idx) => (
                <ListItem key={idx} text={a} icon="checkmark-done-circle" color={theme.solid} />
              )) : <Text className="text-[13px] text-gray-600">No algae action needed.</Text>}
            </Section>
          </>
        ) : null}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
