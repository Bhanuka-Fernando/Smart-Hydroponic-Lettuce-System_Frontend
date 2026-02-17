import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {View, Text} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import DashboardScreen from "../screens/main/DashboardScreen";
import ScanScreen from "../screens/main/ScanScreen";
import HistoryScreen from "../screens/main/HistoryScreen";
import SettingsScreen from "../screens/main/SettingsScreen";

export type AppTabParamList = {
  Dashboard: undefined;
  Scan: undefined;
  History: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

function TabIcon({
  focused,
  iconName,
}: {
  focused: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View className={`w-12 h-12 rounded-2xl items-center justify-center ${focused ? "bg-[#DCEEFF]" : "bg-[#EEF2F7]"}`}>
      <Ionicons name={iconName} size={22} color={focused ? "#0046AD" : "#64748B"} />
    </View>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // only show "Dashboard" header if you want
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: "white" },
        headerShadowVisible: true,

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

        // Make the bar look like Figma (rounded container, elevated)
        tabBarStyle: {
          height: 100,
          paddingTop: 10,
          paddingRight:14,
          paddingLeft:14,
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
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Dashboard" }} />
      <Tab.Screen name="Scan" component={ScanScreen} options={{ title: "Scan" }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: "History" }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
    </Tab.Navigator>
  );
}