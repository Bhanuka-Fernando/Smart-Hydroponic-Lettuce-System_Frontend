import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";

const PRIMARY = "#0046AD";

type Mode = "Camera" | "Gallery";
type Nav = NativeStackNavigationProp<RootStackParamList, "SpoilageScan">;

export default function SpoilageScanScreen() {
  const navigation = useNavigation<Nav>(); // ✅ inside component
  const [mode, setMode] = useState<Mode>("Camera");

  const previewUri = useMemo(
    () =>
      "https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&w=1200&q=60",
    []
  );

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

          <View className="flex-row items-center">
            <Text className="text-[16px] font-extrabold text-gray-900">
              Scan Spoilage
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              className="ml-2 w-7 h-7 rounded-full bg-white items-center justify-center"
              style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
              onPress={() => {}}
            >
              <Ionicons name="help" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View className="w-10 h-10" />
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

        {/* Live View */}
        <View className="mt-4 rounded-[22px] overflow-hidden bg-white shadow-sm">
          <ImageBackground
            source={{ uri: previewUri }}
            resizeMode="cover"
            style={{ height: 520 }}
          >
            <View className="p-4 flex-row items-center justify-between">
              <View className="px-3 py-1 rounded-full bg-[#111827]/80">
                <Text className="text-[11px] font-bold text-white">● LIVE VIEW</Text>
              </View>

              <View className="flex-row items-center space-x-2">
                <OverlayChip icon="thermometer-outline" text="26°C" />
                <OverlayChip icon="water-outline" text="88% RH" />
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
          </ImageBackground>
        </View>

        {/* Camera Controls */}
        <View className="mt-4 flex-row items-center justify-between px-6">
          <CircleIcon icon="flash-outline" onPress={() => {}} />
          <CaptureButton onPress={() => {}} />
          <CircleIcon icon="camera-reverse-outline" onPress={() => {}} />
        </View>

        {/* Use Last Sensor */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {}}
          className="mt-4 bg-white rounded-full px-4 py-3 flex-row items-center justify-center shadow-sm"
          style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
        >
          <Ionicons name="pulse-outline" size={16} color={PRIMARY} />
          <Text className="ml-2 text-[12.5px] font-extrabold text-gray-900">
            Use Last Sensor
          </Text>
        </TouchableOpacity>

        {/* Start Analysis */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {}}
          className="mt-4 rounded-[12px] items-center justify-center"
          style={{
            backgroundColor: PRIMARY,
            height: 52,
            shadowColor: "#000",
            shadowOpacity: Platform.OS === "android" ? 0.18 : 0.12,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            elevation: 3,
          }}
        >
          <View className="flex-row items-center">
            <Ionicons name="play" size={18} color="#fff" />
            <Text className="ml-2 text-[14px] font-extrabold text-white">
              Start Analysis
            </Text>
          </View>
        </TouchableOpacity>

        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- components ---------------- */

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

function CaptureButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <View className="w-[72px] h-[72px] rounded-full items-center justify-center bg-white">
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