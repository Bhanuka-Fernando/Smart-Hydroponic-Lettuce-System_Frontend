// src/screens/main/SpoilageDashboardScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { classifySpoilage, SpoilageStage } from "../../api/spoilageApi";
import { useAuth } from "../../auth/useAuth";

type PlantStatus = "Fresh" | "Monitoring" | "Warning" | "Critical";

type PlantItem = {
  id: string;
  status: PlantStatus;
  daysLeft: number;
};

const STATUS_COLOR: Record<PlantStatus, string> = {
  Fresh: "#22C55E",
  Monitoring: "#3B82F6",
  Warning: "#F59E0B",
  Critical: "#EF4444",
};

function stageToStatus(stage: SpoilageStage): PlantStatus {
  switch (stage) {
    case "fresh":
      return "Fresh";
    case "slightly_aged":
      return "Monitoring";
    case "near_spoilage":
      return "Warning";
    case "spoiled":
      return "Critical";
    default:
      return "Monitoring";
  }
}

// placeholder until remaining-days model
function stageToDays(stage: SpoilageStage): number {
  switch (stage) {
    case "fresh":
      return 7;
    case "slightly_aged":
      return 5;
    case "near_spoilage":
      return 2;
    case "spoiled":
      return 0;
    default:
      return 0;
  }
}

export default function SpoilageDashboardScreen() {
  const insets = useSafeAreaInsets();

  // ✅ hook must be INSIDE component
  const { accessToken, isLoading } = useAuth();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PlantStatus | "All">("All");

  const [tempC] = useState<number>(24);
  const [humidityPct] = useState<number>(60);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [lastPred, setLastPred] = useState<{
    plantId: string;
    stage: SpoilageStage;
    confidence: number;
  } | null>(null);

  const [data, setData] = useState<PlantItem[]>([
    { id: "P-001", status: "Fresh", daysLeft: 7 },
    { id: "P-020", status: "Monitoring", daysLeft: 5 },
    { id: "P-050", status: "Warning", daysLeft: 2 },
    { id: "P-060", status: "Critical", daysLeft: 1 },
    { id: "P-051", status: "Warning", daysLeft: 2 },
    { id: "P-052", status: "Warning", daysLeft: 2 },
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((p) => {
      const matchesQuery = !q || p.id.toLowerCase().includes(q);
      const matchesFilter = filter === "All" || p.status === filter;
      return matchesQuery && matchesFilter;
    });
  }, [data, query, filter]);

  const counts = useMemo(() => {
    const c = { All: data.length, Monitoring: 0, Warning: 0, Critical: 0 } as any;
    for (const p of data) {
      if (p.status === "Monitoring") c.Monitoring++;
      if (p.status === "Warning") c.Warning++;
      if (p.status === "Critical") c.Critical++;
    }
    return c as { All: number; Monitoring: number; Warning: number; Critical: number };
  }, [data]);

  const globalAlert = counts.Warning + counts.Critical;

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Allow gallery access to select an image.");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (result.canceled) return null;
    return result.assets[0].uri;
  };

  const handlePredictForPlant = async (plantId: string) => {
    if (loadingId) return;

    // ✅ block if auth still restoring
    if (isLoading) {
      Alert.alert("Please wait", "Auth is still loading. Try again in a second.");
      return;
    }

    // ✅ must have token
    if (!accessToken) {
      Alert.alert("Prediction failed", "No access token found. Please login again.");
      return;
    }

    try {
      setLoadingId(plantId);

      const uri = await pickImage();
      if (!uri) return;

      // ✅ pass accessToken into API call
      const res = await classifySpoilage(accessToken, uri, tempC, humidityPct);

      const newStatus = stageToStatus(res.stage);
      const newDays = stageToDays(res.stage);

      setData((prev) =>
        prev.map((p) =>
          p.id === plantId ? { ...p, status: newStatus, daysLeft: newDays } : p
        )
      );

      setLastPred({
        plantId,
        stage: res.stage,
        confidence: res.confidence,
      });
    } catch (e: any) {
      Alert.alert("Prediction failed", e?.message ?? "Unknown error");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {globalAlert > 0 ? (
        <View style={styles.globalAlert}>
          <Text style={styles.globalAlertText}>
            GLOBAL ALERT: {globalAlert} PLANTS NEAR SPOILAGE
          </Text>
        </View>
      ) : null}

      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={18} color="#0B7A3B" />
          </View>
          <Text style={styles.brand}>Quadra Leaf</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Temperature</Text>
          <Text style={styles.metricValue}>{tempC}°C</Text>
          <Text style={styles.metricSub}>Safe</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Humidity</Text>
          <Text style={styles.metricValue}>{humidityPct}%</Text>
          <Text style={styles.metricSub}>Safe</Text>
        </View>
      </View>

      {lastPred ? (
        <View style={styles.lastPredRow}>
          <Ionicons name="analytics-outline" size={16} color="#111" />
          <Text style={styles.lastPredText}>
            Last: {lastPred.plantId} → {lastPred.stage} (
            {(lastPred.confidence * 100).toFixed(2)}%)
          </Text>
        </View>
      ) : null}

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#6B7280" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by Plant ID"
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
        <Pressable onPress={() => setQuery("")} hitSlop={10}>
          <Ionicons name="close-circle" size={18} color="#9CA3AF" />
        </Pressable>
      </View>

      <View style={styles.chipsRow}>
        <Chip label={`All (${counts.All})`} active={filter === "All"} onPress={() => setFilter("All")} />
        <Chip label={`Monitoring (${counts.Monitoring})`} active={filter === "Monitoring"} onPress={() => setFilter("Monitoring")} />
        <Chip label={`Warning (${counts.Warning})`} active={filter === "Warning"} onPress={() => setFilter("Warning")} />
        <Chip label={`Critical (${counts.Critical})`} active={filter === "Critical"} onPress={() => setFilter("Critical")} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 18, gap: 12 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handlePredictForPlant(item.id)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
          >
            <View style={styles.cardTopRow}>
              <Text style={styles.plantId}>{item.id}</Text>
              {loadingId === item.id ? (
                <ActivityIndicator size="small" />
              ) : (
                <Ionicons name="camera-outline" size={18} color="#111" />
              )}
            </View>

            <View style={styles.thumbWrap}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=200&q=60",
                }}
                style={styles.thumb}
              />
            </View>

            <View style={styles.statusRow}>
              <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[item.status] }]}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>

              <View style={styles.daysWrap}>
                <Ionicons name="time-outline" size={16} color="#111" />
                <Text style={styles.daysText}>{item.daysLeft} DAYS</Text>
              </View>
            </View>

            <Text style={styles.tapHint}>Tap to select image & predict</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
    >
      <Text style={[styles.chipText, active && { color: "#fff" }]}>{label}</Text>
    </Pressable>
  );
}

