import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ToastAndroid,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SpoilageStackParamList } from "../../navigation/SpoilageNavigator";

type Props = NativeStackScreenProps<SpoilageStackParamList, "SpoilageAlerts">;

type Filter = "All Status" | "Monitoring" | "Warning" | "Critical";

type AlertItem = {
  id: string;
  severity: "monitoring" | "warning" | "critical";
  time: string;
  title: string;
  plantId: string;
  actionText: string;
};

export default function SpoilageAlertsScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<Filter>("All Status");

  const initialItems: AlertItem[] = useMemo(
    () => [
      {
        id: "a1",
        severity: "critical",
        time: "10:45 AM",
        title: "Spoilage Detected",
        plantId: "P-060",
        actionText: "Act Now! 0 Days Left",
      },
      {
        id: "a2",
        severity: "warning",
        time: "09:30 AM",
        title: "Shelf-Life Risk",
        plantId: "P-051",
        actionText: "Act Now! 1.2 Days Left",
      },
      {
        id: "a3",
        severity: "monitoring",
        time: "09:30 AM",
        title: "Freshness Detected",
        plantId: "P-020",
        actionText: "Act Now! 5 Days Left",
      },
      {
        id: "a4",
        severity: "critical",
        time: "10:45 AM",
        title: "Spoilage Detected",
        plantId: "P-061",
        actionText: "Act Now! 0 Days Left",
      },
    ],
    []
  );

  // ✅ alerts in state so we can remove them
  const [items, setItems] = useState<AlertItem[]>(initialItems);

  const filtered = useMemo(() => {
    if (filter === "All Status") return items;
    if (filter === "Monitoring") return items.filter((i) => i.severity === "monitoring");
    if (filter === "Warning") return items.filter((i) => i.severity === "warning");
    return items.filter((i) => i.severity === "critical");
  }, [filter, items]);

  const toast = (msg: string) => {
    if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert("Done", msg);
  };

  const acknowledge = (id: string, plantId: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    toast(`Alert acknowledged for ${plantId}`);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#EAF4FF]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Text className="text-[14px] font-extrabold text-gray-900">Today&apos;s Alerts</Text>

          <View className="w-10 h-10" />
        </View>

        {/* Filters */}
        <View className="mt-3 bg-white rounded-full p-1 flex-row">
          <Chip label="All Status" active={filter === "All Status"} onPress={() => setFilter("All Status")} />
          <Chip label="Monitoring" active={filter === "Monitoring"} onPress={() => setFilter("Monitoring")} />
          <Chip label="Warning" active={filter === "Warning"} onPress={() => setFilter("Warning")} />
          <Chip label="Critical" active={filter === "Critical"} onPress={() => setFilter("Critical")} />
        </View>

        {/* Cards */}
        <View className="mt-4 space-y-4">
          {filtered.length === 0 ? (
            <View className="bg-white rounded-[18px] p-5 items-center">
              <Ionicons name="checkmark-circle-outline" size={26} color="#16A34A" />
              <Text className="mt-2 font-extrabold text-gray-900">All caught up</Text>
              <Text className="text-[12px] text-gray-500 mt-1">
                No alerts for the selected filter.
              </Text>
            </View>
          ) : (
            filtered.map((a) => (
              <AlertCard
                key={a.id}
                item={a}
                onAcknowledge={() => acknowledge(a.id, a.plantId)}
              />
            ))
          )}
        </View>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className={`flex-1 py-2 rounded-full items-center justify-center ${
        active ? "bg-[#111827]" : "bg-transparent"
      }`}
    >
      <Text className={`text-[11px] font-extrabold ${active ? "text-white" : "text-gray-500"}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function AlertCard({ item, onAcknowledge }: { item: AlertItem; onAcknowledge: () => void }) {
  const isCritical = item.severity === "critical";
  const isWarning = item.severity === "warning";

  const border = isCritical ? "#EF4444" : isWarning ? "#F59E0B" : "#22C55E";
  const softBg = isCritical ? "#FEE2E2" : isWarning ? "#FFF7ED" : "#ECFDF5";
  const titleColor = isCritical ? "#DC2626" : isWarning ? "#F59E0B" : "#16A34A";

  const badge = isCritical ? "Critical" : isWarning ? "Near Spoilage" : "Slightly Aged";
  const icon = isCritical ? "warning-outline" : isWarning ? "time-outline" : "checkmark-circle-outline";

  return (
    <View>
      <View
        className="rounded-[18px] p-4"
        style={{ backgroundColor: softBg, borderWidth: 1, borderColor: border }}
      >
        <View className="flex-row items-start">
          <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
            <Ionicons name={icon as any} size={18} color={border} />
          </View>

          <View className="ml-3 flex-1">
            <View className="flex-row items-center">
              <Text className="text-[11px] font-extrabold" style={{ color: titleColor }}>
                {badge}
              </Text>
              <Text className="text-[10px] text-gray-500 ml-2">{item.time}</Text>
            </View>

            <Text className="text-[12px] font-extrabold text-gray-900 mt-1">{item.title}</Text>
            <Text className="text-[11px] text-gray-600 mt-1">Plant ID: {item.plantId}</Text>
          </View>
        </View>

        <View
          className="mt-3 rounded-full px-4 py-3 flex-row items-center justify-center"
          style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: border }}
        >
          <Ionicons name="time-outline" size={16} color={border} />
          <Text className="ml-2 text-[12px] font-extrabold" style={{ color: titleColor }}>
            {item.actionText}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onAcknowledge}
        className="mt-3 rounded-[12px] items-center justify-center"
        style={{ backgroundColor: "#0046AD", height: 48 }}
      >
        <View className="flex-row items-center">
          <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
          <Text className="ml-2 text-[13px] font-extrabold text-white">Acknowledge</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}