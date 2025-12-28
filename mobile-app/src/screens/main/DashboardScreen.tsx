// src/screens/main/DashboardScreen.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../auth/useAuth";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { DashboardStackParamList } from "../../navigation/DashboardStack";

type TileKey = "estimateWeight" | "diseaseDetection" | "estimateShelfLife" | "algaeDetection";

const TILES: Array<{ key: TileKey; label: string }> = [
  { key: "estimateWeight", label: "Estimate Weight" },
  { key: "diseaseDetection", label: "Disease Detection" },
  { key: "estimateShelfLife", label: "Estimate Shelf life" },
  { key: "algaeDetection", label: "Algae Detection" },
];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const navigation = useNavigation<NativeStackNavigationProp<DashboardStackParamList>>();

  const handleTilePress = (key: TileKey) => {
    if (key === "estimateShelfLife") {
      navigation.navigate("SpoilageDashboard");
      return;
    }
    console.log("Pressed:", key);
  };

  const handleQuickAction = (action: "estimate" | "predict") => {
    console.log("Quick action:", action);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>Quadra Leaf</Text>
            {user?.full_name ? <Text style={styles.subTitle}>Hi, {user.full_name}</Text> : null}
          </View>

          <View style={styles.headerRight}>
            <Pressable onPress={() => console.log("Notifications")} style={styles.iconBtn} hitSlop={10}>
              <Ionicons name="notifications-outline" size={22} color="#111" />
              <View style={styles.notifDot} />
            </Pressable>

            <Pressable onPress={() => console.log("Profile")} style={styles.avatarWrap} hitSlop={10}>
              <Image
                source={{ uri: "https://ui-avatars.com/api/?name=User&background=E6EEF6&color=0A2A43" }}
                style={styles.avatar}
              />
            </Pressable>
          </View>
        </View>

        {/* Tiles */}
        <View style={styles.grid}>
          {TILES.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => handleTilePress(t.key)}
              style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.99 }], opacity: 0.95 }]}
            >
              <View style={styles.tileInner}>
                <View style={styles.tileLabelPill}>
                  <Text style={styles.tileLabelText}>{t.label}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={styles.quickTitle}>Quick Actions</Text>

        <View style={styles.quickRow}>
          <Pressable onPress={() => handleQuickAction("estimate")} style={({ pressed }) => [styles.quickBtn, pressed && styles.pressed]}>
            <Text style={styles.quickBtnText}>Estimate Weight</Text>
          </Pressable>

          <Pressable onPress={() => handleQuickAction("predict")} style={({ pressed }) => [styles.quickBtn, pressed && styles.pressed]}>
            <Text style={styles.quickBtnText}>Predict Weight</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const CARD_BG = "#DCEBFA";
const ACCENT = "#1F7A8C";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 18, paddingTop: 10 },

  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#0B0B0B", letterSpacing: 0.2 },
  subTitle: { marginTop: 4, fontSize: 13, color: "#5B6470", fontWeight: "500" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },

  iconBtn: { width: 38, height: 38, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "#F3F6FA", position: "relative" },
  notifDot: { position: "absolute", top: 9, right: 10, width: 8, height: 8, borderRadius: 999, backgroundColor: "#E53935" },

  avatarWrap: { width: 38, height: 38, borderRadius: 999, overflow: "hidden", backgroundColor: "#E6EEF6" },
  avatar: { width: "100%", height: "100%" },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 16, marginTop: 6, marginBottom: 18 },
  tile: { width: "48%", aspectRatio: 1, borderRadius: 16, backgroundColor: CARD_BG, overflow: "hidden" },
  tileInner: { flex: 1, padding: 12, justifyContent: "flex-end", alignItems: "flex-start" },
  tileLabelPill: { backgroundColor: ACCENT, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  tileLabelText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },

  quickTitle: { fontSize: 13, fontWeight: "700", color: "#303846", marginBottom: 10 },
  quickRow: { flexDirection: "row", gap: 10 },
  quickBtn: { backgroundColor: ACCENT, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  quickBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
  pressed: { opacity: 0.9 },
});