const BG = "#E8F7F1";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  globalAlert: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: "#F59E0B",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  globalAlertText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  headerRow: { paddingHorizontal: 16, paddingBottom: 10 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoCircle: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#DDF6E8",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 20, fontWeight: "900", color: "#0B0B0B" },

  metricsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, marginBottom: 10 },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#D7EFE4",
  },
  metricLabel: { color: "#6B7280", fontWeight: "700", fontSize: 12 },
  metricValue: { color: "#111", fontWeight: "900", fontSize: 18, marginTop: 4 },
  metricSub: { color: "#22C55E", fontWeight: "800", fontSize: 12, marginTop: 2 },

  lastPredRow: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#D7EFE4",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lastPredText: { color: "#111", fontWeight: "800", fontSize: 12 },

  searchRow: {
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#D7EFE4",
    marginBottom: 10,
  },
  searchInput: { flex: 1, color: "#111", fontWeight: "600" },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 },
  chipActive: { backgroundColor: "#0B57D0" },
  chipInactive: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D7EFE4" },
  chipText: { fontSize: 12, fontWeight: "800", color: "#0B57D0" },

  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#D7EFE4",
  },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  plantId: { fontWeight: "900", color: "#111" },

  thumbWrap: { borderRadius: 12, overflow: "hidden", height: 90, backgroundColor: "#F3F4F6" },
  thumb: { width: "100%", height: "100%" },

  statusRow: { marginTop: 10, gap: 8 },
  statusPill: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText: { color: "#fff", fontWeight: "900", fontSize: 11 },
  daysWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  daysText: { fontWeight: "900", color: "#111" },

  tapHint: { marginTop: 10, color: "#6B7280", fontWeight: "700", fontSize: 11 },
});
