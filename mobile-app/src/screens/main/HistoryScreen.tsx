import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";

type ActivityType =
  | "weight_scan"
  | "growth_forecast"
  | "sensor_update"
  | "harvest"
  | "system"
  | "disease_check"
  | "all";

type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  zone?: string;
  status?: "success" | "warning" | "info";
};

const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "weight_scan",
    title: "Weight Estimation",
    description: "Lettuce #L-042 estimated at 245g",
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    zone: "Z01",
    status: "success",
  },
  {
    id: "2",
    type: "sensor_update",
    title: "pH Adjustment",
    description: "Auto-balanced to 6.2 in Zone 1",
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    zone: "Z01",
    status: "info",
  },
  {
    id: "3",
    type: "growth_forecast",
    title: "Growth Forecast",
    description: "4-day forecast generated for 12 plants",
    timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
    zone: "Z01",
    status: "success",
  },
  {
    id: "4",
    type: "system",
    title: "Light Cycle Started",
    description: "Day mode activated (14h cycle)",
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    status: "info",
  },
  {
    id: "5",
    type: "harvest",
    title: "Harvest Completed",
    description: "3 plants harvested from Zone 2",
    timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
    zone: "Z02",
    status: "success",
  },
  {
    id: "6",
    type: "sensor_update",
    title: "Temperature Alert",
    description: "Temperature rose to 28°C in Zone 3",
    timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
    zone: "Z03",
    status: "warning",
  },
  {
    id: "7",
    type: "disease_check",
    title: "Disease Scan",
    description: "Healthy - No issues detected",
    timestamp: new Date(Date.now() - 300 * 60000).toISOString(),
    zone: "Z01",
    status: "success",
  },
  {
    id: "8",
    type: "weight_scan",
    title: "Weight Estimation",
    description: "Lettuce #L-038 estimated at 198g",
    timestamp: new Date(Date.now() - 360 * 60000).toISOString(),
    zone: "Z02",
    status: "success",
  },
];

export default function HistoryScreen() {
  const [selectedFilter, setSelectedFilter] = useState<ActivityType>("all");
  const [activities, setActivities] = useState<ActivityItem[]>(mockActivities);

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
          onPress: () => {
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
          onPress: () => {
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
      case "sensor_update":
        return <Ionicons name="water-outline" size={20} color="#0284C7" />;
      case "harvest":
        return <MaterialCommunityIcons name="sprout" size={20} color="#16A34A" />;
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
      case "sensor_update":
        return "bg-[#E8F7FF]";
      case "harvest":
        return "bg-[#E9FBEF]";
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

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      {/* Header - Matching DashboardScreen */}
      <View className="px-4 pt-4 pb-3">
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
            label="Sensors"
            active={selectedFilter === "sensor_update"}
            onPress={() => setSelectedFilter("sensor_update")}
            count={activities.filter((a) => a.type === "sensor_update").length}
          />
          <FilterChip
            label="Harvest"
            active={selectedFilter === "harvest"}
            onPress={() => setSelectedFilter("harvest")}
            count={activities.filter((a) => a.type === "harvest").length}
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
                  {item.zone && (
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
    success: { bg: "bg-[#E9FBEF]", text: "text-[#16A34A]", icon: "checkmark-circle" },
    warning: { bg: "bg-[#FFF6E5]", text: "text-[#F59E0B]", icon: "alert-circle" },
    info: { bg: "bg-[#EAF4FF]", text: "text-[#0046AD]", icon: "information-circle" },
  };

  const { bg, text, icon } = colors[status];

  return (
    <View className={`px-2 py-1 rounded-full ${bg} flex-row items-center`}>
      <Ionicons name={icon as any} size={10} color={colors[status].text.replace('text-', '')} style={{ marginRight: 3 }} />
      <Text className={`text-[10px] font-extrabold ${text}`}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
}

