// src/screens/leafHealth/LeafHealthScanScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { predictLeafHealth } from "../../api/LeafHealthApi";

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

export default function LeafHealthScanScreen({ navigation }: any) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
    }
  };

  const runPredict = async () => {
    if (!imageUri) {
      return Alert.alert("Select an image first");
    }

    try {
      setLoading(true);
      const data = await predictLeafHealth(imageUri);
      navigation.navigate("LeafHealthResult", { result: data, imageUri });
    } catch (e: any) {
      Alert.alert("Prediction failed", e?.message || "Unknown error");
    } finally {
      setLoading(false);
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
          Analyze Plant Health
        </Text>
        <Text className="text-[11px] text-gray-500 text-center mt-2 leading-[16px]">
          Upload a top-view leaf photo or use the mobile camera to detect diseases, deficiencies,
          and tipburn.
        </Text>

        {/* Image Upload */}
        <View className="bg-white rounded-[18px] shadow-sm mt-5 p-4">
          {!imageUri ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={pickImage}
              className="rounded-[16px] border border-dashed border-[#B6C8F0] items-center justify-center py-8"
            >
              <View className="w-16 h-16 rounded-full bg-[#EAF4FF] items-center justify-center mb-3">
                <Ionicons name="cloud-upload-outline" size={28} color="#0046AD" />
              </View>

              <Text className="text-[12px] font-extrabold text-gray-900">
                Drop / Click to upload
              </Text>
              <Text className="text-[10px] text-gray-500 mt-1">Top-view leaf image</Text>
            </TouchableOpacity>
          ) : (
            <View className="relative">
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: 240, borderRadius: 14 }}
                resizeMode="cover"
              />

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={pickImage}
                className="absolute top-3 right-3 bg-black/50 px-3 py-2 rounded-full flex-row items-center"
              >
                <Ionicons name="swap-horizontal" size={14} color="#fff" />
                <Text className="ml-2 text-[10px] font-extrabold text-white">Change</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setImageUri(null)}
                className="absolute top-3 left-3 bg-black/50 w-9 h-9 rounded-full items-center justify-center"
              >
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View className="flex-row items-center justify-between mt-4">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={pickImage}
            className="flex-1 mr-2 rounded-[16px] py-3 items-center justify-center flex-row bg-white"
          >
            <Ionicons name="folder-open-outline" size={18} color="#111827" />
            <Text className="ml-2 text-[12px] font-extrabold text-gray-900">Upload Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("LeafHealthCamera")}
            className="flex-1 ml-2 rounded-[16px] py-3 items-center justify-center flex-row bg-white"
          >
            <Ionicons name="camera-outline" size={18} color="#0046AD" />
            <Text className="ml-2 text-[12px] font-extrabold text-blue-700">Use Camera</Text>
          </TouchableOpacity>
        </View>

        {/* Start Analysis */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={runPredict}
          disabled={loading || !imageUri}
          className={`mt-4 rounded-[16px] py-4 items-center justify-center flex-row ${
            loading || !imageUri ? "bg-[#C7D2E5]" : "bg-[#003B8F]"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="play-circle-outline" size={18} color="#FFFFFF" />
              <Text className="ml-2 text-[12px] font-extrabold text-white">Start Analysis</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Tips */}
        <Text className="text-[12px] font-extrabold text-gray-900 mt-6">QUICK TIPS</Text>
        <Text className="text-[11px] text-gray-500 mt-1 mb-3">For Accurate Detection</Text>

        <TipCard
          icon={<Ionicons name="checkmark-circle-outline" size={18} color="#16A34A" />}
          iconBg="bg-[#E9FBEF]"
          title="Use a clear image"
          body="Keep focus and avoid motion blur for best results."
        />
        <TipCard
          icon={<Feather name="target" size={18} color="#0046AD" />}
          iconBg="bg-[#EAF4FF]"
          title="Top-down view"
          body="Capture directly above the plant/leaf for accurate detection."
        />
        <TipCard
          icon={<MaterialCommunityIcons name="leaf" size={18} color="#DB2777" />}
          iconBg="bg-[#FFEAF2]"
          title="One plant at a time"
          body="Keep only one leaf/plant in frame to avoid confusion."
        />
        <TipCard
          icon={<Ionicons name="sunny-outline" size={18} color="#F59E0B" />}
          iconBg="bg-[#FFF6E5]"
          title="Good lighting"
          body="Use natural or bright artificial light for better image quality."
        />
      </ScrollView>
    </SafeAreaView>
  );
}