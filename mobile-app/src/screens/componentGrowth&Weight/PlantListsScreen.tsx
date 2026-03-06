import React, { useMemo, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage"; // ✅ Add this import

import { useAuth } from "../../auth/useAuth";
import { getPlants, deletePlant } from "../../api/plantsApi";

type Filter = "All" | "Growing" | "Harvest Ready";

type Plant = {
  id: string;
  listKey: string; // unique key for React rendering
  name: string;
  day: number;
  area: number; // cm2
  diameter: number; // cm
  estWeight: number; // g
  status: "NOT READY" | "HARVEST READY";
  imageUri: string;
};

const normalizePlantId = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^[^a-z0-9_-]+/i, ""); // strips leading symbols like "$"

function Chip({ label, active, onPress }: { label: Filter; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className={`px-4 py-2 rounded-full border ${
        active ? "bg-[#EAF4FF] border-[#B6C8F0]" : "bg-white border-gray-200"
      }`}
    >
      <Text className={`text-[11px] font-extrabold ${active ? "text-[#003B8F]" : "text-gray-600"}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function StatusPill({ status }: { status: Plant["status"] }) {
  const isReady = status === "HARVEST READY";
  return (
    <View className={`px-3 py-1 rounded-full ${isReady ? "bg-[#E9FBEF]" : "bg-[#EEF2F7]"}`}>
      <Text className={`text-[9px] font-extrabold ${isReady ? "text-[#16A34A]" : "text-gray-600"}`}>
        {status}
      </Text>
    </View>
  );
}

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <View className="bg-[#F6F8FC] rounded-[12px] px-3 py-2">
      <Text className="text-[9px] font-extrabold text-gray-500">{label}</Text>
      <Text className="text-[11px] font-extrabold text-gray-900 mt-1">{value}</Text>
    </View>
  );
}

function PlantCard({ plant, onPress, onDelete }: { plant: Plant; onPress: () => void; onDelete: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} className="bg-white rounded-[18px] shadow-sm p-4 mb-3">
      <View className="flex-row">
        <View className="w-[64px] h-[64px] rounded-[16px] overflow-hidden bg-[#E5E7EB]">
          <Image source={{ uri: plant.imageUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        </View>

        <View className="flex-1 ml-3">
          <View className="flex-row items-start justify-between">
            <Text className="text-[13px] font-extrabold text-gray-900">{plant.name}</Text>
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <StatusPill status={plant.status} />
              <TouchableOpacity
                onPress={onDelete}
                activeOpacity={0.7}
                className="w-7 h-7 rounded-full bg-red-50 items-center justify-center"
              >
                <Ionicons name="trash-outline" size={14} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row mt-3" style={{ gap: 10 }}>
            <MiniField label="DAY" value={`Day ${plant.day}`} />
            <MiniField label="EST. WEIGHT" value={`${plant.estWeight}g`} />
          </View>

          <View className="flex-row mt-2" style={{ gap: 10 }}>
            <MiniField label="AREA" value={`${plant.area} cm²`} />
            <MiniField label="DIAMETER" value={`${plant.diameter} cm`} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function PlantListsScreen() {
  const navigation = useNavigation<any>();
  const { accessToken } = useAuth();

  const [filter, setFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);

  const apiFilter = useMemo(() => {
    if (filter === "All") return "all";
    if (filter === "Growing") return "growing";
    return "harvest_ready";
  }, [filter]);

  const loadPlants = async () => {
    try {
      setLoading(true);
      const data = await getPlants({ token: accessToken, filter: apiFilter as any, zone_id: "z01" });

      const seen = new Set<string>();
      const mapped: Plant[] = [];

      data.forEach((p: any, index: number) => {
        if (!p?.plant_id) return;

        const normalizedId = normalizePlantId(p.plant_id);
        if (!normalizedId) return;

        // Block p04/P04 completely
        if (normalizedId === "p04") {
          console.log("🚫 Blocking p04 from display");
          return;
        }

        // Dedupe by normalized plant_id
        if (seen.has(normalizedId)) {
          console.log(`⚠️ Duplicate plant skipped: ${p.plant_id}`);
          return;
        }
        seen.add(normalizedId);

        const cleanId = String(p.plant_id).trim().replace(/^[^a-z0-9_-]+/i, "");

        mapped.push({
          id: cleanId || normalizedId.toUpperCase(),
          listKey: `${normalizedId}-${index}`, // guaranteed unique key
          name: p.name ?? `Plant ${cleanId || normalizedId.toUpperCase()}`,
          day: Number(p.age_days ?? 0),
          area: Number(Number(p.area_cm2 ?? 0).toFixed(1)),
          diameter: Number(Number(p.diameter_cm ?? 0).toFixed(1)),
          estWeight: Number(Number(p.estimated_weight_g ?? 0).toFixed(1)),
          status: p.status === "HARVEST_READY" ? "HARVEST READY" : "NOT READY",
          imageUri:
            p.image_url ||
            "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=60",
        });
      });

      setPlants(mapped);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load plants");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (plantId: string, plantName: string) => {
    Alert.alert(
      "Delete Plant",
      `Are you sure you want to delete ${plantName}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // ✅ 1. Delete from backend
              await deletePlant({ token: accessToken, plant_id: plantId });

              // ✅ 2. Clear ALL cached data from AsyncStorage
              const normalizedId = plantId.trim().toLowerCase();
              const startKey = `plant_start_weight_g:${normalizedId}`;
              const currentKey = `plant_current_weight_g:${normalizedId}`;
              const scansKey = `plant_scans:${normalizedId}`; // ✅ Added this
              
              await AsyncStorage.multiRemove([startKey, currentKey, scansKey]);

              console.log(`✅ Deleted all cached data for plant: ${normalizedId}`);

              Alert.alert("Success", "Plant deleted successfully");
              loadPlants(); // Refresh the list
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to delete plant");
            }
          },
        },
      ]
    );
  };

  // Refresh plants when screen comes into focus (e.g., after saving a new plant)
  useFocusEffect(
    useCallback(() => {
      loadPlants();
    }, [apiFilter, accessToken])
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      {/* Header */}
      <View className="px-4 pt-2 pb-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Text className="text-[13px] font-extrabold text-gray-900">Plant Lists</Text>
          <View className="w-10 h-10" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      >
        {/* Chips */}
        <View className="flex-row mt-1" style={{ gap: 10 }}>
          <Chip label="All" active={filter === "All"} onPress={() => setFilter("All")} />
          <Chip label="Growing" active={filter === "Growing"} onPress={() => setFilter("Growing")} />
          <Chip label="Harvest Ready" active={filter === "Harvest Ready"} onPress={() => setFilter("Harvest Ready")} />
        </View>

        {/* Loading */}
        {loading ? (
          <View className="mt-6 items-center">
            <ActivityIndicator />
            <Text className="mt-2 text-[11px] text-gray-500 font-semibold">Loading plants...</Text>
          </View>
        ) : (
          <View className="mt-4">
            {plants.map((p) => (
              <PlantCard
                key={p.listKey}
                plant={p}
                onPress={() => navigation.navigate("PlantDetails", { plant_id: p.id })}
                onDelete={() => handleDelete(p.id, p.name)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}