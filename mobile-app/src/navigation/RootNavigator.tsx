import React from "react";
import { View, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../auth/useAuth";
import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";
import SpoilageNavigator from "./SpoilageNavigator";
import LeafHealthNavigator from "./LeafHealthNavigator";

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
  LeafHealth: undefined;

  // ✅ Spoilage module entry point
  Spoilage: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  // ✅ DO NOT render <SplashScreen/> here (causes gallery crash sometimes)
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="App" component={AppNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}

      {/* ✅ whole spoilage module */}
      <Stack.Screen name="Spoilage" component={SpoilageNavigator} />

      <Stack.Screen name="LeafHealth" component={LeafHealthNavigator} />
    </Stack.Navigator>
  );
}