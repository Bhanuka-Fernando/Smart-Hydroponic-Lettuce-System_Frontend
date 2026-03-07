import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LeafHealthScanScreen from "../screens/leafHealth/LeafHealthScanScreen";
import LeafHealthCameraScreen from "../screens/leafHealth/LeafHealthCameraScreen";
import LeafHealthResultScreen from "../screens/leafHealth/LeafHealthResultScreen";

export type LeafHealthStackParamList = {
  LeafHealthScan: undefined;
  LeafHealthCamera: undefined;
  LeafHealthResult: { result: any; imageUri?: string };
  LeafHealthHistory: { plantId?: string } | undefined;
};

const Stack = createNativeStackNavigator<LeafHealthStackParamList>();

export default function LeafHealthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LeafHealthScan" component={LeafHealthScanScreen} />
      <Stack.Screen name="LeafHealthCamera" component={LeafHealthCameraScreen} />
      <Stack.Screen name="LeafHealthResult" component={LeafHealthResultScreen} />
    </Stack.Navigator>
  );
}