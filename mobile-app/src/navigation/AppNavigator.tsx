// src/navigation/AppNavigator.tsx
import React from "react";
import { View, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigatorScreenParams } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import DashboardScreen from "../screens/main/DashboardScreen";
import WeightGrowthScreen from "../screens/componentGrowth&Weight/WeightGrowthScreen";
import ScheduleTimeSlotsScreen from "../screens/componentGrowth&Weight/ScheduleTimeSlotScreen";
import EstimateWeightScanScreen from "../screens/componentGrowth&Weight/EstimateWeightScanScreen";
import EstimateWeightResultsScreen from "../screens/componentGrowth&Weight/EstimateWeightResultsScreen";
import GrowthForecastingScreen from "../screens/componentGrowth&Weight/GrowthForecastingScreen";
import GrowthPredictionResultsScreen from "../screens/componentGrowth&Weight/GrowthPredictionResultsScreen";
import PlantListsScreen from "../screens/componentGrowth&Weight/PlantListsScreen";
import PlantDetailsScreen from "../screens/componentGrowth&Weight/PlantDetailsScreen";

import ScanScreen from "../screens/main/ScanScreen";
import HistoryScreen from "../screens/main/HistoryScreen";
import SettingsScreen from "../screens/main/SettingsScreen";

export type DashboardStackParamList = {
  DashboardHome: undefined;
  WeightGrowth: undefined;
  ScheduleTimeSlots: undefined;
  EstimateWeightScan: undefined;
  GrowthForecasting: undefined;
  PlantLists: undefined;

  EstimateWeightResults: {
    imageUri: string;
    accuracy?: number;
    biomassG?: number;
    leafAreaCm2?: number;
    leafDiameterCm?: number;
    plantId?: string;
    plantAgeDays?: number;
    capturedAtISO?: string;
  };

  GrowthPredictionResults: {
    dateLabel?: string;
    predictedWeight?: number;
    predictedArea?: number;
    predictedDiameter?: number;
    changePct?: number;
    labels?: string[];
    actual?: number[];
    predicted?: number[];
  };

  // ✅ FIX: pass ONLY plant_id
  PlantDetails: { plant_id: string };
};

const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();

function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="DashboardHome" component={DashboardScreen} />
      <DashboardStack.Screen name="WeightGrowth" component={WeightGrowthScreen} />
      <DashboardStack.Screen name="ScheduleTimeSlots" component={ScheduleTimeSlotsScreen} />
      <DashboardStack.Screen name="EstimateWeightScan" component={EstimateWeightScanScreen} />
      <DashboardStack.Screen name="GrowthForecasting" component={GrowthForecastingScreen} />
      <DashboardStack.Screen name="GrowthPredictionResults" component={GrowthPredictionResultsScreen} />
      <DashboardStack.Screen name="PlantLists" component={PlantListsScreen} />
      <DashboardStack.Screen name="PlantDetails" component={PlantDetailsScreen} />
      <DashboardStack.Screen name="EstimateWeightResults" component={EstimateWeightResultsScreen} />
    </DashboardStack.Navigator>
  );
}

export type TabParamList = {
  Dashboard: NavigatorScreenParams<DashboardStackParamList>;
  Scan: undefined;
  History: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({
  focused,
  iconName,
}: {
  focused: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      className={`w-12 h-12 rounded-2xl items-center justify-center ${
        focused ? "bg-[#DCEEFF]" : "bg-[#EEF2F7]"
      }`}
    >
      <Ionicons
        name={iconName}
        size={22}
        color={focused ? "#0046AD" : "#64748B"}
      />
    </View>
  );
}

function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabel: ({ focused }) => (
          <Text
            style={{
              marginTop: 12,
              fontSize: 12,
              fontWeight: "700",
              color: focused ? "#0046AD" : "#94A3B8",
            }}
          >
            {route.name}
          </Text>
        ),
        tabBarStyle: {
          height: 100,
          paddingTop: 10,
          paddingRight: 14,
          paddingLeft: 14,
          paddingBottom: 18,
          backgroundColor: "white",
          borderTopWidth: 0,
          elevation: 112,
        },
        tabBarIcon: ({ focused }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            Dashboard: "home-outline",
            Scan: "scan-outline",
            History: "time-outline",
            Settings: "settings-outline",
          };
          return <TabIcon focused={focused} iconName={iconMap[route.name]} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStackNavigator} />
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return <TabsNavigator />;
}