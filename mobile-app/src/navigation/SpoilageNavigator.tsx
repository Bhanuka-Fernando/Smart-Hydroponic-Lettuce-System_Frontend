import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SpoilageDetailsScreen from "../screens/spoilage/SpoilageDetailsScreen";
import SpoilageScanScreen from "../screens/spoilage/SpoilageScanScreen";

export type SpoilageStackParamList = {
  SpoilageDetails: undefined;
  SpoilageScan: undefined;
};

const Stack = createNativeStackNavigator<SpoilageStackParamList>();

export default function SpoilageNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SpoilageDetails" component={SpoilageDetailsScreen} />
      <Stack.Screen name="SpoilageScan" component={SpoilageScanScreen} />
    </Stack.Navigator>
  );
}