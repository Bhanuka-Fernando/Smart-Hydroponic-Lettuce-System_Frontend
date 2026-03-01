import "./global.css";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./src/auth/AuthProvider";
import RootNavigator from "./src/navigation/RootNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SensorReadingsProvider } from "./src/context/SensorReadingsContext";
import { PreferencesProvider } from "./src/context/PreferencesContext";

import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import { Text } from "react-native";

export default function App() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!loaded) return null;

  // ✅ Force default font for ALL Text everywhere
  // (unless you override it)
  (Text as any).defaultProps = (Text as any).defaultProps || {};
  (Text as any).defaultProps.style = [
    { fontFamily: "Inter_400Regular" },
    (Text as any).defaultProps.style,
  ];

  return (
    
    <SafeAreaProvider>
      <PreferencesProvider>
        <SensorReadingsProvider>
          <AuthProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
        </SensorReadingsProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}
