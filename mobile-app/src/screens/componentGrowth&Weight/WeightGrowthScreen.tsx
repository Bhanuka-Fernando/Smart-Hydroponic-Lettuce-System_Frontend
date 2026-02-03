import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

function formatHeaderDate(d: Date) {
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  return `${month} ${day} • Sunny 24°C`;
}

type Status = "Good" | "Optimal" | "Low";

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { bg: string; text: string }> = {
    Good: { bg: "bg-[#E9FBEF]", text: "text-[#16A34A]" },
    Optimal: { bg: "bg-[#EEF2FF]", text: "text-[#4F46E5]" },
    Low: { bg: "bg-[#FFF6E5]", text: "text-[#F59E0B]" },
  };

  return (
    <View className={`px-2.5 py-1 rounded-full ${map[status].bg}`}>
      <Text className={`text-[11px] font-extrabold ${map[status].text}`}>
        {status}
      </Text>
    </View>
  );
}

function MetricCard({
  iconBg,
  icon,
  label,
  value,
  unit,
  status,
}: {
  iconBg: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  status: Status;
}) {
  return (
    <View className="bg-white rounded-[18px] p-4 w-[48%]">
      <View className="flex-row items-start justify-between">
        <View className={`w-11 h-11 rounded-full ${iconBg} items-center justify-center`}>
          {icon}
        </View>
        <StatusPill status={status} />
      </View>

      <Text className="mt-3 text-[12px] text-gray-500 font-semibold">{label}</Text>

      <View className="flex-row items-end justify-between mt-1">
        <View className="flex-row items-end">
          <Text className="text-[20px] font-extrabold text-gray-900">{value}</Text>
          {unit ? (
            <Text className="text-[12px] text-gray-400 ml-1 mb-[2px]">{unit}</Text>
          ) : null}
        </View>

        {/* right mini icon like the design */}
        <Ionicons name="sync-circle-outline" size={24} color="#1D4ED8" />
      </View>
    </View>
  );
}

function SmallActionButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="flex-row items-center bg-white rounded-[14px] px-3 py-2"
    >
      {icon}
      <Text className="ml-2 text-[12px] font-bold text-gray-700">{label}</Text>
    </TouchableOpacity>
  );
}

function SlotRow({
  label,
  time,
  value,
  onChange,
}: {
  label: string;
  time: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <View>
        <Text className="text-[11px] font-extrabold text-gray-700 tracking-[0.6px]">
          {label}
        </Text>
      </View>

      <View className="flex-row items-center">
        <Text className="text-[11px] font-bold text-gray-500 mr-3">{time}</Text>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: "#E5E7EB", true: "#93C5FD" }}
          thumbColor={value ? "#1D4ED8" : "#FFFFFF"}
        />
      </View>
    </View>
  );
}

