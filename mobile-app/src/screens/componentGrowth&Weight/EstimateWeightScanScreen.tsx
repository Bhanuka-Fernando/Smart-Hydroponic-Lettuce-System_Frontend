import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "../../auth/useAuth";
import { estimateWeight } from "../../api/weightApi";

type PickedImage = { uri: string };

function TipCard({
  icon,
  iconBg,
  title,
  body,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  body: string;
}) {
  return (
    <View className="bg-white rounded-[18px] shadow-sm px-4 py-4 mb-3 flex-row">
      <View className={`w-10 h-10 rounded-full ${iconBg} items-center justify-center mr-3`}>
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-[13px] font-extrabold text-gray-900">{title}</Text>
        <Text className="text-[11px] text-gray-500 mt-1 leading-[16px]">{body}</Text>
      </View>
    </View>
  );
}

export default function EstimateWeightScanScreen() {
  const navigation = useNavigation<any>();
  const { accessToken } = useAuth();

  const [rgbImage, setRgbImage] = useState<PickedImage | null>(null);
  const [depthImage, setDepthImage] = useState<PickedImage | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [maskPreview, setMaskPreview] = useState<string | null>(null);

  const canAnalyze = useMemo(
    () => !!rgbImage?.uri && !!depthImage?.uri && !analyzing,
    [rgbImage, depthImage, analyzing]
  );
  const canGoResults = useMemo(
    () => !!result?.imageUri && !analyzing,
    [result, analyzing]
  );

  const requestGalleryPerm = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow gallery permission.");
      return false;
    }
    return true;
  };

  const pickRgbFromGallery = async () => {
    const ok = await requestGalleryPerm();
    if (!ok) return;

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false, // ✅ must be false
    });

    if (!res.canceled && res.assets?.[0]?.uri) {
      setRgbImage({ uri: res.assets[0].uri });
      setResult(null);
      setMaskPreview(null);
    }
  };

  const pickDepthFromGallery = async () => {
    const ok = await requestGalleryPerm();
    if (!ok) return;

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false, // ✅ must be false
    });

    if (!res.canceled && res.assets?.[0]?.uri) {
      setDepthImage({ uri: res.assets[0].uri });
      setResult(null);
      setMaskPreview(null);
    }
  };

  function getImageSize(uri: string): Promise<{ w: number; h: number }> {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (w, h) => resolve({ w, h }),
        (err) => reject(err)
      );
    });
  }

  const startAnalysis = async () => {
    if (!rgbImage?.uri || !depthImage?.uri) {
      Alert.alert("Missing inputs", "Please upload both RGB and Depth images.");
      return;
    }

    try {
      setAnalyzing(true);

      const capturedAtISO = new Date().toISOString();

      const data = await estimateWeight({
        rgbUri: rgbImage.uri,
        depthUri: depthImage.uri,
        token: accessToken,
        plant_id: "p04",
        captured_at: capturedAtISO,
        dap: 25,
        A_prev_cm2: null,
        sensors: null,
      });

      // ✅ map backend keys -> UI keys
      const merged = {
        plant_id: "p04",
        captured_at: capturedAtISO,
        biomass_g: data.W_today_g,
        leaf_area_cm2: data.A_des_cm2,
        leaf_diameter_cm: data.D_proj_cm,
        accuracy: 0, // your backend doesn't return accuracy yet
        mask_url: data.mask_url,
        image_url: data.image_url,
        capturedAtISO,
        imageUri: rgbImage.uri,
        depthUri: depthImage.uri,
      };

      setResult(merged);
      if (data.mask_overlay_b64) {
        setMaskPreview(`data:image/png;base64,${data.mask_overlay_b64}`);
      } else {
        setMaskPreview(null);
      }

      Alert.alert("Done", "Analysis complete. Tap 'Check for Results'.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to start analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  const goToResults = () => {
    if (!result?.imageUri) {
      Alert.alert("No results", "Run Start Analysis first.");
      return;
    }

    navigation.navigate("EstimateWeightResults", {
      imageUri: result.imageUri,
      accuracy: result.accuracy,
      biomassG: result.biomass_g,
      leafAreaCm2: result.leaf_area_cm2,
      leafDiameterCm: result.leaf_diameter_cm,
      plantId: result.plant_id ?? "Plant",
      plantAgeDays: 24,
      capturedAtISO: result.capturedAtISO,
      rawPayload: result,
    });
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

          <Text className="text-[13px] font-extrabold text-gray-900">New Scan</Text>

          <View className="w-10 h-10" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      >
        {/* Title */}
        <Text className="text-[18px] font-extrabold text-gray-900 text-center mt-2">
          Analyze Plant
        </Text>
        <Text className="text-[11px] text-gray-500 text-center mt-2 leading-[16px]">
          Upload both RGB and Depth images to estimate plant weight.
        </Text>

        {/* RGB Upload */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={pickRgbFromGallery}
          className="bg-white rounded-[18px] shadow-sm mt-4 p-4"
        >
          <View className="rounded-[16px] border border-dashed border-[#B6C8F0] items-center justify-center py-5">
            <View className="w-12 h-12 rounded-full bg-[#EAF4FF] items-center justify-center mb-3">
              <Ionicons name="image-outline" size={22} color="#0046AD" />
            </View>

            <Text className="text-[12px] font-extrabold text-gray-900">
              Upload RGB Image (Top-view)
            </Text>
            <Text className="text-[10px] text-gray-500 mt-1">from gallery</Text>
          </View>

          {rgbImage?.uri ? (
            <View className="mt-4">
              <Image
                source={{ uri: rgbImage.uri }}
                style={{ width: "100%", height: 180, borderRadius: 14 }}
                resizeMode="cover"
              />
            </View>
          ) : null}
        </TouchableOpacity>

        {/* Depth Upload */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={pickDepthFromGallery}
          className="bg-white rounded-[18px] shadow-sm mt-3 p-4"
        >
          <View className="rounded-[16px] border border-dashed border-[#B6C8F0] items-center justify-center py-5">
            <View className="w-12 h-12 rounded-full bg-[#EAF4FF] items-center justify-center mb-3">
              <Ionicons name="layers-outline" size={22} color="#0046AD" />
            </View>

            <Text className="text-[12px] font-extrabold text-gray-900">
              Upload Depth Image
            </Text>
            <Text className="text-[10px] text-gray-500 mt-1">
              (must match RGB size)
            </Text>
          </View>

          {depthImage?.uri ? (
            <View className="mt-4">
              <Image
                source={{ uri: depthImage.uri }}
                style={{ width: "100%", height: 180, borderRadius: 14 }}
                resizeMode="cover"
              />
            </View>
          ) : null}
        </TouchableOpacity>

        {/* Start Analysis */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={startAnalysis}
          disabled={!canAnalyze}
          className={`mt-3 rounded-[16px] py-4 items-center justify-center flex-row ${
            canAnalyze ? "bg-[#003B8F]" : "bg-[#C7D2E5]"
          }`}
        >
          {analyzing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="play-circle-outline" size={18} color="#FFFFFF" />
              <Text className="ml-2 text-[12px] font-extrabold text-white">
                Start Analysis
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Tips */}
        <Text className="text-[12px] font-extrabold text-gray-900 mt-6">
          QUICK TIPS
        </Text>
        <Text className="text-[11px] text-gray-500 mt-1 mb-3">
          For Accurate Estimation
        </Text>

        <TipCard
          icon={<Ionicons name="checkmark-circle-outline" size={18} color="#16A34A" />}
          iconBg="bg-[#E9FBEF]"
          title="Match RGB & Depth"
          body="RGB and Depth must be same resolution (width/height)."
        />
        <TipCard
          icon={<Ionicons name="scan-outline" size={18} color="#0046AD" />}
          iconBg="bg-[#EAF4FF]"
          title="Top-Down View"
          body="Capture directly above the plant for best results."
        />
        <TipCard
          icon={<Feather name="target" size={18} color="#DB2777" />}
          iconBg="bg-[#FFEAF2]"
          title="Don’t Crop Depth"
          body="Keep depth image original (no editing/cropping)."
        />

        {/* Plant Mask */}
        <Text className="text-[12px] font-extrabold text-gray-900 mt-5 mb-3">
          PLANT MASK
        </Text>

        <View className="bg-white rounded-[18px] shadow-sm p-4">
          <View className="h-[170px] rounded-[16px] bg-[#E5E7EB] overflow-hidden items-center justify-center">
            {maskPreview ? (
              <Image
                source={{ uri: maskPreview }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <Text className="text-[11px] text-gray-500 font-semibold">
                Mask preview will appear here
              </Text>
            )}
          </View>
        </View>

        <View className="h-10" />

        {/* Results */}
        <View className="px-4 pb-4 bg-[#F4F6FA]">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={goToResults}
            disabled={!canGoResults}
            className={`rounded-[16px] py-4 items-center justify-center flex-row ${
              canGoResults ? "bg-[#003B8F]" : "bg-[#C7D2E5]"
            }`}
          >
            <Ionicons name="bar-chart-outline" size={18} color="#FFFFFF" />
            <Text className="ml-2 text-[12px] font-extrabold text-white">
              Check for Results
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}