import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SpoilageStackParamList } from "../../navigation/SpoilageNavigator";

import type { SpoilagePredictResponse } from "../../api/SpoilageApi";

type Props = NativeStackScreenProps<SpoilageStackParamList, "SpoilageConfirm">;

function stageTitle(stage: string) {
  if (stage === "fresh") return "Stage 1: Fresh";
  if (stage === "slightly_aged") return "Stage 2: Slightly Aged";
  if (stage === "near_spoilage") return "Stage 3: Near Spoilage";
  return "Stage 4: Spoiled";
}

function stageDesc(stage: string) {
  if (stage === "fresh") {
    return "Analysis indicates the plant is fresh with minimal spoilage indicators.";
  }
  if (stage === "slightly_aged") {
    return "Analysis indicates early aging signs. Continue monitoring storage conditions.";
  }
  if (stage === "near_spoilage") {
    return "Analysis indicates spoilage risk is increasing. Inspect and take action soon.";
  }
  return "Analysis indicates spoiled indicators. Discard or segregate this plant to prevent contamination.";
}

function confidenceFromProbs(p?: any) {
  if (!p) return null;
  return Math.max(p.fresh, p.slightly_aged, p.near_spoilage, p.spoiled);
}

function stageTheme(stage: string) {
  if (stage === "fresh") {
    return {
      bg: "#E9FBEF",
      text: "#16A34A",
      icon: "leaf-outline" as const,
    };
  }
  if (stage === "slightly_aged") {
    return {
      bg: "#ECFDF5",
      text: "#22C55E",
      icon: "time-outline" as const,
    };
  }
  if (stage === "near_spoilage") {
    return {
      bg: "#FFF7ED",
      text: "#F59E0B",
      icon: "warning-outline" as const,
    };
  }
  return {
    bg: "#FEE2E2",
    text: "#DC2626",
    icon: "alert-circle-outline" as const,
  };
}

export default function SpoilageConfirmScreen({ navigation, route }: Props) {
  const {
    imageUri,
    result,
    temperature,
    humidity,
    plantId,
    isSim,
  } = route.params as {
    imageUri: string;
    result: SpoilagePredictResponse;
    temperature: number;
    humidity: number;
    plantId: string;
    isSim?: boolean;
  };

  const conf = useMemo(() => confidenceFromProbs(result?.stage_probs), [result]);
  const theme = useMemo(() => stageTheme(result?.stage), [result]);

  const tempText = Number.isFinite(temperature) ? `${temperature}°C` : "--";
  const humText = Number.isFinite(humidity) ? `${humidity}%` : "--";

  // ✅ Clean status text - remove emojis and special characters
  const cleanStatus = useMemo(() => {
    if (!result?.status) return "-";
    // Remove emojis and special characters, keep only alphanumeric and basic punctuation
    const cleaned = result.status.replace(/[^\w\s.,!?-]/g, '').trim();
    return cleaned || "Completed";
  }, [result?.status]);

  const onViewResults = () => {
    if (!result) {
      Alert.alert("Missing", "No prediction result found.");
      return;
    }
    navigation.navigate("SpoilageShelfLifeResult", { imageUri, result });
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      >
        <View className="pt-3 pb-2 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
            className="w-10 h-10 items-center justify-center rounded-full bg-white"
            style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Text className="text-[16px] font-extrabold text-gray-900">
            Confirm Details
          </Text>

          <View
            className="w-10 h-10 items-center justify-center rounded-full bg-white"
            style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
          >
            <Ionicons name="checkmark-done-outline" size={18} color="#64748B" />
          </View>
        </View>

        <View className="mt-4 bg-white rounded-[22px] overflow-hidden shadow-sm">
          <View style={{ height: 260 }} className="bg-gray-100">
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

            {conf !== null ? (
              <View className="absolute top-4 right-4">
                <View
                  className="px-3 py-2 rounded-full bg-white/95 flex-row items-center"
                  style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
                >
                  <View
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: theme.text }}
                  />
                  <Text className="ml-2 text-[12px] font-extrabold text-gray-900">
                    {Math.round(conf * 100)}% Confidence
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          <View className="p-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-[10px] font-semibold text-gray-500">
                  AI DETECTED STAGE
                </Text>
                <Text className="text-[17px] font-extrabold text-gray-900 mt-1">
                  {stageTitle(result.stage)}
                </Text>
              </View>

              <View
                className="px-3 py-1.5 rounded-full flex-row items-center"
                style={{ backgroundColor: theme.bg }}
              >
                <Ionicons name={theme.icon} size={14} color={theme.text} />
                <Text
                  className="ml-1.5 text-[11px] font-extrabold"
                  style={{ color: theme.text }}
                >
                  {stageTitle(result.stage).replace(/^Stage \d: /, "")}
                </Text>
              </View>
            </View>

            <Text className="text-[12px] text-gray-600 mt-3 leading-5">
              {stageDesc(result.stage)}
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                Alert.alert(
                  "Report",
                  "You can add a wrong-result feedback flow later."
                )
              }
              className="mt-3 self-start"
            >
              <Text className="text-[12px] font-semibold text-[#2563EB]">
                Report wrong result
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-5 bg-white rounded-[20px] p-4 shadow-sm">
          <Text className="text-[14px] font-extrabold text-gray-900">
            Environmental Data
          </Text>

          <View className="flex-row justify-between mt-4">
            <MiniStat
              icon="thermometer-outline"
              label="Temperature"
              value={tempText}
              iconBg="#FFF2E6"
              iconColor="#F59E0B"
            />
            <MiniStat
              icon="water-outline"
              label="Humidity"
              value={humText}
              iconBg="#EAF4FF"
              iconColor="#2563EB"
            />
          </View>
        </View>

        <View className="mt-4 bg-white rounded-[20px] p-4 shadow-sm">
          <Text className="text-[14px] font-extrabold text-gray-900">
            Batch Details
          </Text>

          <View className="mt-3 rounded-[16px] bg-[#F8FAFC] overflow-hidden">
            <RowItem left="Plant ID" right={plantId || "-"} />
            <Divider />
            <RowItem left="Status" right={cleanStatus} />
            <Divider />
            <RowItem left="Source" right={isSim ? "Simulation" : "Real Scan"} />
          </View>
        </View>

        <View className="mt-6 flex-row justify-between">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.goBack()}
            className="rounded-[14px] py-3 items-center justify-center bg-white"
            style={{
              width: "48%",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              height: 52,
            }}
          >
            <View className="flex-row items-center">
              <Ionicons name="refresh-outline" size={18} color="#111827" />
              <Text className="ml-2 font-extrabold text-gray-900">Retake</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onViewResults}
            className="rounded-[14px] items-center justify-center"
            style={{
              width: "48%",
              backgroundColor: "#0046AD",
              height: 52,
            }}
          >
            <View className="flex-row items-center">
              <Ionicons name="sparkles" size={18} color="#fff" />
              <Text className="ml-2 text-[14px] font-extrabold text-white">
                View Results
              </Text>
            </View>
          </TouchableOpacity>
        </View>
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
      className="bg-[#F8FAFC] rounded-[18px] px-4 py-4"
      style={{ width: "48%" }}
    >
      <View className="flex-row items-center">
        <View
          className="w-10 h-10 rounded-[14px] items-center justify-center"
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
  return <View className="h-px bg-gray-200 mx-4" />;
}