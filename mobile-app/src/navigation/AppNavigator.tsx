// src/navigation/AppNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import DashboardScreen from "../screens/main/DashboardScreen";
import CameraScreen from "../screens/main/CameraScreen";
import AlertsScreen from "../screens/main/AlertsScreen";
import PlantsScreen from "../screens/main/PlantsScreen";
import SettingsScreen from "../screens/main/SettingsScreen";
import DashboardStack from "./DashboardStack";

export type AppTabParamList = {
  Dashboard: undefined;
  Camera: undefined;
  Alerts: undefined;
  Plants: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor: "#0B57D0",
        tabBarInactiveTintColor: "#6B7280",

        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },

        tabBarIcon: ({ color, size, focused }) => {
          const iconSize = size ?? 24;

          let name: keyof typeof Ionicons.glyphMap = "home-outline";

          switch (route.name) {
            case "Dashboard":
              name = focused ? "home" : "home-outline";
              break;
            case "Camera":
              name = focused ? "camera" : "camera-outline";
              break;
            case "Alerts":
              name = focused ? "warning" : "warning-outline";
              break;
            case "Plants":
              name = focused ? "leaf" : "leaf-outline";
              break;
            case "Settings":
              name = focused ? "settings" : "settings-outline";
              break;
          }

          return <Ionicons name={name} size={iconSize} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Camera" component={CameraScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Plants" component={PlantsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default AppNavigator;
