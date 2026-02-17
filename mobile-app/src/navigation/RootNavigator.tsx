// src/navigation/RootNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../auth/useAuth";
import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";
import SplashScreen from "../screens/auth/SplashScreen";

// ✅ add these imports
import SpoilageDetailsScreen from "../screens/spoilage/SpoilageDetailsScreen";
import SpoilageScanScreen from "../screens/spoilage/SpoilageScanScreen";

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;

  // ✅ spoilage module screens at ROOT level
  SpoilageDetails: undefined;
  SpoilageScan: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <SplashScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="App" component={AppNavigator} />

          {/* ✅ Spoilage flow screens */}
          <Stack.Screen name="SpoilageDetails" component={SpoilageDetailsScreen} />
          <Stack.Screen name="SpoilageScan" component={SpoilageScanScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;