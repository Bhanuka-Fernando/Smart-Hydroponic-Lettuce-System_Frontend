// src/screens/auth/LoginScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from "react-native";
import { useAuth } from "../../auth/useAuth";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";

import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Ionicons } from "@expo/vector-icons";
import { AntDesign } from "@expo/vector-icons";

import {
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_REDIRECT_URI,
} from "../../config/googleAuth";

WebBrowser.maybeCompleteAuthSession();

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, "Login">;

const LoginScreen: React.FC = () => {
  const { signInWithEmailPassword, signInWithGoogle, isLoading } = useAuth();
  const navigation = useNavigation<LoginNavProp>();

  const [email, setEmail] = useState("farmer@example.com");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ---------- GOOGLE AUTH (Web client + Expo proxy) ----------
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      clientId: GOOGLE_WEB_CLIENT_ID,
      redirectUri: GOOGLE_REDIRECT_URI,
      scopes: ["openid", "profile", "email"],
    } as any
  );

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (!response) return;

      if (response.type === "success") {
        try {
          const idToken =
            (response.params as any)?.id_token as string | undefined;

          if (!idToken) {
            Alert.alert("Google login failed", "No ID token received.");
            return;
          }

          await signInWithGoogle(idToken);
        } catch (err: any) {
          console.error(
            "Google login error:",
            err?.response?.data || err?.message
          );
          const message =
            err?.response?.data?.detail ||
            "Google login failed. Please try again.";
          Alert.alert("Google login failed", message);
        }
      } else if (response.type === "error") {
        Alert.alert("Google login cancelled", "Something went wrong.");
      }
    };

    handleGoogleResponse();
  }, [response, signInWithGoogle]);

  // ---------- EMAIL/PASSWORD LOGIN ----------
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    try {
      setSubmitting(true);
      await signInWithEmailPassword({ email, password });
    } catch (err: any) {
      console.error("Login error:", err?.response?.data || err?.message);
      const message =
        err?.response?.data?.detail ||
        (err.message === "Network Error"
          ? "Cannot reach server. Check connection."
          : "Login failed. Please check your credentials.");
      Alert.alert("Login failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  const loading = isLoading || submitting;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        

        {/* Logo */}
        <View style={styles.logoWrapper}>
          {/* change source to your real logo */}
          <Image
            source={require("../../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Title + subtitle */}
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>
          Welcome back! Please enter your details
        </Text>

        {/* Email input */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#9FA6B2"
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
          />
        </View>

        {/* Password input with eye icon */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9FA6B2"
            value={password}
            secureTextEntry={!showPassword}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>

        {/* Forgot password */}
        <TouchableOpacity
          style={styles.forgotWrapper}
          onPress={() => Alert.alert("Forgot Password", "Not implemented yet.")}
        >
          <Text style={styles.forgotText}>Forgot Password ?</Text>
        </TouchableOpacity>

        {/* Login button */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or Continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google button */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => promptAsync({ useProxy: true } as any)}
          disabled={!request}
        >
          <AntDesign name="google" size={20} color="#DB4437" />
          <Text style={styles.googleButtonText}>Google</Text>
        </TouchableOpacity>

        {/* Bottom sign up text */}
        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Don&apos;t have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.bottomLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;

const PRIMARY_BLUE = "#0046AD";
const LIGHT_GRAY = "#F3F5FA";

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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  logoWrapper: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
    color: "#111827",
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_GRAY,
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  eyeButton: {
    marginLeft: 8,
  },
  forgotWrapper: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 13,
    color: PRIMARY_BLUE,
    fontWeight: "600",
  },
  primaryButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: PRIMARY_BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 8,
    fontSize: 12,
    color: "#9CA3AF",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    height: 52,
    marginBottom: 24,
  },
  googleButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: "auto",
    marginBottom: 12,
  },
  bottomText: {
    fontSize: 13,
    color: "#6B7280",
  },
  bottomLink: {
    fontSize: 13,
    color: PRIMARY_BLUE,
    fontWeight: "600",
  },
});
