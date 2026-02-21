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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";

import { CameraView, type CameraViewRef, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

const PRIMARY = "#0046AD";

type Mode = "Camera" | "Gallery";
type Props = NativeStackScreenProps<RootStackParamList, "SpoilageScan">;

export default function SpoilageScanScreen({ navigation }: Props) {
  const [mode, setMode] = useState<Mode>("Camera");

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

  const tempText = "26°C";
  const rhText = "88% RH";

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

  const startAnalysis = async () => {
    if (!capturedUri) {
      Alert.alert("Missing", "Upload an image first.");
      return;
    }
    Alert.alert("Start Analysis", "Next: send image to backend + show results.");
  };

  const canStart = !!capturedUri;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 18 }}
      >
        {/* Header (matches your target for Gallery) */}
        <View className="pt-3 pb-2 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Text className="text-[16px] font-extrabold text-gray-900">
            {mode === "Gallery" ? "Gallery" : "Scan Spoilage"}
          </Text>

          <View className="flex-row items-center">
            {mode !== "Gallery" ? (
              <TouchableOpacity
                activeOpacity={0.85}
                className="w-7 h-7 rounded-full bg-white items-center justify-center"
                style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
                onPress={() => {}}
              >
                <Ionicons name="help" size={16} color="#64748B" />
              </TouchableOpacity>
            ) : (
              <View className="w-10 h-10" />
            )}
          </View>
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

        {/* CAMERA MODE (unchanged) */}
        {mode === "Camera" ? (
          <>
            <View className="mt-4 rounded-[22px] overflow-hidden bg-white shadow-sm">
              <View style={{ height: 520 }} className="bg-black">
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

            <View className="mt-4 flex-row items-center justify-between px-6">
              <CircleIcon
                icon={torchOn ? "flash-outline" : "flash-off-outline"}
                onPress={() => setTorchOn((p) => !p)}
              />
              <CaptureButton onPress={takePhoto} disabled={busy || !camGranted} />
              <CircleIcon
                icon="camera-reverse-outline"
                onPress={() => setFacing((p) => (p === "back" ? "front" : "back"))}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={startAnalysis}
              disabled={!canStart}
              className="mt-4 rounded-[12px] items-center justify-center"
              style={{
                backgroundColor: PRIMARY,
                height: 52,
                opacity: canStart ? 1 : 0.5,
              }}
            >
              <View className="flex-row items-center">
                <Ionicons name="play" size={18} color="#fff" />
                <Text className="ml-2 text-[14px] font-extrabold text-white">
                  Start Analysis
                </Text>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          /* ✅ GALLERY UI (matches your target) */
          <>
            <View className="mt-4 bg-white rounded-[20px] p-4 shadow-sm">
              <Text className="text-[24px] font-extrabold text-gray-900">
                Analyze Plant
              </Text>
              <Text className="text-[12px] text-gray-500 mt-2 leading-4">
                Upload a top-view leaf photo or connect the IP camera to run spoilage detection.
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

              {/* Buttons Row */}
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
                  onPress={() => Alert.alert("IP Cam", "Add IP cam flow later")}
                  className="bg-white rounded-[12px] px-4 py-3 flex-row items-center justify-center"
                  style={{ borderWidth: 1, borderColor: "#CBD5E1", width: "48%" }}
                >
                  <View className="w-4 h-4 rounded-full border border-[#2563EB] items-center justify-center">
                    <View className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                  </View>
                  <Text className="ml-2 font-extrabold text-gray-900 text-[12px]">
                    Connect IP Cam
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Start Analysis */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={startAnalysis}
                disabled={!canStart}
                className="mt-4 rounded-[12px] items-center justify-center"
                style={{
                  backgroundColor: PRIMARY,
                  height: 52,
                  opacity: canStart ? 1 : 0.5,
                }}
              >
                <View className="flex-row items-center">
                  <Ionicons name="play" size={18} color="#fff" />
                  <Text className="ml-2 text-[14px] font-extrabold text-white">
                    Start Analysis
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* QUICK TIPS */}
            <View className="mt-4 bg-white rounded-[18px] p-4 shadow-sm">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-[#EAF4FF] items-center justify-center">
                  <Ionicons name="information" size={16} color={PRIMARY} />
                </View>
                <Text className="ml-2 font-extrabold text-gray-900">
                  QUICK TIPS
                </Text>
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

function CircleIcon({
  icon,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="w-12 h-12 rounded-full bg-white items-center justify-center"
      style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
    >
      <Ionicons name={icon} size={18} color="#111827" />
    </TouchableOpacity>
  );
}

function CaptureButton({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} disabled={disabled}>
      <View
        className="w-[72px] h-[72px] rounded-full items-center justify-center bg-white"
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        <View
          className="w-[64px] h-[64px] rounded-full items-center justify-center"
          style={{ borderWidth: 3, borderColor: "#0B1220" }}
        >
          <View
            className="w-[52px] h-[52px] rounded-full"
            style={{ borderWidth: 2, borderColor: "#CBD5E1" }}
          />
        </View>
      </View>
    </TouchableOpacity>
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