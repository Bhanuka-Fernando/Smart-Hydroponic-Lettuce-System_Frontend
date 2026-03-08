import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SpoilageStackParamList } from "../../navigation/SpoilageNavigator";

import {
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";

import { predictAll, getSimSample } from "../../api/SpoilageApi";
import { SPOILAGE_BASE_URL } from "../../utils/constants";

const PRIMARY = "#003B8F";

function formatLocalDateTime(iso: string) {
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

type Mode = "Camera" | "Gallery";
type Props = NativeStackScreenProps<SpoilageStackParamList, "SpoilageScan">;

const stripSim = (id: string) => (id ? id.replace(/^SIM-/i, "") : id);

type SimLock = {
  plantId: string;
  imageUrl: string;
  temperature: number;
  humidity: number;
  capturedAt: string;
  sourceImageName?: string | null;
};

async function ensureLocalUri(uri: string) {
  if (uri.startsWith("file://")) return uri;

  const filename = `sim_${Date.now()}.jpg`;
  const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!baseDir) throw new Error("No cache/document directory available");

  const localPath = baseDir + filename;
  await FileSystem.downloadAsync(uri, localPath);
  return localPath;
}

function getFriendlyPredictionError(detail: any) {
  if (!detail) {
    return "Could not verify the image. Please capture one clear top-view photo of a single lettuce plant.";
  }

  if (typeof detail === "string") {
    const msg = detail.toLowerCase();

    if (
      msg.includes("not recognized as lettuce") ||
      msg.includes("object not recognized as lettuce") ||
      msg.includes("one lettuce plant only")
    ) {
      return "Wrong object detected. Capture only one lettuce plant from the top view, with less background.";
    }

    if (msg.includes("prediction is uncertain") || msg.includes("uncertain")) {
      return "The image is unclear for prediction. Try better lighting, closer framing, and a clear top-view lettuce image.";
    }

    if (msg.includes("too dark")) {
      return "The image is too dark. Capture the lettuce in better lighting.";
    }

    if (msg.includes("too bright")) {
      return "The image is too bright. Avoid strong glare and capture again.";
    }

    if (
      msg.includes("invalid image") ||
      msg.includes("top-view lettuce")
    ) {
      return "Invalid image. Please capture a clear top-view photo of one lettuce plant only.";
    }

    return detail;
  }

  return "Could not verify the image. Please capture one clear top-view photo of a single lettuce plant.";
}

export default function SpoilageScanScreen({ navigation, route }: Props) {
  const [mode, setMode] = useState<Mode>("Camera");

  const rawLockedPlantId = route.params?.plantId?.trim();
  const initialDemoMode = route.params?.demoMode ?? false;

  const isLockedSimStream =
    !!rawLockedPlantId && rawLockedPlantId.toUpperCase().startsWith("SIM-");

  const effectiveDemoMode = isLockedSimStream ? true : initialDemoMode;

  const lockedPlantId = rawLockedPlantId
    ? stripSim(rawLockedPlantId)
    : undefined;

  const isPlantLocked = !!lockedPlantId;

  const cameraRef = useRef<React.ElementRef<typeof CameraView> | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const camGranted = permission?.granted ?? false;
  const camChecked = permission != null;

  const [facing, setFacing] = useState<"back" | "front">("back");
  const [torchOn, setTorchOn] = useState(false);

  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedAt, setCapturedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [temperature, setTemperature] = useState<number>(6.5);
  const [humidity, setHumidity] = useState<number>(91.0);

  const [plantId, setPlantId] = useState<string>(lockedPlantId ?? "P-001");
  const [simLock, setSimLock] = useState<SimLock | null>(null);

  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    if (lockedPlantId) setPlantId(lockedPlantId);
  }, [lockedPlantId]);

  const tempText = `${temperature.toFixed(1)}°C`;
  const rhText = `${humidity.toFixed(0)}%`;

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission, requestPermission]);

  const pickFromGallery = async () => {
    try {
      setScanError(null);

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission", "Please allow gallery access.");
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!res.canceled) {
        setCapturedUri(res.assets[0].uri);
        setCapturedAt(new Date().toISOString());
        setSimLock(null);
      }
    } catch (e) {
      console.log("Gallery error:", e);
      Alert.alert("Error", "Could not open gallery.");
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      setBusy(true);
      setScanError(null);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: true,
      });

      if (photo?.uri) {
        setCapturedUri(photo.uri);
        setCapturedAt(new Date().toISOString());
        setSimLock(null);
      }
    } catch (e) {
      console.log("Camera error:", e);
      Alert.alert("Camera", "Failed to capture photo.");
    } finally {
      setBusy(false);
    }
  };

  const retake = () => {
    setCapturedUri(null);
    setCapturedAt(null);
    setSimLock(null);
    setScanError(null);
  };

  const onUseLastSensor = async () => {
    try {
      setBusy(true);

      const pidForSimRequest = (rawLockedPlantId ?? plantId)?.trim() || "";
      const pidForDisplay = stripSim(pidForSimRequest);

      if (!pidForDisplay) {
        Alert.alert("Missing", "Enter Plant ID (ex: P-001).");
        return;
      }

      const effectiveNowIso = new Date().toISOString();

      const sample = await getSimSample({
        plant_id: pidForSimRequest,
        mode: "time",
        now_iso: effectiveNowIso,
      });

      if (!simLock) {
        setTemperature(Number(sample.temperature));
        setHumidity(Number(sample.humidity));
      }

      if (!isPlantLocked && sample.plant_id) {
        setPlantId(stripSim(sample.plant_id));
      }

      Alert.alert(
        "Sensor Updated",
        `Plant ${stripSim(sample.plant_id ?? pidForDisplay ?? "-")} • Temp ${Number(
          sample.temperature
        ).toFixed(1)}°C • RH ${Number(sample.humidity).toFixed(0)}%`
      );
    } catch (e: any) {
      console.log("Sim sample error:", e?.message, e?.response?.data);
      Alert.alert("Error", "Failed to load simulated sensor sample");
    } finally {
      setBusy(false);
    }
  };

  const onSimulateCamera = async () => {
    try {
      setBusy(true);
      setScanError(null);

      const pidForSimRequest = (rawLockedPlantId ?? plantId)?.trim() || "";
      const pidForDisplay = stripSim(pidForSimRequest);

      if (!pidForDisplay) {
        Alert.alert("Missing", "Enter Plant ID (ex: P-001).");
        return;
      }

      const effectiveNowIso = new Date().toISOString();

      const sample = await getSimSample({
        plant_id: pidForSimRequest,
        mode: "time",
        now_iso: effectiveNowIso,
      });

      if (!sample.image_url) {
        Alert.alert(
          "No Image",
          "No matching image found in backend sim_images folder."
        );
        return;
      }

      const fullUrl = `${SPOILAGE_BASE_URL}${sample.image_url}`;
      const t = Number(sample.temperature);
      const h = Number(sample.humidity);
      const simCapturedAt = effectiveNowIso;

      setCapturedUri(fullUrl);
      setCapturedAt(simCapturedAt);
      setTemperature(t);
      setHumidity(h);

      setSimLock({
        plantId: pidForDisplay,
        imageUrl: fullUrl,
        temperature: t,
        humidity: h,
        capturedAt: simCapturedAt,
        sourceImageName: sample.image_name ?? null,
      });

      Alert.alert(
        "Simulated Camera",
        `Plant: ${pidForDisplay}
Time: ${formatLocalDateTime(simCapturedAt)}
CSV Label: ${sample.label}
Image: ${sample.image_name ?? "none"}`
      );
    } catch (e: any) {
      console.log("Simulate error:", e?.message, e?.response?.data);
      Alert.alert("Error", "Failed to simulate camera from dataset images");
    } finally {
      setBusy(false);
    }
  };

  const startAnalysis = async () => {
    if (!capturedUri) {
      Alert.alert("Missing", "Capture / upload / simulate an image first.");
      return;
    }

    const pidClean = stripSim((lockedPlantId ?? plantId)?.trim() || "");

    if (!pidClean) {
      Alert.alert("Missing", "Enter Plant ID (ex: P-001).");
      return;
    }

    try {
      setBusy(true);
      setScanError(null);

      if (simLock && capturedUri === simLock.imageUrl) {
        setTemperature(simLock.temperature);
        setHumidity(simLock.humidity);
      }

      const localUri = await ensureLocalUri(capturedUri);

      const isSim = !!simLock && capturedUri === simLock.imageUrl;
      const pidToSave =
        isSim || isLockedSimStream ? `SIM-${pidClean}` : pidClean;

      const usedTemp = isSim ? simLock!.temperature : temperature;
      const usedHumidity = isSim ? simLock!.humidity : humidity;

      const usedCapturedAt = isSim
        ? new Date().toISOString()
        : capturedAt ?? new Date().toISOString();

      const result = await predictAll({
        imageUri: localUri,
        temperature: usedTemp,
        humidity: usedHumidity,
        plant_id: pidToSave,
        captured_at: usedCapturedAt,
        sim_source_image: isSim ? simLock?.sourceImageName ?? undefined : undefined,
      });

      setCapturedUri(null);
      setCapturedAt(null);
      setSimLock(null);
      setScanError(null);

      navigation.replace("SpoilageConfirm", {
        imageUri: localUri,
        result,
        temperature: usedTemp,
        humidity: usedHumidity,
        plantId: pidClean,
        isSim: isSim || isLockedSimStream,
      });
    } catch (e: any) {
      console.log("Predict error:", e?.message, e?.response?.data);

      const detail = e?.response?.data?.detail;
      const friendly = getFriendlyPredictionError(detail);

      setScanError(friendly);
    } finally {
      setBusy(false);
    }
  };

  const canStart = !!capturedUri && !busy;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      >
        {/* Header */}
        <View className="pt-3 pb-3 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
            className="w-10 h-10 items-center justify-center rounded-full bg-white"
            style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
          >
            <Ionicons name="chevron-back" size={20} color="#111827" />
          </TouchableOpacity>

          <Text className="text-[16px] font-extrabold text-gray-900">
            {effectiveDemoMode ? "Scan (Demo)" : "Spoilage Scan"}
          </Text>

          <View className="w-10 h-10" />
        </View>

        {/* Mode Selector */}
        <View className="mt-4 bg-white rounded-[18px] p-4 shadow-sm">
          <Text className="text-[14px] font-extrabold text-gray-900">
            Capture Method
          </Text>
          <Text className="text-[11px] text-gray-500 mt-1">
            Choose how to capture your plant image
          </Text>

          <View className="mt-4 bg-[#F4F7FB] rounded-full p-1 flex-row">
            <Segment
              label="Camera"
              active={mode === "Camera"}
              onPress={() => setMode("Camera")}
            />
            <Segment
              label="Gallery"
              active={mode === "Gallery"}
              onPress={() => setMode("Gallery")}
            />
          </View>
        </View>

        {/* Plant ID Input */}
        {isPlantLocked ? (
          <View className="mt-4 bg-white rounded-[18px] px-4 py-4 shadow-sm">
            <Text className="text-[11px] font-extrabold text-gray-400 tracking-wider mb-3">
              PLANT ID
            </Text>
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-[#EAF4FF] items-center justify-center mr-3">
                <Ionicons name="leaf-outline" size={18} color={PRIMARY} />
              </View>
              <View>
                <Text className="text-[15px] font-extrabold text-gray-900">
                  {lockedPlantId}
                  {isLockedSimStream ? " (Sim)" : ""}
                </Text>
                <Text className="text-[10px] text-gray-500 mt-0.5">
                  Selected from plant list
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="mt-4 bg-white rounded-[18px] px-4 py-4 shadow-sm">
            <Text className="text-[11px] font-extrabold text-gray-400 tracking-wider mb-2">
              PLANT ID
            </Text>
            <TextInput
              value={plantId}
              onChangeText={(t) => setPlantId(stripSim(t))}
              placeholder="P-001"
              autoCapitalize="characters"
              className="text-[15px] font-extrabold text-gray-900 py-2"
              placeholderTextColor="#9CA3AF"
            />
            <Text className="text-[10px] text-gray-500 mt-1">
              Example: P-001, P-007
            </Text>
          </View>
        )}

        {/* Error Message */}
        {scanError ? (
          <View
            className="mt-4 rounded-[18px] px-4 py-4"
            style={{
              backgroundColor: "#FEF2F2",
              borderWidth: 1,
              borderColor: "#FCA5A5",
            }}
          >
            <View className="flex-row items-start">
              <Ionicons name="warning" size={18} color="#DC2626" />
              <View className="ml-3 flex-1">
                <Text className="text-[13px] font-extrabold text-red-700">
                  Invalid Capture
                </Text>
                <Text className="text-[11px] text-red-600 mt-1 leading-[16px]">
                  {scanError}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {mode === "Camera" ? (
          <>
            {/* Camera View */}
            <View className="mt-4 rounded-[18px] overflow-hidden bg-white shadow-sm">
              <View style={{ height: 420 }} className="bg-black">
                {capturedUri ? (
                  <View className="flex-1">
                    <Image
                      source={{ uri: capturedUri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                    <View className="absolute top-3 right-3">
                      <TouchableOpacity
                        onPress={retake}
                        activeOpacity={0.9}
                        className="bg-white/95 px-4 py-2 rounded-full flex-row items-center"
                      >
                        <Ionicons name="refresh" size={16} color="#111827" />
                        <Text className="ml-2 font-extrabold text-[11px] text-gray-900">
                          Retake
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : !camChecked ? (
                  <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#fff" />
                    <Text className="text-white mt-2 text-[12px] font-semibold">
                      Checking camera...
                    </Text>
                  </View>
                ) : !camGranted ? (
                  <View className="flex-1 items-center justify-center px-6">
                    <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center mb-3">
                      <Ionicons name="camera-outline" size={24} color="#fff" />
                    </View>
                    <Text className="text-white text-center font-extrabold">
                      Camera Permission Required
                    </Text>
                    <Text className="text-white/70 text-center text-[12px] mt-2">
                      Allow camera access to capture plant images
                    </Text>
                    <TouchableOpacity
                      className="mt-4 bg-white px-5 py-3 rounded-full"
                      onPress={requestPermission}
                      activeOpacity={0.9}
                    >
                      <Text className="font-extrabold text-[12px] text-gray-900">
                        Allow Camera
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="flex-1">
                    <CameraView
                      ref={cameraRef}
                      style={{ flex: 1 }}
                      facing={facing}
                      enableTorch={torchOn}
                    />

                    {/* Top Overlay */}
                    <View className="absolute top-0 left-0 right-0 p-4 flex-row items-center justify-between">
                      <View className="px-3 py-1.5 rounded-full bg-black/70">
                        <Text className="text-[10px] font-extrabold text-white">
                          ● LIVE
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <View className="flex-row items-center px-3 py-1.5 rounded-full bg-black/70 mr-2">
                          <Ionicons name="thermometer-outline" size={12} color="#fff" />
                          <Text className="ml-1.5 text-[10px] font-bold text-white">
                            {tempText}
                          </Text>
                        </View>
                        <View className="flex-row items-center px-3 py-1.5 rounded-full bg-black/70">
                          <Ionicons name="water-outline" size={12} color="#fff" />
                          <Text className="ml-1.5 text-[10px] font-bold text-white">
                            {rhText}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Camera Controls */}
                    <View className="absolute bottom-20 left-0 right-0 flex-row justify-center px-4">
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setTorchOn((prev) => !prev)}
                        className="w-11 h-11 rounded-full bg-black/60 items-center justify-center mr-3"
                      >
                        <Ionicons
                          name={torchOn ? "flash" : "flash-off"}
                          size={18}
                          color="#fff"
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() =>
                          setFacing((prev) => (prev === "back" ? "front" : "back"))
                        }
                        className="w-11 h-11 rounded-full bg-black/60 items-center justify-center"
                      >
                        <Ionicons
                          name="camera-reverse-outline"
                          size={18}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Capture Button */}
                    <View className="absolute bottom-5 left-0 right-0 items-center">
                      <TouchableOpacity
                        onPress={takePhoto}
                        activeOpacity={0.9}
                        disabled={busy}
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 36,
                          backgroundColor: "#fff",
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 5,
                          borderColor: "#D1D5DB",
                          opacity: busy ? 0.6 : 1,
                        }}
                      >
                        {busy ? (
                          <ActivityIndicator color={PRIMARY} />
                        ) : (
                          <View
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: 26,
                              backgroundColor: PRIMARY,
                            }}
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View className="mt-3 flex-row justify-between">
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={onUseLastSensor}
                disabled={busy}
                className="bg-white rounded-[14px] px-4 py-3 flex-row items-center justify-center w-[48%]"
                style={{ opacity: busy ? 0.6 : 1 }}
              >
                <Ionicons name="pulse-outline" size={16} color={PRIMARY} />
                <Text className="ml-2 text-[11px] font-extrabold text-gray-900">
                  Use Sensor
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setMode("Gallery")}
                className="bg-white rounded-[14px] px-4 py-3 flex-row items-center justify-center w-[48%]"
              >
                <Ionicons name="images-outline" size={16} color="#111827" />
                <Text className="ml-2 text-[11px] font-extrabold text-gray-900">
                  Gallery
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onSimulateCamera}
              disabled={busy}
              className="mt-3 bg-white rounded-[16px] px-5 py-4 flex-row items-center justify-center"
              style={{ opacity: busy ? 0.6 : 1 }}
            >
              <Ionicons name="camera-outline" size={16} color={PRIMARY} />
              <Text className="ml-2 text-[12px] font-extrabold text-gray-900">
                Simulate Camera (Dataset)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={startAnalysis}
              disabled={!canStart}
              className="mt-4 rounded-[16px] items-center justify-center py-4"
              style={{
                backgroundColor: PRIMARY,
                opacity: canStart ? 1 : 0.5,
              }}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="play-circle-outline" size={18} color="#fff" />
                  <Text className="ml-2 text-[12px] font-extrabold text-white">
                    Start Analysis
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Gallery Mode */}
            <View className="mt-4 bg-white rounded-[18px] p-5 shadow-sm">
              <Text className="text-[18px] font-extrabold text-gray-900">
                Analyze Plant
              </Text>
              <Text className="text-[11px] text-gray-500 mt-2 leading-[16px]">
                Upload a top-view image or use simulated dataset image
              </Text>

              <View
                className="mt-4 rounded-[16px] items-center justify-center overflow-hidden"
                style={{
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: "#B6C8F0",
                  height: 200,
                  backgroundColor: "#F8FAFC",
                }}
              >
                {capturedUri ? (
                  <Image
                    source={{ uri: capturedUri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <>
                    <View className="w-14 h-14 rounded-full bg-[#EAF4FF] items-center justify-center mb-3">
                      <Ionicons
                        name="cloud-upload-outline"
                        size={24}
                        color={PRIMARY}
                      />
                    </View>
                    <Text className="text-[13px] font-extrabold text-gray-900">
                      Upload Image
                    </Text>
                    <Text className="text-[11px] text-gray-500 mt-1">
                      Top-view plant photo
                    </Text>
                  </>
                )}
              </View>

              {capturedUri && (
                <TouchableOpacity
                  onPress={retake}
                  activeOpacity={0.9}
                  className="mt-3 bg-gray-50 rounded-[14px] py-3 flex-row items-center justify-center"
                >
                  <Ionicons name="refresh" size={16} color="#111827" />
                  <Text className="ml-2 text-[11px] font-extrabold text-gray-900">
                    Change Image
                  </Text>
                </TouchableOpacity>
              )}

              <View className="mt-4 flex-row justify-between">
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={pickFromGallery}
                  className="bg-white rounded-[14px] px-4 py-3 flex-row items-center justify-center w-[48%]"
                  style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
                >
                  <Ionicons name="images-outline" size={16} color="#111827" />
                  <Text className="ml-2 font-extrabold text-gray-900 text-[11px]">
                    Upload
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={onSimulateCamera}
                  className="bg-white rounded-[14px] px-4 py-3 flex-row items-center justify-center w-[48%]"
                  style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
                >
                  <Ionicons name="camera-outline" size={16} color={PRIMARY} />
                  <Text className="ml-2 font-extrabold text-gray-900 text-[11px]">
                    Simulate
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={onUseLastSensor}
                disabled={busy}
                className="mt-3 bg-white rounded-[16px] px-5 py-4 flex-row items-center justify-center"
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  opacity: busy ? 0.6 : 1,
                }}
              >
                <Ionicons name="pulse-outline" size={16} color={PRIMARY} />
                <Text className="ml-2 text-[11px] font-extrabold text-gray-900">
                  Use Last Sensor ({tempText}, {rhText})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={startAnalysis}
                disabled={!canStart}
                className="mt-4 rounded-[16px] items-center justify-center py-4"
                style={{
                  backgroundColor: PRIMARY,
                  opacity: canStart ? 1 : 0.5,
                }}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="play-circle-outline" size={18} color="#fff" />
                    <Text className="ml-2 text-[12px] font-extrabold text-white">
                      Start Analysis
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* Components */

function Segment({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className={`flex-1 py-3 rounded-full items-center justify-center ${
        active ? "bg-white" : "bg-transparent"
      }`}
      style={{
        shadowColor: active ? "#000" : "transparent",
        shadowOpacity: active ? 0.06 : 0,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: active ? 2 : 0,
      }}
    >
      <Text
        className={`text-[12px] font-extrabold ${
          active ? "text-gray-900" : "text-gray-400"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}