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

import { predictAll, type SpoilagePredictResponse } from "../../api/SpoilageApi";

type Props = NativeStackScreenProps<SpoilageStackParamList, "SpoilageConfirm">;

function stageTitle(stage: string) {
  if (stage === "fresh") return "Stage 1: Fresh";
  if (stage === "slightly_aged") return "Stage 2: Slightly Aged";
  if (stage === "near_spoilage") return "Stage 3: Near Spoilage";
  return "Stage 4: Spoiled";
}

function stageDesc(stage: string) {
  if (stage === "fresh")
    return "Analysis indicates the plant is fresh with minimal spoilage indicators.";
  if (stage === "slightly_aged")
    return "Analysis indicates early aging signs. Monitor storage conditions.";
  if (stage === "near_spoilage")
    return "Analysis indicates spoilage risk is increasing. Inspect and take action soon.";
  return "Analysis indicates spoiled indicators. Discard/segregate to prevent contamination.";
}

function confidenceFromProbs(p?: any) {
  if (!p) return null;
  return Math.max(p.fresh, p.slightly_aged, p.near_spoilage, p.spoiled);
}

export default function SpoilageConfirmScreen({ navigation, route }: Props) {
  const { imageUri } = route.params;

  // ✅ manual inputs (no simulation)
  const [plantId, setPlantId] = useState("");
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");

  const [loading, setLoading] = useState(false);

  // ✅ real model output (filled after predict)
  const [pred, setPred] = useState<SpoilagePredictResponse | null>(null);

  const preview = useMemo(() => {
    const t = Number(temperature);
    const h = Number(humidity);
    return {
      tempText: Number.isFinite(t) ? `${t}°C` : "--",
      humText: Number.isFinite(h) ? `${h}%` : "--",
    };
  }, [temperature, humidity]);

  const conf = useMemo(() => confidenceFromProbs(pred?.stage_probs), [pred]);
  const showPred = !!pred;

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
      });

      // ✅ update confirm UI with real stage + confidence
      setPred(result);

      // ✅ then navigate to remaining days screen
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

          {/* confidence pill (only after prediction) */}
          {showPred && conf !== null ? (
            <View className="absolute top-3 right-3">
              <View
                className="px-3 py-1 rounded-full bg-white/95 flex-row items-center"
                style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
              >
                <View className="w-2 h-2 rounded-full bg-[#16A34A]" />
                <Text className="ml-2 text-[12px] font-extrabold text-gray-900">
                  {Math.round(conf * 100)}% Confidence
                </Text>
              </View>
            </View>
          ) : null}

          {/* Stage details (only after prediction, like your screenshot) */}
          {showPred ? (
            <View className="p-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-[10px] font-semibold text-gray-500">
                    AI DETECTED STAGE
                  </Text>
                  <Text className="text-[16px] font-extrabold text-gray-900 mt-1">
                    {stageTitle(pred.stage)}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => Alert.alert("Report", "Add report flow later.")}
                >
                  <Text className="text-[12px] font-semibold text-[#2563EB]">
                    Report wrong
                  </Text>
                </TouchableOpacity>
              </View>

              <Text className="text-[12px] text-gray-600 mt-2 leading-4">
                {stageDesc(pred.stage)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Inputs (needed before prediction) */}
        <View className="mt-4 bg-white rounded-[18px] p-4 shadow-sm">
          <Text className="text-[12px] font-extrabold text-gray-900">
            Confirm Inputs
          </Text>

          <View className="mt-3">
            <Text className="text-[11px] text-gray-500 font-semibold">Plant ID</Text>
            <TextInput
              value={plantId}
              onChangeText={setPlantId}
              autoCapitalize="characters"
              placeholder="P-001"
              className="mt-2 px-3 py-3 rounded-xl bg-[#F4F6FA] text-gray-900"
            />
          </View>

          <View className="mt-3 flex-row">
            <View className="flex-1 mr-2">
              <Text className="text-[11px] text-gray-500 font-semibold">Temperature</Text>
              <TextInput
                value={temperature}
                onChangeText={setTemperature}
                keyboardType="numeric"
                placeholder="26"
                className="mt-2 px-3 py-3 rounded-xl bg-[#F4F6FA] text-gray-900"
              />
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-[11px] text-gray-500 font-semibold">Humidity</Text>
              <TextInput
                value={humidity}
                onChangeText={setHumidity}
                keyboardType="numeric"
                placeholder="85"
                className="mt-2 px-3 py-3 rounded-xl bg-[#F4F6FA] text-gray-900"
              />
            </View>
          </View>
        </View>

        {/* Environmental Data (like screenshot) */}
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

        {/* Batch Details (like screenshot) */}
        <Text className="text-[14px] font-extrabold text-gray-900 mt-5 mb-3">
          Batch Details
        </Text>

        <View className="bg-white rounded-[18px] shadow-sm overflow-hidden">
          <RowItem left="Plant ID" right={plantId || "-"} />
          <Divider />
          <RowItem left="Batch ID" right="#BUT-2291" />
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
          style={{
            backgroundColor: "#0046AD",
            height: 54,
            opacity: loading ? 0.7 : 1,
          }}
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
    <View className="bg-white rounded-[18px] px-4 py-4 shadow-sm" style={{ width: "48%" }}>
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