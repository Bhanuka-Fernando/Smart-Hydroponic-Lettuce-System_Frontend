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

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const headerDate = useMemo(() => formatHeaderDate(new Date()), []);

  const { user, signOut, accessToken } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  
  // Dashboard state
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Notifications and Activities state
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [activities, setActivities] = useState<ActivityItem[]>(mockActivities);

  // Fetch dashboard metrics
  const fetchDashboard = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const data = await getDashboardLatest({ token: accessToken });
      setMetrics(data);
    } catch (error: any) {
      console.error("Failed to fetch dashboard:", error);
      
      // Use mock data if API is not available
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
      
      if (!isRefreshing) {
        console.warn("Using mock data - backend endpoint not available");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  // Fetch on mount
  useEffect(() => {
    fetchDashboard();
  }, []);

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

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
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

            <View className="flex-row justify-between mt-3">
              <FeatureCard
                title="Spoilage Detection"
                subtitle="Identify Crop Issues"
                iconBg="bg-[#FFF6E5]"
                icon={<Ionicons name="warning-outline" size={22} color="#F59E0B" />}
                onPress={() => (navigation.getParent() as any)?.navigate("Spoilage")}
              />
              <FeatureCard
                title="Water Quality"
                subtitle="Monitor Sensor data"
                iconBg="bg-[#E8F7FF]"
                icon={<Ionicons name="water-outline" size={22} color="#0284C7" />}
                onPress={() => go("Scan")}
              />
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
            onPress={() => navigation.navigate("SpoilageDetails")}
          />
        </View>

        {/* Notifications */}
        {notifications.length > 0 && (
          <>
            <View className="flex-row items-center justify-between mt-6 mb-3">
              <Text className="text-[13px] font-extrabold text-gray-900">
                Notifications
              </Text>

              <View className="flex-row items-center gap-2">
                <View className="bg-red-500 rounded-full px-3 py-1">
                  <Text className="text-white text-[11px] font-extrabold">
                    {notifications.length} New
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleClearAllNotifications}
                  activeOpacity={0.7}
                  className="px-3 py-1 rounded-full bg-gray-100"
                >
                  <Text className="text-[11px] font-extrabold text-gray-600">
                    Clear All
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <NotificationCard
                  {...notification}
                  onDismiss={() => handleDismissNotification(notification.id)}
                />
                {index < notifications.length - 1 && <View className="h-3" />}
              </React.Fragment>
            ))}
          </>
        )}

        {/* Recent Activities */}
        {activities.length > 0 && (
          <>
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
