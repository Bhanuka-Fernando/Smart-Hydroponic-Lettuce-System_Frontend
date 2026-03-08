import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import {
  getLeafHealthAllLogs,
  getLeafHealthDashboardCritical,
  getLeafHealthLogById,
  type LeafHealthRecentItem,
} from "../../api/LeafHealthApi";

function formatHeaderDate(d: Date) {
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  return `${month} ${day} • Sunny 24°C`;
}

function formatCapturedAt(value?: string) {
  if (!value) return "Unknown time";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins === 1) return "1 min ago";
  if (diffMins < 60) return `${diffMins} mins ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;

  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusTheme(status: string) {
  if (status === "OK") {
    return {
      badgeBg: "bg-[#E9FBEF]",
      badgeText: "text-[#15803D]",
      scoreBg: "bg-[#E9FBEF]",
      scoreText: "text-[#15803D]",
      iconBg: "bg-[#E9FBEF]",
      iconColor: "#15803D",
      icon: "checkmark-circle" as const,
    };
  }

  if (status === "WATCH") {
    return {
      badgeBg: "bg-[#FFF6E5]",
      badgeText: "text-[#C2410C]",
      scoreBg: "bg-[#FFF6E5]",
      scoreText: "text-[#C2410C]",
      iconBg: "bg-[#FFF6E5]",
      iconColor: "#C2410C",
      icon: "warning" as const,
    };
  }

  return {
    badgeBg: "bg-[#FEF2F2]",
    badgeText: "text-[#B91C1C]",
    scoreBg: "bg-[#FEF2F2]",
    scoreText: "text-[#B91C1C]",
    iconBg: "bg-[#FEF2F2]",
    iconColor: "#B91C1C",
    icon: "alert-circle" as const,
  };
}

export default function LeafHealthDashboardScreen({ navigation }: any) {
  const tabBarHeight = useBottomTabBarHeight();
  const headerDate = useMemo(() => formatHeaderDate(new Date()), []);

  const [items, setItems] = useState<LeafHealthRecentItem[]>([]);
  const [allLogs, setAllLogs] = useState<LeafHealthRecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingId, setOpeningId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    const [criticalRes, allRes] = await Promise.all([
      getLeafHealthDashboardCritical(3),
      getLeafHealthAllLogs(100, 0),
    ]);
    setItems(criticalRes?.items ?? []);
    setAllLogs(allRes?.items ?? []);
  }, []);

  const insights = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recent = allLogs.filter((log) => {
      const d = new Date(log.captured_at);
      return !Number.isNaN(d.getTime()) && d >= sevenDaysAgo;
    });

    const totalScans7d = recent.length;
    const avgHealthScore7d =
      totalScans7d > 0
        ? Math.round(
            recent.reduce((sum, item) => sum + Number(item.health_score || 0), 0) /
              totalScans7d
          )
        : 0;
    const critical7d = recent.filter((item) => item.status === "ACT NOW").length;
    const okCount = recent.filter((item) => item.status === "OK").length;
    const watchCount = recent.filter((item) => item.status === "WATCH").length;
    const actNowCount = recent.filter((item) => item.status === "ACT NOW").length;

    return {
      totalScans7d,
      avgHealthScore7d,
      critical7d,
      okCount,
      watchCount,
      actNowCount,
    };
  }, [allLogs]);

  useEffect(() => {
    (async () => {
      try {
        await loadData();
      } catch (e: any) {
        Alert.alert("Load failed", e?.message || "Could not load leaf health dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadData();
    } catch (e: any) {
      Alert.alert("Refresh failed", e?.message || "Could not refresh dashboard");
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const openFullReport = useCallback(
    async (logId: number) => {
      try {
        setOpeningId(logId);
        const res = await getLeafHealthLogById(logId);
        const item = res?.item;

        if (!item) {
          Alert.alert("Not found", "Could not load full report");
          return;
        }

        const sortedTop3 = item?.probs
          ? Object.fromEntries(
              Object.entries(item.probs)
                .sort((a: any, b: any) => Number(b[1]) - Number(a[1]))
                .slice(0, 3)
            )
          : {};

        navigation.navigate("LeafHealthResult", {
          result: {
            ...item,
            top3_probs: item.top3_probs || sortedTop3,
            primary_issue: item.primary_issue || item.main_issue,
          },
          imageUri: undefined,
        });
      } catch (e: any) {
        Alert.alert("Load failed", e?.message || "Could not open report");
      } finally {
        setOpeningId(null);
      }
    },
    [navigation]
  );

  const openFullHistory = useCallback(() => {
    navigation.navigate("LeafHealthHistory");
  }, [navigation]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}>
        <View className="flex-row items-center justify-between mb-3">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            className="w-10 h-10 items-center justify-center rounded-full bg-white"
            style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
          >
            <Ionicons name="chevron-back" size={20} color="#111827" />
          </TouchableOpacity>

          {/* Title */}
          <Text className="text-[16px] font-extrabold text-gray-900">Leaf Health</Text>

          {/* Spacer */}
          <View className="w-10 h-10" />
        </View>

        {/* Date */}
        <Text className="text-[11px] text-gray-500 font-semibold tracking-[0.4px]">
          {headerDate}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1D4ED8"
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: tabBarHeight + 16,
        }}
      >
        {/* Dashboard Title */}
        <Text className="text-[20px] font-extrabold text-gray-900 mt-1">
          Disease Dashboard
        </Text>
        <Text className="text-[12px] text-gray-500 mt-1 leading-[18px]">
          Review recent detections and start a fresh scan.
        </Text>

        {/* Start New Scan Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("LeafHealthScan")}
          className="mt-5 bg-[#003B8F] rounded-[16px] py-4 items-center justify-center flex-row"
        >
          <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
          <Text className="ml-2 text-[12px] font-extrabold text-white">
            Start New Scan
          </Text>
        </TouchableOpacity>

        {/* Section Header */}
        <View className="flex-row items-center justify-between mt-6 mb-3">
          <Text className="text-[14px] font-extrabold text-gray-900">
            Recent Critical Activity
          </Text>

          <TouchableOpacity activeOpacity={0.85} onPress={openFullHistory}>
            <Text className="text-[11px] font-bold text-blue-700">View full history</Text>
          </TouchableOpacity>
        </View>

        {/* Insights Summary */}
        <View className="bg-white rounded-[18px] shadow-sm p-4 mb-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name="bar-chart-outline" size={16} color="#1D4ED8" />
            <Text className="ml-2 text-[13px] font-extrabold text-gray-900">
              Insights Summary (Last 7 Days)
            </Text>
          </View>

          <View className="flex-row justify-between mb-3">
            <View className="w-[32%] rounded-[14px] bg-[#EEF4FF] px-2 py-3 items-center">
              <Text className="text-[16px] font-extrabold text-[#1D4ED8]">
                {insights.avgHealthScore7d}
              </Text>
              <Text className="text-[10px] text-[#1E3A8A] font-semibold mt-1">
                Avg Score
              </Text>
            </View>

            <View className="w-[32%] rounded-[14px] bg-[#FEF2F2] px-2 py-3 items-center">
              <Text className="text-[16px] font-extrabold text-[#B91C1C]">
                {insights.critical7d}
              </Text>
              <Text className="text-[10px] text-[#7F1D1D] font-semibold mt-1">
                Critical
              </Text>
            </View>

            <View className="w-[32%] rounded-[14px] bg-[#F5F3FF] px-2 py-3 items-center">
              <Text className="text-[16px] font-extrabold text-[#6D28D9]">
                {insights.totalScans7d}
              </Text>
              <Text className="text-[10px] text-[#4C1D95] font-semibold mt-1">
                Total Scans
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between rounded-[14px] bg-[#F8FAFC] px-3 py-3">
            <View className="items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-[#16A34A] mb-1.5" />
              <Text className="text-[11px] font-extrabold text-[#166534]">
                {insights.okCount}
              </Text>
              <Text className="text-[10px] text-gray-500">OK</Text>
            </View>

            <View className="items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-[#EA580C] mb-1.5" />
              <Text className="text-[11px] font-extrabold text-[#9A3412]">
                {insights.watchCount}
              </Text>
              <Text className="text-[10px] text-gray-500">WATCH</Text>
            </View>

            <View className="items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-[#DC2626] mb-1.5" />
              <Text className="text-[11px] font-extrabold text-[#991B1B]">
                {insights.actNowCount}
              </Text>
              <Text className="text-[10px] text-gray-500">ACT NOW</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View className="bg-white rounded-[18px] shadow-sm p-8 items-center">
            <ActivityIndicator size="large" color="#1D4ED8" />
            <Text className="mt-3 text-[12px] font-semibold text-gray-500">
              Loading recent critical reports...
            </Text>
          </View>
        ) : items.length === 0 ? (
          <View className="bg-white rounded-[18px] shadow-sm p-8 items-center">
            <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-4">
              <Ionicons name="document-text-outline" size={28} color="#1D4ED8" />
            </View>
            <Text className="text-[15px] font-extrabold text-gray-900">
              No critical reports yet
            </Text>
            <Text className="text-[12px] text-gray-500 mt-2 text-center leading-[18px] px-4">
              Critical leaf health detections will appear here after you save scan logs.
            </Text>
          </View>
        ) : (
          items.map((item) => {
            const theme = getStatusTheme(item.status);

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() => openFullReport(item.id)}
                className="bg-white rounded-[18px] shadow-sm p-4 mb-3"
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center flex-1 pr-3">
                    <View className={`w-10 h-10 rounded-full ${theme.iconBg} items-center justify-center mr-3`}>
                      <Ionicons name={theme.icon} size={18} color={theme.iconColor} />
                    </View>

                    <View className="flex-1">
                      <View className={`self-start px-2.5 py-1 rounded-full ${theme.badgeBg} mb-2`}>
                        <Text className={`text-[11px] font-extrabold ${theme.badgeText}`}>
                          {item.status}
                        </Text>
                      </View>
                      <Text className="text-[13px] font-extrabold text-gray-900">
                        {item.plant_id}
                      </Text>
                    </View>
                  </View>

                  <View className="items-center">
                    <View className={`w-12 h-12 rounded-full ${theme.scoreBg} items-center justify-center`}>
                      <Text className={`text-[16px] font-extrabold ${theme.scoreText}`}>
                        {item.health_score}
                      </Text>
                    </View>
                    <Text className="text-[10px] text-gray-400 mt-1 font-semibold">
                      Score
                    </Text>
                  </View>
                </View>

                <Text className="text-[12px] font-semibold text-gray-700 mb-3">
                  {item.main_issue}
                </Text>

                <View className="pt-3 border-t border-gray-100 flex-row items-center justify-between">
                  <Text className="text-[10px] text-gray-400">
                    {formatCapturedAt(item.captured_at)}
                  </Text>

                  <View className="flex-row items-center">
                    {openingId === item.id ? (
                      <ActivityIndicator size="small" color="#1D4ED8" />
                    ) : (
                      <>
                        <Text className="text-[11px] font-bold text-blue-700 mr-1">
                          View full report
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color="#1D4ED8" />
                      </>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
