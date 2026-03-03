import React, { useMemo, useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Switch, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import AsyncStorage from '@react-native-async-storage/async-storage';

import SensorReadingsModal from "../../components/Sensors/SensorReadingsModal";
import ActionTile from "../../components/ui/ActionTile";
import { useSensorReadings } from "../../context/SensorReadingsContext";
import { getDeviceSensors } from "../../api/deviceApi";
import axios from 'axios';
import { ML_BASE_URL } from '../../utils/constants';

function formatHeaderDate(d: Date) {
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  return `${month} ${day} • Sunny 24°C`;
}

type Status = "Good" | "Optimal" | "Low";

function statusFor(key: "airT" | "RH" | "EC" | "pH", value: number | null): Status {
  if (value === null || value === undefined) return "Low";
  
  const ranges: Record<string, { optimal: [number, number]; good: [number, number] }> = {
    airT: { optimal: [22, 28], good: [18, 32] },
    RH: { optimal: [50, 70], good: [40, 80] },
    EC: { optimal: [1.2, 1.8], good: [0.8, 2.2] },
    pH: { optimal: [5.5, 6.5], good: [5.0, 7.0] },
  };

  const range = ranges[key];
  const isOptimal = value >= range.optimal[0] && value <= range.optimal[1];
  const isGood = value >= range.good[0] && value <= range.good[1];

  return isOptimal ? "Optimal" : isGood ? "Good" : "Low";
}

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { bg: string; text: string }> = {
    Good: { bg: "bg-[#E9FBEF]", text: "text-[#16A34A]" },
    Optimal: { bg: "bg-[#EEF2FF]", text: "text-[#4F46E5]" },
    Low: { bg: "bg-[#FFF6E5]", text: "text-[#F59E0B]" },
  };

  return (
    <View className={`px-2.5 py-1 rounded-full ${map[status].bg}`}>
      <Text className={`text-[11px] font-extrabold ${map[status].text}`}>{status}</Text>
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
  onRetryPress,
  loading,
}: {
  iconBg: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  status: Status;
  onRetryPress: () => void;
  loading?: boolean;
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
          {unit ? <Text className="text-[12px] text-gray-400 ml-1 mb-[2px]">{unit}</Text> : null}
        </View>

        {/* retry / edit */}
        <TouchableOpacity onPress={onRetryPress} activeOpacity={0.85} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#1D4ED8" />
          ) : (
            <Ionicons name="sync-circle-outline" size={24} color="#1D4ED8" />
          )}
        </TouchableOpacity>
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

type Slot = {
  id: string;
  name: string;
  timeLabel: string;
  enabled: boolean;
  hour24: number;
  minute: number;
};

const STORAGE_KEY = '@schedule_time_slots';

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
        <Text className="text-[11px] font-extrabold text-gray-700 tracking-[0.6px]">{label}</Text>
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

