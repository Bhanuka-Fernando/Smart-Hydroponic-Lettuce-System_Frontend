// src/screens/auth/SplashScreen.tsx
import React, { useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";

type SplashNavProp = NativeStackNavigationProp<AuthStackParamList, "Splash">;

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashNavProp>();

  useEffect(() => {
    const timer = setTimeout(() => {
      // go to onboarding after short delay
      navigation.replace("Onboarding");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Logo centered */}
        <View style={styles.logoWrapper}>
          <Image
            source={require("../../../assets/logo.png")} // keep your path
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Tagline at bottom */}
        <Text style={styles.tagline}>Cultivating Smarter Growth</Text>
      </View>
    </SafeAreaView>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 48,
  },
  logoWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  logo: {
    width: 180,
    height: 180,
  },
  tagline: {
    fontSize: 13,
    letterSpacing: 0.3,
    color: "#111827",
    marginBottom: 8,
  },
});
