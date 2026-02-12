import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

type HistoryItem = {
  id: string;
  dateLabel: string;      // "Today, Oct 24"
  weightG: number;        // 320
  predG: number;          // 145
  deltaG?: number;        // +1 / -2 optional
  statusLabel: string;    // "On Track" / "Slightly Low" / "Exact"
};

type RouteParams = {
  plant: {
    id: string;
    name: string;         // "Plant #04"
    plantedOn?: string;   // "Planted Dec 10"
    ageDays: number;      // 24
    startWeightG: number; // 12
    currentWeightG: number; // 320
  };
};

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

      <Text className="text-[18px] font-extrabold text-gray-900 mt-2">{value}</Text>

      {subValue ? (
        <Text className="text-[10px] font-bold text-green-600 mt-1">{subValue}</Text>
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
        active ? "bg-[#EAF4FF] border border-[#B6C8F0]" : "bg-[#EEF2F7]"
      }`}
    >
      <Text className={`text-[10px] font-extrabold ${active ? "text-[#003B8F]" : "text-gray-600"}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function HistoryRow({
  item,
  highlight,
}: {
  item: HistoryItem;
  highlight?: boolean;
}) {
  const delta = item.deltaG ?? 0;
  const deltaColor =
    delta > 0 ? "text-[#16A34A]" : delta < 0 ? "text-[#EF4444]" : "text-gray-400";

  const statusPill =
    item.statusLabel === "On Track"
      ? "bg-[#EAF4FF] text-[#003B8F]"
      : item.statusLabel === "Slightly Low"
      ? "bg-[#FFF6E5] text-[#F59E0B]"
      : "bg-[#EEF2F7] text-gray-600";

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

          <View className={`mt-2 px-3 py-1 rounded-full self-end ${statusPill.split(" ")[0]}`}>
            <Text className={`text-[10px] font-extrabold ${statusPill.split(" ")[1]}`}>
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
  const params: RouteParams = route.params;

  const [range, setRange] = useState<"7d" | "month" | "all">("7d");

  const plant = params?.plant;

  const ui = useMemo(() => {
    const name = plant?.name ?? "#04";
    const plantedOn = plant?.plantedOn ?? "Planted Dec 10";
    const ageDays = plant?.ageDays ?? 24;
    const startWeightG = plant?.startWeightG ?? 12;
    const currentWeightG = plant?.currentWeightG ?? 320;

    const predictedToday = 145;

    const history: HistoryItem[] = [
      { id: "h0", dateLabel: "Today, Oct 24", weightG: 320, predG: 145, statusLabel: "On Track" },
      { id: "h1", dateLabel: "Oct 23", weightG: 310, predG: 138, deltaG: -2, statusLabel: "On Track" },
      { id: "h2", dateLabel: "Oct 22", weightG: 305, predG: 130, deltaG: +1, statusLabel: "On Track" },
      { id: "h3", dateLabel: "Oct 21", weightG: 299, predG: 122, statusLabel: "Slightly Low" },
      { id: "h4", dateLabel: "Oct 20", weightG: 280, predG: 115, statusLabel: "Exact" },
    ];

    return {
      name,
      plantedOn,
      ageDays,
      startWeightG,
      currentWeightG,
      predictedToday,
      history,
    };
  }, [plant]);

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
            <Text className="text-[13px] font-extrabold text-gray-900">{ui.name}</Text>
            <Text className="text-[10px] font-bold text-gray-500 mt-1">{ui.plantedOn}</Text>
          </View>

          <View className="w-10 h-10" />
        </View>
      </View>

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
            subValue="+1083%"
          />
        </View>

        {/* Growth Trajectory card (chart placeholder like screenshot) */}
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

          {/* simple curve placeholder */}
          <View className="mt-4 h-[140px] rounded-[16px] bg-[#F1F5FF] overflow-hidden">
            <View className="absolute left-0 right-0 top-10 h-px bg-[#D8E3FF]" />
            <View className="absolute left-0 right-0 top-20 h-px bg-[#D8E3FF]" />
            <View className="absolute left-0 right-0 top-30 h-px bg-[#D8E3FF]" />

            {/* fake curve + dot */}
            <View className="absolute left-0 right-0 bottom-0">
              <View className="h-[140px]">
                <View className="absolute left-3 bottom-5 w-2 h-2 rounded-full bg-[#003B8F]" />
                <View className="absolute left-[40%] bottom-[55px] w-2 h-2 rounded-full bg-[#003B8F]" />
                <View className="absolute right-6 bottom-[95px] w-3 h-3 rounded-full bg-[#003B8F]" />
                <View className="absolute right-6 bottom-[95px] w-3 h-3 rounded-full bg-[#003B8F] opacity-20" />
              </View>
            </View>
          </View>

          <View className="flex-row items-center justify-between mt-3">
            <Text className="text-[10px] font-bold text-gray-400">Oct 10</Text>
            <Text className="text-[10px] font-bold text-gray-400">Oct 17</Text>
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
          <Text className="text-[13px] font-extrabold text-gray-900">
            History Log
          </Text>

          <TouchableOpacity activeOpacity={0.9} onPress={() => {}} className="flex-row items-center">
            <Text className="text-[11px] font-bold text-gray-500 mr-1">Filter</Text>
            <Ionicons name="filter-outline" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {ui.history.map((h, idx) => (
          <HistoryRow key={h.id} item={h} highlight={idx === 0} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
