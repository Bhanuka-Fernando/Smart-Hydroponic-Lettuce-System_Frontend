import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Polyline, Line, Circle } from "react-native-svg";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { WaterQualityStackParamList } from "../../navigation/WaterQualityNavigator";
import { getWaterHistory, type LatestResponse } from "../../api/WaterQualityApi";

type Props = NativeStackScreenProps<WaterQualityStackParamList, "WaterQualityCharts">;

const THEME = "#00368C";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function formatMaybe(n: number) {
  if (Number.isFinite(n)) return n;
  return 0;
}

function buildPoints(data: number[], w: number, h: number, pad = 16) {
  if (data.length < 2) return { points: "", min: 0, max: 0 };

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;

  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * innerW;
    const y = pad + (1 - (v - min) / span) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return { points: pts.join(" "), min, max };
}

function ChartCard({
  title,
  subtitle,
  values,
  height = 140,
}: {
  title: string;
  subtitle: string;
  values: number[];
  height?: number;
}) {
  const width = 340; // works fine; SVG scales inside card

  const { points, min, max } = useMemo(() => buildPoints(values, width, height), [values, height]);
  const last = values.length ? values[values.length - 1] : 0;

  return (
    <View className="bg-white rounded-[22px] border border-[#E5EEF9] p-5 mb-4">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-[16px] font-extrabold text-gray-900">{title}</Text>
          <Text className="text-[12px] font-bold text-gray-500 mt-1">{subtitle}</Text>
        </View>
        <View className="items-end">
          <Text className="text-[12px] font-bold text-gray-500">Latest</Text>
          <Text className="text-[16px] font-extrabold" style={{ color: THEME }}>
            {Number.isFinite(last) ? last.toFixed(2) : "—"}
          </Text>
        </View>
      </View>

      <View className="mt-4 rounded-[18px] overflow-hidden bg-[#F5FAFF] border border-[#E5EEF9]">
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* grid */}
          <Line x1="16" y1={height - 16} x2={width - 16} y2={height - 16} stroke="#D7E6FF" strokeWidth="1" />
          <Line x1="16" y1="16" x2={width - 16} y2="16" stroke="#D7E6FF" strokeWidth="1" />
          <Line x1="16" y1="16" x2="16" y2={height - 16} stroke="#D7E6FF" strokeWidth="1" />
          <Line x1={width - 16} y1="16" x2={width - 16} y2={height - 16} stroke="#D7E6FF" strokeWidth="1" />

          {/* polyline */}
          {values.length >= 2 ? (
            <>
              <Polyline points={points} fill="none" stroke={THEME} strokeWidth="3" />
              {/* last point marker */}
              {(() => {
                const pts = points.split(" ");
                const lastPt = pts[pts.length - 1]?.split(",") ?? ["0", "0"];
                const cx = parseFloat(lastPt[0]);
                const cy = parseFloat(lastPt[1]);
                return (
                  <>
                    <Circle cx={cx} cy={cy} r="5" fill="#FFFFFF" stroke={THEME} strokeWidth="3" />
                  </>
                );
              })()}
            </>
          ) : (
            <></>
          )}
        </Svg>
      </View>

      <View className="mt-3 flex-row justify-between">
        <Text className="text-[12px] text-gray-500">Min: {Number.isFinite(min) ? min.toFixed(2) : "—"}</Text>
        <Text className="text-[12px] text-gray-500">Max: {Number.isFinite(max) ? max.toFixed(2) : "—"}</Text>
      </View>
    </View>
  );
}

export default function WaterQualityChartsScreen({ navigation, route }: Props) {
  const { tank_id } = route.params;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<LatestResponse[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getWaterHistory(tank_id, 120); // show last 120 points
        setRows(res.readings);
      } catch (e: any) {
        setErr(e?.response?.data?.detail ?? e?.message ?? "Failed to load charts.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const ph = useMemo(() => rows.map(r => formatMaybe(r.ph)), [rows]);
  const temp = useMemo(() => rows.map(r => formatMaybe(r.temp_c)), [rows]);
  const turb = useMemo(() => rows.map(r => formatMaybe(r.turb_ntu)), [rows]);
  const ec = useMemo(() => rows.map(r => formatMaybe(r.ec)), [rows]);

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAFF]">
      <View className="px-5 pt-2 pb-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-11 h-11 rounded-2xl bg-white items-center justify-center border border-[#E6EEF9]"
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <View className="items-center">
            <Text className="text-[18px] font-extrabold text-gray-900">Water Charts</Text>
            <Text className="text-[12px] font-bold text-gray-500 mt-1">Tank: {tank_id}</Text>
          </View>

          <View className="w-11 h-11" />
        </View>
      </View>

      <ScrollView className="flex-1 px-5">
        {loading ? (
          <View className="mt-10 items-center">
            <ActivityIndicator size="large" color={THEME} />
            <Text className="mt-3 text-gray-600 text-[13px]">Loading…</Text>
          </View>
        ) : err ? (
          <View className="bg-white rounded-[22px] p-5 border border-[#FFE4E6]">
            <Text className="text-[15px] font-extrabold text-red-700">{err}</Text>
          </View>
        ) : rows.length < 2 ? (
          <View className="bg-white rounded-[22px] p-5 border border-[#E5EEF9]">
            <Text className="text-[15px] font-extrabold text-gray-900">Not enough data</Text>
            <Text className="text-[13px] text-gray-600 mt-2">
              Add more readings via ESP32 or Postman ingest, then refresh.
            </Text>
          </View>
        ) : (
          <>
            <ChartCard title="pH Trend" subtitle="Hydroponic target usually ~5.5–6.5" values={ph} />
            <ChartCard title="Temperature Trend" subtitle="°C (watch >24°C for algae risk)" values={temp} />
            <ChartCard title="Turbidity Trend" subtitle="NTU (high/rising indicates algae/contamination)" values={turb} />
            <ChartCard title="EC Trend" subtitle="Nutrient concentration indicator" values={ec} />
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}