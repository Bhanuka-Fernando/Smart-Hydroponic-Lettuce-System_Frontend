// src/screens/auth/RegisterScreen.tsx
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
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { registerUser } from "../../auth/authApi";
import { useAuth } from "../../auth/useAuth";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { signInWithEmailPassword } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
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

      // 1) create user
      await registerUser({
        email,
        full_name: fullName,
        password,
      });

      // 2) auto login using same credentials
      await signInWithEmailPassword({ email, password });
      // RootNavigator will switch to AppNavigator automatically
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
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Full name"
        value={fullName}
        onChangeText={setFullName}
      />

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

      <TextInput
        style={styles.input}
        placeholder="Confirm password"
        value={confirmPassword}
        secureTextEntry
        onChangeText={setConfirmPassword}
      />

      {submitting ? (
        <ActivityIndicator style={{ marginTop: 12 }} />
      ) : (
        <Button title="Register" onPress={handleRegister} />
      )}

      <View style={styles.footer}>
        <Text>Already have an account?</Text>
        <Text
          style={styles.link}
          onPress={() => navigation.navigate("Login")}
        >
          {" "}
          Login
        </Text>
      </View>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
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
