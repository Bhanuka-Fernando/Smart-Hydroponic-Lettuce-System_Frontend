import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
} from "react-native";
import { useAuth } from "../../auth/useAuth";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";
import { SafeAreaView } from "react-native-safe-area-context";

import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Ionicons } from "@expo/vector-icons";
import { AntDesign } from "@expo/vector-icons";

import { GOOGLE_WEB_CLIENT_ID, GOOGLE_REDIRECT_URI } from "../../config/googleAuth";

WebBrowser.maybeCompleteAuthSession();

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, "Login">;

const LoginScreen: React.FC = () => {
  const { signInWithEmailPassword, signInWithGoogle, isLoading } = useAuth();
  const navigation = useNavigation<LoginNavProp>();

  const [email, setEmail] = useState("farmer@example.com");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
          const idToken = (response.params as any)?.id_token as string | undefined;

          if (!idToken) {
            Alert.alert("Google login failed", "No ID token received.");
            return;
          }

          await signInWithGoogle(idToken);
        } catch (err: any) {
          console.error("Google login error:", err?.response?.data || err?.message);
          const message = err?.response?.data?.detail || "Google login failed. Please try again.";
          Alert.alert("Google login failed", message);
        }
      } else if (response.type === "error") {
        Alert.alert("Google login cancelled", "Something went wrong.");
      }
    };

    handleGoogleResponse();
  }, [response, signInWithGoogle]);

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
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-4">
        {/* Logo */}
        <View className="items-center mt-2 mb-4">
          <Image
            source={require("../../../assets/logo.png")}
            className="w-20 h-20"
            resizeMode="contain"
          />
        </View>

        {/* Title + subtitle */}
        <Text className="text-[26px] font-bold text-center mb-1 text-gray-900">
          Login
        </Text>
        <Text className="text-[13px] text-center text-gray-500 mb-6">
          Welcome back! Please enter your details
        </Text>

        {/* Email input */}
        <View className="flex-row items-center bg-lightgray rounded-[10px] px-4 h-[52px] mb-3">
          <TextInput
            className="flex-1 text-[14px] text-gray-900"
            placeholder="Email Address"
            placeholderTextColor="#9FA6B2"
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
          />
        </View>

        {/* Password input */}
        <View className="flex-row items-center bg-lightgray rounded-[10px] px-4 h-[52px] mb-3">
          <TextInput
            className="flex-1 text-[14px] text-gray-900"
            placeholder="Password"
            placeholderTextColor="#9FA6B2"
            value={password}
            secureTextEntry={!showPassword}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            className="ml-2"
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
          className="items-end mb-5"
          onPress={() => Alert.alert("Forgot Password", "Not implemented yet.")}
        >
          <Text className="text-[13px] text-primary font-semibold">
            Forgot Password ?
          </Text>
        </TouchableOpacity>

        {/* Login button */}
        <TouchableOpacity
          className={`h-[52px] rounded-[10px] bg-primary items-center justify-center mb-6 ${
            loading ? "opacity-70" : ""
          }`}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-[16px] font-semibold">Login</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center mb-4">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="mx-2 text-[12px] text-gray-400">Or Continue with</Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        {/* Google button */}
        <TouchableOpacity
          className="flex-row items-center justify-center bg-gray-200 rounded-[10px] h-[52px] mb-6"
          onPress={() => promptAsync({ useProxy: true } as any)}
          disabled={!request}
        >
          <AntDesign name="google" size={20} color="#DB4437" />
          <Text className="ml-2 text-[15px] font-medium text-gray-900">
            Google
          </Text>
        </TouchableOpacity>

        {/* Bottom sign up text */}
        <View className="flex-row justify-center mt-auto mb-3">
          <Text className="text-[13px] text-gray-500">Don&apos;t have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text className="text-[13px] text-primary font-semibold">Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
