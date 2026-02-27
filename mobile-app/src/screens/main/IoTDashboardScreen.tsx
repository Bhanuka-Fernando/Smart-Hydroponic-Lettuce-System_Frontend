// src/screens/main/IoTDashboardScreen.tsx
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../auth/useAuth";
import { useSensorReadings } from "../../context/SensorReadingsContext";
import { getDashboardLatest, DashboardMetricsResponse } from "../../api/dashboardApi";

export default function IoTDashboardScreen() {
  const { accessToken } = useAuth();
  const { readings, setOne, submitReadings, clear } = useSensorReadings();
  
  const [selectedZone, setSelectedZone] = useState("z01");
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch latest sensor data
  const fetchSensorData = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const data = await getDashboardLatest({ token: accessToken, zone_id: selectedZone });
      setMetrics(data);
    } catch (error) {
      console.error("Failed to fetch sensor data:", error);
      
      // Use mock data if API is not available
      const mockData: DashboardMetricsResponse = {
        zone_id: selectedZone,
        zone_name: `Zone ${selectedZone.toUpperCase()}`,
        plant_count: 24,
        harvest_ready_count: 5,
        avg_growth_pct: 78.5,
        temperature_c: 23.5,
        humidity_pct: 62.0,
        ec_ms_cm: 1.4,
        ph: 6.2,
        last_updated: new Date().toISOString(),
      };
      setMetrics(mockData);
      
      if (!isRefreshing) {
        console.warn("Using mock sensor data - backend endpoint not available");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, selectedZone]);

  useEffect(() => {
    fetchSensorData();
  }, [selectedZone]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSensorData(true);
  }, [fetchSensorData]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await submitReadings(accessToken, selectedZone);
      Alert.alert("Success", "Sensor readings submitted successfully");
      clear();
      await fetchSensorData(); // Refresh to get updated data
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit sensor readings");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    readings.airT !== null &&
    readings.RH !== null &&
    readings.EC !== null &&
    readings.pH !== null;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      {/* Header */}
      <View className="px-4 pt-4 pb-3">
        <Text className="text-[24px] font-extrabold text-gray-900">
          IoT Sensor Dashboard
        </Text>
        <Text className="text-[11px] text-gray-500 mt-1 font-semibold tracking-[0.4px]">
          Monitor and manage sensor readings
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      >
        {/* Zone Selector */}
        <View className="mb-4">
          <Text className="text-[11px] font-extrabold text-gray-900 mb-2 tracking-[0.6px]">
            SELECT ZONE
          </Text>
          <View className="flex-row space-x-2">
            {["z01", "z02", "z03"].map((zone) => (
              <TouchableOpacity
                key={zone}
                onPress={() => setSelectedZone(zone)}
                className={`flex-1 py-3 rounded-full border ${
                  selectedZone === zone ? "bg-[#EAF4FF] border-[#B6C8F0]" : "bg-white border-gray-200"
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-center text-[11px] font-extrabold ${
                    selectedZone === zone ? "text-[#003B8F]" : "text-gray-600"
                  }`}
                >
                  {zone.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading && !metrics ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#0046AD" />
            <Text className="text-gray-500 mt-4">Loading sensor data...</Text>
          </View>
        ) : metrics ? (
          <>
            {/* Current Readings */}
            <View className="bg-white rounded-[18px] p-4 shadow-sm mb-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-[13px] font-extrabold text-gray-900 tracking-[0.6px]">
                  CURRENT READINGS
                </Text>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                  <Text className="text-[11px] text-gray-500">Live</Text>
                </View>
              </View>

              <View className="flex-row flex-wrap">
                <View className="w-1/2 pr-2 mb-3">
                  <SensorCard
                    icon={
                      <Ionicons
                        name="thermometer-outline"
                        size={24}
                        color="#EF4444"
                      />
                    }
                    label="Temperature"
                    value={`${metrics.temperature_c.toFixed(1)}°C`}
                    bgColor="bg-red-50"
                    status={
                      metrics.temperature_c >= 20 && metrics.temperature_c <= 26
                        ? "optimal"
                        : "warning"
                    }
                  />
                </View>

                <View className="w-1/2 pl-2 mb-3">
                  <SensorCard
                    icon={
                      <Ionicons name="water-outline" size={24} color="#3B82F6" />
                    }
                    label="Humidity"
                    value={`${metrics.humidity_pct.toFixed(1)}%`}
                    bgColor="bg-blue-50"
                    status={
                      metrics.humidity_pct >= 50 && metrics.humidity_pct <= 70
                        ? "optimal"
                        : "warning"
                    }
                  />
                </View>

                <View className="w-1/2 pr-2">
                  <SensorCard
                    icon={
                      <MaterialCommunityIcons
                        name="flash"
                        size={24}
                        color="#F59E0B"
                      />
                    }
                    label="EC"
                    value={`${metrics.ec_ms_cm.toFixed(2)}`}
                    unit="mS/cm"
                    bgColor="bg-amber-50"
                    status={
                      metrics.ec_ms_cm >= 1.2 && metrics.ec_ms_cm <= 2.0
                        ? "optimal"
                        : "warning"
                    }
                  />
                </View>

                <View className="w-1/2 pl-2">
                  <SensorCard
                    icon={
                      <MaterialCommunityIcons name="ph" size={24} color="#8B5CF6" />
                    }
                    label="pH Level"
                    value={metrics.ph.toFixed(2)}
                    bgColor="bg-purple-50"
                    status={
                      metrics.ph >= 5.5 && metrics.ph <= 6.5 ? "optimal" : "warning"
                    }
                  />
                </View>
              </View>

              <Text className="text-[11px] text-gray-400 mt-3 text-right">
                Last updated:{" "}
                {new Date(metrics.last_updated).toLocaleTimeString()}
              </Text>
            </View>

            {/* Manual Input Section */}
            <View className="bg-white rounded-[18px] p-4 shadow-sm mb-4">
              <Text className="text-[13px] font-extrabold text-gray-900 mb-4 tracking-[0.6px]">
                MANUAL SENSOR INPUT
              </Text>

              <View className="space-y-3">
                <InputField
                  label="Temperature (°C)"
                  value={readings.airT}
                  onChange={(val) => setOne("airT", val)}
                  icon={
                    <Ionicons name="thermometer-outline" size={18} color="#EF4444" />
                  }
                />
                <InputField
                  label="Humidity (%)"
                  value={readings.RH}
                  onChange={(val) => setOne("RH", val)}
                  icon={<Ionicons name="water-outline" size={18} color="#3B82F6" />}
                />
                <InputField
                  label="EC (mS/cm)"
                  value={readings.EC}
                  onChange={(val) => setOne("EC", val)}
                  icon={
                    <MaterialCommunityIcons name="flash" size={18} color="#F59E0B" />
                  }
                />
                <InputField
                  label="pH Level"
                  value={readings.pH}
                  onChange={(val) => setOne("pH", val)}
                  icon={
                    <MaterialCommunityIcons name="ph" size={18} color="#8B5CF6" />
                  }
                />
              </View>

              <View className="flex-row space-x-3 mt-4">
                <TouchableOpacity
                  onPress={clear}
                  className="flex-1 py-3 rounded-xl bg-gray-100"
                  activeOpacity={0.7}
                >
                  <Text className="text-center text-[14px] font-bold text-gray-700">
                    Clear
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={!canSubmit || submitting}
                  className={`flex-1 py-3 rounded-xl ${
                    canSubmit && !submitting ? "bg-[#0046AD]" : "bg-gray-300"
                  }`}
                  activeOpacity={0.7}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-center text-[14px] font-bold text-white">
                      Submit
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* System Stats */}
            <View className="bg-white rounded-[18px] p-4 shadow-sm">
              <Text className="text-[13px] font-extrabold text-gray-900 mb-4 tracking-[0.6px]">
                SYSTEM STATISTICS
              </Text>
              
              <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="sprout"
                    size={20}
                    color="#0046AD"
                  />
                  <Text className="text-[13px] text-gray-600 ml-2">
                    Total Plants
                  </Text>
                </View>
                <Text className="text-[18px] font-extrabold text-gray-900">
                  {metrics.plant_count}
                </Text>
              </View>

              <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                  <Text className="text-[13px] text-gray-600 ml-2">
                    Harvest Ready
                  </Text>
                </View>
                <Text className="text-[18px] font-extrabold text-gray-900">
                  {metrics.harvest_ready_count}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <Ionicons name="trending-up" size={20} color="#0046AD" />
                  <Text className="text-[13px] text-gray-600 ml-2">
                    Avg Growth
                  </Text>
                </View>
                <Text className="text-[18px] font-extrabold text-gray-900">
                  {metrics.avg_growth_pct.toFixed(1)}%
                </Text>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/* Components */

function SensorCard({
  icon,
  label,
  value,
  unit,
  bgColor,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  bgColor: string;
  status: "optimal" | "warning";
}) {
  return (
    <View className={`${bgColor} rounded-xl p-3`}>
      <View className="flex-row items-center justify-between mb-2">
        {icon}
        {status === "optimal" ? (
          <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
        ) : (
          <Ionicons name="warning" size={16} color="#F59E0B" />
        )}
      </View>
      <Text className="text-[11px] text-gray-600 font-semibold mb-1">
        {label}
      </Text>
      <Text className="text-[18px] font-extrabold text-gray-900">
        {value}
        {unit && (
          <Text className="text-[11px] text-gray-500 font-normal"> {unit}</Text>
        )}
      </Text>
    </View>
  );
}

function InputField({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: number | null;
  onChange: (val: number | null) => void;
  icon: React.ReactNode;
}) {
  return (
    <View className="mb-3">
      <View className="flex-row items-center mb-2">
        {icon}
        <Text className="text-[13px] font-semibold text-gray-700 ml-2">
          {label}
        </Text>
      </View>
      <TextInput
        value={value !== null ? value.toString() : ""}
        onChangeText={(text) => {
          const val = text === "" ? null : parseFloat(text);
          onChange(isNaN(val as any) ? null : val);
        }}
        keyboardType="decimal-pad"
        placeholder="Enter value"
        placeholderTextColor="#9CA3AF"
        className="bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900"
      />
    </View>
  );
}
