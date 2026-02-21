// src/screens/spoilage/SpoilageShelfLifeResultScreen.tsx
import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SpoilageStackParamList } from "../../navigation/SpoilageNavigator";

type Props = NativeStackScreenProps<SpoilageStackParamList, "SpoilageShelfLifeResult">;

export default function SpoilageShelfLifeResultScreen({ navigation, route }: Props) {
  const imageUri = route.params?.imageUri;

  // mock data
  const plantId = "P-051";
  const status = "WARNING";
  const confidence = "92% Conf.";
  const remainingDays = 1.2;
  const estimatedSpoilage = "Oct 26";
  const temp = "5°C";
  const humidity = "90%";

  const [showSaved, setShowSaved] = useState(false);

  const goToDetails = () => {
    setShowSaved(false);

    // ensure modal closes first, then navigate
    requestAnimationFrame(() => {
      navigation.navigate("SpoilageDetails");
    });
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
                IMG_Name, 10:42 AM
              </Text>
            </View>
          </View>
        </View>

        {/* Title block */}
        <View className="mt-4 items-center">
          <Text className="text-[26px] font-extrabold text-gray-900">{plantId}</Text>
          <Text className="text-[12px] font-extrabold text-[#F59E0B] mt-1">
            {status}
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
                {remainingDays}
              </Text>
              <Text className="ml-2 mb-1 text-[12px] font-extrabold text-[#F59E0B]">
                DAYS
              </Text>
            </View>

            <Text className="text-[11px] text-gray-500 mt-1">REMAINING</Text>

            <Text className="text-[11px] text-gray-500 mt-2">
              Estimated Spoilage:{" "}
              <Text className="font-bold">{estimatedSpoilage}</Text>
            </Text>
          </View>

          <View className="mt-4">
            <View className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <View
                className="h-2 rounded-full"
                style={{ width: "68%", backgroundColor: "#F59E0B" }}
              />
            </View>

            <View className="flex-row justify-between mt-2">
              <Text className="text-[10px] text-gray-400 font-semibold">FRESH</Text>
              <Text className="text-[10px] text-[#F59E0B] font-extrabold">
                WARNING
              </Text>
              <Text className="text-[10px] text-gray-400 font-semibold">SPOILED</Text>
            </View>
          </View>
        </View>

        {/* Sensor snapshot */}
        <View className="mt-4 bg-white rounded-[18px] p-4 shadow-sm">
          <View className="flex-row items-center">
            <Ionicons name="pulse-outline" size={16} color="#111827" />
            <Text className="ml-2 font-extrabold text-gray-900">Sensor Snapshot</Text>
          </View>

          <View className="mt-3 flex-row justify-between">
            <SensorPill label="Temp" value={temp} />
            <SensorPill label="Humidity" value={humidity} />
          </View>
        </View>

        {/* Recommended actions */}
        <View className="mt-4 bg-[#FFF7ED] rounded-[18px] p-4 shadow-sm">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-white items-center justify-center">
              <Ionicons name="bulb-outline" size={16} color="#F59E0B" />
            </View>
            <Text className="ml-2 font-extrabold text-gray-900">
              Recommended Actions
            </Text>
          </View>

          <ActionRow
            title="Trim Leaves"
            desc="Remove slimy or browned outer leaves immediately. Wash thoroughly."
          />
          <ActionRow
            title="Consume Fast"
            desc="Use edible parts within 24 hours. Store dry."
          />
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
              {/* X close (closes only) */}
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

              {/* green check */}
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

              {/* OK (closes + redirects) */}
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

function SensorPill({ label, value }: { label: string; value: string }) {
  return (
    <View className="bg-[#EAF4FF] rounded-[14px] px-4 py-3" style={{ width: "48%" }}>
      <Text className="text-[11px] text-gray-600 font-semibold">{label}</Text>
      <Text className="text-[16px] font-extrabold text-gray-900 mt-1">{value}</Text>
    </View>
  );
}

function ActionRow({ title, desc }: { title: string; desc: string }) {
  return (
    <View className="mt-3 bg-white rounded-[14px] px-4 py-3">
      <View className="flex-row items-center">
        <Ionicons name="warning-outline" size={16} color="#F59E0B" />
        <Text className="ml-2 font-extrabold text-gray-900">{title}</Text>
      </View>
      <Text className="text-[12px] text-gray-600 mt-2 leading-4">{desc}</Text>
    </View>
  );
}