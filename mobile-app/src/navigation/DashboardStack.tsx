import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DashboardScreen from "../screens/main/DashboardScreen";
import SpoilageDetailsScreen from "../screens/spoilage/SpoilageDetailsScreen";
import SpoilageScanScreen from "../screens/spoilage/SpoilageScanScreen";

export type DashboardStackParamList = {
  DashboardHome: undefined;
  SpoilageDashboard: undefined;
  SpoilageScan: undefined;
};

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export default function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      <Stack.Screen name="SpoilageDashboard" component={SpoilageDetailsScreen} />
       <Stack.Screen name="SpoilageScan" component={SpoilageScanScreen} />
    </Stack.Navigator>
  );
}
