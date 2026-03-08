import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useAuth } from "../../auth/useAuth";
import { getDashboardLatest, DashboardMetricsResponse } from "../../api/dashboardApi";
import { getDeviceSensors } from "../../api/deviceApi";
import axios from 'axios';
import { ML_BASE_URL } from '../../utils/constants';
import LeafHealthNavigator from "../../navigation/LeafHealthNavigator";

type NotificationItem = {
  id: string;
  accent: "orange" | "blue" | "green" | "red";
  iconName: "alert-circle" | "calendar" | "check-circle" | "alert-triangle";
  title: string;
  body: string;
  time: string;
};

type ActivityItem = {
  id: string;
  iconBg: string;
  iconName: string;
  iconLib: "ionicons" | "material" | "feather";
  title: string;
  subtitle: string;
  time: string;
};

const mockNotifications: NotificationItem[] = [
  {
    id: "n1",
    accent: "orange",
    iconName: "alert-circle",
    title: "Water Tank Low",
    body: "The main reservoir level is below 20%. Refill needed within 4 hours.",
    time: "15 mins ago",
  },
  {
    id: "n2",
    accent: "blue",
    iconName: "calendar",
    title: "Nutrient Schedule",
    body: "Weekly nutrient mix top-up is scheduled for tomorrow morning.",
    time: "1 hour ago",
  },
];

const mockActivities: ActivityItem[] = [
  {
    id: "a1",
    iconBg: "bg-[#EAF4FF]",
    iconName: "sprout",
    iconLib: "material",
    title: "Scanned Lettuce #4",
    subtitle: "Weight recorded: 245g",
    time: "10:42 AM",
  },
  {
    id: "a2",
    iconBg: "bg-[#E9FBEF]",
    iconName: "water-outline",
    iconLib: "ionicons",
    title: "pH Adjustment",
    subtitle: "Auto-balanced to 6.2",
    time: "09:15 AM",
  },
  {
    id: "a3",
    iconBg: "bg-[#F3E8FF]",
    iconName: "sun",
    iconLib: "feather",
    title: "Light Cycle Started",
    subtitle: "Day mode activated",
    time: "08:00 AM",
  },
];

function formatHeaderDate(d: Date) {
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  return `${month} ${day} • Sunny 24°C`;
}

type DashboardNav = NativeStackNavigationProp<
  DashboardStackParamList,
  "DashboardHome"
