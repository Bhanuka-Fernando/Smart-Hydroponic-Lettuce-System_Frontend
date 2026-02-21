import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SpoilageDetailsScreen from "../screens/spoilage/SpoilageDetailsScreen";
import SpoilageScanScreen from "../screens/spoilage/SpoilageScanScreen";
import SpoilageConfirmScreen from "../screens/spoilage/SpoilageConfirmScreen";
import SpoilageShelfLifeResultScreen from "../screens/spoilage/SpoilageShelfLifeResultScreen";
import SpoilageAlertsScreen from "../screens/spoilage/SpoilageAlertsScreen";

export type SpoilageStackParamList = {
  SpoilageDetails: undefined;
  SpoilageScan: undefined;
  SpoilageConfirm: { imageUri: string };
  SpoilageShelfLifeResult: { imageUri: string };
  SpoilageAlerts: undefined;
};

const Stack = createNativeStackNavigator<SpoilageStackParamList>();

export default function SpoilageNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SpoilageDetails" component={SpoilageDetailsScreen} />
      <Stack.Screen name="SpoilageScan" component={SpoilageScanScreen} />
      <Stack.Screen name="SpoilageConfirm" component={SpoilageConfirmScreen} />
      <Stack.Screen name="SpoilageShelfLifeResult" component={SpoilageShelfLifeResultScreen} />
      <Stack.Screen name="SpoilageAlerts" component={SpoilageAlertsScreen} />
    </Stack.Navigator>
  );
}