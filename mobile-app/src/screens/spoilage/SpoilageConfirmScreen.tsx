import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SpoilageStackParamList } from "../../navigation/SpoilageNavigator";

type Props = NativeStackScreenProps<SpoilageStackParamList, "SpoilageConfirm">;

export default function SpoilageConfirmScreen({ navigation, route }: Props) {
  const imageUri = route.params?.imageUri;

  // ✅ mock results for now
  const confidence = 0.95;
  const stageTitle = "Stage 3: Near Spoilage";
  const desc =
    "Analysis indicates marginal necrosis (tip burn) and slight slime formation on basal leaves.";
  const temp = "5°C";
  const humidity = "94%";
  const plantId = "P-051";
  const batchId = "#BUT-2291";

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
            Confirm Details
          </Text>

          <View className="w-10 h-10" />
        </View>

        {/* Image card */}
        <View className="mt-3 bg-white rounded-[18px] overflow-hidden shadow-sm">
          <View style={{ height: 240 }} className="bg-gray-100">
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
          </View>

          {/* confidence pill */}
          <View className="absolute top-3 right-3">
            <View
              className="px-3 py-1 rounded-full bg-white/95 flex-row items-center"
              style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
            >
              <View className="w-2 h-2 rounded-full bg-[#16A34A]" />
              <Text className="ml-2 text-[12px] font-extrabold text-gray-900">
                {(confidence * 100).toFixed(0)}% Confidence
              </Text>
            </View>
          </View>

          {/* Stage details */}
          <View className="p-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[10px] font-semibold text-gray-500">
                  AI DETECTED STAGE
                </Text>
                <Text className="text-[16px] font-extrabold text-gray-900 mt-1">
                  {stageTitle}
                </Text>
              </View>

              <TouchableOpacity activeOpacity={0.85} onPress={() => {}}>
                <Text className="text-[12px] font-semibold text-[#2563EB]">
                  Report wrong
                </Text>
              </TouchableOpacity>
            </View>

            <Text className="text-[12px] text-gray-600 mt-2 leading-4">
              {desc}
            </Text>
          </View>
        </View>

        {/* Environmental Data */}
        <Text className="text-[14px] font-extrabold text-gray-900 mt-5 mb-3">
          Environmental Data
        </Text>

        <View className="flex-row justify-between">
          <MiniStat
            icon="thermometer-outline"
            label="Temperature"
            value={temp}
            iconBg="#FFF2E6"
            iconColor="#F59E0B"
          />
          <MiniStat
            icon="water-outline"
            label="Humidity"
            value={humidity}
            iconBg="#EAF4FF"
            iconColor="#2563EB"
          />
        </View>

        {/* Batch Details */}
        <Text className="text-[14px] font-extrabold text-gray-900 mt-5 mb-3">
          Batch Details
        </Text>

        <View className="bg-white rounded-[18px] shadow-sm overflow-hidden">
          <RowItem left="Plant ID" right={plantId} />
          <Divider />
          <RowItem left="Batch ID" right={batchId} />
        </View>

        {/* Retake */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.goBack()}
          className="mt-6 bg-white rounded-full py-3 items-center"
          style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
        >
          <Text className="font-extrabold text-gray-900">Retake</Text>
        </TouchableOpacity>

        {/* Predict Shelf Life */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {}}
          className="mt-4 rounded-[12px] items-center justify-center"
          style={{ backgroundColor: "#0046AD", height: 54 }}
        >
          <View className="flex-row items-center">
            <Ionicons name="sparkles" size={18} color="#fff" />
            <Text className="ml-2 text-[14px] font-extrabold text-white">
              Predict Shelf Life
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniStat({
  icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <View
      className="bg-white rounded-[18px] px-4 py-4 shadow-sm"
      style={{ width: "48%" }}
    >
      <View className="flex-row items-center">
        <View
          className="w-9 h-9 rounded-[14px] items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View className="ml-3">
          <Text className="text-[11px] text-gray-500 font-semibold">{label}</Text>
          <Text className="text-[16px] font-extrabold text-gray-900 mt-0.5">
            {value}
          </Text>
        </View>
      </View>
    </View>
  );
}

function RowItem({ left, right }: { left: string; right: string }) {
  return (
    <View className="px-4 py-4 flex-row items-center justify-between">
      <Text className="text-[12px] text-gray-500 font-semibold">{left}</Text>
      <Text className="text-[13px] font-extrabold text-gray-900">{right}</Text>
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-gray-100 mx-4" />;
}