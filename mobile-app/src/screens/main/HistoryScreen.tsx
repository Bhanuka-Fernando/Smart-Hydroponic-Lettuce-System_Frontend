import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import {
  clearActivities,
  deleteActivity,
  getActivities,
  type ActivityFilterType,
  type ActivityItem,
  type ActivityType,
} from "../../utils/activityLog";

export default function HistoryScreen() {
  const [selectedFilter, setSelectedFilter] = useState<ActivityFilterType>("all");
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const loadActivities = useCallback(async () => {
    const items = await getActivities();
    setActivities(items);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [loadActivities])
  );

  const filteredActivities = activities.filter(
    (item) => selectedFilter === "all" || item.type === selectedFilter
  );

  const handleDeleteActivity = (id: string) => {
    Alert.alert(
      "Delete Activity",
      "Are you sure you want to remove this activity from history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteActivity(id);
            setActivities((prev) => prev.filter((item) => item.id !== id));
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Activities",
      "Are you sure you want to clear all activity history? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await clearActivities();
            setActivities([]);
          },
        },
      ]
    );
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "weight_scan":
        return <MaterialCommunityIcons name="scale-bathroom" size={20} color="#0046AD" />;
      case "growth_forecast":
        return <Ionicons name="analytics-outline" size={20} color="#16A34A" />;
      case "spoilage_check":
        return <MaterialCommunityIcons name="food-apple-outline" size={20} color="#F59E0B" />;
      case "water_quality":
        return <Ionicons name="water-outline" size={20} color="#0284C7" />;
      case "system":
        return <Feather name="sun" size={20} color="#7C3AED" />;
      case "disease_check":
        return <Ionicons name="medkit-outline" size={20} color="#DB2777" />;
      default:
        return <Ionicons name="time-outline" size={20} color="#6B7280" />;
    }
  };

  const getIconBg = (type: ActivityType) => {
    switch (type) {
      case "weight_scan":
        return "bg-[#EAF4FF]";
      case "growth_forecast":
        return "bg-[#E9FBEF]";
      case "spoilage_check":
        return "bg-[#FFF6E5]";
      case "water_quality":
        return "bg-[#E8F7FF]";
      case "system":
        return "bg-[#F3E8FF]";
      case "disease_check":
        return "bg-[#FFEAF2]";
      default:
        return "bg-gray-100";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days}d ago`;
    }
  };

  // ✅ Helper function to check if zone should be displayed
  const shouldDisplayZone = (type: ActivityType, zone?: string) => {
    // Don't show zone badge for weight_scan or growth_forecast
    if (type === "weight_scan" || type === "growth_forecast") {
      return false;
    }
    return !!zone;
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Header - Matching DashboardScreen */}
      <View className="px-4 pt-4 pb-3 bg-white">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-[24px] font-extrabold text-gray-900">
              Activity History
            </Text>
            <Text className="text-[11px] text-gray-500 mt-1 font-semibold tracking-[0.4px]">
              {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'} found
            </Text>
          </View>
          {activities.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              activeOpacity={0.85}
              className="px-3.5 py-2 rounded-full bg-[#FFF6E5]"
            >
              <Text className="text-[11px] font-extrabold text-[#F59E0B]">
                CLEAR ALL
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="flex-1 bg-[#F4F6FA]">
        {/* Filters - Horizontal scroll */}
        <View className="mb-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            className="flex-grow-0"
          >
            <FilterChip
              label="All"
              active={selectedFilter === "all"}
              onPress={() => setSelectedFilter("all")}
              count={activities.length}
            />
            <FilterChip
              label="Weight"
              active={selectedFilter === "weight_scan"}
              onPress={() => setSelectedFilter("weight_scan")}
              count={activities.filter((a) => a.type === "weight_scan").length}
            />
            <FilterChip
              label="Growth"
              active={selectedFilter === "growth_forecast"}
              onPress={() => setSelectedFilter("growth_forecast")}
              count={activities.filter((a) => a.type === "growth_forecast").length}
            />
            <FilterChip
              label="Spoilage"
              active={selectedFilter === "spoilage_check"}
              onPress={() => setSelectedFilter("spoilage_check")}
              count={activities.filter((a) => a.type === "spoilage_check").length}
            />
            <FilterChip
              label="Disease"
              active={selectedFilter === "disease_check"}
              onPress={() => setSelectedFilter("disease_check")}
              count={activities.filter((a) => a.type === "disease_check").length}
            />
            <FilterChip
              label="Water"
              active={selectedFilter === "water_quality"}
              onPress={() => setSelectedFilter("water_quality")}
              count={activities.filter((a) => a.type === "water_quality").length}
            />
            <FilterChip
              label="System"
              active={selectedFilter === "system"}
              onPress={() => setSelectedFilter("system")}
              count={activities.filter((a) => a.type === "system").length}
            />
          </ScrollView>
        </View>

        {/* Activity List */}
        <FlatList
          data={filteredActivities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View className="bg-white rounded-[18px] mb-3">
              <View className="flex-row items-start p-4">
                {/* Icon */}
                <View className={`w-11 h-11 rounded-full ${getIconBg(item.type)} items-center justify-center mr-3.5`}>
                  {getActivityIcon(item.type)}
                </View>

                {/* Content */}
                <View className="flex-1">
                  <View className="flex-row items-center mb-1.5">
                    <Text className="text-[15px] font-extrabold text-gray-900 flex-1">
                      {item.title}
                    </Text>
                    {/* ✅ Only show zone badge if not weight_scan or growth_forecast */}
                    {shouldDisplayZone(item.type, item.zone) && (
                      <View className="bg-gray-100 rounded-full px-2.5 py-1 ml-2">
                        <Text className="text-[10px] font-extrabold text-gray-600">
                          {item.zone}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text className="text-[13px] text-gray-600 mb-2.5 leading-[18px]">
                    {item.description}
                  </Text>

                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={12} color="#9CA3AF" style={{ marginRight: 4 }} />
                    <Text className="text-[11px] text-gray-400 font-medium">
                      {formatTime(item.timestamp)}
                    </Text>

                    {item.status && (
                      <>
                        <View className="w-1 h-1 rounded-full bg-gray-300 mx-2.5" />
                        <StatusPill status={item.status} />
                      </>
                    )}
                  </View>
                </View>

                {/* Delete Button */}
                <TouchableOpacity
                  onPress={() => handleDeleteActivity(item.id)}
                  activeOpacity={0.85}
                  className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center ml-2"
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="py-24 items-center">
              <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
                <Ionicons name="file-tray-outline" size={36} color="#9CA3AF" />
              </View>
              <Text className="text-[16px] font-bold text-gray-900 mb-1">
                No Activities Found
              </Text>
              <Text className="text-[13px] text-gray-500 text-center px-8">
                {selectedFilter === "all" 
                  ? "Your activity history will appear here"
                  : `No ${selectedFilter.replace('_', ' ')} activities yet`
                }
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

/* Components */

function FilterChip({
  label,
  active,
  onPress,
  count,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  count: number;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`mr-2.5 px-4 py-2.5 mb-4 mt-4 rounded-full flex-row items-center ${
        active ? "bg-[#0046AD]" : "bg-white"
      }`}
      activeOpacity={0.85}
    >
      <Text
        className={`text-[12px] font-extrabold ${
          active ? "text-white" : "text-gray-600"
        }`}
      >
        {label}
      </Text>
      {count > 0 && (
        <View
          className={`ml-2 px-2 py-0.5 rounded-full ${
            active ? "bg-white/20" : "bg-gray-100"
          }`}
        >
          <Text
            className={`text-[10px] font-extrabold ${
              active ? "text-white" : "text-gray-600"
            }`}
          >
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function StatusPill({ status }: { status: "success" | "warning" | "info" }) {
  const colors = {
    success: { bg: "bg-[#E9FBEF]", text: "text-[#16A34A]", icon: "checkmark-circle", iconColor: "#16A34A" },
    warning: { bg: "bg-[#FFF6E5]", text: "text-[#F59E0B]", icon: "alert-circle", iconColor: "#F59E0B" },
    info: { bg: "bg-[#EAF4FF]", text: "text-[#0046AD]", icon: "information-circle", iconColor: "#0046AD" },
  };

  const { bg, text, icon, iconColor } = colors[status];

  return (
    <View className={`px-2 py-1 rounded-full ${bg} flex-row items-center`}>
      <Ionicons name={icon as any} size={10} color={iconColor} style={{ marginRight: 3 }} />
      <Text className={`text-[10px] font-extrabold ${text}`}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
}
