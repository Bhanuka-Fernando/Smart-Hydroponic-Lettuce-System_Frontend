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
import { useAuth } from "../../auth/useAuth";
import { getDashboardLatest, DashboardMetricsResponse } from "../../api/dashboardApi";

function formatHeaderDate(d: Date) {
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  return `${month} ${day} • Sunny 24°C`;
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const headerDate = useMemo(() => formatHeaderDate(new Date()), []);

  const { user, signOut, accessToken } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  
  // Dashboard state
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [selectedZone, setSelectedZone] = useState("z01");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard metrics
  const fetchDashboard = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const data = await getDashboardLatest({ token: accessToken, zone_id: selectedZone });
      setMetrics(data);
    } catch (error: any) {
      console.error("Failed to fetch dashboard:", error);
      
      // Use mock data if API is not available
      const mockData: DashboardMetricsResponse = {
        zone_id: selectedZone,
        zone_name: `Zone ${selectedZone.toUpperCase()}`,
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
      
      if (!isRefreshing) {
        console.warn("Using mock data - backend endpoint not available");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, selectedZone]);

  // Fetch on mount and when zone changes
  useEffect(() => {
    fetchDashboard();
  }, [selectedZone]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard(true);
  }, [fetchDashboard]);

  const go = (routeName: string) => {
    try {
      navigation.navigate(routeName);
    } catch {
      Alert.alert("Navigation", `Route not found: ${routeName}`);
    }
  };

  const handleLogout = async () => {
    try {
      setProfileOpen(false);
      await signOut();
      // RootNavigator will automatically switch back to Auth screens
    } catch {
      Alert.alert("Logout failed", "Please try again.");
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      {/* HEADER */}
      <View className="px-4 pt-4 pb-3">
        <Text className="text-[11px] text-gray-500 font-semibold tracking-[0.4px]">{headerDate}</Text>

        <View className="flex-row items-start justify-between mt-2">
          <View>
            <Text className="text-[24px] font-extrabold text-gray-900 leading-[30px]">
              Good Morning,
            </Text>
            <Text className="text-[24px] font-extrabold text-[#0046AD] leading-[30px]">
              {user?.name ?? "Farmer"}
            </Text>
          </View>

          {/* Profile avatar */}
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

      {/* BODY */}
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
        {/* Zone Selector */}
        <View className="mb-4">
          <Text className="text-[11px] font-extrabold text-gray-700 tracking-[0.6px] mb-2">
            SELECT ZONE
          </Text>
          <View className="flex-row gap-2">
            {["z01", "z02", "z03"].map((zone) => (
              <TouchableOpacity
                key={zone}
                onPress={() => setSelectedZone(zone)}
                activeOpacity={0.85}
                className={`px-4 py-2 rounded-full border ${
                  selectedZone === zone
                    ? "bg-[#EAF4FF] border-[#B6C8F0]"
                    : "bg-white border-gray-200"
                }`}
              >
                <Text
                  className={`text-[11px] font-extrabold ${
                    selectedZone === zone ? "text-[#003B8F]" : "text-gray-600"
                  }`}
                >
                  {zone.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Loading State */}
        {loading && !metrics ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#0046AD" />
            <Text className="text-gray-500 mt-4">Loading dashboard...</Text>
          </View>
        ) : metrics ? (
          <>
            {/* Metrics Cards */}
            <View className="bg-white rounded-[18px] p-4 shadow-sm mb-4">
              <Text className="text-[16px] font-extrabold text-gray-900 mb-3">
                System Overview
              </Text>
              <View className="flex-row justify-between mb-3">
                <View className="flex-1 mr-2">
                  <MetricItem
                    icon={<MaterialCommunityIcons name="sprout" size={18} color="#0046AD" />}
                    label="Total Plants"
                    value={metrics.plant_count.toString()}
                  />
                </View>
                <View className="flex-1 ml-2">
                  <MetricItem
                    icon={<Ionicons name="checkmark-circle" size={18} color="#16A34A" />}
                    label="Harvest Ready"
                    value={metrics.harvest_ready_count.toString()}
                  />
                </View>
              </View>
              <MetricItem
                icon={<Ionicons name="trending-up" size={18} color="#0046AD" />}
                label="Avg Growth"
                value={`${metrics.avg_growth_pct.toFixed(1)}%`}
              />
            </View>

            {/* Sensor Readings */}
            <View className="bg-white rounded-[18px] p-4 shadow-sm mb-4">
              <Text className="text-[16px] font-extrabold text-gray-900 mb-3">
                Sensor Readings
              </Text>
              <View className="flex-row flex-wrap">
                <View className="w-1/2 pr-2 mb-3">
                  <SensorMetric
                    icon={<Ionicons name="thermometer-outline" size={18} color="#EF4444" />}
                    label="Temperature"
                    value={`${metrics.temperature_c.toFixed(1)}°C`}
                    bgColor="bg-red-50"
                  />
                </View>
                <View className="w-1/2 pl-2 mb-3">
                  <SensorMetric
                    icon={<Ionicons name="water-outline" size={18} color="#3B82F6" />}
                    label="Humidity"
                    value={`${metrics.humidity_pct.toFixed(1)}%`}
                    bgColor="bg-blue-50"
                  />
                </View>
                <View className="w-1/2 pr-2">
                  <SensorMetric
                    icon={<MaterialCommunityIcons name="flash" size={18} color="#F59E0B" />}
                    label="EC"
                    value={`${metrics.ec_ms_cm.toFixed(2)} mS/cm`}
                    bgColor="bg-amber-50"
                  />
                </View>
                <View className="w-1/2 pl-2">
                  <SensorMetric
                    icon={<MaterialCommunityIcons name="ph" size={18} color="#8B5CF6" />}
                    label="pH"
                    value={metrics.ph.toFixed(2)}
                    bgColor="bg-purple-50"
                  />
                </View>
              </View>
              <Text className="text-[11px] text-gray-400 mt-3 text-right">
                Last updated: {new Date(metrics.last_updated).toLocaleTimeString()}
              </Text>
            </View>
          </>
        ) : null}
        {/* Feature 2x2 grid */}
        <View className="mt-4">
          <View className="flex-row justify-between">
            <FeatureCard
              title="Weight & Growth"
              subtitle="Forecasting & Estimation"
              iconBg="bg-[#EAF4FF]"
              icon={<MaterialCommunityIcons name="sprout" size={22} color="#0046AD" />}
              onPress={() => go("WeightGrowth")}
            />
            <FeatureCard
              title="Disease Detection"
              subtitle="Analyze Plant Health"
              iconBg="bg-[#FFEAF2]"
              icon={<Ionicons name="medkit-outline" size={22} color="#DB2777" />}
              onPress={() => go("Scan")}
            />
          </View>

          <View className="flex-row justify-between mt-3">
            <FeatureCard
              title="Spoilage Detection"
              subtitle="Identify Crop Issues"
              iconBg="bg-[#FFF6E5]"
              icon={<Ionicons name="warning-outline" size={22} color="#F59E0B" />}
              onPress={() => go("Scan")}
            />
            <FeatureCard
              title="Water Quality"
              subtitle="Monitor Sensor data"
              iconBg="bg-[#E8F7FF]"
              icon={<Ionicons name="water-outline" size={22} color="#0284C7" />}
              onPress={() => go("Scan")}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <Text className="text-[13px] font-extrabold text-gray-900 mt-6 mb-3">
          Quick Actions
        </Text>

        <View className="flex-row justify-between">
          <QuickAction
            top="Estimate"
            bottom="Weight"
            iconBg="bg-[#EAF4FF]"
            icon={<MaterialCommunityIcons name="scale-bathroom" size={20} color="#0046AD" />}
            onPress={() => go("Scan")}
          />
          <QuickAction
            top="Monitor"
            bottom="Growth"
            iconBg="bg-[#E9FBEF]"
            icon={<Ionicons name="analytics-outline" size={20} color="#16A34A" />}
            onPress={() => go("Scan")}
          />
          <QuickAction
            top="Detect"
            bottom="Disease"
            iconBg="bg-[#FFEAF2]"
            icon={<Ionicons name="medkit-outline" size={20} color="#DB2777" />}
            onPress={() => go("Scan")}
          />
          <QuickAction
            top="Spoilage"
            bottom="Check"
            iconBg="bg-[#FFF6E5]"
            icon={<Ionicons name="warning-outline" size={20} color="#F59E0B" />}
            onPress={() => go("Scan")}
          />
        </View>

        {/* Notifications */}
        <View className="flex-row items-center justify-between mt-6 mb-3">
          <Text className="text-[13px] font-extrabold text-gray-900">
            Notifications
          </Text>

          <View className="bg-red-500 rounded-full px-3 py-1">
            <Text className="text-white text-[11px] font-extrabold">2 New</Text>
          </View>
        </View>

        <NotificationCard
          accent="orange"
          iconName="alert-circle"
          title="Water Tank Low"
          body="The main reservoir level is below 20%. Refill needed within 4 hours."
          time="15 mins ago"
        />

        <View className="h-3" />

        <NotificationCard
          accent="blue"
          iconName="calendar"
          title="Nutrient Schedule"
          body="Weekly nutrient mix top-up is scheduled for tomorrow morning."
          time="1 hour ago"
        />

        {/* Recent Activities */}
        <View className="flex-row items-center justify-between mt-6 mb-3">
          <Text className="text-[13px] font-extrabold text-gray-900">
            Recent Activities
          </Text>
          <TouchableOpacity onPress={() => go("History")} activeOpacity={0.85}>
            <Text className="text-[11px] font-extrabold text-[#0046AD]">
              View All
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-[18px] shadow-sm overflow-hidden">
          <ActivityRow
            iconBg="bg-[#EAF4FF]"
            icon={<MaterialCommunityIcons name="sprout" size={18} color="#0046AD" />}
            title="Scanned Lettuce #4"
            subtitle="Weight recorded: 245g"
            time="10:42 AM"
          />
          <Divider />
          <ActivityRow
            iconBg="bg-[#E9FBEF]"
            icon={<Ionicons name="water-outline" size={18} color="#16A34A" />}
            title="pH Adjustment"
            subtitle="Auto-balanced to 6.2"
            time="09:15 AM"
          />
          <Divider />
          <ActivityRow
            iconBg="bg-[#F3E8FF]"
            icon={<Feather name="sun" size={18} color="#7C3AED" />}
            title="Light Cycle Started"
            subtitle="Day mode activated"
            time="08:00 AM"
          />

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
      </ScrollView>

      {/* ✅ Profile Bottom Sheet Modal */}
      <Modal
        visible={profileOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setProfileOpen(false)}
      >
        {/* Backdrop */}
        <Pressable className="flex-1 bg-black/40" onPress={() => setProfileOpen(false)} />

        {/* Sheet */}
        <View className="bg-white rounded-t-3xl px-5 pt-4 pb-6">
          {/* Grab handle */}
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
}: {
  accent: "orange" | "blue";
  iconName: "alert-circle" | "calendar";
  title: string;
  body: string;
  time: string;
}) {
  const leftBar = accent === "orange" ? "bg-orange-400" : "bg-blue-600";
  const iconBg = accent === "orange" ? "bg-[#FFF6E5]" : "bg-[#EAF2FF]";
  const iconColor = accent === "orange" ? "#F59E0B" : "#2563EB";

  return (
    <View className="bg-white rounded-[18px] shadow-sm overflow-hidden">
      <View className="flex-row">
        <View className={`w-1.5 ${leftBar}`} />
        <View className="flex-1 px-4 py-4">
          <View className="flex-row items-center">
            <View className={`w-10 h-10 rounded-[14px] ${iconBg} items-center justify-center mr-3`}>
              <Feather name={iconName} size={18} color={iconColor} />
            </View>

            <View className="flex-1">
              <Text className="text-[15px] font-extrabold text-gray-900">
                {title}
              </Text>
              <Text className="text-[11px] text-gray-400 mt-0.5">{time}</Text>
            </View>
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
  icon,
  title,
  subtitle,
  time,
}: {
  iconBg: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  time: string;
}) {
  return (
    <View className="flex-row items-center px-4 py-4">
      <View className={`w-10 h-10 rounded-full ${iconBg} items-center justify-center mr-3`}>
        {icon}
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

function MetricItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center bg-gray-50 rounded-xl p-3">
      <View className="mr-3">{icon}</View>
      <View className="flex-1">
        <Text className="text-[11px] text-gray-500">{label}</Text>
        <Text className="text-[16px] font-extrabold text-gray-900 mt-0.5">
          {value}
        </Text>
      </View>
    </View>
  );
}

function SensorMetric({
  icon,
  label,
  value,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
}) {
  return (
    <View className={`${bgColor} rounded-xl p-3`}>
      <View className="flex-row items-center mb-2">
        {icon}
        <Text className="text-[11px] text-gray-600 ml-2 font-semibold">
          {label}
        </Text>
      </View>
      <Text className="text-[15px] font-extrabold text-gray-900">{value}</Text>
    </View>
  );
}
