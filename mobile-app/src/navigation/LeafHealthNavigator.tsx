import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LeafHealthScanScreen from "../screens/leafHealth/LeafHealthScanScreen";
import LeafHealthResultScreen from "../screens/leafHealth/LeafHealthResultScreen";
import LeafHealthCameraScreen from "../screens/leafHealth/LeafHealthCameraScreen";

export type LeafHealthStackParamList = {
  LeafHealthScan: undefined;
  LeafHealthResult: { result: any; imageUri: string };
  LeafHealthCamera: undefined;
  LeafHealthHistory: { plantId?: string } | undefined;
};

const Stack = createNativeStackNavigator<LeafHealthStackParamList>();

export default function LeafHealthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LeafHealthScan" component={LeafHealthScanScreen} />
      <Stack.Screen name="LeafHealthResult" component={LeafHealthResultScreen} />
      <Stack.Screen name="LeafHealthCamera" component={LeafHealthCameraScreen} />
    </Stack.Navigator>
  );
}