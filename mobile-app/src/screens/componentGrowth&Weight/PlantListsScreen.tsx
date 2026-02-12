import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

type Filter = "All" | "Growing" | "Harvest Ready";

type Plant = {
  id: string;
  name: string;
  day: number;
  area: number; // cm2
  diameter: number; // cm
  estWeight: number; // g
  status: "NOT READY" | "HARVEST READY";
  imageUri: string;
};

function Chip({
  label,
  active,
  onPress,
}: {
  label: Filter;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className={`px-4 py-2 rounded-full border ${
        active ? "bg-[#EAF4FF] border-[#B6C8F0]" : "bg-white border-gray-200"
      }`}
    >
      <Text
        className={`text-[11px] font-extrabold ${
          active ? "text-[#003B8F]" : "text-gray-600"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function StatusPill({ status }: { status: Plant["status"] }) {
  const isReady = status === "HARVEST READY";
  return (
    <View
      className={`px-3 py-1 rounded-full ${
        isReady ? "bg-[#E9FBEF]" : "bg-[#EEF2F7]"
      }`}
    >
      <Text
        className={`text-[9px] font-extrabold ${
          isReady ? "text-[#16A34A]" : "text-gray-600"
        }`}
      >
        {status}
      </Text>
    </View>
  );
}

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <View className="bg-[#F6F8FC] rounded-[12px] px-3 py-2">
      <Text className="text-[9px] font-extrabold text-gray-500">{label}</Text>
      <Text className="text-[11px] font-extrabold text-gray-900 mt-1">
        {value}
      </Text>
    </View>
  );
}

function PlantCard({
  plant,
  onPress,
}: {
  plant: Plant;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="bg-white rounded-[18px] shadow-sm p-4 mb-3"
    >
      <View className="flex-row">
        <View className="w-[64px] h-[64px] rounded-[16px] overflow-hidden bg-[#E5E7EB]">
          <Image
            source={{ uri: plant.imageUri }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </View>

        <View className="flex-1 ml-3">
          <View className="flex-row items-start justify-between">
            <Text className="text-[13px] font-extrabold text-gray-900">
              {plant.name}
            </Text>
            <StatusPill status={plant.status} />
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
  const [filter, setFilter] = useState<Filter>("All");

  const plants: Plant[] = useMemo(
    () => [
      {
        id: "p04",
        name: "Plant #04",
        day: 24,
        area: 142,
        diameter: 12.5,
        estWeight: 320,
        status: "NOT READY",
        imageUri:
          "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=60",
      },
      {
        id: "p043",
        name: "Plant #043",
        day: 18,
        area: 85,
        diameter: 9.2,
        estWeight: 110,
        status: "NOT READY",
        imageUri:
          "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=600&q=60",
      },
      {
        id: "p044",
        name: "Plant #044",
        day: 42,
        area: 310,
        diameter: 18.4,
        estWeight: 450,
        status: "HARVEST READY",
        imageUri:
          "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=600&q=60",
      },
      {
        id: "p045",
        name: "Plant #045",
        day: 45,
        area: 325,
        diameter: 19.1,
        estWeight: 510,
        status: "HARVEST READY",
        imageUri:
          "https://images.unsplash.com/photo-1524594227084-8bbf5f2b2f35?auto=format&fit=crop&w=600&q=60",
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    if (filter === "All") return plants;
    if (filter === "Growing") return plants.filter((p) => p.status === "NOT READY");
    return plants.filter((p) => p.status === "HARVEST READY");
  }, [filter, plants]);

  // helper: convert "Plant #044" -> "#044"
  const toShortName = (full: string) => {
    const match = full.match(/#\d+/);
    return match ? match[0] : full;
  };

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

          <Text className="text-[13px] font-extrabold text-gray-900">
            Plant Lists
          </Text>

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
          <Chip
            label="Harvest Ready"
            active={filter === "Harvest Ready"}
            onPress={() => setFilter("Harvest Ready")}
          />
        </View>

        {/* List */}
        <View className="mt-4">
          {filtered.map((p) => (
            <PlantCard
              key={p.id}
              plant={p}
              onPress={() =>
                navigation.navigate("PlantDetails", {
                  plant: {
                    id: p.id,
                    name: toShortName(p.name),      // "#04" style header
                    plantedOn: "Planted Dec 10",    // you can replace with real value later
                    ageDays: p.day,
                    startWeightG: 12,               // demo value
                    currentWeightG: p.estWeight,
                  },
                })
              }
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
