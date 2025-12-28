import React from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { useAuth } from "../../auth/useAuth";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  const onLogout = () => {
    Alert.alert("Logout", "Do you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.value}>{user?.email ?? "-"}</Text>
      </View>

      <Pressable style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 12 },
  card: {
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#F3F6FB",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  label: { color: "#64748B", fontWeight: "700", marginBottom: 4 },
  value: { color: "#0F172A", fontWeight: "800" },

  logoutBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B57D0",
  },
  logoutText: { color: "white", fontWeight: "800", fontSize: 16 },
});
