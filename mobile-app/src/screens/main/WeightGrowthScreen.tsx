import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";

function formatDayHeader(d: Date) {
  const weekday = d.toLocaleString("en-US", { weekday: "long" });
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  return `${weekday}, ${month} ${day}`;
}
function formatHeaderDate(d: Date) {
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  return `${month} ${day} • Sunny 24°C`;
}

export default function WeightGrowthScreen() {
    const headerDate = useMemo(() => formatHeaderDate(new Date()), []);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
        
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 }}
      >
        {/* Top header */}
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="text-[13px] text-gray-500">{headerDate}</Text>
            <Text className="text-[20px] font-extrabold text-gray-500 mt-1">
              WEIGHT ESTIMATION & GROWTH FORECAST
            </Text>
          </View>
        </View>

        {/* Environment header */}
        <View className="flex-row items-center justify-between mt-5 mb-3">
          <Text className="text-[13px] font-extrabold text-gray-900">Environment</Text>

          <View className="flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
            <Text className="text-[11px] font-semibold text-gray-500">Recent Updates</Text>
          </View>
        </View>

        {/* 2x2 metrics */}
        <View className="flex-row justify-between">
          <MetricCard
            icon={<Ionicons name="water-outline" size={18} color="#2563EB" />}
            iconBg="bg-[#EAF4FF]"
            label="Water pH"
            value="6.2"
            unit=""
            statusText="Good"
            statusBg="bg-[#E9FBEF]"
            statusColor="text-green-700"
          />

          <MetricCard
            icon={<Ionicons name="flash-outline" size={18} color="#7C3AED" />}
            iconBg="bg-[#F3E8FF]"
            label="EC Level"
            value="1.4"
            unit="mS/cm"
            statusText="Optimal"
            statusBg="bg-[#EAF2FF]"
            statusColor="text-blue-700"
          />
        </View>

        <View className="flex-row justify-between mt-3">
          <MetricCard
            icon={<Feather name="thermometer" size={18} color="#F97316" />}
            iconBg="bg-[#FFF6E5]"
            label="Temperature"
            value="24.5°C"
            unit=""
            statusText=""
            statusBg=""
            statusColor=""
          />

          <MetricCard
            icon={<Ionicons name="water" size={18} color="#0284C7" />}
            iconBg="bg-[#E8F7FF]"
            label="Humidity"
            value="45%"
            unit=""
            statusText="Low"
            statusBg="bg-[#FFF6E5]"
            statusColor="text-orange-600"
          />
        </View>

        {/* Actions */}
        <Text className="text-[13px] font-extrabold text-gray-900 mt-6 mb-3">
          Actions
        </Text>

        <View className="flex-row justify-between">
          <ActionCard
            titleTop="Estimate"
            titleBottom="Weight"
            iconBg="bg-[#EAF4FF]"
            icon={<MaterialCommunityIcons name="scale-bathroom" size={20} color="#0046AD" />}
            onPress={() => {}}
          />
          <ActionCard
            titleTop="Monitor"
            titleBottom="Growth"
            iconBg="bg-[#E9FBEF]"
            icon={<Ionicons name="analytics-outline" size={20} color="#16A34A" />}
            onPress={() => {}}
          />
          <ActionCard
            titleTop="Plant"
            titleBottom="Lists"
            iconBg="bg-[#FFEAF2]"
            icon={<Ionicons name="leaf-outline" size={20} color="#DB2777" />}
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({
  icon,
  iconBg,
  label,
  value,
  unit,
  statusText,
  statusBg,
  statusColor,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  unit: string;
  statusText: string;
  statusBg: string;
  statusColor: string;
}) {
  return (
    <View className="bg-white rounded-[18px] w-[48%] p-4 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className={`w-10 h-10 rounded-full ${iconBg} items-center justify-center`}>
          {icon}
        </View>

        {statusText ? (
          <View className={`px-3 py-1 rounded-full ${statusBg}`}>
            <Text className={`text-[11px] font-bold ${statusColor}`}>{statusText}</Text>
          </View>
        ) : null}
      </View>

      <Text className="text-[11px] text-gray-500 mt-3">{label}</Text>

      <View className="flex-row items-end mt-1">
        <Text className="text-[22px] font-extrabold text-gray-900">{value}</Text>
        {unit ? (
          <Text className="text-[11px] text-gray-400 ml-1 mb-1">{unit}</Text>
        ) : null}
      </View>
    </View>
  );
}

function ActionCard({
  titleTop,
  titleBottom,
  icon,
  iconBg,
  onPress,
}: {
  titleTop: string;
  titleBottom: string;
  icon: React.ReactNode;
  iconBg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-white rounded-[18px] w-[31%] pt-4 pb-3 items-center shadow-sm"
    >
      <View className={`w-11 h-11 rounded-full ${iconBg} items-center justify-center`}>
        {icon}
      </View>

      <View className="mt-3 items-center">
        <Text className="text-[12px] text-gray-800 font-extrabold leading-[15px]">
          {titleTop}
        </Text>
        <Text className="text-[12px] text-gray-800 font-extrabold leading-[15px]">
          {titleBottom}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
