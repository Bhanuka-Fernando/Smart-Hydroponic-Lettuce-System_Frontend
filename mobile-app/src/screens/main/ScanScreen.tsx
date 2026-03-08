import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

type FeatureType = "weight" | "growth" | "spoilage" | "algae" | "disease";

interface Feature {
  id: FeatureType;
  title: string;
  subtitle: string;
  icon: string;
  iconLibrary: "ionicons" | "material";
  iconBg: string;
  iconColor: string;
  gradient: string[];
  status: "active" | "coming-soon";
  route?: string;
}

export default function ScanScreen() {
  const navigation = useNavigation<any>();

  const features: Feature[] = [
    {
      id: "weight",
      title: "Weight Estimation",
      subtitle: "AI-powered lettuce weight measurement",
      icon: "scale-bathroom",
      iconLibrary: "material",
      iconBg: "bg-blue-50",
      iconColor: "#2563EB",
      gradient: ["#3B82F6", "#2563EB"],
      status: "active",
    },
    {
      id: "growth",
      title: "Growth Monitoring",
      subtitle: "Track plant growth and development",
      icon: "trending-up",
      iconLibrary: "ionicons",
      iconBg: "bg-green-50",
      iconColor: "#16A34A",
      gradient: ["#22C55E", "#16A34A"],
      status: "active",
    },
    {
      id: "spoilage",
      title: "Spoilage Detection",
      subtitle: "Identify crop spoilage and root issues",
      icon: "warning-outline",
      iconLibrary: "ionicons",
      iconBg: "bg-amber-50",
      iconColor: "#D97706",
      gradient: ["#F59E0B", "#D97706"],
      status: "active",
    },
    {
      id: "algae",
      title: "Algae Detection",
      subtitle: "Detect and prevent algae growth",
      icon: "water-outline",
      iconLibrary: "ionicons",
      iconBg: "bg-teal-50",
      iconColor: "#0D9488",
      gradient: ["#14B8A6", "#0D9488"],
      status: "coming-soon",
    },
    {
      id: "disease",
      title: "Disease Detection",
      subtitle: "Early identification of plant diseases",
      icon: "medkit-outline",
      iconLibrary: "ionicons",
      iconBg: "bg-pink-50",
      iconColor: "#DB2777",
      gradient: ["#EC4899", "#DB2777"],
      status: "coming-soon",
    },
  ];

  const openRootSpoilage = () => {
    try {
      const rootNav = navigation.getParent?.() ?? navigation;
      rootNav.navigate("Spoilage", {
        screen: "SpoilageScan",
        params: { demoMode: true },
      });
    } catch {
      Alert.alert("Navigation", "Spoilage module route is not available.");
    }
  };

  const openDashboardScreen = (screen: string) => {
    try {
      navigation.navigate("Dashboard", { screen });
    } catch {
      Alert.alert(
        "Navigation",
        `Please use the Dashboard section for ${screen}.`
      );
    }
  };

  const handleFeaturePress = (feature: Feature) => {
    if (feature.status === "coming-soon") {
      Alert.alert(
        feature.title,
        "This feature is under development and will be available soon!",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    switch (feature.id) {
      case "weight":
        openDashboardScreen("EstimateWeightScan");
        break;

      case "growth":
        openDashboardScreen("GrowthForecasting");
        break;

      case "spoilage":
        openRootSpoilage();
        break;

      case "algae":
        Alert.alert(
          "Algae Detection",
          "This feature is under development.\n\nComing soon!"
        );
        break;

      case "disease":
        Alert.alert(
          "Disease Detection",
          "This feature is under development by Team Member 2.\n\nComing soon!"
        );
        break;
    }
  };

  const renderIcon = (feature: Feature, size: number = 26) => {
    if (feature.iconLibrary === "material") {
      return (
        <MaterialCommunityIcons
          name={feature.icon as any}
          size={size}
          color={feature.iconColor}
        />
      );
    }
    return (
      <Ionicons
        name={feature.icon as any}
        size={size}
        color={feature.iconColor}
      />
    );
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 pt-3 pb-4">
        <Text className="text-[32px] font-bold text-gray-900">
          Scan & Analyze
        </Text>
        <Text className="text-[14px] text-gray-600 mt-1.5 font-medium">
          Choose a feature to get started
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
      >
        {/* Best Practices Card - Top */}
        <View className="bg-white rounded-3xl p-5 shadow-sm mb-6 border border-gray-100">
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-2xl bg-blue-50 items-center justify-center mr-3">
              <Ionicons name="bulb" size={20} color="#2563EB" />
            </View>
            <Text className="text-[16px] font-bold text-gray-900">
              Best Scanning Practices
            </Text>
          </View>

          <View className="space-y-2.5">
            <View className="flex-row items-start">
              <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-2.5" />
              <Text className="text-[13px] text-gray-700 leading-5 flex-1">
                Ensure good natural or artificial lighting
              </Text>
            </View>
            <View className="flex-row items-start">
              <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-2.5" />
              <Text className="text-[13px] text-gray-700 leading-5 flex-1">
                Hold camera steady for clear, sharp images
              </Text>
            </View>
            <View className="flex-row items-start">
              <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-2.5" />
              <Text className="text-[13px] text-gray-700 leading-5 flex-1">
                Capture the entire plant within frame
              </Text>
            </View>
            <View className="flex-row items-start">
              <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-2.5" />
              <Text className="text-[13px] text-gray-700 leading-5 flex-1">
                Avoid shadows, glare, and reflections
              </Text>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View className="mb-2">
          <Text className="text-[13px] font-bold text-gray-500 mb-3 tracking-wider uppercase px-1">
            Available Features
          </Text>

          <View className="space-y-3">
            {features.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                onPress={() => handleFeaturePress(feature)}
                activeOpacity={0.7}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
              >
                <View className="flex-row items-center p-4">
                  {/* Icon Container */}
                  <View
                    className={`w-[56px] h-[56px] rounded-2xl ${feature.iconBg} items-center justify-center mr-3.5`}
                  >
                    {renderIcon(feature, 28)}
                  </View>

                  {/* Content */}
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center mb-1">
                      <Text className="text-[15px] font-bold text-gray-900 flex-1">
                        {feature.title}
                      </Text>
                      {feature.status === "active" ? (
                        <View className="bg-green-500 rounded-full px-2.5 py-1">
                          <Text className="text-white text-[10px] font-bold">
                            READY
                          </Text>
                        </View>
                      ) : (
                        <View className="bg-amber-500 rounded-full px-2.5 py-1">
                          <Text className="text-white text-[10px] font-bold">
                            SOON
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-[12px] text-gray-600 leading-[17px]">
                      {feature.subtitle}
                    </Text>
                  </View>

                  {/* Arrow */}
                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color="#D1D5DB"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Footer */}
        <View className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4">
          <View className="flex-row items-center">
            <Ionicons
              name="information-circle"
              size={20}
              color="#6366F1"
              style={{ marginRight: 10 }}
            />
            <Text className="text-[12px] text-gray-700 leading-5 flex-1">
              Tap on any active feature to start scanning and analyzing your
              lettuce crop
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}