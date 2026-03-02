import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "../../auth/useAuth";
import { estimateWeight } from "../../api/weightApi";
import { getGrowthForecast } from "../../api/growthApi";

import SensorReadingsModal from "../../components/Sensors/SensorReadingsModal";
import { useSensorReadings } from "../../context/SensorReadingsContext";

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
  const { accessToken } = useAuth();

  const { readings, setAll } = useSensorReadings();
  const [sensorModalOpen, setSensorModalOpen] = useState(false);

  const [rgbImage, setRgbImage] = useState<PickedImage | null>(null);
  const [depthImage, setDepthImage] = useState<PickedImage | null>(null);

  const [today, setToday] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const dateLabel = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const sensorsReady =
    readings.airT != null && readings.RH != null && readings.EC != null && readings.pH != null;

  const sensors = sensorsReady
    ? { airT: readings.airT, RH: readings.RH, EC: readings.EC, pH: readings.pH }
    : null;

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
      allowsEditing: false,
    });

    if (!res.canceled && res.assets?.[0]?.uri) {
      setRgbImage({ uri: res.assets[0].uri });
      setToday(null);
      setForecast([]);
    }
  };

  const pickDepthFromGallery = async () => {
    const ok = await requestGalleryPerm();
    if (!ok) return;

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    });

    if (!res.canceled && res.assets?.[0]?.uri) {
      setDepthImage({ uri: res.assets[0].uri });
      setToday(null);
      setForecast([]);
    }
  };

  const canAnalyze = useMemo(
    () => !!rgbImage?.uri && !!depthImage?.uri && !analyzing,
    [rgbImage, depthImage, analyzing]
  );

  const startDataAnalysis = async () => {
    if (!rgbImage?.uri || !depthImage?.uri) {
      Alert.alert("Missing inputs", "Upload both RGB and Depth images.");
      return;
    }
    if (!sensorsReady) {
      Alert.alert("Missing sensor readings", "Please input Temperature, Humidity, EC, and pH.");
      setSensorModalOpen(true);
      return;
    }

    try {
      setAnalyzing(true);

      const PLANT_ID = "p04";
      const ZONE_ID = "z01";

      const todayRes = await estimateWeight({
        rgbUri: rgbImage.uri,
        depthUri: depthImage.uri,
        token: accessToken,
        plant_id: PLANT_ID,
        zone_id: ZONE_ID,
        dap: 20, // Default DAP value
        A_prev_cm2: null,
        sensors,
      });



      setToday(todayRes);

      const points = await getGrowthForecast({
        token: accessToken,
        plant_id: PLANT_ID,
        zone_id: ZONE_ID,
        dap: 20, // Default DAP value
        n_days: 4,
        A_prev_cm2: null,
        A_t_cm2: todayRes.A_proj_cm2,
        D_t_cm: todayRes.D_proj_cm,
        sensors,
      });


      setForecast(points);

      Alert.alert("Done", "Growth analysis completed.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to analyze.");
    } finally {
      setAnalyzing(false);
    }
  };

