import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

type RouteParams = {
  imageUri: string;
  accuracy?: number;
  biomassG?: number;
  leafAreaCm2?: number;
  leafDiameterCm?: number;
  plantId?: string;
  plantAgeDays?: number;
  capturedAtISO?: string;
};

function formatCapturedLabel(iso?: string) {
  try {
    if (!iso) return "";
    const d = new Date(iso);
    const hh = d.getHours();
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ampm = hh >= 12 ? "PM" : "AM";
    const hr12 = ((hh + 11) % 12) + 1;
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `IMG_${month}${day}  ${hr12}:${mm} ${ampm}`;
  } catch {
    return "";
  }
}

function MiniStatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 bg-white rounded-[18px] shadow-sm px-4 py-4">
      <View className="w-10 h-10 rounded-full bg-[#EAF4FF] items-center justify-center">
        {icon}
      </View>
      <Text className="text-[11px] text-gray-500 font-semibold mt-3">{label}</Text>
      <Text className="text-[14px] font-extrabold text-gray-900 mt-1">{value}</Text>
    </View>
  );
}

export default function EstimateWeightResultsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const params: RouteParams = route.params || {};

  const computed = useMemo(() => {
    const accuracy = params.accuracy ?? 87;
    const biomassG = params.biomassG ?? 345;
    const leafAreaCm2 = params.leafAreaCm2 ?? 64;
    const leafDiameterCm = params.leafDiameterCm ?? 12;
    const plantId = params.plantId ?? "Plant #01";
    const plantAgeDays = params.plantAgeDays ?? 24;
    const capturedAtISO = params.capturedAtISO ?? new Date().toISOString();
    const capturedLabel = formatCapturedLabel(capturedAtISO);

    return {
      accuracy,
      biomassG,
      leafAreaCm2,
      leafDiameterCm,
      plantId,
      plantAgeDays,
      capturedLabel,
    };
  }, [params]);

  const onSave = () => {
    // TODO: connect backend + store in Growth Log/History
    Alert.alert("Saved", "Saved to Growth Log (demo).");
    navigation.goBack();
  };

  const onNewScan = () => {
    navigation.navigate("EstimateWeightScan", { reset: true });
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
            Weight Estimated Results
          </Text>

          <View className="w-10 h-10" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140 }}
      >
        {/* Image */}
        <View className="bg-black rounded-[18px] overflow-hidden shadow-sm">
          <Image
            source={{ uri: params.imageUri }}
            style={{ width: "100%", height: 210 }}
            resizeMode="cover"
          />

          <View className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/50">
            <Text className="text-[10px] font-bold text-white">
              {computed.capturedLabel}
            </Text>
          </View>
        </View>

        {/* Main result card */}
        <View className="bg-white rounded-[18px] shadow-sm px-5 py-4 mt-4">
          <View className="items-center">
            <View className="px-3 py-1 rounded-full bg-[#E9FBEF] flex-row items-center">
              <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
              <Text className="ml-2 text-[10px] font-extrabold text-[#16A34A]">
                {computed.accuracy}% Accuracy
              </Text>
            </View>

            <Text className="text-[10px] font-extrabold text-gray-500 mt-3">
              ESTIMATED BIOMASS
            </Text>

            <View className="flex-row items-end mt-1">
              <Text className="text-[44px] font-extrabold text-gray-900 leading-[48px]">
                {computed.biomassG}
              </Text>
              <Text className="text-[14px] font-extrabold text-gray-700 mb-2 ml-2">
                g
              </Text>
            </View>

            <View className="mt-3 items-center">
              <Text className="text-[11px] text-gray-700 font-semibold">
                Leaf Area : {computed.leafAreaCm2} cm2
              </Text>
              <Text className="text-[11px] text-gray-700 font-semibold mt-1">
                Leaf Diameter : {computed.leafDiameterCm} cm
              </Text>
            </View>
          </View>
        </View>

        {/* Two mini cards */}
        <View className="flex-row mt-4" style={{ gap: 12 }}>
          <MiniStatCard
            icon={<Ionicons name="heart-outline" size={18} color="#0046AD" />}
            label="Plant ID"
            value={computed.plantId}
          />
          <MiniStatCard
            icon={<Ionicons name="calendar-outline" size={18} color="#F97316" />}
            label="Plant Age"
            value={`${computed.plantAgeDays} Days`}
          />
        </View>

        {/* Buttons */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onSave}
          className="mt-5 bg-[#003B8F] rounded-[16px] py-4 items-center justify-center flex-row"
        >
          <Ionicons name="save-outline" size={18} color="#FFFFFF" />
          <Text className="ml-2 text-[12px] font-extrabold text-white">
            Save to Growth Log
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onNewScan}
          className="mt-3 bg-white rounded-[16px] border border-gray-200 py-4 items-center justify-center flex-row"
        >
          <Ionicons name="camera-outline" size={18} color="#111827" />
          <Text className="ml-2 text-[12px] font-extrabold text-gray-900">
            New Scan
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
