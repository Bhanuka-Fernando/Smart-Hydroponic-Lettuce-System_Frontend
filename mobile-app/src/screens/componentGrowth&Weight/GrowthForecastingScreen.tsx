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
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

type PickedImage = { uri: string };

function StatRow({
  iconName,
  label,
  value,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <View className="flex-row items-center">
        <View className="w-8 h-8 rounded-full bg-[#FFF4E5] items-center justify-center">
          <Ionicons name={iconName} size={16} color="#F97316" />
        </View>
        <Text className="ml-3 text-[12px] font-bold text-gray-700">{label}</Text>
      </View>
      <Text className="text-[12px] font-extrabold text-gray-700">{value}</Text>
    </View>
  );
}

export default function GrowthForecastingScreen() {
  const navigation = useNavigation<any>();

  const [image, setImage] = useState<PickedImage | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const dateLabel = useMemo(() => {
    // match your screenshot vibe (static is fine)
    return "Oct 24, 2023";
  }, []);

  const pickOrCapture = async (mode: "camera" | "gallery") => {
    try {
      if (mode === "camera") {
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
        if (!res.canceled && res.assets?.[0]?.uri) setImage({ uri: res.assets[0].uri });
      } else {
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
        if (!res.canceled && res.assets?.[0]?.uri) setImage({ uri: res.assets[0].uri });
      }
    } catch {
      Alert.alert("Error", "Failed to open camera/gallery.");
    }
  };

  const startDataAnalysis = async () => {
    if (!image?.uri) {
      Alert.alert("No image", "Please capture an image first.");
      return;
    }
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      Alert.alert("Done", "Data analysis completed (demo).");
    }, 900);
  };

  const generatePrediction = () => {
    navigation.navigate("GrowthPredictionResults", {
        dateLabel: "Tuesday, January 6",
        predictedWeight: 142.5,
        predictedArea: 142.5,
        predictedDiameter: 142.5,
        changePct: 3,
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

          <Text className="text-[13px] font-extrabold text-gray-900">
            Growth Forecasting
          </Text>

          <View className="w-10 h-10" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      >
        {/* Title */}
        <Text className="text-[20px] font-extrabold text-gray-900">
          Please Start Analysis
        </Text>
        <Text className="text-[11px] text-gray-500 mt-1">{dateLabel}</Text>

        {/* Camera Preview */}
        <View className="bg-white rounded-[18px] shadow-sm mt-4 p-4">
          <View className="rounded-[18px] overflow-hidden bg-[#E5E7EB] h-[200px] items-center justify-center relative">
            {image?.uri ? (
              <Image
                source={{ uri: image.uri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <Text className="text-[11px] font-semibold text-gray-500">
                Capture image to start
              </Text>
            )}

            {/* fake focus corners */}
            <View className="absolute top-4 left-4 w-7 h-7 border-l-4 border-t-4 border-white/80 rounded-sm" />
            <View className="absolute top-4 right-4 w-7 h-7 border-r-4 border-t-4 border-white/80 rounded-sm" />
            <View className="absolute bottom-4 left-4 w-7 h-7 border-l-4 border-b-4 border-white/80 rounded-sm" />
            <View className="absolute bottom-4 right-4 w-7 h-7 border-r-4 border-b-4 border-white/80 rounded-sm" />
          </View>

          {/* Buttons row */}
          <View className="flex-row mt-3" style={{ gap: 10 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => pickOrCapture("camera")}
              className="flex-1 bg-white rounded-[14px] border border-gray-200 py-3 items-center justify-center flex-row"
            >
              <Ionicons name="camera-outline" size={16} color="#111827" />
              <Text className="ml-2 text-[12px] font-extrabold text-gray-900">
                Capture Now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => pickOrCapture("gallery")}
              className="w-12 bg-white rounded-[14px] border border-gray-200 items-center justify-center"
            >
              <Ionicons name="image-outline" size={18} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* Start Data Analysis */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={startDataAnalysis}
            disabled={analyzing}
            className={`mt-3 rounded-[14px] py-3 items-center justify-center flex-row ${
              analyzing ? "bg-[#C7D2E5]" : "bg-[#EAF4FF]"
            }`}
          >
            {analyzing ? (
              <ActivityIndicator color="#003B8F" />
            ) : (
              <>
                <Ionicons name="analytics-outline" size={16} color="#003B8F" />
                <Text className="ml-2 text-[12px] font-extrabold text-[#003B8F]">
                  Start Data Analysis
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Environment Data */}
        <Text className="text-[12px] font-extrabold text-gray-900 mt-6 mb-3">
          Environment Data
        </Text>

        <View className="bg-white rounded-[18px] shadow-sm px-4 py-2">
          <StatRow iconName="thermometer-outline" label="Temperature" value="22°C" />
          <View className="h-px bg-gray-100" />
          <StatRow iconName="water-outline" label="PH value" value="6.2" />
          <View className="h-px bg-gray-100" />
          <StatRow iconName="flash-outline" label="EC value" value="1.4" />
          <View className="h-px bg-gray-100" />
          <StatRow iconName="cloud-outline" label="Humidity" value="45%" />
        </View>

        {/* Details of Plant */}
        <Text className="text-[12px] font-extrabold text-gray-900 mt-6 mb-3">
          Details of Plant
        </Text>

        <View className="bg-white rounded-[18px] shadow-sm px-4 py-2">
          <StatRow iconName="leaf-outline" label="Leaf Area" value="123 cm2" />
          <View className="h-px bg-gray-100" />
          <StatRow iconName="resize-outline" label="Diameter" value="10 cm" />
          <View className="h-px bg-gray-100" />
          <StatRow iconName="calendar-outline" label="DAP" value="20" />
        </View>

        {/* Recent History */}
        <Text className="text-[12px] font-extrabold text-gray-900 mt-6 mb-3">
          Recent History
        </Text>

        <View className="bg-white rounded-[18px] shadow-sm p-4">
          <View className="flex-row justify-between">
            {["#01", "#02", "#03"].map((id) => (
              <View key={id} className="items-center">
                <View className="w-[86px] h-[56px] rounded-[12px] bg-[#E5E7EB] overflow-hidden">
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=60",
                    }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </View>
                <Text className="text-[10px] font-bold text-gray-500 mt-2">
                  {id}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={generatePrediction}
          className="mt-6 bg-[#003B8F] rounded-[16px] py-4 items-center justify-center flex-row"
        >
          <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
          <Text className="ml-2 text-[12px] font-extrabold text-white">
            Generate Growth Prediction
          </Text>
        </TouchableOpacity>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
