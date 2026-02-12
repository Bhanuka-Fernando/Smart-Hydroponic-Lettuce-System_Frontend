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

  const [image, setImage] = useState<PickedImage | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const canAnalyze = useMemo(() => !!image && !analyzing, [image, analyzing]);

  const goToResults = () => {
  if (!image?.uri) {
    Alert.alert("No image", "Please upload or capture an image first.");
    return;
  }

  navigation.navigate("EstimateWeightResults", {
    imageUri: image.uri,
    accuracy: 87,
    biomassG: 345,
    leafAreaCm2: 64,
    leafDiameterCm: 12,
    plantId: "Plant #01",
    plantAgeDays: 24,
    capturedAtISO: new Date().toISOString(),
  });
};


  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow gallery permission.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
      aspect: [4, 5],
    });

    if (!res.canceled && res.assets?.[0]?.uri) {
      setImage({ uri: res.assets[0].uri });
    }
  };

  const captureFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow camera permission.");
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      quality: 0.9,
      allowsEditing: true,
      aspect: [4, 5],
    });

    if (!res.canceled && res.assets?.[0]?.uri) {
      setImage({ uri: res.assets[0].uri });
    }
  };

  const startAnalysis = async () => {
    if (!image) return;

    try {
      setAnalyzing(true);

      // TODO: call your backend/model here
      // For now, just simulate
      setTimeout(() => {
        setAnalyzing(false);
        Alert.alert("Analysis started", "Next step: show results screen.");
      }, 900);
    } catch (e) {
      setAnalyzing(false);
      Alert.alert("Error", "Failed to start analysis.");
    }
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
          Choose an image source to start estimating{"\n"}
          the daily weight of your lettuce plant.
        </Text>

        {/* Upload card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={pickFromGallery}
          className="bg-white rounded-[18px] shadow-sm mt-4 p-4"
        >
          <View
            className="rounded-[16px] border border-dashed border-[#B6C8F0] items-center justify-center py-5"
          >
            <View className="w-12 h-12 rounded-full bg-[#EAF4FF] items-center justify-center mb-3">
              <Ionicons name="scan-outline" size={22} color="#0046AD" />
            </View>

            <Text className="text-[12px] font-extrabold text-gray-900">
              Click to Upload Top-view image
            </Text>
            <Text className="text-[10px] text-gray-500 mt-1">
              of the plant from gallery
            </Text>
          </View>

          {/* Preview */}
          {image?.uri ? (
            <View className="mt-4">
              <Image
                source={{ uri: image.uri }}
                style={{ width: "100%", height: 180, borderRadius: 14 }}
                resizeMode="cover"
              />
            </View>
          ) : null}
        </TouchableOpacity>

        {/* Buttons */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={captureFromCamera}
          className="mt-3 bg-white rounded-[16px] border border-gray-200 py-4 items-center justify-center flex-row"
        >
          <Ionicons name="camera-outline" size={18} color="#111827" />
          <Text className="ml-2 text-[12px] font-extrabold text-gray-900">
            Capture real-time Image
          </Text>
        </TouchableOpacity>

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

        {/* Quick Tips */}
        <Text className="text-[12px] font-extrabold text-gray-900 mt-6">
          QUICK TIPS
        </Text>
        <Text className="text-[11px] text-gray-500 mt-1 mb-3">
          For Accurate Estimation
        </Text>

        <TipCard
          icon={<Ionicons name="checkmark-circle-outline" size={18} color="#16A34A" />}
          iconBg="bg-[#E9FBEF]"
          title="Use a Clear Image"
          body="Ensure the image is focused well and not blurry."
        />
        <TipCard
          icon={<Ionicons name="scan-outline" size={18} color="#0046AD" />}
          iconBg="bg-[#EAF4FF]"
          title="Top-Down View"
          body="Capture the image directly above for best results."
        />
        <TipCard
          icon={<Feather name="target" size={18} color="#DB2777" />}
          iconBg="bg-[#FFEAF2]"
          title="One Plant at a Time"
          body="Focus on a single plant to ensure accuracy."
        />

        {/* Plant Mask */}
        <Text className="text-[12px] font-extrabold text-gray-900 mt-5 mb-3">
          PLANT MASK
        </Text>

        <View className="bg-white rounded-[18px] shadow-sm p-4">
          <View className="h-[170px] rounded-[16px] bg-[#E5E7EB] overflow-hidden items-center justify-center">
            <Text className="text-[11px] text-gray-500 font-semibold">
              Mask preview will appear here
            </Text>
          </View>
        </View>

        {/* Bottom spacing */}
        <View className="h-10" />

        {/* Bottom button */}
        <View className="px-4 pb-4 bg-[#F4F6FA]">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={goToResults}
              disabled={!image?.uri}
              className={`rounded-[16px] py-4 items-center justify-center flex-row ${
                image?.uri ? "bg-[#003B8F]" : "bg-[#C7D2E5]"
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
