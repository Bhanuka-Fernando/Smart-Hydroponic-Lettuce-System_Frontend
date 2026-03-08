import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
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
  status: "active" | "coming-soon";
}

export default function ScanScreen() {
  const navigation = useNavigation<any>();

  const features: Feature[] = [
    {
      id: "weight",
      title: "Weight Estimation",
      subtitle: "AI-powered measurement",
      icon: "scale-bathroom",
      iconLibrary: "material",
      iconBg: "bg-[#EAF4FF]",
      iconColor: "#0046AD",
      status: "active",
    },
    {
      id: "growth",
      title: "Growth Monitoring",
      subtitle: "Track development",
      icon: "trending-up",
      iconLibrary: "ionicons",
      iconBg: "bg-[#E9FBEF]",
      iconColor: "#16A34A",
      status: "active",
    },
    {
      id: "spoilage",
      title: "Spoilage Detection",
      subtitle: "Identify crop issues",
      icon: "warning-outline",
      iconLibrary: "ionicons",
      iconBg: "bg-[#FFF6E5]",
      iconColor: "#F59E0B",
      status: "active",
    },
    {
      id: "algae",
      title: "Algae Detection",
      subtitle: "Prevent algae growth",
      icon: "water-outline",
      iconLibrary: "ionicons",
      iconBg: "bg-[#E8F7FF]",
      iconColor: "#0284C7",
      status: "coming-soon",
    },
    {
      id: "disease",
      title: "Disease Detection",
      subtitle: "Early identification",
      icon: "medkit-outline",
      iconLibrary: "ionicons",
      iconBg: "bg-[#FFEAF2]",
      iconColor: "#DB2777",
      status: "active",
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

  const openLeafHealthScan = () => {
    try {
      navigation.navigate("Dashboard", {
        screen: "LeafHealth",
        params: { screen: "LeafHealthScan" },
      });
    } catch {
      Alert.alert("Navigation", "Leaf health scan route is not available.");
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
      case "disease":
        openLeafHealthScan();
        break;
    }
  };

  const renderIcon = (feature: Feature, size: number = 22) => {
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
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Header - Matching DashboardScreen */}
      <View className="px-4 pt-4 pb-3 bg-white">
        <Text className="text-[24px] font-extrabold text-gray-900 leading-[30px]">
          Scan & Analyze
        </Text>
        <Text className="text-[11px] text-gray-500 mt-1 font-semibold tracking-[0.4px]">
          Choose a feature to get started
        </Text>
      </View>

      <View className="flex-1 bg-[#F4F6FA]">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        >
          {/* Best Practices - Matching environment card style */}
          <View className="mt-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-[20px] font-extrabold text-gray-900">
                Best Practices
              </Text>
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                <Text className="text-[11px] font-bold text-gray-500">Tips</Text>
              </View>
            </View>

            <View className="bg-white rounded-[18px] p-4">
              <View className="flex-row items-start mb-3">
                <View className="w-11 h-11 rounded-full bg-[#EAF4FF] items-center justify-center mr-3">
                  <Ionicons name="bulb" size={20} color="#0046AD" />
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-extrabold text-gray-900 mb-2">
                    Scanning Guidelines
                  </Text>
                  <View className="space-y-1.5">
                    <Text className="text-[12px] text-gray-600 leading-[20px]">
                      • Ensure good natural or artificial lighting
                    </Text>
                    <Text className="text-[12px] text-gray-600 leading-[20px]">
                      • Hold camera steady for clear images
                    </Text>
                    <Text className="text-[12px] text-gray-600 leading-[20px]">
                      • Capture entire plant within frame
                    </Text>
                    <Text className="text-[12px] text-gray-600 leading-[20px]">
                      • Avoid shadows, glare, and reflections
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Available Features - Matching Features section style */}
          <View className="mt-6">
            <Text className="text-[20px] font-extrabold text-gray-900 mb-3">
              Available Features
            </Text>

            <View className="flex-row justify-between">
              <FeatureCard
                feature={features[0]}
                onPress={() => handleFeaturePress(features[0])}
                renderIcon={renderIcon}
              />
              <FeatureCard
                feature={features[1]}
                onPress={() => handleFeaturePress(features[1])}
                renderIcon={renderIcon}
              />
            </View>

            <View className="flex-row justify-between mt-3">
              <FeatureCard
                feature={features[2]}
                onPress={() => handleFeaturePress(features[2])}
                renderIcon={renderIcon}
              />
              <FeatureCard
                feature={features[3]}
                onPress={() => handleFeaturePress(features[3])}
                renderIcon={renderIcon}
              />
            </View>

            <View className="flex-row justify-between mt-3">
              <FeatureCard
                feature={features[4]}
                onPress={() => handleFeaturePress(features[4])}
                renderIcon={renderIcon}
              />
              <View className="w-[48%]" />
            </View>
          </View>

          {/* Info Note */}
          <View className="mt-6 bg-white rounded-[18px] p-4">
            <View className="flex-row items-start">
              <Ionicons
                name="information-circle"
                size={20}
                color="#0046AD"
                style={{ marginTop: 2 }}
              />
              <Text className="text-[12px] text-gray-600 leading-[16px] ml-3 flex-1">
                Tap on any active feature to start scanning and analyzing your lettuce crop
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* Components */

function FeatureCard({
  feature,
  onPress,
  renderIcon,
}: {
  feature: Feature;
  onPress: () => void;
  renderIcon: (feature: Feature, size: number) => React.ReactNode;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-white rounded-[18px] p-4 w-[48%]"
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className={`w-11 h-11 rounded-full ${feature.iconBg} items-center justify-center`}>
          {renderIcon(feature, 22)}
        </View>
        {feature.status === "active" ? (
          <View className="bg-[#E9FBEF] rounded-full px-2 py-0.5">
            <Text className="text-[9px] font-extrabold text-[#16A34A]">
              READY
            </Text>
          </View>
        ) : (
          <View className="bg-[#FFF6E5] rounded-full px-2 py-0.5">
            <Text className="text-[9px] font-extrabold text-[#F59E0B]">
              SOON
            </Text>
          </View>
        )}
      </View>

      <Text className="text-[15px] font-extrabold text-gray-900 leading-[18px]">
        {feature.title}
      </Text>
      <Text className="text-[12px] text-gray-500 mt-1">{feature.subtitle}</Text>
    </TouchableOpacity>
  );
}
