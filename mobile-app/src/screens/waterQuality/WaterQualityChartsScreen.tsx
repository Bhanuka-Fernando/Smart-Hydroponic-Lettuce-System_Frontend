import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  ActivityIndicator,
  Easing,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Polyline, Line, Circle } from "react-native-svg";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { WaterQualityStackParamList } from "../../navigation/WaterQualityNavigator";
import { getWaterHistory, type LatestResponse } from "../../api/WaterQualityApi";

type Props = NativeStackScreenProps<WaterQualityStackParamList, "WaterQualityCharts">;

const THEME = "#00368C";
const BORDER = "#E1ECF8";

function formatMaybe(n: number) {
  if (Number.isFinite(n)) return n;
  return 0;
}

function WaterWave({
  height = 54,
  color = "#DDF0FF",
  opacity = 0.85,
}: {
  height?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <Svg width="100%" height={height} viewBox="0 0 360 72" preserveAspectRatio="none">
      <Path
        d="M0 34 C48 8 96 8 144 34 C192 60 240 60 288 34 C318 18 340 14 360 18 L360 72 L0 72 Z"
        fill={color}
        opacity={opacity}
      />
      <Path
        d="M0 46 C42 28 82 28 124 46 C166 64 208 64 250 46 C292 28 326 26 360 38"
        fill="none"
        stroke="#8DCCF7"
        strokeWidth="2"
        opacity={0.46}
      />
    </Svg>
  );
}

function BubbleField({ subtle = false }: { subtle?: boolean }) {
  const bubbles = [
    { right: 18, top: 14, size: 34, opacity: subtle ? 0.14 : 0.24 },
    { right: 78, top: 48, size: 14, opacity: subtle ? 0.16 : 0.28 },
    { right: 38, bottom: 18, size: 20, opacity: subtle ? 0.12 : 0.22 },
    { left: 22, bottom: 12, size: 12, opacity: subtle ? 0.1 : 0.18 },
  ];

  return (
    <View className="absolute inset-0">
      {bubbles.map((b, idx) => (
        <View
          key={idx}
          className="absolute rounded-full border"
          style={{
            width: b.size,
            height: b.size,
            borderRadius: b.size / 2,
            borderColor: "#7CC8F8",
            backgroundColor: "#E9F7FF",
            opacity: b.opacity,
            left: b.left,
            right: b.right,
            top: b.top,
            bottom: b.bottom,
          }}
        />
      ))}
    </View>
  );
}

function FloatingLettuce() {
  const bob = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const rippleLoop = Animated.loop(
      Animated.timing(ripple, {
        toValue: 1,
        duration: 2200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );

    bobLoop.start();
    rippleLoop.start();

    return () => {
      bobLoop.stop();
      rippleLoop.stop();
    };
  }, [bob, ripple]);

  const lettuceStyle = {
    transform: [
      {
        translateY: bob.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -7],
        }),
      },
      {
        rotate: bob.interpolate({
          inputRange: [0, 1],
          outputRange: ["-3deg", "4deg"],
        }),
      },
    ],
  };

  const rippleStyle = {
    opacity: ripple.interpolate({
      inputRange: [0, 0.55, 1],
      outputRange: [0.28, 0.1, 0.28],
    }),
    transform: [
      {
        scaleX: ripple.interpolate({
          inputRange: [0, 1],
          outputRange: [0.78, 1.22],
        }),
      },
      {
        scaleY: ripple.interpolate({
          inputRange: [0, 1],
          outputRange: [0.7, 1],
        }),
      },
    ],
  };

  return (
    <View pointerEvents="none" className="absolute right-2 bottom-0 w-[96px] h-[88px] items-center justify-end">
      <Animated.View
        className="absolute bottom-2 w-16 h-4 rounded-full"
        style={[{ backgroundColor: "#67BDF2" }, rippleStyle]}
      />

      <Animated.View style={lettuceStyle}>
        <Svg width={70} height={58} viewBox="0 0 78 66">
          <Path
            d="M39 9 C32 2 20 3 17 15 C8 14 2 22 8 32 C1 40 7 52 20 51 C24 62 38 63 44 53 C55 59 67 52 65 40 C76 34 74 20 61 17 C58 6 47 3 39 9 Z"
            fill="#4ADE80"
            stroke="#15803D"
            strokeWidth="2"
          />
          <Path d="M39 12 C34 18 32 27 35 37 C28 31 22 25 17 17" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round" opacity={0.75} />
          <Path d="M39 12 C43 20 43 29 39 40 C47 34 55 27 61 18" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round" opacity={0.75} />
          <Path d="M39 14 C38 27 39 39 42 52" fill="none" stroke="#DCFCE7" strokeWidth="3" strokeLinecap="round" opacity={0.9} />
          <Path d="M16 35 C25 33 32 37 38 45 C43 35 50 31 62 33" fill="none" stroke="#BBF7D0" strokeWidth="3" strokeLinecap="round" opacity={0.8} />
        </Svg>
      </Animated.View>
    </View>
  );
}

