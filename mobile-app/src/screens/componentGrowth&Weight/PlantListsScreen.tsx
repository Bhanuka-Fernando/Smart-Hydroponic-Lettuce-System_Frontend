import React, { useMemo, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "../../auth/useAuth";
import { getPlants, deletePlant } from "../../api/plantsApi";

type Filter = "All" | "Growing" | "Harvest Ready";

type Plant = {
  id: string;
  listKey: string;
  name: string;
  day: number;
  area: number;
  diameter: number;
  estWeight: number;
  status: "NOT READY" | "HARVEST READY";
  imageUri: string;
};

const normalizePlantId = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^[^a-z0-9_-]+/i, "");

function Chip({ label, active, onPress }: { label: Filter; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className={`px-4 py-2 rounded-full ${
        active ? "bg-[#EAF4FF] border border-[#B6C8F0]" : "bg-white border border-gray-200"
      }`}
    >
      <Text className={`text-[10px] font-extrabold ${active ? "text-[#003B8F]" : "text-gray-600"}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function StatusPill({ status }: { status: Plant["status"] }) {
  const isReady = status === "HARVEST READY";
  return (
    <View className={`px-2.5 py-1 rounded-full ${isReady ? "bg-green-100" : "bg-amber-100"}`}>
      <Text className={`text-[9px] font-bold ${isReady ? "text-green-700" : "text-amber-700"}`}>
        {isReady ? "READY" : "GROWING"}
      </Text>
    </View>
  );
}

function PlantCard({ 
  plant, 
  onPress, 
  onDelete,
  onChangeImage 
}: { 
  plant: Plant; 
  onPress: () => void; 
  onDelete: () => void;
  onChangeImage: () => void;
}) {
  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress} 
      className="bg-white rounded-2xl p-3.5 mb-3 border border-gray-100"
    >
      <View className="flex-row items-center">
        {/* Plant Image */}
        <View className="relative">
          <View className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
            <Image source={{ uri: plant.imageUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          </View>
          
          {/* Camera Icon */}
          <TouchableOpacity
            onPress={onChangeImage}
            activeOpacity={0.8}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#003B8F] items-center justify-center border-2 border-white"
          >
            <Ionicons name="camera" size={11} color="white" />
          </TouchableOpacity>
        </View>

        {/* Plant Info */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[13px] font-bold text-gray-900" numberOfLines={1} style={{ flex: 1 }}>
              {plant.name}
            </Text>
          </View>

          <View className="flex-row items-center">
            <StatusPill status={plant.status} />
            <Text className="text-[10px] font-semibold text-gray-500 ml-2">Day {plant.day}</Text>
          </View>
        </View>

        {/* Delete Button - Vertically Centered */}
        <TouchableOpacity
          onPress={onDelete}
          activeOpacity={0.7}
          className="ml-2 w-9 h-9 rounded-full bg-red-50 items-center justify-center"
        >
          <Ionicons name="trash-outline" size={16} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  return (
    <View className="items-center justify-center py-16 px-8">
      <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-3">
        <Ionicons name="leaf-outline" size={28} color="#9CA3AF" />
      </View>
      <Text className="text-[13px] font-bold text-gray-900 mb-1">No Plants Found</Text>
      <Text className="text-[11px] text-gray-500 text-center">
        {filter === "All" 
          ? "Start by adding your first plant"
          : `No ${filter.toLowerCase()} plants available`}
      </Text>
    </View>
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

        if (normalizedId === "p04") {
          console.log("🚫 Blocking p04 from display");
          return;
        }

        if (seen.has(normalizedId)) {
          console.log(`⚠️ Duplicate plant skipped: ${p.plant_id}`);
          return;
        }
        seen.add(normalizedId);

        const cleanId = String(p.plant_id).trim().replace(/^[^a-z0-9_-]+/i, "");

        mapped.push({
          id: cleanId || normalizedId.toUpperCase(),
          listKey: `${normalizedId}-${index}`,
          name: p.name ?? `Plant ${cleanId || normalizedId.toUpperCase()}`,
          day: Number(p.age_days ?? 0),
          area: Number(Number(p.area_cm2 ?? 0).toFixed(1)),
          diameter: Number(Number(p.diameter_cm ?? 0).toFixed(1)),
          estWeight: Number(Number(p.estimated_weight_g ?? 0).toFixed(1)),
          status: p.status === "HARVEST_READY" ? "HARVEST READY" : "NOT READY",
          imageUri:
            p.image_url ||
            "https://onlyhydroponics.in/cdn/shop/products/LettuceLocarno.jpg?v=1683217680",
        });
      });

      // Load cached images
      const updatedPlants = await Promise.all(
        mapped.map(async (plant) => {
          const key = `plant_image:${plant.id.toLowerCase()}`;
          const cachedUri = await AsyncStorage.getItem(key);
          return cachedUri ? { ...plant, imageUri: cachedUri } : plant;
        })
      );

      setPlants(updatedPlants);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load plants");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeImage = async (plantId: string, plantName: string) => {
    Alert.alert(
      "Change Plant Image",
      `Select image source for ${plantName}`,
      [
        {
          text: "Camera",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
              Alert.alert("Permission Denied", "Camera permission is required");
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              await updatePlantImage(plantId, result.assets[0].uri);
            }
          },
        },
        {
          text: "Gallery",
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
              Alert.alert("Permission Denied", "Gallery permission is required");
              return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              await updatePlantImage(plantId, result.assets[0].uri);
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const updatePlantImage = async (plantId: string, imageUri: string) => {
    try {
      setPlants((prev) =>
        prev.map((p) => (p.id === plantId ? { ...p, imageUri } : p))
      );

      const key = `plant_image:${plantId.toLowerCase()}`;
      await AsyncStorage.setItem(key, imageUri);

      Alert.alert("Success", "Plant image updated successfully");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update plant image");
    }
  };

  const handleDelete = (plantId: string, plantName: string) => {
    Alert.alert(
      "Delete Plant",
      `Are you sure you want to delete ${plantName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePlant({ token: accessToken, plant_id: plantId });

              const normalizedId = plantId.trim().toLowerCase();
              const startKey = `plant_start_weight_g:${normalizedId}`;
              const currentKey = `plant_current_weight_g:${normalizedId}`;
              const scansKey = `plant_scans:${normalizedId}`;
              const imageKey = `plant_image:${normalizedId}`;
              
              await AsyncStorage.multiRemove([startKey, currentKey, scansKey, imageKey]);

              Alert.alert("Success", "Plant deleted successfully");
              loadPlants();
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to delete plant");
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadPlants();
    }, [apiFilter, accessToken])
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      {/* Header */}
      <View className="px-4 py-3 bg-[#F4F6FA] border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            className="w-9 h-9 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>

          <Text className="text-[15px] font-bold text-gray-900">Plant Lists</Text>
          
          <View className="w-9 h-9" />
        </View>

        {/* Filter Chips */}
        <View className="flex-row" style={{ gap: 8 }}>
          <Chip label="All" active={filter === "All"} onPress={() => setFilter("All")} />
          <Chip label="Growing" active={filter === "Growing"} onPress={() => setFilter("Growing")} />
          <Chip label="Harvest Ready" active={filter === "Harvest Ready"} onPress={() => setFilter("Harvest Ready")} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
      >
        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#003B8F" />
            <Text className="mt-2 text-[11px] text-gray-500 font-semibold">Loading plants...</Text>
          </View>
        ) : plants.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          plants.map((p) => (
            <PlantCard
              key={p.listKey}
              plant={p}
              onPress={() => navigation.navigate("PlantDetails", { plant_id: p.id })}
              onDelete={() => handleDelete(p.id, p.name)}
              onChangeImage={() => handleChangeImage(p.id, p.name)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}