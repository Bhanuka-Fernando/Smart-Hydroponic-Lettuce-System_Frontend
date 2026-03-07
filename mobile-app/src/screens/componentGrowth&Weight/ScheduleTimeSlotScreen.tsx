import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Pressable,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useSensorReadings } from "../../context/SensorReadingsContext";
import { getDeviceSensors } from "../../api/deviceApi";
import { ML_BASE_URL } from "../../utils/constants";

type Slot = {
  id: string;
  name: string;
  timeLabel: string;
  enabled: boolean;
  hour24: number;
  minute: number;
};

const MAX_SLOTS = 6;
const STORAGE_KEY = "@schedule_time_slots";
const LAST_CHECK_KEY = "@last_schedule_check";
const LAST_AUTO_UPDATE_KEY = "@last_auto_update";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function makeTimeLabel(hour: number, minute: number, meridiem: "AM" | "PM") {
  return `${pad2(hour)}:${pad2(minute)} ${meridiem}`;
}

function convertTo24Hour(hour: number, meridiem: "AM" | "PM"): number {
  if (meridiem === "AM") {
    return hour === 12 ? 0 : hour;
  } else {
    return hour === 12 ? 12 : hour + 12;
  }
}

function convertTo12Hour(hour24: number): { hour: number; meridiem: "AM" | "PM" } {
  if (hour24 === 0) return { hour: 12, meridiem: "AM" };
  if (hour24 < 12) return { hour: hour24, meridiem: "AM" };
  if (hour24 === 12) return { hour: 12, meridiem: "PM" };
  return { hour: hour24 - 12, meridiem: "PM" };
}

function SelectionPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2.5 rounded-full items-center justify-center my-1 ${
        selected ? "bg-[#003B8F]" : "bg-transparent"
      }`}
      style={{ minWidth: 64 }}
    >
      <Text className={`text-[15px] font-extrabold ${selected ? "text-white" : "text-gray-400"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function ScheduleTimeSlotsScreen() {
  const navigation = useNavigation<any>();
  const { setAll } = useSensorReadings();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [open, setOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [scheduleName, setScheduleName] = useState("");
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [meridiem, setMeridiem] = useState<"AM" | "PM">("AM");

  // Use ref to always have current slots in the interval callback
  const slotsRef = useRef<Slot[]>([]);
  
  useEffect(() => {
    slotsRef.current = slots;
    console.log(`📝 Slots ref updated. Count: ${slots.length}`);
  }, [slots]);

  const capacityText = useMemo(
    () => `${Math.min(slots.length, MAX_SLOTS)} of ${MAX_SLOTS} capacity`,
    [slots.length]
  );

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  // ✅ Load saved slots on mount
  useEffect(() => {
    loadSlots();
  }, []);

  // ✅ Start background scheduler
  useEffect(() => {
    console.log("🚀 Starting background scheduler...");
    
    const interval = setInterval(() => {
      checkAndExecuteSchedules();
    }, 60000); // Check every minute

    // Also check immediately on mount
    setTimeout(() => {
      checkAndExecuteSchedules();
    }, 2000); // Small delay to ensure slots are loaded

    return () => {
      console.log("🛑 Stopping background scheduler...");
      clearInterval(interval);
    };
  }, []);

  const loadSlots = async () => {
    try {
      console.log("📥 Loading slots from AsyncStorage...");
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (saved) {
        const parsed = JSON.parse(saved) as Slot[];
        console.log(`✅ Loaded ${parsed.length} slots:`, parsed.map(s => s.name));
        setSlots(parsed);
        slotsRef.current = parsed;
      } else {
        console.log("ℹ️  No saved slots found. Starting fresh.");
        // Set default slots
        const defaultSlots: Slot[] = [
          { id: "1", name: "Morning", timeLabel: "08:00 AM", enabled: true, hour24: 8, minute: 0 },
          { id: "2", name: "Afternoon", timeLabel: "01:00 PM", enabled: true, hour24: 13, minute: 0 },
          { id: "3", name: "Evening", timeLabel: "08:00 PM", enabled: true, hour24: 20, minute: 0 },
        ];
        setSlots(defaultSlots);
        slotsRef.current = defaultSlots;
        await saveSlots(defaultSlots);
      }
    } catch (error) {
      console.error("❌ Failed to load schedules:", error);
      Alert.alert("Error", "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  const saveSlots = async (newSlots: Slot[]) => {
    try {
      console.log(`💾 Saving ${newSlots.length} slots to AsyncStorage...`);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSlots));
      slotsRef.current = newSlots;
      console.log("✅ Slots saved successfully");
    } catch (error) {
      console.error("❌ Failed to save schedules:", error);
      Alert.alert("Error", "Failed to save schedules");
    }
  };

  const checkAndExecuteSchedules = async () => {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      console.log("=".repeat(50));
      console.log(`🕐 Schedule Check at ${now.toLocaleTimeString()}`);
      console.log(`Current Time: ${currentHour}:${pad2(currentMinute)}`);
      console.log(`Total Slots: ${slotsRef.current.length}`);
      console.log(`Enabled Slots: ${slotsRef.current.filter((s) => s.enabled).length}`);

      // Get last check time
      const lastCheck = await AsyncStorage.getItem(LAST_CHECK_KEY);
      const lastCheckTime = lastCheck ? new Date(lastCheck) : null;

      console.log(`Last Check: ${lastCheckTime?.toLocaleTimeString() || "Never"}`);

      // Only execute if we haven't checked in the last 55 seconds
      if (lastCheckTime && now.getTime() - lastCheckTime.getTime() < 55000) {
        console.log("⏭️  Skipped - Too soon since last check");
        console.log("=".repeat(50));
        return;
      }

      // Update last check time
      await AsyncStorage.setItem(LAST_CHECK_KEY, now.toISOString());

      // Check each enabled slot
      let foundMatch = false;
      for (const slot of slotsRef.current) {
        const slotTime = `${slot.hour24}:${pad2(slot.minute)}`;
        const currentTime = `${currentHour}:${pad2(currentMinute)}`;

        console.log(`\n📋 Checking Slot: ${slot.name}`);
        console.log(`   - Schedule Time: ${slotTime} (${slot.timeLabel})`);
        console.log(`   - Current Time:  ${currentTime}`);
        console.log(`   - Enabled: ${slot.enabled ? "✅" : "❌"}`);

        if (!slot.enabled) {
          console.log(`   ⏭️  Skipped - Disabled`);
          continue;
        }

        // Check if current time matches slot time
        if (slot.hour24 === currentHour && slot.minute === currentMinute) {
          foundMatch = true;
          console.log(`   🎯 MATCH FOUND!`);
          console.log(`   ⏰ Executing schedule: ${slot.name} at ${slot.timeLabel}`);

          try {
            await fetchAndUpdateSensors(slot.name);
            console.log(`   ✅ Successfully fetched sensors`);
          } catch (error) {
            console.error(`   ❌ Failed to fetch sensors:`, error);
          }
        } else {
          console.log(`   ⏭️  No match - Different time`);
        }
      }

      if (!foundMatch) {
        console.log(`\n⚠️  No matching schedules found for ${currentHour}:${pad2(currentMinute)}`);
      }

      console.log("=".repeat(50));
    } catch (error) {
      console.error("❌ Schedule check failed:", error);
    }
  };

  const fetchAndUpdateSensors = async (slotName: string) => {
    try {
      console.log(`\n📡 Fetching sensors for schedule: ${slotName}`);

      const ZONE_ID = "z01";
      console.log(`   - Calling device simulator at zone: ${ZONE_ID}`);

      const deviceSensors = await getDeviceSensors(ZONE_ID, "NORMAL");

      console.log(`   - Received sensor data:`, {
        temp: deviceSensors.temperature_c,
        humidity: deviceSensors.humidity_pct,
        ec: deviceSensors.ec_ms_cm,
        ph: deviceSensors.ph,
      });

      const mappedSensors = {
        airT: deviceSensors.temperature_c,
        RH: deviceSensors.humidity_pct,
        EC: deviceSensors.ec_ms_cm,
        pH: deviceSensors.ph,
      };

      // Update sensor context
      setAll(mappedSensors);
      console.log(`   ✅ Context updated`);

      // ✅ Save timestamp of this auto-update
      await AsyncStorage.setItem(LAST_AUTO_UPDATE_KEY, new Date().toISOString());
      console.log(`   ✅ Auto-update timestamp saved`);

      // Ingest to ML backend
      try {
        // ✅ Fixed payload format to match ML backend expectations
        const payload = {
          device_id: deviceSensors.device_id,
          zone_id: deviceSensors.zone_id,
          plant_id: "p04",
          ts: deviceSensors.timestamp,
          // Use lowercase keys that match the ML backend schema
          air_temp_c: deviceSensors.temperature_c,
          humidity_pct: deviceSensors.humidity_pct,
          ec_ms_cm: deviceSensors.ec_ms_cm,
          ph: deviceSensors.ph,
        };

        console.log(`   - Sending to ML backend:`, payload);

        const response = await axios.post(`${ML_BASE_URL}/infer/iot/ingest`, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        });
        
        console.log(`   ✅ ML backend ingested successfully:`, response.data);
      } catch (e: any) {
        console.warn(`   ⚠️  ML backend ingest failed:`, {
          status: e?.response?.status,
          data: e?.response?.data,
          message: e?.message,
        });
        // Don't throw - sensor update already succeeded
      }

      console.log(`\n✅ ✅ ✅ Sensors successfully updated from schedule: ${slotName}`);
    } catch (error) {
      console.error(`❌ Failed to fetch sensors for schedule ${slotName}:`, error);
      throw error;
    }
  };

  const onToggleSlot = (id: string) => {
    const updated = slots.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    setSlots(updated);
    saveSlots(updated);
  };

  const onRemoveSlot = (id: string) => {
    Alert.alert("Remove Schedule", "Are you sure you want to remove this schedule?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          const updated = slots.filter((s) => s.id !== id);
          setSlots(updated);
          saveSlots(updated);
        },
      },
    ]);
  };

  const openModal = () => {
    if (slots.length >= MAX_SLOTS) {
      Alert.alert("Capacity Reached", `You can only have ${MAX_SLOTS} time slots.`);
      return;
    }
    setEditingSlotId(null);
    setScheduleName("");
    setHour(8);
    setMinute(0);
    setMeridiem("AM");
    setOpen(true);
  };

  const openEditModal = (slot: Slot) => {
    setEditingSlotId(slot.id);
    setScheduleName(slot.name);
    const { hour: h, meridiem: m } = convertTo12Hour(slot.hour24);
    setHour(h);
    setMinute(slot.minute);
    setMeridiem(m);
    setOpen(true);
  };

  const saveSlotFromModal = () => {
    const name = scheduleName.trim();
    if (!name) {
      Alert.alert("Missing name", "Please enter a schedule name.");
      return;
    }

    const isEditing = !!editingSlotId;
    if (!isEditing && slots.length >= MAX_SLOTS) {
      Alert.alert("Capacity reached", `You can only have ${MAX_SLOTS} time slots.`);
      return;
    }

    const hour24 = convertTo24Hour(hour, meridiem);

    // Prevent duplicate schedule times
    const hasConflict = slots.some(
      (s) => s.id !== editingSlotId && s.hour24 === hour24 && s.minute === minute
    );

    if (hasConflict) {
      Alert.alert(
        "Time conflict",
        `A schedule already exists at ${makeTimeLabel(hour, minute, meridiem)}. Please choose a different time.`
      );
      return;
    }

    const nextSlot: Slot = {
      id: editingSlotId ?? String(Date.now()),
      name,
      timeLabel: makeTimeLabel(hour, minute, meridiem),
      enabled: true,
      hour24,
      minute,
    };

    const updated = isEditing
      ? slots.map((s) => (s.id === editingSlotId ? { ...s, ...nextSlot, enabled: s.enabled } : s))
      : [...slots, nextSlot];

    setSlots(updated);
    saveSlots(updated);
    setOpen(false);
    setEditingSlotId(null);

    Alert.alert(
      isEditing ? "Schedule Updated" : "Schedule Added",
      `"${name}" will automatically update sensors at ${nextSlot.timeLabel} daily.`
    );
  };

  if (loading) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA] items-center justify-center">
        <Text className="text-[14px] font-semibold text-gray-500">Loading schedules...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      {/* Header */}
      <View className="px-5 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="chevron-back" size={28} color="#1F2937" />
          </TouchableOpacity>

          <View className="flex-1">
            <Text className="text-[18px] font-extrabold text-gray-900">Schedule Time Slots</Text>
            <Text className="text-[11px] font-semibold text-gray-500 mt-0.5">{capacityText}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={async () => {
              console.log("🧪 Manual test triggered");
              await checkAndExecuteSchedules();
            }}
            className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center"
          >
            <Ionicons name="flash" size={20} color="#EA580C" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
      >
        {/* Slots */}
        {slots.map((slot) => (
          <View key={slot.id} className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1">
                <Text className="text-[15px] font-extrabold text-gray-900 mb-1">{slot.name}</Text>
                <Text className="text-[12px] font-semibold text-gray-500">{slot.timeLabel}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onToggleSlot(slot.id)}
                className={`px-4 py-2 rounded-full ${
                  slot.enabled ? "bg-emerald-100" : "bg-gray-100"
                }`}
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-2 h-2 rounded-full mr-2 ${
                      slot.enabled ? "bg-emerald-500" : "bg-gray-400"
                    }`}
                  />
                  <Text
                    className={`text-[11px] font-extrabold ${
                      slot.enabled ? "text-emerald-700" : "text-gray-600"
                    }`}
                  >
                    {slot.enabled ? "ON" : "OFF"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View className="flex-row" style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => openEditModal(slot)}
                className="flex-1 bg-[#F8FAFC] rounded-xl py-3 items-center"
                activeOpacity={0.85}
              >
                <Text className="text-[12px] font-extrabold text-gray-700">Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onRemoveSlot(slot.id)}
                className="flex-1 bg-red-50 rounded-xl py-3 items-center"
                activeOpacity={0.85}
              >
                <Text className="text-[12px] font-extrabold text-red-600">Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Add Button */}
        {slots.length < MAX_SLOTS && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={openModal}
            className="bg-[#003B8F] rounded-2xl py-4 items-center flex-row justify-center mt-2"
          >
            <Ionicons name="add-circle-outline" size={22} color="white" />
            <Text className="ml-2 text-[14px] font-extrabold text-white">Add Time Slot</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          className="flex-1 bg-black/40 items-center justify-center px-5"
        >
          <Pressable onPress={() => {}} className="w-full bg-white rounded-[22px] overflow-hidden max-w-md">
            <View className="px-5 pt-5 pb-3 border-b border-gray-100 flex-row items-center justify-between">
              <Text className="text-[12px] font-extrabold text-gray-900 tracking-[0.6px]">
                {editingSlotId ? "EDIT SCHEDULE" : "NEW SCHEDULE"}
              </Text>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                className="w-9 h-9 rounded-full bg-[#F1F5F9] items-center justify-center"
                activeOpacity={0.85}
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View className="px-5 py-5">
              <Text className="text-[13px] font-extrabold text-gray-900 mb-2">Schedule Name</Text>
              <View className="bg-[#F1F5F9] rounded-[14px] px-4 py-3 mb-5">
                <TextInput
                  value={scheduleName}
                  onChangeText={setScheduleName}
                  placeholder="e.g., Morning Check"
                  placeholderTextColor="#94A3B8"
                  className="text-[13px] font-semibold text-gray-900"
                />
              </View>

              <Text className="text-[13px] font-extrabold text-gray-900 mb-3">Select Time</Text>

              <View className="flex-row bg-[#F8FAFC] rounded-[16px] p-2" style={{ height: 220 }}>
                <View className="flex-1 items-center">
                  <Text className="text-[11px] font-extrabold text-gray-500 mb-2">HOUR</Text>
                  <ScrollView
                    style={{ flex: 1, width: "100%" }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ alignItems: "center", paddingVertical: 4 }}
                  >
                    {hours.map((h) => (
                      <SelectionPill key={`h-${h}`} label={pad2(h)} selected={hour === h} onPress={() => setHour(h)} />
                    ))}
                  </ScrollView>
                </View>

                <View className="w-px bg-gray-200 mx-2" />

                <View className="flex-1 items-center">
                  <Text className="text-[11px] font-extrabold text-gray-500 mb-2">MIN</Text>
                  <ScrollView
                    style={{ flex: 1, width: "100%" }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ alignItems: "center", paddingVertical: 4 }}
                  >
                    {minutes.map((m) => (
                      <SelectionPill key={`m-${m}`} label={pad2(m)} selected={minute === m} onPress={() => setMinute(m)} />
                    ))}
                  </ScrollView>
                </View>

                <View className="w-px bg-gray-200 mx-2" />

                <View className="flex-1 items-center justify-center">
                  <SelectionPill label="AM" selected={meridiem === "AM"} onPress={() => setMeridiem("AM")} />
                  <View className="h-2" />
                  <SelectionPill label="PM" selected={meridiem === "PM"} onPress={() => setMeridiem("PM")} />
                </View>
              </View>

              <View className="flex-row justify-between mt-6">
                <TouchableOpacity
                  onPress={() => setOpen(false)}
                  activeOpacity={0.9}
                  className="flex-1 bg-[#E8EEF8] rounded-[18px] py-4 items-center mr-3"
                >
                  <Text className="text-[13px] font-extrabold text-gray-700">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={saveSlotFromModal}
                  activeOpacity={0.9}
                  className="flex-1 bg-[#003B8F] rounded-[18px] py-4 items-center"
                >
                  <Text className="text-[13px] font-extrabold text-white">
                    {editingSlotId ? "Save Changes" : "Add Schedule"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
