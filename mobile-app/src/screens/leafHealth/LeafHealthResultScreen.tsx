import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Buffer } from "buffer";
import {
  buildLeafHealthImageUrl,
  predictLeafHealthAnnotated,
  saveLeafHealthLog,
} from "../../api/LeafHealthApi";

function formatSeverity(status?: string) {
  if (status === "ACT NOW") return "High";
  if (status === "WATCH") return "Medium";
  return "Low";
}

function formatStatusLabel(status?: string) {
  if (status === "WATCH") return "Warning";
  return status || "Unknown";
}

export default function LeafHealthResultScreen({ route, navigation }: any) {
  const { result, imageUri } = route.params || {};

  const backendImageUri = buildLeafHealthImageUrl(result?.image_path);
  const displayImageUri = imageUri || backendImageUri;

  const [annotating, setAnnotating] = useState(false);
  const [annotatedVisible, setAnnotatedVisible] = useState(false);
  const [annotatedImageUri, setAnnotatedImageUri] = useState<string | null>(null);

  const saveLog = async () => {
    try {
      await saveLeafHealthLog({
        plant_id: result.plant_id,
        captured_at: result.captured_at,
        health_score: result.health_score,
        status: result.status,
        main_issue: result.primary_issue || result.main_issue,
        probs: result.probs,
        tipburn: result.tipburn,
        image_name: result.image_name,
        image_path: result.image_path,
        reason: result.reason,
        classification_label: result.classification_label,
        classification_confidence: result.classification_confidence,
        raw_result: result.raw_result || result,
      });
      Alert.alert("Saved", "Saved to daily log");
    } catch (e: any) {
      Alert.alert("Save failed", e?.message || "Unknown error");
    }
  };

  const handleAnnotateTipburn = async () => {
    if (!imageUri) {
      Alert.alert(
        "Not available",
        "Annotated view is currently available only right after a fresh scan or upload."
      );
      return;
    }

    try {
      setAnnotating(true);
      const arrayBuffer = await predictLeafHealthAnnotated(imageUri);
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const dataUri = `data:image/png;base64,${base64}`;
      setAnnotatedImageUri(dataUri);
      setAnnotatedVisible(true);
    } catch (e: any) {
      Alert.alert("Annotation failed", e?.message || "Could not generate annotated image");
    } finally {
      setAnnotating(false);
    }
  };

  const top3 = useMemo(() => {
    if (result?.top3_probs) return result.top3_probs;
    if (!result?.probs) return {};
    return Object.fromEntries(
      Object.entries(result.probs)
        .sort((a: any, b: any) => Number(b[1]) - Number(a[1]))
        .slice(0, 3)
    );
  }, [result]);

  const issue = result?.primary_issue || result?.main_issue || "Unknown";
  const topPredictionName =
    Object.keys(top3).length > 0 ? Object.entries(top3)[0][0] : issue;
  const topPredictionValue =
    Object.keys(top3).length > 0 ? Number(Object.entries(top3)[0][1]) : 0;

  const scoreColor =
    result?.health_score >= 80
      ? "#15803D"
      : result?.health_score >= 60
      ? "#D97706"
      : "#B91C1C";

  const statusBg =
    result?.status === "OK"
      ? "bg-[#E9FBEF]"
      : result?.status === "WATCH"
      ? "bg-[#FFF6E5]"
      : "bg-[#FEF2F2]";

  const statusText =
    result?.status === "OK"
      ? "text-[#15803D]"
      : result?.status === "WATCH"
      ? "text-[#C2410C]"
      : "text-[#B91C1C]";

  const canAnnotate = !!imageUri && (result?.tipburn?.num_boxes ?? 0) > 0;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      >
        {/* Header */}
        <View className="pt-2 pb-3">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}
              className="w-10 h-10 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={22} color="#111827" />
            </TouchableOpacity>

            <Text className="text-[13px] font-extrabold text-gray-900">Health Report</Text>

            <View className="w-10 h-10" />
          </View>
        </View>

        {/* Image Card */}
        <View className="bg-white rounded-[18px] shadow-sm overflow-hidden">
          {displayImageUri ? (
            <Image
              source={{ uri: displayImageUri }}
              style={{ width: "100%", height: 280 }}
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-[280px] items-center justify-center bg-gray-50">
              <Ionicons name="leaf-outline" size={34} color="#9CA3AF" />
              <Text className="text-[12px] text-gray-500 mt-2">No scan image available</Text>
            </View>
          )}

          <View className="absolute top-3 left-3 bg-black/60 px-3 py-1.5 rounded-full">
            <Text className="text-[11px] font-extrabold text-white">
              {result?.plant_id || "Plant #01"}
            </Text>
          </View>

          <View className="absolute top-3 right-3 bg-black/60 px-3 py-1.5 rounded-full">
            <Text className="text-[10px] font-semibold text-white">
              {result?.image_name || result?.captured_at || "Leaf Scan"}
            </Text>
          </View>
        </View>

        {/* Annotate Button */}
        {canAnnotate && (
          <TouchableOpacity
            onPress={handleAnnotateTipburn}
            disabled={annotating}
            activeOpacity={0.85}
            className="mt-3 bg-white rounded-[14px] py-3 px-4 items-center justify-center flex-row"
          >
            {annotating ? (
              <ActivityIndicator color="#1D4ED8" />
            ) : (
              <>
                <Ionicons name="scan-outline" size={18} color="#1D4ED8" />
                <Text className="ml-2 text-[12px] font-bold text-blue-700">
                  Annotate Tipburn Areas
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Health Score Card */}
        <View className="mt-4 bg-white rounded-[18px] shadow-sm p-5">
          <Text className="text-[11px] font-extrabold text-gray-400 tracking-wider">
            HEALTH SCORE
          </Text>

          <View className="flex-row items-center justify-between mt-3">
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text
                  className="text-[48px] font-extrabold mr-3"
                  style={{ color: scoreColor }}
                >
                  {result?.health_score ?? 0}
                </Text>

                <View className={`px-3 py-1.5 rounded-full ${statusBg}`}>
                  <Text className={`text-[11px] font-extrabold ${statusText}`}>
                    {formatStatusLabel(result?.status)}
                  </Text>
                </View>
              </View>

              <Text className="text-[12px] text-gray-600 mt-3 leading-[18px]">
                Main issue:{" "}
                <Text className="font-bold text-gray-900">{issue}</Text>
                {" • "}
                Severity:{" "}
                <Text className="font-bold text-gray-900">
                  {formatSeverity(result?.status)}
                </Text>
              </Text>
            </View>

            <View className="w-14 h-14 rounded-full bg-blue-50 items-center justify-center">
              <Ionicons name="warning-outline" size={28} color="#1D4ED8" />
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row justify-between mt-3">
          <View className="bg-white rounded-[18px] shadow-sm p-4 w-[48%]">
            <Text className="text-[11px] text-gray-500 font-semibold">Top Prediction</Text>
            <Text className="text-[13px] font-extrabold text-gray-900 mt-2">
              {topPredictionName}
            </Text>
            <Text className="text-[12px] text-gray-600 mt-1">
              {topPredictionValue.toFixed(2)}
            </Text>

            <View className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <View
                className="h-full bg-blue-600 rounded-full"
                style={{
                  width: `${Math.max(8, Math.min(100, topPredictionValue * 100))}%`,
                }}
              />
            </View>
          </View>

          <View className="bg-white rounded-[18px] shadow-sm p-4 w-[48%]">
            <Text className="text-[11px] text-gray-500 font-semibold">Tipburn Risk</Text>
            <Text className="text-[20px] font-extrabold text-gray-900 mt-2">
              {(result?.tipburn?.C ?? 0).toFixed(2)}
            </Text>
            <Text className="text-[10px] text-gray-400 mt-2 leading-[14px]">
              Boxes: {result?.tipburn?.num_boxes ?? 0}
              {"\n"}
              Area: {(result?.tipburn?.A ?? 0).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Explanations Card */}
        <View className="mt-4 bg-white rounded-[18px] shadow-sm p-5">
          <Text className="text-[16px] font-extrabold text-gray-900">Explanations</Text>

          {/* Classifier Section */}
          <Text className="text-[11px] text-gray-500 mt-4 mb-3">
            <Text className="font-bold">Classifier</Text> — Top 3 probabilities
          </Text>

          {Object.keys(top3).length === 0 ? (
            <Text className="text-[12px] text-gray-400 italic">
              No top probabilities returned
            </Text>
          ) : (
            Object.entries(top3).map(([k, v]: any, idx) => (
              <View
                key={k}
                className={`flex-row items-center justify-between py-2 ${
                  idx < Object.keys(top3).length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <Text className="text-[12px] text-gray-700 flex-1">{k}</Text>
                <Text className="text-[12px] font-bold text-gray-900">
                  {Number(v).toFixed(2)}
                </Text>
              </View>
            ))
          )}

          {/* Tipburn Section */}
          <Text className="text-[11px] text-gray-500 mt-5 mb-3">
            <Text className="font-bold">Tipburn</Text> — Detector stats
          </Text>

          <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
            <Text className="text-[12px] text-gray-700">Boxes count</Text>
            <Text className="text-[12px] font-bold text-gray-900">
              {result?.tipburn?.num_boxes ?? 0}
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
            <Text className="text-[12px] text-gray-700">Area ratio</Text>
            <Text className="text-[12px] font-bold text-gray-900">
              {Number(result?.tipburn?.A ?? 0).toFixed(2)}
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-2">
            <Text className="text-[12px] text-gray-700">Average confidence</Text>
            <Text className="text-[12px] font-bold text-gray-900">
              {Number(result?.tipburn?.C ?? 0).toFixed(2)}
            </Text>
          </View>

          {/* Decision Summary Section */}
          {!!result?.classification_label && (
            <>
              <Text className="text-[11px] text-gray-500 mt-5 mb-3">
                <Text className="font-bold">Decision summary</Text>
              </Text>

              <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                <Text className="text-[12px] text-gray-700">Selected class</Text>
                <Text className="text-[12px] font-bold text-gray-900">
                  {result.classification_label}
                </Text>
              </View>

              <View className="flex-row items-center justify-between py-2">
                <Text className="text-[12px] text-gray-700">Confidence</Text>
                <Text className="text-[12px] font-bold text-gray-900">
                  {Number(result?.classification_confidence ?? 0).toFixed(2)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          onPress={saveLog}
          activeOpacity={0.85}
          className="mt-4 bg-[#003B8F] rounded-[16px] py-4 items-center justify-center"
        >
          <Text className="text-[12px] font-extrabold text-white">Save to Daily Log</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("LeafHealthScan")}
          activeOpacity={0.85}
          className="mt-3 bg-white rounded-[16px] py-4 items-center justify-center"
        >
          <Text className="text-[12px] font-extrabold text-gray-900">New Scan</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Annotated Image Modal */}
      <Modal visible={annotatedVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-[24px] max-h-[85%]">
            <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
              <Text className="text-[15px] font-extrabold text-gray-900">
                Annotated Tipburn Areas
              </Text>

              <TouchableOpacity
                onPress={() => setAnnotatedVisible(false)}
                activeOpacity={0.85}
                className="w-9 h-9 rounded-full items-center justify-center bg-gray-100"
              >
                <Ionicons name="close" size={18} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {annotatedImageUri ? (
                <Image
                  source={{ uri: annotatedImageUri }}
                  style={{ width: "100%", height: 400, borderRadius: 14 }}
                  resizeMode="contain"
                />
              ) : (
                <View className="w-full h-[400px] items-center justify-center bg-gray-50 rounded-[14px]">
                  <Text className="text-[12px] text-gray-500">
                    No annotated image available
                  </Text>
                </View>
              )}
            </ScrollView>

            <View className="px-5 pb-5 pt-3 border-t border-gray-100">
              <TouchableOpacity
                onPress={() => setAnnotatedVisible(false)}
                activeOpacity={0.85}
                className="bg-[#003B8F] rounded-[16px] py-4 items-center justify-center"
              >
                <Text className="text-[12px] font-extrabold text-white">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}