function ChartHero({
  count,
  latestPh,
  latestTurbidity,
}: {
  count: number;
  latestPh: number | undefined;
  latestTurbidity: number | undefined;
}) {
  return (
    <View className="bg-white rounded-[24px] border p-5 mb-5 shadow-sm overflow-hidden" style={{ borderColor: BORDER }}>
      <View className="absolute left-0 right-0 bottom-0">
        <WaterWave height={66} />
      </View>
      <BubbleField />
      <FloatingLettuce />

      <View className="pr-24">
        <Text className="text-[12px] font-extrabold text-gray-500 uppercase">Trend Garden</Text>
        <Text className="mt-1 text-[22px] font-extrabold text-gray-900">{count} readings</Text>
        <Text className="mt-1 text-[12px] font-semibold text-gray-500">Live patterns across pH, temperature, turbidity, and EC</Text>
      </View>

      <View className="mt-4 flex-row gap-3 pr-20">
        <View className="rounded-[16px] bg-[#F8FBFF] border border-[#E7F0FB] px-3 py-3 flex-1">
          <Text className="text-[11px] font-extrabold text-gray-500">Latest pH</Text>
          <Text className="mt-1 text-[18px] font-extrabold text-[#2563EB]">
            {Number.isFinite(latestPh) ? latestPh!.toFixed(2) : "--"}
          </Text>
        </View>
        <View className="rounded-[16px] bg-[#F8FBFF] border border-[#E7F0FB] px-3 py-3 flex-1">
          <Text className="text-[11px] font-extrabold text-gray-500">Turbidity</Text>
          <Text className="mt-1 text-[18px] font-extrabold text-[#10B981]">
            {Number.isFinite(latestTurbidity) ? latestTurbidity!.toFixed(1) : "--"}
          </Text>
        </View>
      </View>
    </View>
  );
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
  accent = THEME,
  icon,
  unit,
  height = 140,
}: {
  title: string;
  subtitle: string;
  values: number[];
  accent?: string;
  icon: keyof typeof Ionicons.glyphMap;
  unit?: string;
  height?: number;
}) {
  const width = 340; // works fine; SVG scales inside card

  const { points, min, max } = useMemo(() => buildPoints(values, width, height), [values, height]);
  const last = values.length ? values[values.length - 1] : 0;

  return (
    <View className="bg-white rounded-[22px] border p-5 mb-4 shadow-sm overflow-hidden" style={{ borderColor: BORDER }}>
      <View className="absolute left-0 right-0 bottom-0">
        <WaterWave height={42} color="#EEF8FF" opacity={0.88} />
      </View>
      <BubbleField subtle />
      <View className="flex-row items-start justify-between">
        <View className="flex-row flex-1 pr-3">
          <View className="w-11 h-11 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: `${accent}18` }}>
            <Ionicons name={icon} size={20} color={accent} />
          </View>
          <View className="flex-1">
            <Text className="text-[16px] font-extrabold text-gray-900">{title}</Text>
            <Text className="text-[12px] font-bold text-gray-500 mt-1">{subtitle}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-[12px] font-bold text-gray-500">Latest</Text>
          <Text className="text-[17px] font-extrabold" style={{ color: accent }}>
            {Number.isFinite(last) ? last.toFixed(2) : "—"}
          </Text>
          {unit ? <Text className="text-[10px] font-bold text-gray-400">{unit}</Text> : null}
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
              <Polyline points={points} fill="none" stroke={accent} strokeWidth="3" />
              {/* last point marker */}
              {(() => {
                const pts = points.split(" ");
                const lastPt = pts[pts.length - 1]?.split(",") ?? ["0", "0"];
                const cx = parseFloat(lastPt[0]);
                const cy = parseFloat(lastPt[1]);
                return (
                  <>
                    <Circle cx={cx} cy={cy} r="5" fill="#FFFFFF" stroke={accent} strokeWidth="3" />
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
            <ChartHero
              count={rows.length}
              latestPh={ph[ph.length - 1]}
              latestTurbidity={turb[turb.length - 1]}
            />
            <ChartCard title="pH Trend" subtitle="Hydroponic target usually ~5.5-6.5" values={ph} accent="#2563EB" icon="water-outline" />
            <ChartCard title="Temperature Trend" subtitle="Watch >24C for algae risk" values={temp} accent="#F97316" icon="thermometer-outline" unit="C" />
            <ChartCard title="Turbidity Trend" subtitle="High/rising NTU can signal contamination" values={turb} accent="#10B981" icon="eye-outline" unit="NTU" />
            <ChartCard title="EC Trend" subtitle="Nutrient concentration indicator" values={ec} accent="#7C3AED" icon="flash-outline" />
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
