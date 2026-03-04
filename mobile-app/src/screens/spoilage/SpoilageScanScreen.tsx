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
  type CameraViewRef,
  useCameraPermissions,
} from "expo-camera";
import * as ImagePicker from "expo-image-picker";

import * as FileSystem from "expo-file-system/legacy";

import { predictAll, getSimSample } from "../../api/SpoilageApi";
import { SPOILAGE_BASE_URL } from "../../utils/constants";

const PRIMARY = "#0046AD";

type Mode = "Camera" | "Gallery";
type Props = NativeStackScreenProps<SpoilageStackParamList, "SpoilageScan">;

async function ensureLocalUri(uri: string) {
  if (uri.startsWith("file://")) return uri;

  const filename = `sim_${Date.now()}.jpg`;
  const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!baseDir) throw new Error("No cache/document directory available");

  const localPath = baseDir + filename;
  await FileSystem.downloadAsync(uri, localPath);
  return localPath;
}

export default function SpoilageScanScreen({ navigation, route }: Props) {
  const [mode, setMode] = useState<Mode>("Camera");

  // ✅ plantId from previous screen (locked flow)
  const lockedPlantId = route.params?.plantId?.trim();
  const isPlantLocked = !!lockedPlantId;

  // camera
  const cameraRef = useRef<CameraViewRef | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const camGranted = permission?.granted ?? false;
  const camChecked = permission != null;

  const [facing, setFacing] = useState<"back" | "front">("back");
  const [torchOn, setTorchOn] = useState(false);

  // shared
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // sensor state (from backend csv)
  const [temperature, setTemperature] = useState<number>(6.5);
  const [humidity, setHumidity] = useState<number>(91.0);

  // plant id (locked when passed)
  const [plantId, setPlantId] = useState<string>(lockedPlantId ?? "P-001");

  useEffect(() => {
    if (lockedPlantId) setPlantId(lockedPlantId);
  }, [lockedPlantId]);

  const tempText = `${temperature.toFixed(1)}°C`;
  const rhText = `${humidity.toFixed(0)}% RH`;

  useEffect(() => {
    if (!permission) requestPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission", "Please allow gallery access.");
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!res.canceled) setCapturedUri(res.assets[0].uri);
    } catch (e) {
      console.log("Gallery error:", e);
      Alert.alert("Error", "Could not open gallery.");
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      setBusy(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: true,
      });
      if (photo?.uri) setCapturedUri(photo.uri);
    } catch (e) {
      console.log("Camera error:", e);
      Alert.alert("Camera", "Failed to capture photo.");
    } finally {
      setBusy(false);
    }
  };

  const retake = () => setCapturedUri(null);

  // ✅ real csv sensor sample
  const onUseLastSensor = async () => {
    try {
      setBusy(true);

      const pid = (lockedPlantId ?? plantId)?.trim();
      const sample = await getSimSample({ plant_id: pid ? pid : undefined, mode: "next" } as any);

      setTemperature(Number(sample.temperature));
      setHumidity(Number(sample.humidity));

      // ✅ do not overwrite if locked
      if (!isPlantLocked && sample.plant_id) setPlantId(sample.plant_id);

      Alert.alert(
        "Sensor Updated",
        `Plant ${sample.plant_id ?? pid ?? "-"} • Temp ${Number(sample.temperature).toFixed(
          1
        )}°C • RH ${Number(sample.humidity).toFixed(0)}%`
      );
    } catch (e: any) {
      console.log("Sim sample error:", e?.message, e?.response?.data);
      Alert.alert("Error", "Failed to load simulated sensor sample");
    } finally {
      setBusy(false);
    }
  };

  // ✅ Simulate Camera = sample row + use matching backend image
  const onSimulateCamera = async () => {
    try {
      setBusy(true);

      const pid = (lockedPlantId ?? plantId)?.trim();
      const sample = await getSimSample({ plant_id: pid ? pid : undefined });

      setTemperature(Number(sample.temperature));
      setHumidity(Number(sample.humidity));

      // ✅ do not overwrite if locked
      if (!isPlantLocked && sample.plant_id) setPlantId(sample.plant_id);

      if (!sample.image_url) {
        Alert.alert(
          "No Image",
          "No matching image found in backend sim_images folder."
        );
        return;
      }

      const fullUrl = `${SPOILAGE_BASE_URL}${sample.image_url}`;
      setCapturedUri(fullUrl);

      Alert.alert(
        "Simulated Camera",
        `Loaded ${sample.image_name ?? "image"} (Plant ${sample.plant_id ?? pid ?? "-"})`
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

    const pid = (lockedPlantId ?? plantId)?.trim();
    if (!pid) {
      Alert.alert("Missing", "Enter Plant ID (ex: P-001).");
      return;
    }

    try {
      setBusy(true);

      const localUri = await ensureLocalUri(capturedUri);

      const result = await predictAll({
        imageUri: localUri,
        temperature,
        humidity,
        plant_id: pid,
      });

      navigation.navigate("SpoilageConfirm", {
        imageUri: localUri,
        result,
        temperature,
        humidity,
        plantId: pid,
      } as any);
    } catch (e: any) {
      console.log("Predict error:", e?.message, e?.response?.data);
      Alert.alert("Error", e?.response?.data?.detail || "Prediction failed");
    } finally {
      setBusy(false);
    }
  };

  const canStart = !!capturedUri && !busy;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 18 }}
      >
        {/* Header */}
        <View className="pt-3 pb-2 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="close" size={22} color="#111827" />
          </TouchableOpacity>

          <Text className="text-[16px] font-extrabold text-gray-900">
            Scan Spoilage
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            className="w-7 h-7 rounded-full bg-white items-center justify-center"
            style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
            onPress={() => {}}
          >
            <Ionicons name="help" size={16} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Segmented Tabs */}
        <View className="mt-2 bg-white rounded-full p-1 flex-row">
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

        {/* ✅ Plant ID (locked/hide input) */}
        {isPlantLocked ? (
          <View
            className="mt-4 bg-white rounded-[16px] px-4 py-3 shadow-sm"
            style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
          >
            <Text className="text-[12px] font-extrabold text-gray-700">Plant ID</Text>
            <Text className="mt-2 text-[14px] font-extrabold text-gray-900">
              {lockedPlantId}
            </Text>
            <Text className="text-[11px] text-gray-500 mt-1">
              Selected from plant list
            </Text>
          </View>
        ) : (
          <View
            className="mt-4 bg-white rounded-[16px] px-4 py-3 shadow-sm"
            style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
          >
            <Text className="text-[12px] font-extrabold text-gray-700">Plant ID</Text>
            <TextInput
              value={plantId}
              onChangeText={setPlantId}
              placeholder="P-001"
              autoCapitalize="characters"
              className="mt-2 text-[14px] font-bold text-gray-900"
            />
            <Text className="text-[11px] text-gray-500 mt-1">
              Example: P-001, P-007
            </Text>
          </View>
        )}

        {/* CAMERA MODE */}
        {mode === "Camera" ? (
          <>
            <View className="mt-4 rounded-[22px] overflow-hidden bg-white shadow-sm">
              <View style={{ height: 470 }} className="bg-black">
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
                        style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
                      >
                        <Ionicons name="refresh" size={16} color="#111827" />
                        <Text className="ml-2 font-extrabold text-[12px] text-gray-900">
                          Retake
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : !camChecked ? (
                  <View className="flex-1 items-center justify-center">
                    <ActivityIndicator />
                    <Text className="text-white mt-2 font-bold">
                      Checking camera permission...
                    </Text>
                  </View>
                ) : !camGranted ? (
                  <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-white text-center font-extrabold">
                      Camera permission denied
                    </Text>
                    <Text className="text-white/70 text-center mt-2">
                      Tap below to allow camera access.
                    </Text>

                    <TouchableOpacity
                      className="mt-4 bg-white px-4 py-2 rounded-full"
                      onPress={requestPermission}
                      activeOpacity={0.9}
                    >
                      <Text className="font-extrabold text-gray-900">
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

                    <View className="absolute top-0 left-0 right-0 p-4 flex-row items-center justify-between">
                      <View className="px-3 py-1 rounded-full bg-[#111827]/80">
                        <Text className="text-[11px] font-bold text-white">
                          ● LIVE VIEW
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <OverlayChip icon="thermometer-outline" text={tempText} />
                        <View className="w-2" />
                        <OverlayChip icon="water-outline" text={rhText} />
                      </View>
                    </View>

                    <View className="absolute bottom-3 left-0 right-0 px-4">
                      <View className="bg-[#0B1220]/70 rounded-[18px] px-4 py-3">
                        <Text className="text-[12px] font-extrabold text-white">
                          CAPTURE GUIDANCE
                        </Text>
                        <Text className="text-[12px] text-white/80 mt-1 leading-4">
                          Top-down photo, full lettuce butt/center visible, good light
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Control strip */}
            <View className="mt-4 bg-white rounded-[22px] px-6 py-4 shadow-sm flex-row items-center justify-between">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setTorchOn((p) => !p)}
                className="w-12 h-12 rounded-full bg-[#F3F4F6] items-center justify-center"
              >
                <Ionicons
                  name={torchOn ? "flash-outline" : "flash-off-outline"}
                  size={18}
                  color="#111827"
                />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={takePhoto}
                disabled={busy || !camGranted}
              >
                <View
                  className="w-[74px] h-[74px] rounded-full bg-white items-center justify-center"
                  style={{
                    opacity: busy || !camGranted ? 0.5 : 1,
                    borderWidth: 2,
                    borderColor: "#CBD5E1",
                  }}
                >
                  <View
                    className="w-[62px] h-[62px] rounded-full"
                    style={{ borderWidth: 4, borderColor: "#0B1220" }}
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  setFacing((p) => (p === "back" ? "front" : "back"))
                }
                className="w-12 h-12 rounded-full bg-[#F3F4F6] items-center justify-center"
              >
                <Ionicons name="camera-reverse-outline" size={18} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Buttons */}
            <View className="mt-3 flex-row justify-between">
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={onUseLastSensor}
                disabled={busy}
                className="bg-white rounded-full px-5 py-3 flex-row items-center justify-center shadow-sm"
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  width: "48%",
                  opacity: busy ? 0.6 : 1,
                }}
              >
                <Ionicons name="pulse-outline" size={16} color={PRIMARY} />
                <Text className="ml-2 text-[12.5px] font-extrabold text-gray-900">
                  Use Last Sensor
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setMode("Gallery")}
                className="bg-white rounded-full px-5 py-3 flex-row items-center justify-center shadow-sm"
                style={{ borderWidth: 1, borderColor: "#E5E7EB", width: "48%" }}
              >
                <Ionicons name="images-outline" size={16} color="#111827" />
                <Text className="ml-2 text-[12.5px] font-extrabold text-gray-900">
                  Gallery
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onSimulateCamera}
              disabled={busy}
              className="mt-3 bg-white rounded-full px-5 py-3 flex-row items-center justify-center shadow-sm"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                opacity: busy ? 0.6 : 1,
              }}
            >
              <Ionicons name="camera-outline" size={16} color={PRIMARY} />
              <Text className="ml-2 text-[12.5px] font-extrabold text-gray-900">
                Simulate Camera (Dataset Image)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={startAnalysis}
              disabled={!canStart}
              className="mt-4 rounded-[14px] items-center justify-center"
              style={{
                backgroundColor: PRIMARY,
                height: 56,
                opacity: canStart ? 1 : 0.45,
                shadowColor: "#000",
                shadowOpacity: Platform.OS === "android" ? 0.14 : 0.12,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
                elevation: 3,
              }}
            >
              <View className="flex-row items-center">
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="play" size={18} color="#fff" />
                    <Text className="ml-2 text-[14px] font-extrabold text-white">
                      Start Analysis
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* GALLERY MODE */}
            <View className="mt-4 bg-white rounded-[20px] p-4 shadow-sm">
              <Text className="text-[24px] font-extrabold text-gray-900">
                Analyze Plant
              </Text>
              <Text className="text-[12px] text-gray-500 mt-2 leading-4">
                Upload a top-view leaf photo or simulate the camera using dataset images.
              </Text>

              <View
                className="mt-4 rounded-[18px] items-center justify-center bg-[#F8FAFC]"
                style={{
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: "#7AA7E6",
                  height: 190,
                  overflow: "hidden",
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
                    <View className="w-14 h-14 rounded-full bg-[#EAF4FF] items-center justify-center">
                      <Ionicons name="arrow-up" size={22} color={PRIMARY} />
                    </View>
                    <Text className="mt-3 font-extrabold text-gray-900">
                      Drop / Click to upload
                    </Text>
                    <Text className="text-[12px] text-gray-500 mt-1">
                      Top-view leaf image
                    </Text>
                  </>
                )}
              </View>

              <View className="mt-4 flex-row justify-between">
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={pickFromGallery}
                  className="bg-white rounded-[12px] px-4 py-3 flex-row items-center justify-center"
                  style={{ borderWidth: 1, borderColor: "#CBD5E1", width: "48%" }}
                >
                  <Ionicons name="search-outline" size={18} color="#111827" />
                  <Text className="ml-2 font-extrabold text-gray-900 text-[12px]">
                    Upload Photo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={onSimulateCamera}
                  className="bg-white rounded-[12px] px-4 py-3 flex-row items-center justify-center"
                  style={{ borderWidth: 1, borderColor: "#CBD5E1", width: "48%" }}
                >
                  <Ionicons name="camera-outline" size={18} color={PRIMARY} />
                  <Text className="ml-2 font-extrabold text-gray-900 text-[12px]">
                    Simulate Camera
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={onUseLastSensor}
                disabled={busy}
                className="mt-3 bg-white rounded-full px-5 py-3 flex-row items-center justify-center shadow-sm"
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  opacity: busy ? 0.6 : 1,
                }}
              >
                <Ionicons name="pulse-outline" size={16} color={PRIMARY} />
                <Text className="ml-2 text-[12.5px] font-extrabold text-gray-900">
                  Use Last Sensor (Temp {tempText}, RH {rhText})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={startAnalysis}
                disabled={!canStart}
                className="mt-4 rounded-[12px] items-center justify-center"
                style={{ backgroundColor: PRIMARY, height: 52, opacity: canStart ? 1 : 0.5 }}
              >
                <View className="flex-row items-center">
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="play" size={18} color="#fff" />
                      <Text className="ml-2 text-[14px] font-extrabold text-white">
                        Start Analysis
                      </Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <View className="mt-4 bg-white rounded-[18px] p-4 shadow-sm">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-[#EAF4FF] items-center justify-center">
                  <Ionicons name="information" size={16} color={PRIMARY} />
                </View>
                <Text className="ml-2 font-extrabold text-gray-900">QUICK TIPS</Text>
              </View>

              <TipRow
                icon="ellipse-outline"
                iconBg="#EAF4FF"
                title="Use a clear image"
                desc="Keep focus and avoid motion blur."
              />
              <TipRow
                icon="remove-outline"
                iconBg="#FFF2E6"
                title="Top-down view"
                desc="Capture directly above the plant/leaf."
              />
              <TipRow
                icon="square-outline"
                iconBg="#EEF2FF"
                title="One plant at a time"
                desc="Keep only one leaf/plant in frame."
              />
            </View>
          </>
        )}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- small components ---------- */

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
      className={`flex-1 py-2 rounded-full items-center justify-center ${
        active ? "bg-white" : "bg-transparent"
      }`}
      style={{
        shadowColor: active ? "#000" : "transparent",
        shadowOpacity: active ? 0.06 : 0,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: active ? 2 : 0,
      }}
    >
      <Text
        className={`text-[12.5px] font-extrabold ${
          active ? "text-gray-900" : "text-gray-400"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function OverlayChip({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View className="flex-row items-center px-3 py-1 rounded-full bg-[#111827]/80">
      <Ionicons name={icon} size={14} color="#fff" />
      <Text className="ml-1.5 text-[11px] font-bold text-white">{text}</Text>
    </View>
  );
}

function TipRow({
  icon,
  iconBg,
  title,
  desc,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  title: string;
  desc: string;
}) {
  return (
    <View className="mt-3 bg-[#F8FAFC] rounded-[14px] px-4 py-3 flex-row">
      <View
        className="w-9 h-9 rounded-[10px] items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        <Ionicons name={icon} size={16} color="#111827" />
      </View>

      <View className="ml-3 flex-1">
        <Text className="font-extrabold text-gray-900">{title}</Text>
        <Text className="text-[12px] text-gray-600 mt-1">{desc}</Text>
      </View>
    </View>
  );
}