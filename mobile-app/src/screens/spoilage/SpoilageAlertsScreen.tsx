import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ToastAndroid,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SpoilageStackParamList } from "../../navigation/SpoilageNavigator";

import {
  getSpoilageAlerts,
  acknowledgeSpoilageAlert,
  type SpoilageAlertRow,
} from "../../api/SpoilageApi";

type Props = NativeStackScreenProps<SpoilageStackParamList, "SpoilageAlerts">;

type Filter = "All Status" | "Warning" | "Critical";

function toTimeLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h === 0 ? 12 : h;
  return `${h}:${m} ${ampm}`;
}

export default function SpoilageAlertsScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<Filter>("All Status");
  const [rows, setRows] = useState<SpoilageAlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ackLoadingIds, setAckLoadingIds] = useState<Set<number>>(new Set());

  const toast = (msg: string) => {
    if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert("Done", msg);
  };

  const load = async () => {
    try {
      setLoading(true);
      const data = await getSpoilageAlerts({ acknowledged: false, limit: 100 });
      setRows(data);
    } catch (e: any) {
      console.log("Load alerts error:", e?.message, e?.response?.data);
      Alert.alert("Error", e?.response?.data?.detail || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const acknowledge = async (id: number, plantId: string) => {
    try {
      setAckLoadingIds((prev) => new Set([...Array.from(prev), id]));
      await acknowledgeSpoilageAlert(id);
      setRows((prev) => prev.filter((x) => x.id !== id));
      toast(`Alert acknowledged for ${plantId}`);
    } catch (e: any) {
      console.log("Ack alert error:", e?.message, e?.response?.data);
      Alert.alert("Error", e?.response?.data?.detail || "Failed to acknowledge alert");
    } finally {
      setAckLoadingIds((prev) => {
        const next = new Set(Array.from(prev));
        next.delete(id);
        return next;
      });
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    load();
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (filter === "All Status") return rows;
    if (filter === "Warning") return rows.filter((r) => r.severity === "warning");
    return rows.filter((r) => r.severity === "critical");
  }, [filter, rows]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#EAF4FF]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Text className="text-[14px] font-extrabold text-gray-900">
            Today&apos;s Alerts
          </Text>

          <TouchableOpacity
            onPress={load}
            activeOpacity={0.85}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="refresh" size={18} color="#111827" />
          </TouchableOpacity>
        </View>

        <View className="mt-3 bg-white rounded-full p-1 flex-row">
          <Chip
            label="All Status"
            active={filter === "All Status"}
            onPress={() => setFilter("All Status")}
          />
          <Chip
            label="Warning"
            active={filter === "Warning"}
            onPress={() => setFilter("Warning")}
          />
          <Chip
            label="Critical"
            active={filter === "Critical"}
            onPress={() => setFilter("Critical")}
          />
        </View>

        <View className="mt-4 space-y-4">
          {loading ? (
            <View className="bg-white rounded-[18px] p-5 items-center">
              <ActivityIndicator />
              <Text className="mt-2 text-[12px] text-gray-500 font-semibold">
                Loading...
              </Text>
            </View>
          ) : filtered.length === 0 ? (
            <View className="bg-white rounded-[18px] p-5 items-center">
              <Ionicons name="checkmark-circle-outline" size={26} color="#16A34A" />
              <Text className="mt-2 font-extrabold text-gray-900">All caught up</Text>
              <Text className="text-[12px] text-gray-500 mt-1">
                No active alerts right now.
              </Text>
            </View>
          ) : (
            filtered.map((a) => (
              <AlertCard
                key={a.id}
                item={a}
                ackLoading={ackLoadingIds.has(a.id)}
                onAcknowledge={() => acknowledge(a.id, a.plant_id)}
              />
            ))
          )}
        </View>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({
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

function AlertCard({
  item,
  onAcknowledge,
  ackLoading,
}: {
  item: SpoilageAlertRow;
  onAcknowledge: () => void;
  ackLoading: boolean;
}) {
  const isCritical = item.severity === "critical";
  const border = isCritical ? "#EF4444" : "#F59E0B";
  const softBg = isCritical ? "#FEE2E2" : "#FFF7ED";
  const titleColor = isCritical ? "#DC2626" : "#F59E0B";

  const badge = isCritical ? "Critical" : "Near Spoilage";
  const icon = isCritical ? "warning-outline" : "time-outline";

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
              <Text className="text-[10px] text-gray-500 ml-2">
                {toTimeLabel(item.created_at)}
              </Text>
            </View>

            <Text className="text-[12px] font-extrabold text-gray-900 mt-1">
              {item.title}
            </Text>
            <Text className="text-[11px] text-gray-600 mt-1">
              Plant ID: {item.plant_id}
            </Text>
            <Text className="text-[11px] text-gray-600 mt-1">
              {item.message}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onAcknowledge}
        disabled={ackLoading}
        className="mt-3 rounded-[12px] items-center justify-center"
        style={{ backgroundColor: "#003B8F", height: 48, opacity: ackLoading ? 0.7 : 1 }}
      >
        <View className="flex-row items-center">
          <Ionicons name="checkmark-done-outline" size={18} color="#FFFFFF" />
          <Text className="ml-2 text-[13px] font-extrabold text-white">
            {ackLoading ? "Acknowledging..." : "Acknowledge"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}