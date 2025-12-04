// src/screens/auth/LoginScreen.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useAuth } from "../../auth/useAuth";

const LoginScreen: React.FC = () => {
  const { signInWithEmailPassword, isLoading } = useAuth();
  const [email, setEmail] = useState("farmer@example.com");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if(!email || !password){
        Alert.alert("Error", "Please enter both email and password.");
        return;
    }
    try {
        setSubmitting(true);
        await signInWithEmailPassword({email, password});
    } catch(err: any) {
        console.error("Login error:", err?.response?.data || err?.message);
        const message = err?.response?.data?.detail || "Login failed. Please check your credentials.";
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
});