function ActionTile({
  iconBg,
  icon,
  labelTop,
  labelBottom,
  onPress,
}: {
  iconBg: string;
  icon: React.ReactNode;
  labelTop: string;
  labelBottom: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="bg-white rounded-[18px] w-[31%] pt-4 pb-3 items-center shadow-sm"
    >
      <View className={`w-11 h-11 rounded-full ${iconBg} items-center justify-center`}>
        {icon}
      </View>

      <View className="mt-3 items-center">
        <Text className="text-[12px] text-gray-800 font-extrabold leading-[15px]">
          {labelTop}
        </Text>
        <Text className="text-[12px] text-gray-800 font-extrabold leading-[15px]">
          {labelBottom}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function WeightGrowthScreen() {
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();

  const headerDate = useMemo(() => formatHeaderDate(new Date()), []);

  const [morning, setMorning] = useState(true);
  const [afternoon, setAfternoon] = useState(false);
  const [evening, setEvening] = useState(true);

  const go = (routeName: string) => {
    try {
      navigation.navigate(routeName);
    } catch {
      // ignore for now
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      {/* Top header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
        <Text className="text-[13px] text-gray-500">{headerDate}</Text>
        <View className="flex-row items-start justify-between mt-2">
          <View className="flex-1 pr-3">
            <Text className="text-[25px] font-extrabold text-[#000000] leading-[34px]">
              WEIGHT ESTIMATION & GROWTH FORECAST
            </Text>
          </View>

          <View className="relative mt-1">
            <Image
              source={{ uri: "https://i.pravatar.cc/100?img=12" }}
              className="w-12 h-12 rounded-full"
            />
            <View className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 16, // keep small like DashboardScreen
        }}
      >

        {/* Environment */}
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-[20px] font-extrabold text-gray-900 ">
            Environment
          </Text>

          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            <Text className="text-[11px] font-bold text-gray-500">Recent Updates</Text>
          </View>
        </View>

        {/* Metrics 2x2 */}
        <View className="mt-6">
          <View className="flex-row justify-between">
            <MetricCard
              iconBg="bg-[#FFEAF2]"
              icon={<Feather name="thermometer" size={20} color="#DB2777" />}
              label="Temperature"
              value="24.5°C"
              status="Good"
            />

            <MetricCard
              iconBg="bg-[#F3E8FF]"
              icon={<Ionicons name="flash-outline" size={20} color="#7C3AED" />}
              label="EC Level"
              value="1.4"
              unit="ms/cm"
              status="Optimal"
            />
          </View>

          <View className="flex-row justify-between mt-3">
            <MetricCard
              iconBg="bg-[#E8F7FF]"
              icon={<Ionicons name="water-outline" size={20} color="#0284C7" />}
              label="Humidity"
              value="45%"
              status="Low"
            />

            <MetricCard
              iconBg="bg-[#EAF4FF]"
              icon={<MaterialCommunityIcons name="water-check-outline" size={20} color="#0046AD" />}
              label="Water pH"
              value="6.2"
              status="Good"
            />
          </View>
        </View>

        {/* Small actions row */}
        <View className="flex-row items-center justify-between mt-6">
          <SmallActionButton
            icon={<Ionicons name="sync-outline" size={16} color="#1D4ED8" />}
            label="Check for Updates"
            onPress={() => {}}
          />
          <SmallActionButton
            icon={<Ionicons name="time-outline" size={16} color="#1D4ED8" />}
            label="View All Past Activities"
            onPress={() => go("History")}
          />
        </View>

        {/* Scheduled time slots (CLICKABLE) */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate("ScheduleTimeSlots")}
          className="bg-white rounded-[18px] shadow-sm mt-5 p-4"
        >
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-[14px] bg-[#EEF2FF] items-center justify-center mr-3">
              <Ionicons name="calendar-outline" size={18} color="#1D4ED8" />
            </View>

            <View className="flex-1">
              <Text className="text-[14px] font-extrabold text-gray-900">
                Scheduled Time Slots
              </Text>
              <Text className="text-[11px] text-gray-500 mt-0.5">
                Daily sensor logging
              </Text>
            </View>

            {/* optional right arrow */}
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </View>

          <SlotRow
            label="MORNING"
            time="09:00 AM"
            value={morning}
            onChange={setMorning}
          />
          <View className="h-px bg-gray-100" />
          <SlotRow
            label="AFTERNOON"
            time="01:00 PM"
            value={afternoon}
            onChange={setAfternoon}
          />
          <View className="h-px bg-gray-100" />
          <SlotRow
            label="EVENING"
            time="05:00 PM"
            value={evening}
            onChange={setEvening}
          />
        </TouchableOpacity>


        {/* Actions */}
        <Text className="text-[14px] font-extrabold text-gray-900 mt-6 mb-3">
          Actions
        </Text>

        <View className="flex-row justify-between">
          <ActionTile
            iconBg="bg-[#EAF4FF]"
            icon={<MaterialCommunityIcons name="scale-bathroom" size={20} color="#0046AD" />}
            labelTop="Estimate"
            labelBottom="Weight"
            onPress={() => go("Scan")}
          />
          <ActionTile
            iconBg="bg-[#E9FBEF]"
            icon={<Ionicons name="analytics-outline" size={20} color="#16A34A" />}
            labelTop="Monitor"
            labelBottom="Growth"
            onPress={() => {}}
          />
          <ActionTile
            iconBg="bg-[#FFEAF2]"
            icon={<Ionicons name="leaf-outline" size={20} color="#DB2777" />}
            labelTop="Plant"
            labelBottom="Lists"
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
