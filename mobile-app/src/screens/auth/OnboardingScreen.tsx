// src/screens/auth/OnboardingScreen.tsx
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<AuthStackParamList, "Onboarding">;

const PRIMARY_BLUE = "#0046AD";
const LIGHT_GRAY = "#F3F5FA";

const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoWrapper}>
          <Image
            source={require("../../../assets/logo.png")} // update path if needed
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Welcome to</Text>
        <Text style={styles.titleAccent}>Asia Plantation</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Your smart solution for Hydroponic farm management. Monitor Growth,
          Detect issues and ensure quality with ease
        </Text>

        {/* Feature cards */}
        <View style={styles.featuresContainer}>
          <FeatureCard
            icon={
              <Ionicons name="analytics-outline" size={22} color={PRIMARY_BLUE} />
            }
            title="Monitor Growth"
            subtitle="Track key metrics in real-time."
          />
          <FeatureCard
            icon={
              <Ionicons name="alert-circle-outline" size={22} color={PRIMARY_BLUE} />
            }
            title="Detect Deficiencies"
            subtitle="Get early alerts for plant health."
          />
          <FeatureCard
            icon={
              <MaterialCommunityIcons
                name="check-decagram-outline"
                size={22}
                color={PRIMARY_BLUE}
              />
            }
            title="Assess Quality"
            subtitle="Ensure your harvest meets standards."
          />
          <FeatureCard
            icon={
              <MaterialCommunityIcons
                name="scale-bathroom"
                size={22}
                color={PRIMARY_BLUE}
              />
            }
            title="Weight Estimation"
            subtitle="Ensure weights of the plants at harvest."
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.primaryButtonText}>Create an Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.secondaryButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
};

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, subtitle }) => {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIconWrapper}>{icon}</View>
      <View style={styles.featureTextWrapper}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  logoWrapper: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  logo: {
    width: 64,
    height: 64,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
  },
  titleAccent: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 20,
    lineHeight: 18,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_GRAY,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  featureIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5EDF8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  featureTextWrapper: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 11,
    color: "#6B7280",
  },
  buttonGroup: {
    marginTop: 10,
  },
  primaryButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: PRIMARY_BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "600",
  },
});
