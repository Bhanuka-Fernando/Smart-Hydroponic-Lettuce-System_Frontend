import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SpoilageStackParamList } from "../../navigation/SpoilageNavigator";

type Props = NativeStackScreenProps<SpoilageStackParamList, "SpoilagePlants">;

type Filter = "All Plants" | "Fresh" | "Slightly Aged" | "Spoiled";

type PlantItem = {
  id: string;
  plantId: string;
  day: string;
  remainingDays: number;
  temperature: string;
  humidity: string;
  status: "FRESH" | "SLIGHTLY AGED" | "NEAR SPOILAGE" | "SPOILED";
  imageUrl: string;
};

export default function SpoilagePlantsScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<Filter>("All Plants");

  const plants: PlantItem[] = useMemo(
    () => [
      {
        id: "1",
        plantId: "P-001",
        day: "2025.12.30",
        remainingDays: 7,
        temperature: "5°C",
        humidity: "88%",
        status: "FRESH",
        imageUrl:
          "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=70",
      },
      {
        id: "2",
        plantId: "P-020",
        day: "2025.12.30",
        remainingDays: 5,
        temperature: "8°C",
        humidity: "90%",
        status: "SLIGHTLY AGED",
        imageUrl:
          "https://images.unsplash.com/photo-1557844352-761f2565b576?auto=format&fit=crop&w=400&q=70",
      },
      {
        id: "3",
        plantId: "P-050",
        day: "2025.12.30",
        remainingDays: 2,
        temperature: "6°C",
        humidity: "90%",
        status: "NEAR SPOILAGE",
        imageUrl:
          "https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&w=400&q=70",
      },
      {
        id: "4",
        plantId: "P-060",
        day: "2025.12.31",
        remainingDays: 0,
        temperature: "7°C",
        humidity: "89%",
        status: "SPOILED",
        imageUrl:
          "https://images.unsplash.com/photo-1524594166163-20a1c3fd77a1?auto=format&fit=crop&w=400&q=70",
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    if (filter === "All Plants") return plants;
    if (filter === "Fresh") return plants.filter((p) => p.status === "FRESH");
    if (filter === "Slightly Aged")
      return plants.filter((p) => p.status === "SLIGHTLY AGED");
    return plants.filter((p) => p.status === "SPOILED");
  }, [filter, plants]);

  const totalPlants = plants.length;
  const avgShelf = Math.round(
    plants.reduce((sum, p) => sum + p.remainingDays, 0) / Math.max(1, plants.length)
  );

  const totalAlerts = plants.filter(
    (p) => p.status === "NEAR SPOILAGE" || p.status === "SPOILED"
  ).length;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#EAF4FF]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Text className="text-[14px] font-extrabold text-gray-900">All Plants</Text>

          <View className="w-10 h-10" />
        </View>

        {/* Search */}
        <View className="mt-3 bg-white rounded-[14px] px-3 py-2 flex-row items-center shadow-sm">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <Text className="text-gray-400 text-[13px] ml-2 flex-1">
            Search by Plant ID ...
          </Text>
          <Feather name="sliders" size={16} color="#9CA3AF" />
        </View>

        {/* Filter chips */}
        <View className="mt-3 bg-white rounded-full p-1 flex-row">
          <Chip label="All Plants" active={filter === "All Plants"} onPress={() => setFilter("All Plants")} />
          <Chip label="Fresh" active={filter === "Fresh"} onPress={() => setFilter("Fresh")} />
          <Chip
            label="Slightly Aged"
            active={filter === "Slightly Aged"}
            onPress={() => setFilter("Slightly Aged")}
          />
          <Chip label="Spoiled" active={filter === "Spoiled"} onPress={() => setFilter("Spoiled")} />
        </View>

        {/* Stats summary */}
        <View className="mt-4 bg-white rounded-[18px] p-4 shadow-sm">
          <Text className="text-[14px] font-extrabold text-gray-900">Stats Summary</Text>

          <View className="flex-row justify-between mt-3">
            <StatBox title="Total Plants" value={String(totalPlants)} bg="#7DE9D9" />
            <StatBox title="Avg Shelf-life" value={`${avgShelf} Days`} bg="#AFC8FF" />
          </View>

          <View className="mt-3 items-center">
            <View
              className="rounded-[14px] px-6 py-3"
              style={{ backgroundColor: "#FAD1D1" }}
            >
              <Text className="text-[10px] font-semibold text-gray-700 text-center">
                Total Alerts
              </Text>
              <Text className="text-[16px] font-extrabold text-gray-900 text-center mt-1">
                {totalAlerts}
              </Text>
            </View>
          </View>
        </View>

        {/* Plant cards */}
        <View className="mt-4 space-y-3">
          {filtered.map((p) => (
            <PlantCard key={p.id} plant={p} />
          ))}
        </View>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className={`flex-1 py-2 rounded-full items-center justify-center ${
        active ? "bg-[#111827]" : "bg-transparent"
      }`}
    >
      <Text className={`text-[11px] font-extrabold ${active ? "text-white" : "text-gray-500"}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function StatBox({ title, value, bg }: { title: string; value: string; bg: string }) {
  return (
    <View className="rounded-[16px] px-4 py-3" style={{ width: "48%", backgroundColor: bg }}>
      <Text className="text-[10px] font-semibold text-gray-700">{title}</Text>
      <Text className="text-[16px] font-extrabold text-gray-900 mt-1">{value}</Text>
    </View>
  );
}

function PlantCard({ plant }: { plant: any }) {
  const badgeBg =
    plant.status === "FRESH"
      ? "#E9FBEF"
      : plant.status === "SLIGHTLY AGED"
      ? "#ECFDF5"
      : plant.status === "NEAR SPOILAGE"
      ? "#FFF7ED"
      : "#FEE2E2";

  const badgeText =
    plant.status === "FRESH"
      ? "#16A34A"
      : plant.status === "SLIGHTLY AGED"
      ? "#22C55E"
      : plant.status === "NEAR SPOILAGE"
      ? "#F59E0B"
      : "#DC2626";

  return (
    <View className="bg-white rounded-[18px] p-4 shadow-sm flex-row">
      <Image
        source={{ uri: plant.imageUrl }}
        style={{ width: 76, height: 76, borderRadius: 18 }}
      />

      <View className="flex-1 ml-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-[14px] font-extrabold text-gray-900">{plant.plantId}</Text>
          <View className="px-3 py-1 rounded-full" style={{ backgroundColor: badgeBg }}>
            <Text className="text-[10px] font-extrabold" style={{ color: badgeText }}>
              {plant.status}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between mt-2">
          <Mini label="DAY" value={plant.day} />
          <Mini label="REMAINING DAYS" value={String(plant.remainingDays)} />
        </View>

        <View className="flex-row justify-between mt-2">
          <Mini label="TEMPERATURE" value={plant.temperature} />
          <Mini label="HUMIDITY" value={plant.humidity} />
        </View>
      </View>
    </View>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: "48%" }}>
      <Text className="text-[9px] text-gray-400 font-semibold">{label}</Text>
      <Text className="text-[11px] text-gray-900 font-extrabold mt-0.5">{value}</Text>
    </View>
  );
}