// src/screens/auth/RegisterScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { registerUser } from "../../api/authApi";
import { useAuth } from "../../auth/useAuth";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { signInWithEmailPassword } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);

      // Backend currently expects: email, full_name, password
      // Add phone later if your API supports it.
      await registerUser({
        email,
        full_name: fullName,
        password,
      });

      await signInWithEmailPassword({ email, password });
    } catch (err: any) {
      console.error("Register error:", err?.response?.data || err?.message);
      const message = err?.response?.data?.detail || "Registration failed. Please try again.";
      Alert.alert("Registration failed", message);
    } finally {
      setSubmitting(false);
    }
  };

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
        <Text className="text-[24px] font-bold text-center mb-1 text-gray-900">
          Create Your Account
        </Text>
        <Text className="text-[13px] text-center text-gray-500 mb-6">
          Start your journey with us !
        </Text>

        {/* Inputs */}
        <View className="bg-lightgray rounded-[10px] h-[52px] px-4 justify-center mb-3">
          <TextInput
            className="text-[14px] text-gray-900"
            placeholder="Full Name"
            placeholderTextColor="#9FA6B2"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View className="bg-lightgray rounded-[10px] h-[52px] px-4 justify-center mb-3">
          <TextInput
            className="text-[14px] text-gray-900"
            placeholder="Email Address"
            placeholderTextColor="#9FA6B2"
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
          />
        </View>

        <View className="bg-lightgray rounded-[10px] h-[52px] px-4 justify-center mb-3">
          <TextInput
            className="text-[14px] text-gray-900"
            placeholder="Phone Number"
            placeholderTextColor="#9FA6B2"
            value={phone}
            keyboardType="phone-pad"
            onChangeText={setPhone}
          />
        </View>

        <View className="bg-lightgray rounded-[10px] h-[52px] px-4 justify-center mb-3">
          <TextInput
            className="text-[14px] text-gray-900"
            placeholder="Password"
            placeholderTextColor="#9FA6B2"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
          />
        </View>

        <View className="bg-lightgray rounded-[10px] h-[52px] px-4 justify-center mb-3">
          <TextInput
            className="text-[14px] text-gray-900"
            placeholder="Re-enter Password"
            placeholderTextColor="#9FA6B2"
            value={confirmPassword}
            secureTextEntry
            onChangeText={setConfirmPassword}
          />
        </View>

        {/* Create account button */}
        <TouchableOpacity
          className={`h-[52px] rounded-[10px] bg-primary items-center justify-center mt-4 ${
            submitting ? "opacity-70" : ""
          }`}
          onPress={handleRegister}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-[16px] font-semibold">
              Create Account
            </Text>
          )}
        </TouchableOpacity>

        {/* Bottom link */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-[13px] text-gray-500">Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text className="text-[13px] text-primary font-semibold">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default RegisterScreen;