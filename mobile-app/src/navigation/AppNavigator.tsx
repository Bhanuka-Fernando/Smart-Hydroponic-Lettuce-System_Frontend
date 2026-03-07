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
import ProfileScreen from "../screens/main/ProfileScreen";

import SpoilageNavigator, {
  type SpoilageStackParamList,
} from "./SpoilageNavigator";

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
  PlantDetails: { plant_id: string };

  // Spoilage module
  SpoilageModule: NavigatorScreenParams<SpoilageStackParamList> | undefined;
};

const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();

function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="DashboardHome" component={DashboardScreen} />
      <DashboardStack.Screen name="WeightGrowth" component={WeightGrowthScreen} />
      <DashboardStack.Screen
        name="ScheduleTimeSlots"
        component={ScheduleTimeSlotsScreen}
      />
      <DashboardStack.Screen
        name="EstimateWeightScan"
        component={EstimateWeightScanScreen}
      />
      <DashboardStack.Screen
        name="GrowthForecasting"
        component={GrowthForecastingScreen}
      />
      <DashboardStack.Screen
        name="GrowthPredictionResults"
        component={GrowthPredictionResultsScreen}
      />
      <DashboardStack.Screen name="PlantLists" component={PlantListsScreen} />
      <DashboardStack.Screen name="PlantDetails" component={PlantDetailsScreen} />
      <DashboardStack.Screen
        name="EstimateWeightResults"
        component={EstimateWeightResultsScreen}
      />

      <DashboardStack.Screen
        name="SpoilageModule"
        component={SpoilageNavigator}
      />
    </DashboardStack.Navigator>
  );
}

export type SettingsStackParamList = {
  SettingsHome: undefined;
  Profile: undefined;
};

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsHome" component={SettingsScreen} />
      <SettingsStack.Screen name="Profile" component={ProfileScreen} />
    </SettingsStack.Navigator>
  );
}

export type TabParamList = {
  Dashboard: NavigatorScreenParams<DashboardStackParamList>;
  Scan: undefined;
  History: undefined;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
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

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabel: ({ focused }) => (
          <Text
            style={{
              marginTop: 10,
              fontSize: 12,
              fontWeight: "700",
              color: focused ? "#0046AD" : "#94A3B8",
            }}
          >
            {route.name}
          </Text>
        ),
        tabBarStyle: {
          height: 96,
          paddingTop: 10,
          paddingRight: 14,
          paddingLeft: 14,
          paddingBottom: 14,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarItemStyle: {
          paddingVertical: 4,
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
      <Tab.Screen name="Settings" component={SettingsStackNavigator} />
    </Tab.Navigator>
  );
}