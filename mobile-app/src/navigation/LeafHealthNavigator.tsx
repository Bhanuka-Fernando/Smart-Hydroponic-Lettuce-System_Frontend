import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LeafHealthDashboardScreen from "../screens/leafHealth/LeafHealthDashboardScreen";
import LeafHealthScanScreen from "../screens/leafHealth/LeafHealthScanScreen";
import LeafHealthCameraScreen from "../screens/leafHealth/LeafHealthCameraScreen";
import LeafHealthResultScreen from "../screens/leafHealth/LeafHealthResultScreen";
import LeafHealthHistoryScreen from "../screens/leafHealth/LeafHealthHistoryScreen";

export type LeafHealthStackParamList = {
  LeafHealthDashboard: undefined;
  LeafHealthScan: undefined;
  LeafHealthCamera: undefined;
  LeafHealthResult: { result: any; imageUri?: string };
  LeafHealthHistory: undefined;
};

const Stack = createNativeStackNavigator<LeafHealthStackParamList>();

export default function LeafHealthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LeafHealthDashboard" component={LeafHealthDashboardScreen} />
      <Stack.Screen name="LeafHealthScan" component={LeafHealthScanScreen} />
      <Stack.Screen name="LeafHealthCamera" component={LeafHealthCameraScreen} />
      <Stack.Screen name="LeafHealthResult" component={LeafHealthResultScreen} />
      <Stack.Screen name="LeafHealthHistory" component={LeafHealthHistoryScreen} />
    </Stack.Navigator>
  );
}