>;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNav>();
  const headerDate = useMemo(() => formatHeaderDate(new Date()), []);

  const { user, signOut, accessToken } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Add loading state for "Check for Updates"
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  // ✅ Add state for water quality data (turbidity)
  const [turbidity, setTurbidity] = useState<number | null>(null);

  // ✅ Add state for chiller room data
  const [chillerTemp, setChillerTemp] = useState<number | null>(null);
  const [chillerHumidity, setChillerHumidity] = useState<number | null>(null);

  // Notifications and Activities state
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [activities, setActivities] = useState<ActivityItem[]>(mockActivities);

  // Fetch dashboard metrics
  const fetchDashboard = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const data = await getDashboardLatest({ token: accessToken });
      setMetrics(data);
      
      // ✅ Fetch turbidity from water quality API
      try {
        const { getWaterHistory } = await import('../../api/WaterQualityApi');
        const hist = await getWaterHistory('TANK_01', 1);
        if (hist.readings && hist.readings.length > 0) {
          setTurbidity(hist.readings[hist.readings.length - 1].turb_ntu);
        }
      } catch (waterErr) {
        console.warn('Failed to fetch turbidity:', waterErr);
        setTurbidity(null);
      }

      // ✅ Fetch chiller room data (mock for now - replace with actual API)
      setChillerTemp(18.5);
      setChillerHumidity(65);
      
    } catch (error: any) {
      console.error("Failed to fetch dashboard:", error);
      
      const mockData: DashboardMetricsResponse = {
        zone_id: "all",
        zone_name: "All Zones",
        plant_count: 24,
        harvest_ready_count: 5,
        avg_growth_pct: 78.5,
        temperature_c: 23.5,
        humidity_pct: 62.0,
        ec_ms_cm: 1.4,
        ph: 6.2,
        last_updated: new Date().toISOString(),
      };
      setMetrics(mockData);
      setTurbidity(2.5);
      setChillerTemp(18.5);
      setChillerHumidity(65);
      
      if (!isRefreshing) {
        console.warn("Using mock data - backend endpoint not available");
      }
    },
    [accessToken]
  );

  // ✅ New function: Fetch fresh sensor readings from device simulator
  const handleCheckForUpdates = async () => {
    try {
      setLoadingUpdate(true);

      const ZONE_ID = "z01";
      const deviceSensors = await getDeviceSensors(ZONE_ID, "NORMAL");

      // Update metrics with fresh sensor data
      const updatedMetrics: DashboardMetricsResponse = {
        ...metrics,
        zone_id: deviceSensors.zone_id,
        zone_name: "Zone 01",
        temperature_c: deviceSensors.temperature_c,
        humidity_pct: deviceSensors.humidity_pct,
        ec_ms_cm: deviceSensors.ec_ms_cm,
        ph: deviceSensors.ph,
        last_updated: deviceSensors.timestamp,
        plant_count: metrics?.plant_count ?? 0,
        harvest_ready_count: metrics?.harvest_ready_count ?? 0,
        avg_growth_pct: metrics?.avg_growth_pct ?? 0,
      };

      setMetrics(updatedMetrics);

      // Fetch turbidity
      try {
        const { getWaterHistory } = await import('../../api/WaterQualityApi');
        const hist = await getWaterHistory('TANK_01', 1);
        if (hist.readings && hist.readings.length > 0) {
          setTurbidity(hist.readings[hist.readings.length - 1].turb_ntu);
        }
      } catch (waterErr) {
        console.warn('Failed to fetch turbidity:', waterErr);
      }

      // Optional: Ingest to ML backend
      try {
        const payload = {
          device_id: deviceSensors.device_id,
          zone_id: deviceSensors.zone_id,
          plant_id: "p04",
          ts: deviceSensors.timestamp,
          air_temp_c: deviceSensors.temperature_c,
          humidity_pct: deviceSensors.humidity_pct,
          ec_ms_cm: deviceSensors.ec_ms_cm,
          ph: deviceSensors.ph,
        };

        await axios.post(`${ML_BASE_URL}/infer/iot/ingest`, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });
        
        console.log("✅ ML backend ingested successfully");
      } catch (e: any) {
        console.warn("⚠️  Failed to ingest sensor data to ML backend:", {
          status: e?.response?.status,
          data: e?.response?.data,
          message: e?.message,
        });
      }

      // ✅ Show success feedback
      Alert.alert("✅ Updated", "Sensor readings refreshed successfully", [{ text: "OK" }]);
    } catch (error: any) {
      Alert.alert(
        "Update Failed",
        error?.message || "Failed to fetch sensor readings. Ensure device simulator is running.",
        [{ text: "OK" }]
      );
    } finally {
      setLoadingUpdate(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard(true);
  }, [fetchDashboard]);

 const openSpoilageModule = (
  screen: "SpoilageDetails" | "SpoilageScan" = "SpoilageDetails",
  params?: {
    plantId?: string;
    demoMode?: boolean;
    initialDemoDayIndex?: number;
  }
) => {
  try {
    if (screen === "SpoilageDetails") {
      navigation.navigate("SpoilageModule", {
        screen: "SpoilageDetails",
      });
      return;
    }

    navigation.navigate("SpoilageModule", {
      screen: "SpoilageScan",
      params,
    });
  } catch {
    Alert.alert("Navigation", "Spoilage module route is not available.");
  }
};

  const go = (routeName: keyof DashboardStackParamList | "Scan" | "History") => {
    try {
      navigation.navigate(routeName as never);
    } catch {
      Alert.alert("Navigation", `Route not found: ${String(routeName)}`);
    }
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => setNotifications([]),
        },
      ]
    );
  };

  const handleLogout = async () => {
    try {
      setProfileOpen(false);
      await signOut();
    } catch {
      Alert.alert("Logout failed", "Please try again.");
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      <View className="px-4 pt-4 pb-3">
        <Text className="text-[11px] text-gray-500 font-semibold tracking-[0.4px]">
          {headerDate}
        </Text>

        <View className="flex-row items-start justify-between mt-2">
          <View>
            <Text className="text-[24px] font-extrabold text-gray-900 leading-[30px]">
              Good Morning,
            </Text>
            <Text className="text-[24px] font-extrabold text-[#0046AD] leading-[30px]">
              {user?.name ?? "Farmer"}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setProfileOpen(true)}
            className="relative mt-1"
          >
            <Image
              source={{ uri: "https://i.pravatar.cc/100?img=12" }}
              className="w-11 h-11 rounded-full"
            />
            <View className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 0,
          paddingBottom: 16,
        }}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#0046AD" />
            <Text className="text-gray-500 mt-4">Loading dashboard...</Text>
          </View>
        ) : metrics ? (
          <>
            {/* Environment Metrics */}
            <View className="mt-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-[20px] font-extrabold text-gray-900">Environment</Text>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                  <Text className="text-[11px] font-bold text-gray-500">Live Data</Text>
                </View>
              </View>

              {/* Metrics 2x2 Grid - Row 1 */}
              <View className="flex-row justify-between">
                <EnvironmentMetricCard
                  iconBg="bg-[#FFEAF2]"
                  icon={<Feather name="thermometer" size={20} color="#DB2777" />}
                  label="Temperature"
                  value={metrics?.temperature_c != null ? `${metrics.temperature_c}` : "--"}
                  unit="°C"
                  status={getStatus("airT", metrics?.temperature_c ?? null)}
                />

                <EnvironmentMetricCard
                  iconBg="bg-[#F3E8FF]"
                  icon={<Ionicons name="flash-outline" size={20} color="#7C3AED" />}
                  label="EC Level"
                  value={metrics?.ec_ms_cm != null ? `${metrics.ec_ms_cm}` : "--"}
                  unit="ms/cm"
                  status={getStatus("EC", metrics?.ec_ms_cm ?? null)}
                />
              </View>

              {/* Metrics 2x2 Grid - Row 2 */}
              <View className="flex-row justify-between mt-3">
                <EnvironmentMetricCard
                  iconBg="bg-[#E8F7FF]"
                  icon={<Ionicons name="water-outline" size={20} color="#0284C7" />}
                  label="Humidity"
                  value={metrics?.humidity_pct != null ? `${metrics.humidity_pct}` : "--"}
                  unit="%"
                  status={getStatus("RH", metrics?.humidity_pct ?? null)}
                />

                <EnvironmentMetricCard
                  iconBg="bg-[#EAF4FF]"
                  icon={<MaterialCommunityIcons name="water-check-outline" size={20} color="#0046AD" />}
                  label="Water pH"
                  value={metrics?.ph != null ? `${metrics.ph}` : "--"}
                  status={getStatus("pH", metrics?.ph ?? null)}
                />
              </View>

              {/* Metrics 2x2 Grid - Row 3 (Turbidity) */}
              <View className="flex-row justify-between mt-3">
                <EnvironmentMetricCard
                  iconBg="bg-[#F0FDF4]"
                  icon={<Ionicons name="eye-outline" size={20} color="#10B981" />}
                  label="Turbidity"
                  value={turbidity != null ? `${turbidity.toFixed(1)}` : "--"}
                  unit="NTU"
                  status={getStatus("turbidity", turbidity)}
                />

                {/* Empty card to maintain layout */}
                <View className="w-[48%]" />
              </View>

              {/* ✅ Check for Updates Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleCheckForUpdates}
                disabled={loadingUpdate}
                className="mt-4 bg-white rounded-[14px] px-4 py-3 flex-row items-center justify-center shadow-sm"
              >
                {loadingUpdate ? (
                  <>
                    <ActivityIndicator size="small" color="#1D4ED8" />
                    <Text className="ml-2 text-[12px] font-bold text-gray-700">Updating...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="sync-outline" size={18} color="#1D4ED8" />
                    <Text className="ml-2 text-[12px] font-bold text-gray-700">Check for Updates</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Chiller Room Section */}
            <View className="mt-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-[20px] font-extrabold text-gray-900">Chiller Room</Text>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                  <Text className="text-[11px] font-bold text-gray-500">Monitored</Text>
                </View>
              </View>

              <View className="flex-row justify-between">
                <EnvironmentMetricCard
                  iconBg="bg-[#DBEAFE]"
                  icon={<Feather name="thermometer" size={20} color="#1D4ED8" />}
                  label="Temperature"
                  value={chillerTemp != null ? `${chillerTemp}` : "--"}
                  unit="°C"
                  status={getStatus("chillerTemp", chillerTemp)}
                />

                <EnvironmentMetricCard
                  iconBg="bg-[#E0F2FE]"
                  icon={<Ionicons name="water-outline" size={20} color="#0284C7" />}
                  label="Humidity"
                  value={chillerHumidity != null ? `${chillerHumidity}` : "--"}
                  unit="%"
                  status={getStatus("chillerHumidity", chillerHumidity)}
                />
              </View>
            </View>

            {/* Feature 2x2 grid */}
            <View className="mt-6">
              <Text className="text-[20px] font-extrabold text-gray-900 mb-3">Features</Text>
              
              <View className="flex-row justify-between">
                <FeatureCard
                  title="Weight & Growth"
                  subtitle="Forecasting & Estimation"
                  iconBg="bg-[#EAF4FF]"
                  icon={
                    <MaterialCommunityIcons
                      name="sprout"
                      size={22}
                      color="#0046AD"
                    />
                  }
                  onPress={() => go("WeightGrowth")}
                />
                <FeatureCard
                  title="Disease Detection"
                  subtitle="Analyze Plant Health"
                  iconBg="bg-[#FFEAF2]"
                  icon={<Ionicons name="medkit-outline" size={22} color="#DB2777" />}
                  onPress={() => navigation.navigate("LeafHealth")}
                />
              </View>

              <View className="flex-row justify-between mt-3">
                <FeatureCard
                  title="Spoilage Detection"
                  subtitle="Identify Crop Issues"
                  iconBg="bg-[#FFF6E5]"
                  icon={
                    <Ionicons
                      name="warning-outline"
                      size={22}
                      color="#F59E0B"
                    />
                  }
                  onPress={() => openSpoilageModule("SpoilageDetails")}
                />
                <FeatureCard
                  title="Water Quality"
                  subtitle="Monitor Sensor data"
                  iconBg="bg-[#E8F7FF]"
                  icon={
                    <Ionicons
                      name="water-outline"
                      size={22}
                      color="#0284C7"
                    />
                  }
                  onPress={() => (navigation.getParent() as any)?.navigate("WaterQuality")}
                />
              </View>
            </View>

            {/* Quick Actions section removed */}

            {/* Notifications section removed */}

            {activities.length > 0 && (
              <>
                <View className="flex-row items-center justify-between mt-6 mb-3">
                  <Text className="text-[13px] font-extrabold text-gray-900">
                    Recent Activities
                  </Text>
                  <TouchableOpacity
                    onPress={() => go("History")}
                    activeOpacity={0.85}
                  >
                    <Text className="text-[11px] font-extrabold text-[#0046AD]">
                      View All
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="bg-white rounded-[18px] shadow-sm overflow-hidden">
                  {activities.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ActivityRow {...activity} />
                      {index < activities.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}

                  <TouchableOpacity
                    className="py-4 items-center"
                    activeOpacity={0.85}
                    onPress={() => go("History")}
                  >
                    <Text className="text-[13px] font-semibold text-gray-700">
                      View All Activity
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        ) : null}
      </ScrollView>

      <Modal
        visible={profileOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setProfileOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setProfileOpen(false)}
        />

        <View className="bg-white rounded-t-3xl px-5 pt-4 pb-6">
          <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-4" />

          <View className="flex-row items-center">
            <Image
              source={{ uri: "https://i.pravatar.cc/100?img=12" }}
              className="w-12 h-12 rounded-full"
            />
            <View className="ml-3 flex-1">
              <Text className="text-[16px] font-extrabold text-gray-900">
                {user?.name ?? "Farmer"}
              </Text>
              <Text className="text-[12px] text-gray-500 mt-0.5">
                {user?.email ?? "farmer@example.com"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setProfileOpen(false)}
              className="w-9 h-9 rounded-full bg-[#F3F4F6] items-center justify-center"
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <View className="h-px bg-gray-100 my-4" />

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleLogout}
            className="h-[52px] rounded-2xl bg-[#EF4444] items-center justify-center"
          >
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={18} color="white" />
              <Text className="text-white text-[14px] font-extrabold ml-2">
                Log out
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------- components ---------- */

type Status = "Good" | "Optimal" | "Low";

function getStatus(key: "airT" | "RH" | "EC" | "pH" | "turbidity" | "chillerTemp" | "chillerHumidity", value: number | null): Status {
  if (value === null || value === undefined) return "Low";
  
  const ranges: Record<string, { optimal: [number, number]; good: [number, number] }> = {
    airT: { optimal: [22, 28], good: [18, 32] },
    RH: { optimal: [50, 70], good: [40, 80] },
    EC: { optimal: [1.2, 1.8], good: [0.8, 2.2] },
    pH: { optimal: [5.5, 6.5], good: [5.0, 7.0] },
    turbidity: { optimal: [0, 3], good: [0, 5] },
    chillerTemp: { optimal: [15, 20], good: [12, 22] },
    chillerHumidity: { optimal: [60, 75], good: [50, 85] }, // ✅ Chiller room humidity range
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

function EnvironmentMetricCard({
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

      <View className="flex-row items-end mt-1">
        <Text className="text-[20px] font-extrabold text-gray-900">{value}</Text>
        {unit ? <Text className="text-[12px] text-gray-400 ml-1 mb-[2px]">{unit}</Text> : null}
      </View>
    </View>
  );
}

function FeatureCard({
  title,
  subtitle,
  icon,
  iconBg,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-white rounded-[18px] p-4 w-[48%]"
    >
      <View className={`w-11 h-11 rounded-full ${iconBg} items-center justify-center`}>
        {icon}
      </View>

      <Text className="mt-4 text-[15px] font-extrabold text-gray-900">
        {title}
      </Text>
      <Text className="mt-1 text-[12px] text-gray-500">{subtitle}</Text>
    </TouchableOpacity>
  );
}

function QuickAction({
  top,
  bottom,
  icon,
  iconBg,
  onPress,
}: {
  top: string;
  bottom: string;
  icon: React.ReactNode;
  iconBg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-white rounded-[18px] w-[23%] pt-4 pb-3 items-center shadow-sm"
    >
      <View className={`w-11 h-11 rounded-full ${iconBg} items-center justify-center`}>
        {icon}
      </View>

      <View className="mt-3 items-center">
        <Text className="text-[13px] text-gray-800 font-extrabold leading-[16px]">
          {top}
        </Text>
        <Text className="text-[13px] text-gray-800 font-extrabold leading-[16px]">
          {bottom}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function NotificationCard({
  accent,
  iconName,
  title,
  body,
  time,
  onDismiss,
}: {
  accent: "orange" | "blue" | "green" | "red";
  iconName: "alert-circle" | "calendar" | "check-circle" | "alert-triangle";
  title: string;
  body: string;
  time: string;
  onDismiss: () => void;
}) {
  const colors = {
    orange: { bar: "bg-orange-400", iconBg: "bg-[#FFF6E5]", iconColor: "#F59E0B" },
    blue: { bar: "bg-blue-600", iconBg: "bg-[#EAF2FF]", iconColor: "#2563EB" },
    green: { bar: "bg-green-500", iconBg: "bg-[#E9FBEF]", iconColor: "#16A34A" },
    red: { bar: "bg-red-500", iconBg: "bg-[#FFE5E5]", iconColor: "#EF4444" },
  };

  const { bar, iconBg, iconColor } = colors[accent];

  return (
    <View className="bg-white rounded-[18px] shadow-sm overflow-hidden">
      <View className="flex-row">
        <View className={`w-1.5 ${bar}`} />
        <View className="flex-1 px-4 py-4">
          <View className="flex-row items-center">
            <View className={`w-10 h-10 rounded-[14px] ${iconBg} items-center justify-center mr-3`}>
              <Ionicons name={iconName as any} size={18} color={iconColor} />
            </View>

            <View className="flex-1">
              <Text className="text-[15px] font-extrabold text-gray-900">
                {title}
              </Text>
              <Text className="text-[11px] text-gray-400 mt-0.5">{time}</Text>
            </View>

            <TouchableOpacity
              onPress={onDismiss}
              activeOpacity={0.7}
              className="w-8 h-8 rounded-full bg-red-50 items-center justify-center"
            >
              <Ionicons name="close" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>

          <Text className="text-[12px] text-gray-600 mt-3 leading-[16px]">
            {body}
          </Text>
        </View>
      </View>
    </View>
  );
}

function ActivityRow({
  iconBg,
  iconName,
  iconLib,
  title,
  subtitle,
  time,
}: {
  iconBg: string;
  iconName: string;
  iconLib: "ionicons" | "material" | "feather";
  title: string;
  subtitle: string;
  time: string;
}) {
  const renderIcon = () => {
    const iconColor = iconBg.includes("EAF4FF")
      ? "#0046AD"
      : iconBg.includes("E9FBEF")
      ? "#16A34A"
      : "#7C3AED";

    if (iconLib === "material") {
      return <MaterialCommunityIcons name={iconName as any} size={18} color={iconColor} />;
    } else if (iconLib === "ionicons") {
      return <Ionicons name={iconName as any} size={18} color={iconColor} />;
    } else {
      return <Feather name={iconName as any} size={18} color={iconColor} />;
    }
  };

  return (
    <View className="flex-row items-center px-4 py-4">
      <View className={`w-10 h-10 rounded-full ${iconBg} items-center justify-center mr-3`}>
        {renderIcon()}
      </View>

      <View className="flex-1">
        <Text className="text-[14px] font-extrabold text-gray-900">{title}</Text>
        <Text className="text-[11px] text-gray-500 mt-0.5">{subtitle}</Text>
      </View>

      <Text className="text-[11px] text-gray-400">{time}</Text>
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-gray-100 mx-4" />;
}