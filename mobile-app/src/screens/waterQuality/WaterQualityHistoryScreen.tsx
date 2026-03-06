import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { WaterQualityStackParamList } from "../../navigation/WaterQualityNavigator";
import { getWaterHistory, type LatestResponse } from "../../api/WaterQualityApi";

type Props = NativeStackScreenProps<WaterQualityStackParamList, "WaterQualityHistory">;

const THEME = "#00368C";

export default function WaterQualityHistoryScreen({ navigation, route }: Props) {
  const { tank_id } = route.params;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<LatestResponse[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getWaterHistory(tank_id, 80);
        setRows(res.readings);
      } catch (e: any) {
        setErr(e?.response?.data?.detail ?? e?.message ?? "Failed to load history");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAFF]">
      {/* Header */}
      <View className="px-5 pt-2 pb-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-11 h-11 rounded-2xl bg-white items-center justify-center border border-[#E6EEF9]"
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <View className="items-center">
            <Text className="text-[18px] font-extrabold text-gray-900">History</Text>
            <Text className="text-[12px] font-bold text-gray-500 mt-1">Tank: {tank_id}</Text>
          </View>

          <View className="w-11 h-11" />
        </View>

        <View className="mt-4 bg-white rounded-[22px] border border-[#E5EEF9] p-4 flex-row items-center justify-between">
          <View>
            <Text className="text-[12px] font-bold text-gray-500">Showing</Text>
            <Text className="text-[16px] font-extrabold text-gray-900 mt-1">{rows.length} readings</Text>
          </View>
          <View className="w-10 h-10 rounded-2xl items-center justify-center" style={{ backgroundColor: "#EAF4FF" }}>
            <Ionicons name="stats-chart" size={20} color={THEME} />
          </View>
        </View>
      </View>

      {/* List */}
      <ScrollView className="flex-1 px-5">
        {loading ? (
          <View className="mt-10 items-center">
            <ActivityIndicator size="large" color={THEME} />
            <Text className="mt-3 text-gray-600 text-[13px]">Loading…</Text>
          </View>
        ) : err ? (
          <View className="bg-white rounded-[22px] p-5 border border-[#FFE4E6]">
            <Text className="text-[15px] font-extrabold text-red-700">{err}</Text>
          </View>
        ) : (
          rows.map((r, idx) => (
            <View
              key={`${r.timestamp}-${idx}`}
              className="bg-white rounded-[22px] p-5 border border-[#E5EEF9] mb-3 shadow-sm"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] font-extrabold text-gray-900" numberOfLines={1}>
                  {r.timestamp}
                </Text>
                <View className="px-3 py-1 rounded-full" style={{ backgroundColor: "#EAF4FF" }}>
                  <Text className="text-[12px] font-extrabold" style={{ color: THEME }}>
                    #{idx + 1}
                  </Text>
                </View>
              </View>

              <View className="mt-3">
                <View className="flex-row justify-between">
                  <Text className="text-[13px] text-gray-800">pH</Text>
                  <Text className="text-[13px] font-extrabold text-gray-900">{r.ph.toFixed(2)}</Text>
                </View>

                <View className="flex-row justify-between mt-2">
                  <Text className="text-[13px] text-gray-800">Temperature</Text>
                  <Text className="text-[13px] font-extrabold text-gray-900">{r.temp_c.toFixed(1)}°C</Text>
                </View>

                <View className="flex-row justify-between mt-2">
                  <Text className="text-[13px] text-gray-800">Turbidity</Text>
                  <Text className="text-[13px] font-extrabold text-gray-900">{r.turb_ntu.toFixed(1)} NTU</Text>
                </View>

                <View className="flex-row justify-between mt-2">
                  <Text className="text-[13px] text-gray-800">EC</Text>
                  <Text className="text-[13px] font-extrabold text-gray-900">{r.ec.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          ))
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}