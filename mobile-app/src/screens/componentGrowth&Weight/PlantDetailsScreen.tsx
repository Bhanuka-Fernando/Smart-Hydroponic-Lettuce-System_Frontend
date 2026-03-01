import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useAuth } from "../../auth/useAuth";
import { getPlantDetails } from "../../api/plantsApi";

type HistoryItem = {
  id: string;
  dateLabel: string;
  weightG: number;
  predG: number;
  deltaG?: number;
  statusLabel: string;
};

type RouteParams = { plant_id: string };

function TopStat({
  icon,
  label,
  value,
  subValue,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <View className="flex-1 bg-white rounded-[14px] border border-gray-100 px-3 py-3">
      <View className="flex-row items-center">
        <Ionicons name={icon} size={16} color="#003B8F" />
        <Text className="ml-2 text-[10px] font-extrabold text-gray-500 tracking-[0.4px]">
          {label}
        </Text>
      </View>
      <Text className="text-[18px] font-extrabold text-gray-900 mt-2">
        {value}
      </Text>
      {subValue ? (
        <Text className="text-[10px] font-bold text-green-600 mt-1">
          {subValue}
        </Text>
      ) : null}
    </View>
  );
}

function SegButton({
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
      activeOpacity={0.9}
      onPress={onPress}
      className={`px-4 py-2 rounded-full ${
        active
          ? "bg-[#EAF4FF] border border-[#B6C8F0]"
          : "bg-[#EEF2F7]"
      }`}
    >
      <Text
        className={`text-[10px] font-extrabold ${
          active ? "text-[#003B8F]" : "text-gray-600"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function HistoryRow({ item, highlight }: { item: HistoryItem; highlight?: boolean }) {
  const delta = item.deltaG ?? 0;
  const deltaColor =
    delta > 0 ? "text-[#16A34A]" : delta < 0 ? "text-[#EF4444]" : "text-gray-400";

  const statusPill =
    item.statusLabel === "On Track"
      ? "bg-[#EAF4FF] text-[#003B8F]"
      : item.statusLabel === "Slightly Low"
      ? "bg-[#FFF6E5] text-[#F59E0B]"
      : "bg-[#EEF2F7] text-gray-600";

  const pillBg = statusPill.split(" ")[0];
  const pillText = statusPill.split(" ")[1];

  return (
    <View
      className={`bg-white rounded-[16px] border ${
        highlight ? "border-[#003B8F]" : "border-gray-100"
      } px-4 py-3 mb-3`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View
            className={`w-9 h-9 rounded-full ${
              highlight ? "bg-[#EAF4FF]" : "bg-[#EEF2F7]"
            } items-center justify-center`}
          >
            <Ionicons
              name={highlight ? "checkmark-circle-outline" : "time-outline"}
              size={18}
              color={highlight ? "#003B8F" : "#64748B"}
            />
          </View>

          <View className="ml-3">
            <Text className="text-[12px] font-extrabold text-gray-900">
              {item.dateLabel}
            </Text>
            <Text className="text-[10px] font-bold text-gray-500 mt-1">
              Pred: {item.predG}g
            </Text>
          </View>
        </View>

        <View className="items-end">
          <View className="flex-row items-center">
            <Text className="text-[14px] font-extrabold text-gray-900">
              {item.weightG}g
            </Text>
            {item.deltaG !== undefined ? (
              <Text className={`text-[10px] font-extrabold ml-2 ${deltaColor}`}>
                {delta > 0 ? `+${delta}` : `${delta}`}g
              </Text>
            ) : null}
          </View>

          <View className={`mt-2 px-3 py-1 rounded-full self-end ${pillBg}`}>
            <Text className={`text-[10px] font-extrabold ${pillText}`}>
              {item.statusLabel}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function PlantDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { accessToken } = useAuth();

  const params: RouteParams | undefined = route.params;
  const plant_id = params?.plant_id;

  // ✅ use range chips
  const [range, setRange] = useState<"7d" | "month" | "all">("7d");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  // ✅ your app usually uses z01; you can later make this dynamic
  const zone_id = "z01";

  useEffect(() => {
    if (!plant_id) return;

    (async () => {
      try {
        setLoading(true);

        // ✅ send zone_id + range to backend
        const res = await getPlantDetails({
          token: accessToken,
          plant_id,
          zone_id,
          range,
        } as any);

        setData(res);
      } catch (e: any) {
        Alert.alert("Error", e?.message || "Failed to load plant details");
      } finally {
        setLoading(false);
      }
    })();
  }, [plant_id, range, accessToken]);

  const ui = useMemo(() => {
    const name = data?.display_name ?? `Plant ${plant_id ?? ""}`;
    const plantedOn = data?.planted_on ?? "Planted --";
    const ageDays = Number(data?.age_days ?? 0);

    const startWeightG = Number(data?.start_weight_g ?? 0);
    const currentWeightG = Number(data?.current_weight_g ?? 0);

    const growthPct = Number(data?.growth_pct ?? 0);
    const growthPctLabel = startWeightG > 0 ? `+${growthPct.toFixed(0)}%` : "";

    const predictedToday =
      data?.predicted_today_g == null ? 0 : Number(data.predicted_today_g);

    const history: HistoryItem[] = Array.isArray(data?.history)
      ? data.history.map((h: any, idx: number) => ({
          id: `${idx}`,
          dateLabel: h?.date_label ?? h?.date ?? "",
          weightG: h?.actual_weight_g == null ? 0 : Number(h.actual_weight_g),
          predG: h?.predicted_weight_g == null ? 0 : Number(h.predicted_weight_g),
          deltaG: h?.delta_g == null ? undefined : Number(h.delta_g),
          statusLabel: h?.status ?? "On Track",
        }))
      : [];

    return {
      name,
      plantedOn,
      ageDays,
      startWeightG,
      currentWeightG,
      growthPctLabel,
      predictedToday,
      history,
    };
  }, [data, plant_id]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      {/* Header */}
      <View className="px-4 pt-2 pb-2">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <View className="items-center">
            <Text className="text-[13px] font-extrabold text-gray-900">
              {ui.name}
            </Text>
            <Text className="text-[10px] font-bold text-gray-500 mt-1">
              {ui.plantedOn}
            </Text>
          </View>

          <View className="w-10 h-10" />
        </View>
      </View>

      {!plant_id ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[12px] font-semibold text-gray-600">
            Missing plant_id.
          </Text>
        </View>
      ) : loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-2 text-[11px] text-gray-500 font-semibold">
            Loading plant details...
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        >
          {/* Top stats */}
          <View className="flex-row mt-4" style={{ gap: 10 }}>
            <TopStat icon="calendar-outline" label="AGE" value={`${ui.ageDays} Days`} />
            <TopStat icon="hourglass-outline" label="START" value={`${ui.startWeightG}g`} />
            <TopStat
              icon="bar-chart-outline"
              label="CURRENT"
              value={`${ui.currentWeightG}g`}
              subValue={ui.growthPctLabel}
            />
          </View>

          {/* Growth Trajectory */}
          <View className="bg-white rounded-[18px] shadow-sm px-4 py-4 mt-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[12px] font-extrabold text-gray-700">
                Growth Trajectory
              </Text>
              <Text className="text-[10px] font-bold text-gray-400">Predicted</Text>
            </View>

            <View className="flex-row items-end justify-between mt-3">
              <View className="flex-row items-end">
                <Text className="text-[26px] font-extrabold text-gray-900">
                  {ui.currentWeightG}g
                </Text>
                <View className="ml-3 px-3 py-1 rounded-full bg-[#EAF4FF]">
                  <Text className="text-[10px] font-extrabold text-[#003B8F]">
                    On Track
                  </Text>
                </View>
              </View>

              <Text className="text-[14px] font-extrabold text-gray-500">
                {ui.predictedToday}g
              </Text>
            </View>

            <View className="mt-4 h-[140px] rounded-[16px] bg-[#F1F5FF] overflow-hidden">
              <View className="absolute left-0 right-0 top-10 h-px bg-[#D8E3FF]" />
              <View className="absolute left-0 right-0 top-20 h-px bg-[#D8E3FF]" />
              <View className="absolute left-0 right-0 top-30 h-px bg-[#D8E3FF]" />
            </View>

            <View className="flex-row items-center justify-between mt-3">
              <Text className="text-[10px] font-bold text-gray-400">...</Text>
              <Text className="text-[10px] font-bold text-gray-400">...</Text>
              <Text className="text-[10px] font-bold text-gray-400">Today</Text>
            </View>
          </View>

          {/* Range chips */}
          <View className="flex-row mt-4" style={{ gap: 10 }}>
            <SegButton label="Last 7 Days" active={range === "7d"} onPress={() => setRange("7d")} />
            <SegButton label="Last Month" active={range === "month"} onPress={() => setRange("month")} />
            <SegButton label="All Time" active={range === "all"} onPress={() => setRange("all")} />
          </View>

          {/* History Log */}
          <View className="flex-row items-center justify-between mt-6 mb-3">
            <Text className="text-[13px] font-extrabold text-gray-900">History Log</Text>
            <TouchableOpacity activeOpacity={0.9} onPress={() => {}} className="flex-row items-center">
              <Text className="text-[11px] font-bold text-gray-500 mr-1">Filter</Text>
              <Ionicons name="filter-outline" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {ui.history.length === 0 ? (
            <View className="bg-white rounded-[16px] border border-gray-100 px-4 py-4">
              <Text className="text-[11px] font-semibold text-gray-500">
                No history yet.
              </Text>
            </View>
          ) : (
            ui.history.map((h, idx) => (
              <HistoryRow key={h.id} item={h} highlight={idx === 0} />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}