import React from "react";
import { View, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigatorScreenParams } from "@react-navigation/native";

import { useAuth } from "../auth/useAuth";
import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";
import SpoilageNavigator, {
  type SpoilageStackParamList,
} from "./SpoilageNavigator";

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;

  // ✅ UPDATED
  Spoilage: NavigatorScreenParams<SpoilageStackParamList>;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

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

      <Stack.Screen name="Spoilage" component={SpoilageNavigator} />
    </Stack.Navigator>
  );
}