export default function WeightGrowthScreen() {
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();

  const headerDate = useMemo(() => formatHeaderDate(new Date()), []);

  const { readings, setAll, setOne } = useSensorReadings();

  const [sensorModalOpen, setSensorModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"all" | "single">("all");
  const [singleKey, setSingleKey] = useState<"airT" | "RH" | "EC" | "pH">("airT");

  // Loading states for individual sensors
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingTemp, setLoadingTemp] = useState(false);
  const [loadingEC, setLoadingEC] = useState(false);
  const [loadingRH, setLoadingRH] = useState(false);
  const [loadingPH, setLoadingPH] = useState(false);

  // Load schedules from AsyncStorage
  const [schedules, setSchedules] = useState<Slot[]>([]);

  useEffect(() => {
    loadSchedules();

    // Listen for navigation focus to reload schedules when returning from ScheduleTimeSlotsScreen
    const unsubscribe = navigation.addListener('focus', () => {
      loadSchedules();
    });

    return unsubscribe;
  }, [navigation]);

  const loadSchedules = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Slot[] = JSON.parse(saved);
        setSchedules(parsed);
      } else {
        setSchedules([]);
      }
    } catch (error) {
      console.error("Failed to load schedules:", error);
      setSchedules([]);
    }
  };

  const handleToggleSchedule = async (id: string, value: boolean) => {
    try {
      const updated = schedules.map((s) => (s.id === id ? { ...s, enabled: value } : s));
      setSchedules(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to update schedule:", error);
    }
  };

  const openAll = () => {
    setModalMode("all");
    setSensorModalOpen(true);
  };

  const openOne = (k: "airT" | "RH" | "EC" | "pH") => {
    setSingleKey(k);
    setModalMode("single");
    setSensorModalOpen(true);
  };

  const go = (routeName: string) => {
    try {
      navigation.navigate(routeName);
    } catch {
      // ignore
    }
  };

  // Fetch all sensor readings from device simulator
  const handleCheckForUpdates = async () => {
    try {
      setLoadingAll(true);

      const ZONE_ID = "z01";
      const deviceSensors = await getDeviceSensors(ZONE_ID, "NORMAL");

      const mappedSensors = {
        airT: deviceSensors.temperature_c,
        RH: deviceSensors.humidity_pct,
        EC: deviceSensors.ec_ms_cm,
        pH: deviceSensors.ph,
      };

      setAll(mappedSensors);

      // Optional: Ingest to ML backend
      try {
        await axios.post(`${ML_BASE_URL}/infer/iot/ingest`, {
          device_id: deviceSensors.device_id,
          zone_id: deviceSensors.zone_id,
          plant_id: "p04",
          ts: deviceSensors.timestamp,
          airT: deviceSensors.temperature_c,
          RH: deviceSensors.humidity_pct,
          EC: deviceSensors.ec_ms_cm,
          pH: deviceSensors.ph,
        });
      } catch (e) {
        console.warn("Failed to ingest sensor data to ML backend:", e);
      }

      // Success - no alert shown
    } catch (error: any) {
      Alert.alert(
        "Update Failed",
        error?.message || "Failed to fetch sensor readings. Ensure device simulator is running.",
        [{ text: "OK" }]
      );
    } finally {
      setLoadingAll(false);
    }
  };

  // Fetch individual sensor reading
  const handleRetryOne = async (key: "airT" | "RH" | "EC" | "pH") => {
    const setLoading = {
      airT: setLoadingTemp,
      RH: setLoadingRH,
      EC: setLoadingEC,
      pH: setLoadingPH,
    }[key];

    const sensorName = {
      airT: "Temperature",
      RH: "Humidity",
      EC: "EC Level",
      pH: "pH",
    }[key];

    try {
      setLoading(true);

      const ZONE_ID = "z01";
      const deviceSensors = await getDeviceSensors(ZONE_ID, "NORMAL");

      const value = {
        airT: deviceSensors.temperature_c,
        RH: deviceSensors.humidity_pct,
        EC: deviceSensors.ec_ms_cm,
        pH: deviceSensors.ph,
      }[key];

      setOne(key, value);

      // Optional: Ingest to ML backend
      try {
        await axios.post(`${ML_BASE_URL}/infer/iot/ingest`, {
          device_id: deviceSensors.device_id,
          zone_id: deviceSensors.zone_id,
          plant_id: "p04",
          ts: deviceSensors.timestamp,
          airT: deviceSensors.temperature_c,
          RH: deviceSensors.humidity_pct,
          EC: deviceSensors.ec_ms_cm,
          pH: deviceSensors.ph,
        });
      } catch (e) {
        console.warn("Failed to ingest sensor data to ML backend:", e);
      }

      // Success - no alert shown
    } catch (error: any) {
      Alert.alert(
        "Update Failed",
        error?.message || `Failed to fetch ${sensorName}. Ensure device simulator is running.`,
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      {/* Top header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
        <Text className="text-[13px] text-gray-500">{headerDate}</Text>
        <View className="flex-row items-start justify-between mt-2">
          <View className="flex-1 pr-3">
            <Text className="H1 text-gray-900">WEIGHT ESTIMATION & GROWTH FORECAST</Text>
          </View>

          <View className="relative mt-1">
            <Image source={{ uri: "https://i.pravatar.cc/100?img=12" }} className="w-12 h-12 rounded-full" />
            <View className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}
      >
        {/* Environment */}
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-[20px] font-extrabold text-gray-900">Environment</Text>

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
              value={readings.airT != null ? `${readings.airT}` : "--"}
              unit="°C"
              status={statusFor("airT", readings.airT)}
              onRetryPress={() => handleRetryOne("airT")}
              loading={loadingTemp}
            />

            <MetricCard
              iconBg="bg-[#F3E8FF]"
              icon={<Ionicons name="flash-outline" size={20} color="#7C3AED" />}
              label="EC Level"
              value={readings.EC != null ? `${readings.EC}` : "--"}
              unit="ms/cm"
              status={statusFor("EC", readings.EC)}
              onRetryPress={() => handleRetryOne("EC")}
              loading={loadingEC}
            />
          </View>

          <View className="flex-row justify-between mt-3">
            <MetricCard
              iconBg="bg-[#E8F7FF]"
              icon={<Ionicons name="water-outline" size={20} color="#0284C7" />}
              label="Humidity"
              value={readings.RH != null ? `${readings.RH}` : "--"}
              unit="%"
              status={statusFor("RH", readings.RH)}
              onRetryPress={() => handleRetryOne("RH")}
              loading={loadingRH}
            />

            <MetricCard
              iconBg="bg-[#EAF4FF]"
              icon={<MaterialCommunityIcons name="water-check-outline" size={20} color="#0046AD" />}
              label="Water pH"
              value={readings.pH != null ? `${readings.pH}` : "--"}
              status={statusFor("pH", readings.pH)}
              onRetryPress={() => handleRetryOne("pH")}
              loading={loadingPH}
            />
          </View>
        </View>

        {/* Small actions row */}
        <View className="flex-row items-center justify-between mt-6">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCheckForUpdates}
            disabled={loadingAll}
            className="flex-row items-center bg-white rounded-[14px] px-3 py-2"
          >
            {loadingAll ? (
              <>
                <ActivityIndicator size="small" color="#1D4ED8" />
                <Text className="ml-2 text-[12px] font-bold text-gray-700">Updating...</Text>
              </>
            ) : (
              <>
                <Ionicons name="sync-outline" size={16} color="#1D4ED8" />
                <Text className="ml-2 text-[12px] font-bold text-gray-700">Check for Updates</Text>
              </>
            )}
          </TouchableOpacity>
          <SmallActionButton
            icon={<Ionicons name="time-outline" size={16} color="#1D4ED8" />}
            label="View All Past Activities"
            onPress={() => go("History")}
          />
        </View>

        {/* Scheduled time slots (CLICKABLE) - Now dynamic */}
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
              <Text className="text-[14px] font-extrabold text-gray-900">Scheduled Time Slots</Text>
              <Text className="text-[11px] text-gray-500 mt-0.5">
                {schedules.length > 0 ? "Daily sensor logging" : "No schedules set"}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </View>

          {schedules.length > 0 ? (
            schedules.map((slot, index) => (
              <View key={slot.id}>
                {index > 0 && <View className="h-px bg-gray-100" />}
                <SlotRow
                  label={slot.name.toUpperCase()}
                  time={slot.timeLabel}
                  value={slot.enabled}
                  onChange={(v) => handleToggleSchedule(slot.id, v)}
                />
              </View>
            ))
          ) : (
            <View className="py-4 items-center">
              <Text className="text-[11px] text-gray-400">No time slots configured</Text>
              <Text className="text-[10px] text-gray-400 mt-1">Tap to add schedules</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Actions */}
        <Text className="text-[14px] font-extrabold text-gray-900 mt-6 mb-3">Actions</Text>

        <View className="flex-row justify-between">
          <ActionTile
            iconBg="bg-[#EAF4FF]"
            icon={<MaterialCommunityIcons name="scale-bathroom" size={20} color="#0046AD" />}
            labelTop="Estimate"
            labelBottom="Weight"
            onPress={() => navigation.navigate("EstimateWeightScan")}
          />
          <ActionTile
            iconBg="bg-[#E9FBEF]"
            icon={<Ionicons name="analytics-outline" size={20} color="#16A34A" />}
            labelTop="Monitor"
            labelBottom="Growth"
            onPress={() => navigation.navigate("GrowthForecasting")}
          />
          <ActionTile
            iconBg="bg-[#FFEAF2]"
            icon={<Ionicons name="leaf-outline" size={20} color="#DB2777" />}
            labelTop="Plant"
            labelBottom="Lists"
            onPress={() => navigation.navigate("PlantLists")}
          />
        </View>
      </ScrollView>

      {/* Manual sensor input modal */}
      <SensorReadingsModal
        visible={sensorModalOpen}
        mode={modalMode}
        singleKey={singleKey}
        initial={{ airT: readings.airT, RH: readings.RH, EC: readings.EC, pH: readings.pH }}
        onClose={() => setSensorModalOpen(false)}
        onSubmit={(vals) => {
          if (modalMode === "all") setAll(vals);
          else setOne(singleKey, (vals as any)[singleKey] ?? null);
        }}
      />
    </SafeAreaView>
  );
}
