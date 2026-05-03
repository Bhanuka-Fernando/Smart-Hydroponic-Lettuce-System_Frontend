import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ActivityIndicator,
  Alert,
  Easing,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { WaterQualityStackParamList } from "../../navigation/WaterQualityNavigator";
import {
  deleteWaterHistory,
  getWaterHistory,
  type LatestResponse,
} from "../../api/WaterQualityApi";

type Props = NativeStackScreenProps<WaterQualityStackParamList, "WaterQualityHistory">;

const THEME = "#00368C";
const BORDER = "#E1ECF8";

function BubbleField({ subtle = false }: { subtle?: boolean }) {
  const bubbles = [
    { right: 18, top: 14, size: 34, opacity: subtle ? 0.16 : 0.24 },
    { right: 72, top: 46, size: 14, opacity: subtle ? 0.18 : 0.32 },
    { right: 38, bottom: 18, size: 20, opacity: subtle ? 0.14 : 0.24 },
    { left: 22, bottom: 12, size: 12, opacity: subtle ? 0.12 : 0.2 },
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

function MetricPill({
  label,
  value,
  unit,
  icon,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View className="flex-1 rounded-[16px] border border-[#E7F0FB] bg-[#F8FBFF] px-3 py-3 overflow-hidden">
      <View className="absolute right-[-10px] top-[-10px] w-8 h-8 rounded-full" style={{ backgroundColor: color, opacity: 0.1 }} />
      <View className="flex-row items-center justify-between">
        <Text className="text-[11px] font-extrabold text-gray-500">{label}</Text>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <View className="mt-2 flex-row items-end">
        <Text className="text-[16px] font-extrabold text-gray-900">{value}</Text>
        {unit ? <Text className="ml-1 mb-0.5 text-[10px] font-bold text-gray-400">{unit}</Text> : null}
      </View>
    </View>
  );
}

function WaterWave({
  height = 52,
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
        opacity={0.5}
      />
    </Svg>
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
          outputRange: [0, -8],
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
      outputRange: [0.32, 0.12, 0.32],
    }),
    transform: [
      {
        scaleX: ripple.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.25],
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
    <View pointerEvents="none" className="absolute right-3 bottom-1 w-[102px] h-[96px] items-center justify-end">
      <Animated.View
        className="absolute bottom-2 w-20 h-5 rounded-full"
        style={[{ backgroundColor: "#67BDF2" }, rippleStyle]}
      />

      <Animated.View style={lettuceStyle}>
        <Svg width={78} height={66} viewBox="0 0 78 66">
          <Path
            d="M39 9 C32 2 20 3 17 15 C8 14 2 22 8 32 C1 40 7 52 20 51 C24 62 38 63 44 53 C55 59 67 52 65 40 C76 34 74 20 61 17 C58 6 47 3 39 9 Z"
            fill="#4ADE80"
            stroke="#15803D"
            strokeWidth="2"
          />
          <Path
            d="M39 12 C34 18 32 27 35 37 C28 31 22 25 17 17"
            fill="none"
            stroke="#166534"
            strokeWidth="2"
            strokeLinecap="round"
            opacity={0.75}
          />
          <Path
            d="M39 12 C43 20 43 29 39 40 C47 34 55 27 61 18"
            fill="none"
            stroke="#166534"
            strokeWidth="2"
            strokeLinecap="round"
            opacity={0.75}
          />
          <Path
            d="M39 14 C38 27 39 39 42 52"
            fill="none"
            stroke="#DCFCE7"
            strokeWidth="3"
            strokeLinecap="round"
            opacity={0.9}
          />
          <Path
            d="M16 35 C25 33 32 37 38 45 C43 35 50 31 62 33"
            fill="none"
            stroke="#BBF7D0"
            strokeWidth="3"
            strokeLinecap="round"
            opacity={0.8}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

export default function WaterQualityHistoryScreen({ navigation, route }: Props) {
  const { tank_id } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [rows, setRows] = useState<LatestResponse[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const loadHistory = async (showInitialLoader = false) => {
    if (showInitialLoader) setLoading(true);
    setErr(null);

    try {
      const res = await getWaterHistory(tank_id, 200);
      setRows(res.readings);
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? e?.message ?? "Failed to load history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory(true);
  }, [tank_id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
  };

  const confirmDemoReset = () => {
    Alert.alert(
      "Reset water history?",
      `Delete saved readings for ${tank_id}? This is useful for demo resets.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setResetting(true);
              await deleteWaterHistory(tank_id);
              await loadHistory();
            } catch (e: any) {
              Alert.alert("Reset failed", e?.response?.data?.detail ?? e?.message ?? "Could not delete readings.");
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAFF]">
      {/* Header */}
      <View className="px-5 pt-2 pb-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-11 h-11 rounded-2xl bg-white items-center justify-center border shadow-sm"
            style={{ borderColor: BORDER }}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <View className="items-center flex-1 px-3">
            <Text className="text-[20px] font-extrabold text-gray-900">Water History</Text>
            <View className="mt-1 px-3 py-1 rounded-full bg-[#EAF4FF]">
              <Text className="text-[11px] font-extrabold" style={{ color: THEME }}>
                Tank: {tank_id}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={confirmDemoReset}
            disabled={resetting}
            className="w-11 h-11 rounded-2xl bg-white items-center justify-center border shadow-sm"
            style={{ borderColor: BORDER, opacity: resetting ? 0.5 : 1 }}
            activeOpacity={0.85}
          >
            {resetting ? (
              <ActivityIndicator size="small" color={THEME} />
            ) : (
              <Ionicons name="trash-outline" size={19} color={THEME} />
            )}
          </TouchableOpacity>
        </View>

        <View className="mt-4 bg-white rounded-[24px] border p-5 shadow-sm overflow-hidden" style={{ borderColor: BORDER }}>
          <View className="absolute left-0 right-0 bottom-0">
            <WaterWave height={58} />
          </View>
          <BubbleField />
          <FloatingLettuce />
          <View className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: THEME }} />
          <View className="flex-row items-center justify-between">
            <View className="pr-24">
              <Text className="text-[12px] font-extrabold text-gray-500 uppercase">Showing</Text>
              <Text className="text-[22px] font-extrabold text-gray-900 mt-1">{rows.length} readings</Text>
              <Text className="text-[12px] font-semibold text-gray-500 mt-1">Latest saved sensor records</Text>
            </View>
          </View>
        </View>
      </View>

      {/* List */}
      <ScrollView
        className="flex-1 px-5"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View className="mt-10 items-center bg-white rounded-[22px] border border-[#E5EEF9] p-8 shadow-sm">
            <ActivityIndicator size="large" color={THEME} />
            <Text className="mt-3 text-gray-600 text-[13px]">Loading history...</Text>
          </View>
        ) : err ? (
          <View className="bg-white rounded-[22px] p-5 border border-[#FFE4E6] shadow-sm">
            <View className="w-11 h-11 rounded-2xl items-center justify-center bg-[#FEF2F2] mb-3">
              <Ionicons name="alert-circle" size={22} color="#DC2626" />
            </View>
            <Text className="text-[15px] font-extrabold text-red-700">{err}</Text>
          </View>
        ) : rows.length === 0 ? (
          <View className="bg-white rounded-[22px] p-6 border border-[#E5EEF9] shadow-sm items-center overflow-hidden">
            <View className="absolute left-0 right-0 bottom-0">
              <WaterWave height={54} color="#EEF8FF" opacity={0.95} />
            </View>
            <BubbleField />
            <View className="w-14 h-14 rounded-[22px] items-center justify-center bg-[#EAF4FF]">
              <Ionicons name="water-outline" size={26} color={THEME} />
            </View>
            <Text className="mt-4 text-[16px] font-extrabold text-gray-900">No readings yet</Text>
            <Text className="mt-2 text-[13px] text-gray-500 text-center">
              New water quality records will appear here after they are saved.
            </Text>
          </View>
        ) : (
          rows.map((r, idx) => (
            <View
              key={`${r.timestamp}-${idx}`}
              className="bg-white rounded-[24px] p-4 border mb-3 shadow-sm overflow-hidden"
              style={{ borderColor: BORDER }}
            >
              <View className="absolute left-0 right-0 bottom-0">
                <WaterWave height={38} color="#EEF8FF" opacity={0.9} />
              </View>
              <BubbleField subtle />
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 pr-3">
                  <View className="w-10 h-10 rounded-2xl bg-[#EAF4FF] items-center justify-center mr-3">
                    <Ionicons name="water-outline" size={19} color={THEME} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[13px] font-extrabold text-gray-900" numberOfLines={1}>
                      {r.timestamp}
                    </Text>
                    <Text className="text-[11px] font-semibold text-gray-500 mt-0.5">Sensor snapshot</Text>
                  </View>
                </View>
                <View className="px-3 py-1 rounded-full" style={{ backgroundColor: "#EAF4FF" }}>
                  <Text className="text-[12px] font-extrabold" style={{ color: THEME }}>
                    #{idx + 1}
                  </Text>
                </View>
              </View>

              <View className="mt-4 flex-row gap-3">
                <MetricPill label="pH" value={r.ph.toFixed(2)} icon="water-outline" color="#2563EB" />
                <MetricPill label="Temp" value={r.temp_c.toFixed(1)} unit="C" icon="thermometer-outline" color="#F97316" />
              </View>
              <View className="mt-3 flex-row gap-3">
                <MetricPill label="Turbidity" value={r.turb_ntu.toFixed(1)} unit="NTU" icon="eye-outline" color="#10B981" />
                <MetricPill label="EC" value={r.ec.toFixed(2)} icon="flash-outline" color="#7C3AED" />
              </View>
            </View>
          ))
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
