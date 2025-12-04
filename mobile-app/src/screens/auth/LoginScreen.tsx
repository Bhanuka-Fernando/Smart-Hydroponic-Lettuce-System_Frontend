// src/screens/auth/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "../../auth/useAuth";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, "Login">;

const LoginScreen: React.FC = () => {
  const { signInWithEmailPassword, isLoading } = useAuth();
  const navigation = useNavigation<LoginNavProp>();

  const [email, setEmail] = useState("farmer@example.com");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 12 }} />
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}

      <View style={styles.footer}>
        <Text>Don&apos;t have an account?</Text>
        <Text
          style={styles.link}
          onPress={() => navigation.navigate("Register")}
        >
          {" "}
          Register
        </Text>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  footer: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
  },
  link: {
    color: "#007bff",
    fontWeight: "500",
  },
});
