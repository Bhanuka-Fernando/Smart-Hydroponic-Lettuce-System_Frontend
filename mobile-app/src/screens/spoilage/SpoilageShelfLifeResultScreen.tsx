import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SpoilageStackParamList } from "../../navigation/SpoilageNavigator";

type Props = NativeStackScreenProps<SpoilageStackParamList, "SpoilageShelfLifeResult">;

function maxProbPercent(p: any) {
  if (!p) return "—";
  const m = Math.max(p.fresh, p.slightly_aged, p.near_spoilage, p.spoiled);
  return `${Math.round(m * 100)}% Conf.`;
}

function prettyStage(stage: string) {
  if (stage === "fresh") return "Fresh";
  if (stage === "slightly_aged") return "Slightly Aged";
  if (stage === "near_spoilage") return "Near Spoilage";
  return "Spoiled";
}

export default function SpoilageShelfLifeResultScreen({ navigation, route }: Props) {
  const { imageUri, result } = route.params;

  const confidence = useMemo(() => maxProbPercent(result?.stage_probs), [result]);
  const plantId = result?.plant_id ?? "-";
  const status = result?.status ?? "-";
  const remainingDays = typeof result?.remaining_days === "number" ? result.remaining_days : 0;

  const [showSaved, setShowSaved] = useState(false);

  const goToDetails = () => {
    setShowSaved(false);
    requestAnimationFrame(() => navigation.navigate("SpoilageDetails"));
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 18 }}
      >
        {/* Header */}
        <View className="pt-3 pb-2 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Text className="text-[16px] font-extrabold text-gray-900">
            Analysis Remaining Days
          </Text>

          <View className="w-10 h-10" />
        </View>

        {/* Image card */}
        <View className="mt-3 bg-white rounded-[18px] overflow-hidden shadow-sm">
          <View className="relative" style={{ height: 220 }}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-gray-500 font-semibold">No image</Text>
              </View>
            )}

            <View className="absolute bottom-3 left-3 w-9 h-9 rounded-full bg-white items-center justify-center">
              <Ionicons name="warning-outline" size={18} color="#F59E0B" />
            </View>

            <View className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-black/60">
              <Text className="text-[10px] text-white font-semibold">
                {result?.captured_at ? `Captured: ${result.captured_at}` : "Captured"}
              </Text>
            </View>
          </View>
        </View>

        {/* Title block */}
        <View className="mt-4 items-center">
          <Text className="text-[26px] font-extrabold text-gray-900">{plantId}</Text>
          <Text className="text-[12px] font-extrabold text-[#F59E0B] mt-1">
            {status} • {prettyStage(result.stage)}
          </Text>
          <Text className="text-[11px] text-gray-500 mt-1">{confidence}</Text>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("SpoilageScan")}
            className="mt-2 flex-row items-center"
          >
            <Ionicons name="refresh" size={14} color="#111827" />
            <Text className="ml-1 text-[12px] font-semibold text-gray-900">
              Re-Scan
            </Text>
          </TouchableOpacity>
        </View>

        {/* Remaining days card */}
        <View className="mt-4 bg-white rounded-[18px] p-4 shadow-sm">
          <View className="items-center">
            <View className="flex-row items-end">
              <Ionicons name="time-outline" size={18} color="#F59E0B" />
              <Text className="ml-2 text-[34px] font-extrabold text-[#F59E0B]">
                {remainingDays.toFixed(1)}
              </Text>
              <Text className="ml-2 mb-1 text-[12px] font-extrabold text-[#F59E0B]">
                DAYS
              </Text>
            </View>

            <Text className="text-[11px] text-gray-500 mt-1">REMAINING</Text>
          </View>
        </View>

        {/* Stage probabilities (optional but useful) */}
        <View className="mt-4 bg-white rounded-[18px] p-4 shadow-sm">
          <Text className="font-extrabold text-gray-900">Stage Probabilities</Text>

          <View className="mt-3 space-y-2">
            <ProbRow label="Fresh" value={result.stage_probs.fresh} />
            <ProbRow label="Slightly Aged" value={result.stage_probs.slightly_aged} />
            <ProbRow label="Near Spoilage" value={result.stage_probs.near_spoilage} />
            <ProbRow label="Spoiled" value={result.stage_probs.spoiled} />
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setShowSaved(true)}
          className="mt-6 rounded-[12px] items-center justify-center"
          style={{ backgroundColor: "#0046AD", height: 54 }}
        >
          <View className="flex-row items-center">
            <Ionicons name="save-outline" size={18} color="#fff" />
            <Text className="ml-2 text-[14px] font-extrabold text-white">Save</Text>
          </View>
        </TouchableOpacity>

        {/* Popup Modal */}
        <Modal
          visible={showSaved}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSaved(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.35)",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                width: 280,
                backgroundColor: "#fff",
                borderRadius: 18,
                paddingVertical: 18,
                paddingHorizontal: 18,
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => setShowSaved(false)}
                activeOpacity={0.8}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={18} color="#111827" />
              </TouchableOpacity>

              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: "#E9FBEF",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 4,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#16A34A",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="checkmark" size={22} color="#fff" />
                </View>
              </View>

              <Text style={{ marginTop: 12, fontSize: 14, fontWeight: "800", color: "#111827" }}>
                Record Saved
              </Text>
              <Text style={{ marginTop: 2, fontSize: 12, fontWeight: "700", color: "#111827" }}>
                Successfully
              </Text>

              <TouchableOpacity
                onPress={goToDetails}
                activeOpacity={0.9}
                style={{
                  marginTop: 14,
                  backgroundColor: "#0046AD",
                  paddingVertical: 10,
                  paddingHorizontal: 26,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}

function ProbRow({ label, value }: { label: string; value: number }) {
  const pct = Math.round((value ?? 0) * 100);
  return (
    <View>
      <View className="flex-row justify-between">
        <Text className="text-[12px] text-gray-700 font-semibold">{label}</Text>
        <Text className="text-[12px] text-gray-900 font-extrabold">{pct}%</Text>
      </View>
      <View className="h-2 rounded-full bg-gray-200 overflow-hidden mt-1">
        <View className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: "#0046AD" }} />
      </View>
    </View>
  );
}