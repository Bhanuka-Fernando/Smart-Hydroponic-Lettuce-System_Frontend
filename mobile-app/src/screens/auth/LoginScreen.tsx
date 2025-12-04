// src/screens/auth/LoginScreen.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { useAuth } from "../../auth/useAuth";

const LoginScreen: React.FC = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("farmer@example.com");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // TODO: replace with real backend call
    signIn({
      user: {
        id: "1",
        name: "Demo Farmer",
        email,
        role: "farmer",
      },
      accessToken: "dummy-access-token",
      refreshToken: "dummy-refresh-token",
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        autoCapitalize="none"
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />

      <Button title="Login (dummy)" onPress={handleLogin} />
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