const generatePrediction = () => {
  if (!today) {
    Alert.alert("No results", "Run Start Data Analysis first.");
    return;
  }
  if (!forecast?.length) {
    Alert.alert("No forecast", "Run Start Data Analysis first.");
    return;
  }

  const labels = ["Today", ...forecast.map((_: any, i: number) => `D+${i + 1}`)];

  const wToday = Number(today.W_today_g);
  const predicted = [wToday, ...forecast.map((p: any) => Number(p.W_pred_g))];
  const actual = [wToday, ...forecast.map(() => wToday)];

  // ✅ use FORECAST tomorrow consistently
  const tmr = forecast[0];
  const tmrWeight = Number(tmr.W_pred_g ?? 0);
  const tmrLeafArea = Number(tmr.A_leaf_pred_cm2 ?? 0);
  const tmrDiam = Number(tmr.D_pred_cm ?? 0);

  const changePct = wToday > 0 ? ((tmrWeight - wToday) / wToday) * 100 : 0;

  navigation.navigate("GrowthPredictionResults", {
    dateLabel: "Tomorrow",
    predictedWeight: tmrWeight,
    predictedArea: tmrLeafArea,
    predictedDiameter: tmrDiam,
    changePct,
    labels,
    actual,
    predicted,
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

          <Text className="text-[13px] font-extrabold text-gray-900">Growth Forecasting</Text>
          <View className="w-10 h-10" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      >
        <Text className="text-[20px] font-extrabold text-gray-900">Please Start Analysis</Text>
        <Text className="text-[11px] text-gray-500 mt-1">{dateLabel}</Text>

        {/* Preview */}
        <View className="bg-white rounded-[18px] shadow-sm mt-4 p-4">
          {/* Selected Images Preview (RGB + Depth) */}
          <View className="flex-row mt-3" style={{ gap: 10 }}>
            <View className="flex-1">
              <Text className="text-[10px] font-extrabold text-gray-500 mb-2">RGB</Text>
              <View className="h-[110px] rounded-[14px] bg-[#E5E7EB] overflow-hidden items-center justify-center">
                {rgbImage?.uri ? (
                  <Image source={{ uri: rgbImage.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                ) : (
                  <Text className="text-[10px] text-gray-500 font-semibold">Not selected</Text>
                )}
              </View>
            </View>

            <View className="flex-1">
              <Text className="text-[10px] font-extrabold text-gray-500 mb-2">Depth</Text>
              <View className="h-[110px] rounded-[14px] bg-[#E5E7EB] overflow-hidden items-center justify-center">
                {depthImage?.uri ? (
                  <Image source={{ uri: depthImage.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                ) : (
                  <Text className="text-[10px] text-gray-500 font-semibold">Not selected</Text>
                )}
              </View>
            </View>
          </View>

          {/* Upload buttons */}
          <View className="flex-row mt-3" style={{ gap: 10 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={pickRgbFromGallery}
              className="flex-1 bg-white rounded-[14px] border border-gray-200 py-3 items-center justify-center flex-row"
            >
              <Ionicons name="image-outline" size={16} color="#111827" />
              <Text className="ml-2 text-[12px] font-extrabold text-gray-900">Upload RGB</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={pickDepthFromGallery}
              className="flex-1 bg-white rounded-[14px] border border-gray-200 py-3 items-center justify-center flex-row"
            >
              <Ionicons name="layers-outline" size={16} color="#111827" />
              <Text className="ml-2 text-[12px] font-extrabold text-gray-900">Upload Depth</Text>
            </TouchableOpacity>
          </View>

          {/* Start Data Analysis */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={startDataAnalysis}
            disabled={!canAnalyze}
            className={`mt-3 rounded-[14px] py-3 items-center justify-center flex-row ${
              canAnalyze ? "bg-[#EAF4FF]" : "bg-[#C7D2E5]"
            }`}
          >
            {analyzing ? (
              <ActivityIndicator color="#003B8F" />
            ) : (
              <>
                <Ionicons name="analytics-outline" size={16} color="#003B8F" />
                <Text className="ml-2 text-[12px] font-extrabold text-[#003B8F]">Start Data Analysis</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Environment Data + input button */}
        <View className="flex-row items-center justify-between mt-6 mb-3">
          <Text className="text-[12px] font-extrabold text-gray-900">Environment Data</Text>

          <TouchableOpacity
            onPress={() => setSensorModalOpen(true)}
            activeOpacity={0.9}
            className="px-3 py-2 rounded-[12px] bg-white border border-gray-200"
          >
            <Text className="text-[11px] font-extrabold text-gray-900">Input Readings</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-[18px] shadow-sm px-4 py-2">
          <StatRow
            iconName="thermometer-outline"
            label="Temperature"
            value={readings.airT != null ? `${readings.airT}°C` : "--"}
          />
          <View className="h-px bg-gray-100" />
          <StatRow iconName="water-outline" label="PH value" value={readings.pH != null ? `${readings.pH}` : "--"} />
          <View className="h-px bg-gray-100" />
          <StatRow iconName="flash-outline" label="EC value" value={readings.EC != null ? `${readings.EC}` : "--"} />
          <View className="h-px bg-gray-100" />
          <StatRow iconName="cloud-outline" label="Humidity" value={readings.RH != null ? `${readings.RH}%` : "--"} />
        </View>

        {/* Details of Plant */}
        <Text className="text-[12px] font-extrabold text-gray-900 mt-6 mb-3">Details of Plant</Text>

        <View className="bg-white rounded-[18px] shadow-sm px-4 py-2">
          <StatRow
            iconName="leaf-outline"
            label="Leaf Area"
            value={today?.A_des_cm2 != null ? `${Number(today.A_des_cm2).toFixed(1)} cm²` : "--"}
          />
          <View className="h-px bg-gray-100" />
          <StatRow
            iconName="resize-outline"
            label="Diameter"
            value={today?.D_proj_cm != null ? `${Number(today.D_proj_cm).toFixed(1)} cm` : "--"}
          />
          <View className="h-px bg-gray-100" />

          <StatRow
            iconName="barbell-outline"
            label="Weight"
            value={today?.W_today_g != null ? `${Number(today.W_today_g).toFixed(1)} g` : "--"}
          />
        </View>

        {/* Bottom button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={generatePrediction}
          className="mt-6 bg-[#003B8F] rounded-[16px] py-4 items-center justify-center flex-row"
        >
          <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
          <Text className="ml-2 text-[12px] font-extrabold text-white">Generate Growth Prediction</Text>
        </TouchableOpacity>

        <View className="h-6" />
      </ScrollView>

      {/* Manual input modal */}
      <SensorReadingsModal
        visible={sensorModalOpen}
        mode="all"
        initial={{ airT: readings.airT, RH: readings.RH, EC: readings.EC, pH: readings.pH }}
        onClose={() => setSensorModalOpen(false)}
        onSubmit={(vals) => setAll(vals)}
      />
    </SafeAreaView>
  );
}
