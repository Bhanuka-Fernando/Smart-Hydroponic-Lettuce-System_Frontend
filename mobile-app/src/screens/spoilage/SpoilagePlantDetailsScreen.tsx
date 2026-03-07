import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SpoilageStackParamList } from "../../navigation/SpoilageNavigator";

type Props = NativeStackScreenProps<SpoilageStackParamList, "SpoilagePlantDetails">;

export default function SpoilagePlantDetailsScreen({ navigation, route }: Props) {
  const { plantId } = route.params;

  const goToScan = () => navigation.navigate("SpoilageScan", { plantId });

  const title = useMemo(() => `Plant ${plantId}`, [plantId]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      {/* Header */}
      <View className="px-4 pt-3 pb-3 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>

        <Text className="text-[16px] font-extrabold text-gray-900">{title}</Text>
        <View className="w-10 h-10" />
      </View>

      <View className="px-4 mt-2">
        <View className="bg-white rounded-[18px] px-4 py-4 shadow-sm">
          <Text className="text-[11px] text-gray-500 font-semibold">PLANT ID</Text>
          <Text className="text-[20px] font-extrabold text-gray-900 mt-2">{plantId}</Text>

          <View className="mt-4 flex-row items-center">
            <View className="w-9 h-9 rounded-full bg-[#EAF4FF] items-center justify-center">
              <Ionicons name="information" size={18} color="#0046AD" />
            </View>
            <Text className="ml-3 text-[12px] text-gray-600 font-semibold flex-1">
              Use “Check Spoilage” to run stage classification and remaining-days prediction.
            </Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={goToScan}
          className="mt-4 bg-[#0B3B5A] rounded-[18px] px-4 py-4 shadow-sm flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <Ionicons name="leaf-outline" size={20} color="#fff" />
            </View>

            <View className="ml-3">
              <Text className="text-[13px] font-extrabold text-white">Check Spoilage</Text>
              <Text className="text-[11px] font-semibold text-white/80 mt-1">
                Stage + remaining days
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}