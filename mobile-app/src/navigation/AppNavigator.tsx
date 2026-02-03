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

import ScanScreen from "../screens/main/ScanScreen";
import HistoryScreen from "../screens/main/HistoryScreen";
import SettingsScreen from "../screens/main/SettingsScreen";

/** 1) Dashboard stack (Dashboard -> WeightGrowth) */
export type DashboardStackParamList = {
  DashboardHome: undefined;
  WeightGrowth: undefined;
  ScheduleTimeSlots: undefined;
};

const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();

function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="DashboardHome" component={DashboardScreen} />
      <DashboardStack.Screen name="WeightGrowth" component={WeightGrowthScreen} />
      <DashboardStack.Screen name="ScheduleTimeSlots" component={ScheduleTimeSlotsScreen} />
    </DashboardStack.Navigator>
  );
}

/** 2) Tabs */
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
      <Tab.Screen
        name="Dashboard"
        component={DashboardStackNavigator}
        options={{ title: "Dashboard" }}
      />
      <Tab.Screen name="Scan" component={ScanScreen} options={{ title: "Scan" }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: "History" }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
    </Tab.Navigator>
  );
}

/** 3) Root App stack (Tabs + full-screen pages above tabs) */
export type AppStackParamList = {
  Tabs: undefined;
  ScheduleTimeSlots: undefined;
};

const AppStack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tabs always here */}
      <AppStack.Screen name="Tabs" component={TabsNavigator} />

      {/* Opens ABOVE tabs (tabs hidden automatically) */}
      <AppStack.Screen
        name="ScheduleTimeSlots"
        component={ScheduleTimeSlotsScreen}
      />
    </AppStack.Navigator>
  );
}
