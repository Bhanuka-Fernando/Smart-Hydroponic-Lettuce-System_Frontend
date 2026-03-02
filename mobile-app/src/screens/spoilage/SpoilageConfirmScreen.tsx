import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SpoilageStackParamList } from "../../navigation/SpoilageNavigator";

import { predictAll } from "../../api/SpoilageApi";

type Props = NativeStackScreenProps<SpoilageStackParamList, "SpoilageConfirm">;

function stageTitle(stage: string) {
  if (stage === "fresh") return "Stage 1: Fresh";
  if (stage === "slightly_aged") return "Stage 2: Slightly Aged";
  if (stage === "near_spoilage") return "Stage 3: Near Spoilage";
  return "Stage 4: Spoiled";
}

function stageDesc(stage: string) {
  if (stage === "fresh") return "Plant looks fresh with minimal spoilage indicators.";
  if (stage === "slightly_aged") return "Minor aging indicators detected. Monitor storage conditions.";
  if (stage === "near_spoilage") return "High spoilage risk detected. Inspect and take action soon.";
  return "Spoiled indicators detected. Discard/segregate to avoid contamination.";
}

export default function SpoilageConfirmScreen({ navigation, route }: Props) {
  const { imageUri } = route.params;

  // inputs (you can auto-fill later from sensor simulation)
  const [plantId, setPlantId] = useState("P-001");
  const [temperature, setTemperature] = useState("26");
  const [humidity, setHumidity] = useState("85");

  const [loading, setLoading] = useState(false);

  // temporary preview values (before predict)
  const preview = useMemo(() => {
    const t = Number(temperature);
    const h = Number(humidity);
    return {
      tempText: Number.isFinite(t) ? `${t}°C` : "--",
      humText: Number.isFinite(h) ? `${h}%` : "--",
    };
  }, [temperature, humidity]);

  const onPredict = async () => {
    if (!imageUri) return Alert.alert("Missing", "No image found.");
    if (!plantId.trim()) return Alert.alert("Missing", "Enter Plant ID.");

    const t = Number(temperature);
    const h = Number(humidity);
    if (!Number.isFinite(t) || !Number.isFinite(h)) {
      return Alert.alert("Invalid", "Temperature/Humidity must be valid numbers.");
    }

    try {
      setLoading(true);

      const result = await predictAll({
        imageUri,
        temperature: t,
        humidity: h,
        plant_id: plantId.trim(),
        // captured_at: leave undefined => backend auto fills
      });

      navigation.navigate("SpoilageShelfLifeResult", { imageUri, result });
    } catch (e: any) {
      console.log("Predict error:", e?.message, e?.response?.data);
      Alert.alert("Error", e?.response?.data?.detail || "Prediction failed");
    } finally {
      setLoading(false);
    }
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

          <View className="p-4">
            <Text className="text-[10px] font-semibold text-gray-500">
              INPUTS (USED FOR PREDICTION)
            </Text>

            <View className="mt-3">
              <Text className="text-[12px] text-gray-500 font-semibold">Plant ID</Text>
              <TextInput
                value={plantId}
                onChangeText={setPlantId}
                autoCapitalize="characters"
                className="mt-2 px-3 py-3 rounded-xl bg-[#F4F6FA] text-gray-900"
              />
            </View>

            <View className="mt-3 flex-row">
              <View className="flex-1 mr-2">
                <Text className="text-[12px] text-gray-500 font-semibold">Temperature (°C)</Text>
                <TextInput
                  value={temperature}
                  onChangeText={setTemperature}
                  keyboardType="numeric"
                  className="mt-2 px-3 py-3 rounded-xl bg-[#F4F6FA] text-gray-900"
                />
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-[12px] text-gray-500 font-semibold">Humidity (%)</Text>
                <TextInput
                  value={humidity}
                  onChangeText={setHumidity}
                  keyboardType="numeric"
                  className="mt-2 px-3 py-3 rounded-xl bg-[#F4F6FA] text-gray-900"
                />
              </View>
            </View>
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
            value={preview.tempText}
            iconBg="#FFF2E6"
            iconColor="#F59E0B"
          />
          <MiniStat
            icon="water-outline"
            label="Humidity"
            value={preview.humText}
            iconBg="#EAF4FF"
            iconColor="#2563EB"
          />
        </View>

        {/* Batch Details */}
        <Text className="text-[14px] font-extrabold text-gray-900 mt-5 mb-3">
          Batch Details
        </Text>

        <View className="bg-white rounded-[18px] shadow-sm overflow-hidden">
          <RowItem left="Plant ID" right={plantId || "-"} />
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
          onPress={onPredict}
          disabled={loading}
          className="mt-4 rounded-[12px] items-center justify-center"
          style={{ backgroundColor: "#0046AD", height: 54, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View className="flex-row items-center">
              <Ionicons name="sparkles" size={18} color="#fff" />
              <Text className="ml-2 text-[14px] font-extrabold text-white">
                Predict Shelf Life
              </Text>
            </View>
          )}
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