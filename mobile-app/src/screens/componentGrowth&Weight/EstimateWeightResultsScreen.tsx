import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { logWeightActivity } from "../../utils/activityLog";

type RouteParams = {
  imageUri: string;
  accuracy?: number;
  biomassG?: number;
  leafAreaCm2?: number;
  leafDiameterCm?: number;
  plantId?: string;
  plantAgeDays?: number;
  capturedAtISO?: string;
  rawPayload?: any;
  imageName?: string; // ✅ Add this
  shouldLogActivity?: boolean;
};

// ✅ Add this function to extract image name
function getImageFileName(uri?: string, backendImageName?: string) {
  if (backendImageName) {
    return backendImageName;
  }

  if (!uri) return "image.jpg";
  
  try {
    const parts = uri.split('/');
    const fileName = parts[parts.length - 1];
    const cleanFileName = fileName.split('?')[0];
    return cleanFileName || "image.jpg";
  } catch {
    return "image.jpg";
  }
}

function formatCapturedLabel(iso?: string, imageName?: string) { // ✅ Add imageName parameter
  try {
    // ✅ If we have an image name from backend, return it
    if (imageName) {
      return imageName;
    }
    
    // Otherwise, generate the formatted label as before
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

function formatPrettyDateTime(iso?: string) {
  try {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function getQualityLabel(accuracy: number) {
  if (accuracy >= 90) return { label: "Excellent", icon: "sparkles" as const, color: "#16A34A" };
  if (accuracy >= 75) return { label: "Good", icon: "thumbs-up" as const, color: "#2563EB" };
  if (accuracy >= 60) return { label: "Fair", icon: "alert-circle" as const, color: "#F97316" };
  return { label: "Low", icon: "warning" as const, color: "#DC2626" };
}

function getNextTip(accuracy: number) {
  if (accuracy >= 90) return "You can save this scan and continue with monitoring.";
  if (accuracy >= 75) return "Good scan. For best results, keep the leaf centered and flat.";
  if (accuracy >= 60) return "Try better lighting and reduce motion blur for a cleaner mask.";
  return "Retake: use brighter light, steady hands, and keep the leaf fully visible.";
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-row items-center">
        <View className="w-9 h-9 rounded-full bg-[#EAF4FF] items-center justify-center">
          {icon}
        </View>
        <Text className="ml-3 text-[12px] font-extrabold text-gray-700">{label}</Text>
      </View>

      <Text className="text-[12px] font-extrabold text-gray-900">{value}</Text>
    </View>
  );
}

export default function EstimateWeightResultsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const hasLoggedActivityRef = useRef(false);

  const params: RouteParams = route.params || {};
  const shouldLogActivity = params.shouldLogActivity !== false;

  const computed = useMemo(() => {
    const accuracy = params.accuracy ?? 0;
    const biomassG = params.biomassG ?? 0;
    const leafAreaCm2 = params.leafAreaCm2 ?? 0;
    const leafDiameterCm = params.leafDiameterCm ?? 0;
    const capturedAtISO = params.capturedAtISO ?? new Date().toISOString();
    
    // ✅ Get the real image name from backend
    const imageFileName = getImageFileName(params.imageUri, params.imageName);
    const capturedLabel = formatCapturedLabel(capturedAtISO, imageFileName); // ✅ Pass imageFileName

    const quality = getQualityLabel(accuracy);
    const nextTip = getNextTip(accuracy);

    return {
      accuracy,
      biomassG,
      leafAreaCm2,
      leafDiameterCm,
      capturedLabel,
      capturedAtISO,
      prettyCaptured: formatPrettyDateTime(capturedAtISO),
      quality,
      nextTip,
    };
  }, [params]);

  useEffect(() => {
    if (!shouldLogActivity || hasLoggedActivityRef.current) return;
    hasLoggedActivityRef.current = true;

    logWeightActivity({
      plantId: params.plantId,
      weightG: computed.biomassG,
      accuracy: computed.accuracy,
      capturedAtISO: computed.capturedAtISO,
    }).catch((error) => {
      console.error("Failed to log weight activity:", error);
    });
  }, [computed.accuracy, computed.biomassG, computed.capturedAtISO, params.plantId, shouldLogActivity]);

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
            <Text className="text-[12px] font-extrabold text-gray-500 mt-3">
              ESTIMATED BIOMASS
            </Text>

            <View className="flex-row items-end mt-1">
              <Text className="text-[25px] font-extrabold text-gray-900 leading-[48px]">
                {computed.biomassG.toFixed(2)}
              </Text>
              <Text className="text-[20px] font-extrabold text-gray-700 mb-4 ml-2">
                g
              </Text>
            </View>

            <View className="mt-3 items-center">
              <Text className="text-[11px] text-gray-700 font-semibold">
                Leaf Area : {computed.leafAreaCm2.toFixed(2)} cm2
              </Text>
              <Text className="text-[11px] text-gray-700 font-semibold mt-1">
                Leaf Diameter : {computed.leafDiameterCm.toFixed(2)} cm
              </Text>
            </View>
          </View>
        </View>

        {/* New: Scan Summary card (fills the empty space nicely) */}
        <View className="bg-white rounded-[18px] shadow-sm px-5 py-4 mt-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-[12px] font-extrabold text-gray-900">
              Scan Summary
            </Text>

            <View
              className="px-3 py-1 rounded-full flex-row items-center"
              style={{ backgroundColor: "#EEF2FF" }}
            >
              <Ionicons
                name={computed.quality.icon as any}
                size={14}
                color={computed.quality.color}
              />
              <Text
                className="ml-2 text-[10px] font-extrabold"
                style={{ color: computed.quality.color }}
              >
                {computed.quality.label}
              </Text>
            </View>
          </View>

          <View className="mt-2">
            <InfoRow
              icon={<Ionicons name="time-outline" size={18} color="#0046AD" />}
              label="Captured"
              value={computed.prettyCaptured}
            />            

            <View className="h-[1px] bg-gray-100" />

            <View className="py-3">
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-full bg-[#FFF7ED] items-center justify-center">
                  <Ionicons name="bulb-outline" size={18} color="#F97316" />
                </View>
                <Text className="ml-3 text-[12px] font-extrabold text-gray-700">
                  Tip
                </Text>
              </View>
              <Text className="text-[11px] text-gray-700 font-semibold mt-2 leading-5">
                {computed.nextTip}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons (only keep New Scan) */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onNewScan}
          className="mt-5 bg-white rounded-[16px] border border-gray-200 py-4 items-center justify-center flex-row"
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
