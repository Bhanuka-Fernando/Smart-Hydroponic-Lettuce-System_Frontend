import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SpoilageDetailsScreen from "../screens/spoilage/SpoilageDetailsScreen";
import SpoilagePlantsScreen from "../screens/spoilage/SpoilagePlantsScreen";
import SpoilagePlantDetailsScreen from "../screens/spoilage/SpoilagePlantDetailsScreen";
import SpoilageScanScreen from "../screens/spoilage/SpoilageScanScreen";
import SpoilageConfirmScreen from "../screens/spoilage/SpoilageConfirmScreen";
import SpoilageShelfLifeResultScreen from "../screens/spoilage/SpoilageShelfLifeResultScreen";
import SpoilageAlertsScreen from "../screens/spoilage/SpoilageAlertsScreen";

import type { SpoilagePredictResponse } from "../api/SpoilageApi";

export type SpoilageStackParamList = {
  SpoilageDetails: undefined;
  SpoilagePlants: undefined;

  // ✅ new spoilage-owned plant details
  SpoilagePlantDetails: { plantId: string };

  // ✅ scan can accept a plantId (passed from plant details)
  SpoilageScan: { plantId?: string; demoMode?: boolean } | undefined;

  SpoilageConfirm: {
    imageUri: string;
    result: SpoilagePredictResponse;
    temperature: number;
    humidity: number;
    plantId: string;
  };

  SpoilageShelfLifeResult: { imageUri: string; result: SpoilagePredictResponse };
  SpoilageAlerts: undefined;
};

const Stack = createNativeStackNavigator<SpoilageStackParamList>();

export default function SpoilageNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SpoilageDetails" component={SpoilageDetailsScreen} />
      <Stack.Screen name="SpoilagePlants" component={SpoilagePlantsScreen} />
      <Stack.Screen
        name="SpoilagePlantDetails"
        component={SpoilagePlantDetailsScreen}
      />
      <Stack.Screen name="SpoilageScan" component={SpoilageScanScreen} />
      <Stack.Screen name="SpoilageConfirm" component={SpoilageConfirmScreen} />
      <Stack.Screen
        name="SpoilageShelfLifeResult"
        component={SpoilageShelfLifeResultScreen}
      />
      <Stack.Screen name="SpoilageAlerts" component={SpoilageAlertsScreen} />
    </Stack.Navigator>
  );
}