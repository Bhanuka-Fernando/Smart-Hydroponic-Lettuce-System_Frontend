// src/screens/auth/RegisterScreen.tsx
import React, { useState } from "react";
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
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { registerUser } from "../../api/authApi";
import { useAuth } from "../../auth/useAuth";
import { Ionicons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

const PRIMARY_BLUE = "#0046AD";
const LIGHT_GRAY = "#F3F5FA";

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
      // Add phone here later if your API supports it.
      await registerUser({
        email,
        full_name: fullName,
        password,
      });

      await signInWithEmailPassword({ email, password });
      // RootNavigator will switch to AppNavigator
    } catch (err: any) {
      console.error("Register error:", err?.response?.data || err?.message);
      const message =
        err?.response?.data?.detail ||
        "Registration failed. Please try again.";
      Alert.alert("Registration failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoWrapper}>
          {/* change to your actual logo path if different */}
          <Image
            source={require("../../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Title + subtitle */}
        <Text style={styles.title}>Create Your Account</Text>
        <Text style={styles.subtitle}>Start your journey with us !</Text>

        {/* Inputs */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#9FA6B2"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

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

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#9FA6B2"
            value={phone}
            keyboardType="phone-pad"
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9FA6B2"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Re-enter Password"
            placeholderTextColor="#9FA6B2"
            value={confirmPassword}
            secureTextEntry
            onChangeText={setConfirmPassword}
          />
        </View>

        {/* Create account button */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            submitting && styles.primaryButtonDisabled,
          ]}
          onPress={handleRegister}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Bottom link */}
        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.bottomLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default RegisterScreen;

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
    fontSize: 24,
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
    backgroundColor: LIGHT_GRAY,
    borderRadius: 10,
    height: 52,
    paddingHorizontal: 16,
    justifyContent: "center",
    marginBottom: 12,
  },
  input: {
    fontSize: 14,
    color: "#111827",
  },
  primaryButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: PRIMARY_BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
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
