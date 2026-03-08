import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SpoilageStackParamList } from "../../navigation/SpoilageNavigator";
import { logSpoilageActivity } from "../../utils/activityLog";

type Props = NativeStackScreenProps<
  SpoilageStackParamList,
  "SpoilageShelfLifeResult"
>;

function maxProbPercent(p: any) {
  if (!p) return "—";
  const m = Math.max(p.fresh, p.slightly_aged, p.near_spoilage, p.spoiled);
  return `${Math.round(m * 100)}% Confidence`;
}

function prettyStage(stage: string) {
  if (stage === "fresh") return "Fresh";
  if (stage === "slightly_aged") return "Slightly Aged";
  if (stage === "near_spoilage") return "Near Spoilage";
  return "Spoiled";
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

function formatCapturedAt(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h === 0 ? 12 : h;

  return `${yyyy}.${mm}.${dd} • ${h}:${m} ${ampm}`;
}

export default function SpoilageShelfLifeResultScreen({
  navigation,
  route,
}: Props) {
  const { imageUri, result } = route.params;

  const confidence = useMemo(() => maxProbPercent(result?.stage_probs), [result]);
  const theme = useMemo(() => stageTheme(result?.stage), [result]);
  const plantId = result?.plant_id ?? "-";
  const status = result?.status ?? "-";
  const remainingDays =
    typeof result?.remaining_days === "number" ? result.remaining_days : 0;

  const [showSaved, setShowSaved] = useState(false);

  const goToDetails = () => {
    setShowSaved(false);
    requestAnimationFrame(() => navigation.navigate("SpoilageDetails"));
  };

  const goToRescan = () => {
    navigation.navigate("SpoilageScan", {
      plantId: result?.plant_id,
      demoMode: false,
    } as any);
  };

  const onSave = async () => {
    try {
      await logSpoilageActivity({
        plantId: result?.plant_id,
        stage: result?.stage,
        remainingDays: result?.remaining_days,
        capturedAtISO: result?.captured_at,
      });
    } catch (error) {
      console.error("Failed to log spoilage activity:", error);
    } finally {
      setShowSaved(true);
    }
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
            Shelf-Life Result
          </Text>

          <View
            className="w-10 h-10 items-center justify-center rounded-full bg-white"
            style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
          >
            <Ionicons name="analytics-outline" size={18} color="#64748B" />
          </View>
        </View>

        <View className="mt-4 bg-white rounded-[22px] overflow-hidden shadow-sm">
          <View style={{ height: 230 }} className="bg-gray-100">
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
                  {confidence}
                </Text>
              </View>
            </View>

            <View className="absolute bottom-4 left-4">
              <View
                className="px-3 py-1.5 rounded-full flex-row items-center"
                style={{ backgroundColor: theme.bg }}
              >
                <Ionicons name={theme.icon} size={14} color={theme.text} />
                <Text
                  className="ml-1.5 text-[11px] font-extrabold"
                  style={{ color: theme.text }}
                >
                  {prettyStage(result.stage)}
                </Text>
              </View>
            </View>
          </View>

          <View className="p-4">
            <Text className="text-[18px] font-extrabold text-gray-900">
              {plantId}
            </Text>
            <Text className="text-[12px] text-gray-500 mt-1">
              Captured: {formatCapturedAt(result?.captured_at)}
            </Text>

            <View className="mt-4 flex-row justify-between">
              <SmallInfoCard
                icon="pulse-outline"
                label="Status"
                value={status}
                iconBg="#EFF6FF"
                iconColor="#2563EB"
              />
              <SmallInfoCard
                icon="checkmark-circle-outline"
                label="Stage"
                value={prettyStage(result.stage)}
                iconBg={theme.bg}
                iconColor={theme.text}
              />
            </View>
          </View>
        </View>

        <View className="mt-4 bg-white rounded-[22px] p-5 shadow-sm">
          <Text className="text-[14px] font-extrabold text-gray-900 text-center">
            Estimated Remaining Shelf Life
          </Text>

          <View className="items-center mt-4">
            <View
              className="w-20 h-20 rounded-full items-center justify-center"
              style={{ backgroundColor: "#FFF7ED" }}
            >
              <Ionicons name="time-outline" size={30} color="#F59E0B" />
            </View>

            <View className="flex-row items-end mt-4">
              <Text className="text-[40px] font-extrabold text-[#F59E0B]">
                {remainingDays.toFixed(1)}
              </Text>
              <Text className="ml-2 mb-1 text-[12px] font-extrabold text-[#F59E0B]">
                DAYS
              </Text>
            </View>

            <Text className="text-[11px] text-gray-500 mt-1">
              Remaining from current spoilage analysis
            </Text>
          </View>
        </View>

        <View className="mt-4 bg-white rounded-[22px] p-4 shadow-sm">
          <Text className="font-extrabold text-gray-900 text-[14px]">
            Stage Probabilities
          </Text>
          <Text className="text-[11px] text-gray-500 mt-1">
            Model confidence across all spoilage stages
          </Text>

          <View className="mt-4">
            <ProbRow label="Fresh" value={result.stage_probs.fresh} />
            <View className="h-3" />
            <ProbRow label="Slightly Aged" value={result.stage_probs.slightly_aged} />
            <View className="h-3" />
            <ProbRow label="Near Spoilage" value={result.stage_probs.near_spoilage} />
            <View className="h-3" />
            <ProbRow label="Spoiled" value={result.stage_probs.spoiled} />
          </View>
        </View>

        <View className="mt-6 flex-row justify-between">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={goToRescan}
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
              <Text className="ml-2 font-extrabold text-gray-900">Re-Scan</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onSave}
            className="rounded-[14px] items-center justify-center"
            style={{
              width: "48%",
              backgroundColor: "#0046AD",
              height: 52,
            }}
          >
            <View className="flex-row items-center">
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text className="ml-2 text-[14px] font-extrabold text-white">
                Save
              </Text>
            </View>
          </TouchableOpacity>
        </View>

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
                width: 290,
                backgroundColor: "#fff",
                borderRadius: 20,
                paddingVertical: 20,
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
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  backgroundColor: "#E9FBEF",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 4,
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    backgroundColor: "#16A34A",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="checkmark" size={22} color="#fff" />
                </View>
              </View>

              <Text className="mt-4 text-[15px] font-extrabold text-gray-900">
                Record Saved Successfully
              </Text>
              <Text className="mt-2 text-[12px] text-gray-500 text-center">
                The spoilage analysis result has been saved.
              </Text>

              <TouchableOpacity
                onPress={goToDetails}
                activeOpacity={0.9}
                style={{
                  marginTop: 16,
                  backgroundColor: "#0046AD",
                  paddingVertical: 11,
                  paddingHorizontal: 30,
                  borderRadius: 12,
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

function SmallInfoCard({
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
      className="rounded-[18px] px-4 py-4"
      style={{ width: "48%", backgroundColor: "#F8FAFC" }}
    >
      <View className="flex-row items-center">
        <View
          className="w-10 h-10 rounded-[14px] items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-[11px] text-gray-500 font-semibold">{label}</Text>
          <Text className="text-[14px] font-extrabold text-gray-900 mt-0.5">
            {value}
          </Text>
        </View>
      </View>
    </View>
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
      <View className="h-2.5 rounded-full bg-gray-200 overflow-hidden mt-1.5">
        <View
          className="h-2.5 rounded-full"
          style={{ width: `${pct}%`, backgroundColor: "#0046AD" }}
        />
      </View>
    </View>
  );
}
