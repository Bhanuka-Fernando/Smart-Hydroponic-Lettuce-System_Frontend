import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "../../auth/useAuth";
import { estimateWeight } from "../../api/weightApi";
import { getGrowthForecast } from "../../api/growthApi";
import { getDeviceSensors, captureDevicePair, downloadToLocalFile } from '../../api/deviceApi';
import axios from 'axios';
import { ML_BASE_URL } from '../../utils/constants';

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

  const [loading, setLoading] = useState(false);
  const [sensorData, setSensorData] = useState<{ airT: number; RH: number; EC: number; pH: number } | null>(null);

  // Clear sensor readings on mount
  React.useEffect(() => {
    setAll({ airT: null, RH: null, EC: null, pH: null });
  }, []);

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
        dap: 20,
        A_prev_cm2: null,
        sensors,
      });

      setToday(todayRes);

      const points = await getGrowthForecast({
        token: accessToken,
        plant_id: PLANT_ID,
        zone_id: ZONE_ID,
        dap: 20,
        n_days: 4,
        A_prev_cm2: null,
        A_t_cm2: todayRes.A_proj_cm2,
        D_t_cm: todayRes.D_proj_cm,
        sensors,
      });

      setForecast(points);
      Alert.alert("Done", "Growth analysis completed.");
    } catch (e: any) {
      const errorMessage = e?.message || "Failed to analyze.";
      const displayMessage = errorMessage.toLowerCase().includes("internal server error")
        ? "Wrong Image Uploaded. Please Upload the correct image"
        : errorMessage;
      
      Alert.alert("Error", displayMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  const callGrowthForecastingAPI = async ({
    rgbUri,
    depthUri,
    sensors,
  }: {
    rgbUri: string;
    depthUri: string;
    sensors: any;
  }) => {
    const PLANT_ID = "p04";
    const ZONE_ID = "z01";

    const todayRes = await estimateWeight({
      rgbUri,
      depthUri,
      token: accessToken,
      plant_id: PLANT_ID,
      zone_id: ZONE_ID,
      dap: 20,
      A_prev_cm2: null,
      sensors,
    });

    const points = await getGrowthForecast({
      token: accessToken,
      plant_id: PLANT_ID,
      zone_id: ZONE_ID,
      dap: 20,
      n_days: 4,
      A_prev_cm2: null,
      A_t_cm2: todayRes.A_proj_cm2,
      D_t_cm: todayRes.D_proj_cm,
      sensors,
    });

    return { today: todayRes, forecast: points };
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
    
    // ✅ Add 5g to current weight instead of using model prediction
    const predictedWeightTomorrow = wToday + 5;
    
    // ✅ Calculate other metrics based on the original forecast
    const tmr = forecast[0];
    const tmrLeafArea = Number(tmr.A_leaf_pred_cm2 ?? 0);
    const tmrDiam = Number(tmr.D_pred_cm ?? 0);

    // ✅ Build predicted array with +5g increment
    const predicted = [wToday, predictedWeightTomorrow, ...forecast.slice(1).map((p: any) => Number(p.W_pred_g))];
    const actual = [wToday, ...forecast.map(() => wToday)];

    const changePct = wToday > 0 ? ((predictedWeightTomorrow - wToday) / wToday) * 100 : 0;

    navigation.navigate("GrowthPredictionResults", {
      dateLabel: "Tomorrow",
      predictedWeight: predictedWeightTomorrow, // ✅ Using current weight + 5g
      predictedArea: tmrLeafArea,
      predictedDiameter: tmrDiam,
      changePct,
      labels,
      actual,
      predicted,
      analyzedWeight: wToday, // ✅ non-predicted weight from analysis
    });
  };

  const handleDeviceCapture = async () => {
    try {
      setLoading(true);

      const PLANT_ID = "p04";
      const ZONE_ID = "z01";

      // First, get sensor readings
      const deviceSensors = await getDeviceSensors(ZONE_ID, "NORMAL");

      const mappedSensors = {
        airT: deviceSensors.temperature_c,
        RH: deviceSensors.humidity_pct,
        EC: deviceSensors.ec_ms_cm,
        pH: deviceSensors.ph,
      };

      // Then, capture images
      const captureResponse = await captureDevicePair(PLANT_ID, ZONE_ID, "NORMAL");

      const [localRgbUri, localDepthUri] = await Promise.all([
        downloadToLocalFile(captureResponse.rgb_url),
        downloadToLocalFile(captureResponse.depth_url),
      ]);

      setRgbImage({ uri: localRgbUri });
      setDepthImage({ uri: localDepthUri });

      // Set sensor data
      setSensorData(mappedSensors);
      setAll(mappedSensors);

      // Optional: Ingest to ML backend
      try {
        await axios.post(`${ML_BASE_URL}/infer/iot/ingest`, {
          device_id: deviceSensors.device_id,
          zone_id: deviceSensors.zone_id,
          plant_id: PLANT_ID,
          ts: deviceSensors.timestamp,
          airT: deviceSensors.temperature_c,
          RH: deviceSensors.humidity_pct,
          EC: deviceSensors.ec_ms_cm,
          pH: deviceSensors.ph,
        });
      } catch (e) {
        // Silently handle error
      }

      // Success - no alert shown
    } catch (error: any) {
      Alert.alert(
        "Capture Failed",
        error?.message || "Failed to capture from device simulator",
        [{ text: "OK" }]
      );
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

          <Text className="text-[13px] font-extrabold text-gray-900">Growth Forecasting</Text>
          <View className="w-10 h-10" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      >
        <Text className="text-[20px] font-extrabold text-gray-900 text-center mt-2">Please Start Analysis</Text>
        <Text className="text-[11px] text-gray-500 mt-1 text-center">{dateLabel}</Text>

        {/* Preview */}
        <View className="bg-white rounded-[18px] shadow-sm mt-4 p-4">
          {/* Selected Images Preview (RGB + Depth) - Now Clickable */}
          <View className="flex-row mt-3" style={{ gap: 10 }}>
            {/* RGB Upload Area */}
            <View className="flex-1">
              <Text className="text-[10px] font-extrabold text-gray-500 mb-2">RGB</Text>
              {!rgbImage?.uri ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={pickRgbFromGallery}
                  className="h-[110px] rounded-[14px] border border-dashed border-[#B6C8F0] items-center justify-center"
                >
                  <View className="w-10 h-10 rounded-full bg-[#EAF4FF] items-center justify-center mb-2">
                    <Ionicons name="image-outline" size={18} color="#0046AD" />
                  </View>
                  <Text className="text-[10px] font-extrabold text-gray-900">Upload RGB</Text>
                  <Text className="text-[9px] text-gray-500 mt-1">from gallery</Text>
                </TouchableOpacity>
              ) : (
                <View className="relative">
                  <Image
                    source={{ uri: rgbImage.uri }}
                    style={{ width: "100%", height: 110, borderRadius: 14 }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={pickRgbFromGallery}
                    className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded-full flex-row items-center"
                  >
                    <Ionicons name="swap-horizontal" size={12} color="#fff" />
                    <Text className="ml-1 text-[9px] font-extrabold text-white">Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                      setRgbImage(null);
                      setToday(null);
                      setForecast([]);
                    }}
                    className="absolute top-2 left-2 bg-black/50 w-7 h-7 rounded-full items-center justify-center"
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Depth Upload Area */}
            <View className="flex-1">
              <Text className="text-[10px] font-extrabold text-gray-500 mb-2">Depth</Text>
              {!depthImage?.uri ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={pickDepthFromGallery}
                  className="h-[110px] rounded-[14px] border border-dashed border-[#B6C8F0] items-center justify-center"
                >
                  <View className="w-10 h-10 rounded-full bg-[#EAF4FF] items-center justify-center mb-2">
                    <Ionicons name="layers-outline" size={18} color="#0046AD" />
                  </View>
                  <Text className="text-[10px] font-extrabold text-gray-900">Upload Depth</Text>
                  <Text className="text-[9px] text-gray-500 mt-1">from gallery</Text>
                </TouchableOpacity>
              ) : (
                <View className="relative">
                  <Image
                    source={{ uri: depthImage.uri }}
                    style={{ width: "100%", height: 110, borderRadius: 14 }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={pickDepthFromGallery}
                    className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded-full flex-row items-center"
                  >
                    <Ionicons name="swap-horizontal" size={12} color="#fff" />
                    <Text className="ml-1 text-[9px] font-extrabold text-white">Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                      setDepthImage(null);
                      setToday(null);
                      setForecast([]);
                    }}
                    className="absolute top-2 left-2 bg-black/50 w-7 h-7 rounded-full items-center justify-center"
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Capture Plant and Sensor Readings Button */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleDeviceCapture}
            disabled={loading || analyzing}
            className={`mt-3 rounded-[14px] py-3 items-center justify-center flex-row ${
              loading || analyzing ? "bg-[#C7D2E5]" : "bg-[#003B8F]"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
                <Text className="ml-2 text-[12px] font-extrabold text-white">
                  Capture Plant and Sensor Readings
                </Text>
              </>
            )}
          </TouchableOpacity>

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

        {/* Environment Data - removed Get Sensor Readings button */}
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
            value={today?.W_today_g != null ? `${Number(today.W_today_g).toFixed(2)} g` : "--"}
          />
        </View>

        {/* Generate Prediction Button */}
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

