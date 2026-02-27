import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

type ScanType = "weight" | "disease" | "spoilage" | "quality";

export default function ScanScreen() {
  const navigation = useNavigation<any>();
  const [selectedScan, setSelectedScan] = useState<ScanType | null>(null);

  const handleScanSelect = (type: ScanType) => {
    setSelectedScan(type);
    
    switch (type) {
      case "weight":
        try {
          navigation.navigate("EstimateWeightScan");
        } catch {
          Alert.alert("Navigation", "Weight estimation feature available in Growth & Weight section");
        }
        break;
      
      case "disease":
        Alert.alert(
          "Disease Detection",
          "This feature is under development by Team Member 2.\n\nComing soon!"
        );
        break;
      
      case "spoilage":
        Alert.alert(
          "Spoilage Detection",
          "This feature is under development by Team Member 3.\n\nComing soon!"
        );
        break;
      
      case "quality":
        Alert.alert(
          "Quality Assessment",
          "This feature is under development.\n\nComing soon!"
        );
        break;
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      {/* Header */}
      <View className="px-4 pt-4 pb-3">
        <Text className="text-[24px] font-extrabold text-gray-900">
          Scan & Analyze
        </Text>
        <Text className="text-[11px] text-gray-500 mt-1 font-semibold tracking-[0.4px]">
          Choose what you want to scan and analyze
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      >
        {/* Featured Scan - Weight Estimation */}
        <View className="bg-gradient-to-br from-[#0046AD] to-[#0062FF] rounded-[20px] p-5 mb-4 overflow-hidden">
          <View className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <View className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
          
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-white/80 text-[12px] font-semibold mb-1">
                MOST USED
              </Text>
              <Text className="text-white text-[22px] font-extrabold mb-1">
                Weight Estimation
              </Text>
              <Text className="text-white/90 text-[13px]">
                Estimate lettuce weight using AI
              </Text>
            </View>
            <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center">
              <MaterialCommunityIcons name="scale-bathroom" size={28} color="white" />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => handleScanSelect("weight")}
            className="bg-white rounded-xl py-3 mt-3"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="camera" size={18} color="#0046AD" />
              <Text className="text-[15px] font-extrabold text-[#0046AD] ml-2">
                Start Scanning
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Scan Options Grid */}
        <Text className="text-[13px] font-extrabold text-gray-900 mb-3">
          All Scan Types
        </Text>

        <View className="flex-row justify-between mb-3">
          <ScanCard
            title="Weight Estimation"
            subtitle="AI-powered measurement"
            icon={<MaterialCommunityIcons name="scale-bathroom" size={28} color="#0046AD" />}
            iconBg="bg-[#EAF4FF]"
            badge="Active"
            badgeColor="bg-green-500"
            onPress={() => handleScanSelect("weight")}
          />

          <ScanCard
            title="Disease Detection"
            subtitle="Identify plant diseases"
            icon={<Ionicons name="medkit-outline" size={28} color="#DB2777" />}
            iconBg="bg-[#FFEAF2]"
            badge="Soon"
            badgeColor="bg-yellow-500"
            onPress={() => handleScanSelect("disease")}
          />
        </View>

        <View className="flex-row justify-between mb-3">
          <ScanCard
            title="Spoilage Check"
            subtitle="Detect crop issues"
            icon={<Ionicons name="warning-outline" size={28} color="#F59E0B" />}
            iconBg="bg-[#FFF6E5]"
            badge="Soon"
            badgeColor="bg-yellow-500"
            onPress={() => handleScanSelect("spoilage")}
          />

          <ScanCard
            title="Quality Assessment"
            subtitle="Comprehensive analysis"
            icon={<Ionicons name="analytics-outline" size={28} color="#16A34A" />}
            iconBg="bg-[#E9FBEF]"
            badge="Soon"
            badgeColor="bg-yellow-500"
            onPress={() => handleScanSelect("quality")}
          />
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-[18px] p-4 shadow-sm mt-4 mb-4">
          <Text className="text-[13px] font-extrabold text-gray-900 mb-4 tracking-[0.6px]">
            QUICK ACTIONS
          </Text>

          <TouchableOpacity
            onPress={() => {
              try {
                navigation.navigate("PlantLists");
              } catch {
                Alert.alert("Navigation", "Please use the Growth & Weight section");
              }
            }}
            className="flex-row items-center justify-between py-3 border-b border-gray-100"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-[#EAF4FF] items-center justify-center mr-3">
                <MaterialCommunityIcons name="sprout" size={20} color="#0046AD" />
              </View>
              <View>
                <Text className="text-[14px] font-semibold text-gray-900">
                  View Plant History
                </Text>
                <Text className="text-[11px] text-gray-500 mt-0.5">
                  Access previous scans
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              try {
                navigation.navigate("GrowthForecasting");
              } catch {
                Alert.alert("Navigation", "Please use the Growth & Weight section");
              }
            }}
            className="flex-row items-center justify-between py-3 border-b border-gray-100"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-[#E9FBEF] items-center justify-center mr-3">
                <Ionicons name="trending-up" size={20} color="#16A34A" />
              </View>
              <View>
                <Text className="text-[14px] font-semibold text-gray-900">
                  Growth Forecasting
                </Text>
                <Text className="text-[11px] text-gray-500 mt-0.5">
                  Predict future growth
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              try {
                navigation.navigate("ScheduleTimeSlot");
              } catch {
                Alert.alert("Navigation", "Please use the Growth & Weight section");
              }
            }}
            className="flex-row items-center justify-between py-3"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-[#F3E8FF] items-center justify-center mr-3">
                <Ionicons name="calendar-outline" size={20} color="#7C3AED" />
              </View>
              <View>
                <Text className="text-[14px] font-semibold text-gray-900">
                  Schedule Scan
                </Text>
                <Text className="text-[11px] text-gray-500 mt-0.5">
                  Set up automatic scanning
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View className="bg-blue-50 rounded-[18px] p-4 mb-4">
          <View className="flex-row items-start">
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
              <Ionicons name="information-circle" size={22} color="#0046AD" />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-extrabold text-gray-900 mb-1">
                How to get the best scan results
              </Text>
              <Text className="text-[12px] text-gray-600 leading-[18px]">
                • Ensure good lighting{"\n"}
                • Hold camera steady{"\n"}
                • Capture the entire plant{"\n"}
                • Avoid shadows and reflections
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Scans Preview */}
        <View className="bg-white rounded-[18px] p-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-[13px] font-extrabold text-gray-900 tracking-[0.6px]">
              RECENT SCANS
            </Text>
            <TouchableOpacity
              onPress={() => {
                try {
                  navigation.navigate("PlantLists");
                } catch {
                  Alert.alert("History", "View all scans in Plant Lists");
                }
              }}
              activeOpacity={0.7}
            >
              <Text className="text-[12px] font-semibold text-[#0046AD]">
                View All
              </Text>
            </TouchableOpacity>
          </View>

          <RecentScanItem
            title="Lettuce #L-042"
            subtitle="Weight: 245g • 2 hours ago"
            icon={<MaterialCommunityIcons name="scale-bathroom" size={18} color="#0046AD" />}
            iconBg="bg-[#EAF4FF]"
          />

          <View className="h-px bg-gray-100 my-2" />

          <RecentScanItem
            title="Lettuce #L-038"
            subtitle="Weight: 198g • 5 hours ago"
            icon={<MaterialCommunityIcons name="scale-bathroom" size={18} color="#0046AD" />}
            iconBg="bg-[#EAF4FF]"
          />

          <View className="h-px bg-gray-100 my-2" />

          <RecentScanItem
            title="Lettuce #L-035"
            subtitle="Weight: 212g • Yesterday"
            icon={<MaterialCommunityIcons name="scale-bathroom" size={18} color="#0046AD" />}
            iconBg="bg-[#EAF4FF]"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* Components */

function ScanCard({
  title,
  subtitle,
  icon,
  iconBg,
  badge,
  badgeColor,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  badge: string;
  badgeColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-white rounded-[18px] p-4 w-[48%] shadow-sm"
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className={`w-12 h-12 rounded-full ${iconBg} items-center justify-center`}>
          {icon}
        </View>
        <View className={`${badgeColor} rounded-full px-2 py-1`}>
          <Text className="text-white text-[9px] font-bold">{badge}</Text>
        </View>
      </View>

      <Text className="text-[15px] font-extrabold text-gray-900 mb-1">
        {title}
      </Text>
      <Text className="text-[11px] text-gray-500 leading-[14px]">
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

function RecentScanItem({
  title,
  subtitle,
  icon,
  iconBg,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <View className="flex-row items-center py-2">
      <View className={`w-10 h-10 rounded-full ${iconBg} items-center justify-center mr-3`}>
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-[14px] font-semibold text-gray-900">{title}</Text>
        <Text className="text-[11px] text-gray-500 mt-0.5">{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </View>
  );
}