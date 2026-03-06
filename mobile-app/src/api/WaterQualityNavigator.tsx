import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import WaterQualityDashboardScreen from "../screens/waterQuality/WaterQualityDashboardScreen";
import WaterQualityHistoryScreen from "../screens/waterQuality/WaterQualityHistoryScreen";

export type WaterQualityStackParamList = {
  WaterQualityDashboard: undefined;
  WaterQualityHistory: { tank_id: string };
};

const Stack = createNativeStackNavigator<WaterQualityStackParamList>();

export default function WaterQualityNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WaterQualityDashboard" component={WaterQualityDashboardScreen} />
      <Stack.Screen name="WaterQualityHistory" component={WaterQualityHistoryScreen} />
    </Stack.Navigator>
  );
}