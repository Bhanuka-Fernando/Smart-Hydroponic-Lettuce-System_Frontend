// src/screens/main/DashboardScreen.tsx
import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { useAuth } from "../../auth/useAuth";

const DashboardScreen: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      {user && (
        <Text style={styles.subtitle}>
          Welcome, {user.name} ({user.role})
        </Text>
      )}
      <Button title="Logout" onPress={signOut} />
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
  },
});
