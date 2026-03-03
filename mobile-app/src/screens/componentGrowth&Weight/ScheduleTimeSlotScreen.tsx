import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Pressable,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceSensors } from "../../api/deviceApi";
import { useSensorReadings } from "../../context/SensorReadingsContext";
import axios from 'axios';
import { ML_BASE_URL } from '../../utils/constants';

type Slot = {
  id: string;
  name: string;
  timeLabel: string; // "08:00 AM"
  enabled: boolean;
  hour24: number; // 0-23
  minute: number; // 0-59
};

const MAX_SLOTS = 6;
const STORAGE_KEY = '@schedule_time_slots';
const LAST_CHECK_KEY = '@last_schedule_check';

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
      className={`px-4 py-2 rounded-full items-center justify-center ${
        selected ? "bg-[#E8EEF8]" : "bg-transparent"
      }`}
      style={{ minWidth: 58 }}
    >
      <Text className={`text-[16px] font-extrabold ${selected ? "text-gray-900" : "text-gray-400"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function ScheduleTimeSlotsScreen() {
  const navigation = useNavigation<any>();
  const { setAll } = useSensorReadings();

  const [slots, setSlots] = useState<Slot[]>([
    { id: "1", name: "Morning", timeLabel: "08:00 AM", enabled: true, hour24: 8, minute: 0 },
    { id: "2", name: "Afternoon", timeLabel: "01:00 PM", enabled: true, hour24: 13, minute: 0 },
    { id: "3", name: "Evening", timeLabel: "08:00 PM", enabled: true, hour24: 20, minute: 0 },
  ]);

  // Modal state
  const [open, setOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [scheduleName, setScheduleName] = useState("");
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [meridiem, setMeridiem] = useState<"AM" | "PM">("AM");

  const capacityText = useMemo(
    () => `${Math.min(slots.length, MAX_SLOTS)} of ${MAX_SLOTS} capacity`,
    [slots.length]
  );

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const minutes = useMemo(() => {
    const m: number[] = [];
    for (let i = 0; i < 60; i += 5) m.push(i);
    return m;
  }, []);

  // Load saved slots on mount
  useEffect(() => {
    loadSlots();
  }, []);

  // Start background scheduler
  useEffect(() => {
    const interval = setInterval(() => {
      checkAndExecuteSchedules();
    }, 60000); // Check every minute

    // Also check immediately on mount
    checkAndExecuteSchedules();

    return () => clearInterval(interval);
  }, [slots]);

  const loadSlots = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSlots(parsed);
      }
    } catch (error) {
      console.error("Failed to load schedules:", error);
    }
  };

  const saveSlots = async (newSlots: Slot[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSlots));
    } catch (error) {
      console.error("Failed to save schedules:", error);
    }
  };

  const checkAndExecuteSchedules = async () => {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Get last check time
      const lastCheck = await AsyncStorage.getItem(LAST_CHECK_KEY);
      const lastCheckTime = lastCheck ? new Date(lastCheck) : null;

      // Only execute if we haven't checked in the last minute
      if (lastCheckTime && now.getTime() - lastCheckTime.getTime() < 60000) {
        return;
      }

      // Update last check time
      await AsyncStorage.setItem(LAST_CHECK_KEY, now.toISOString());

      // Check each enabled slot
      for (const slot of slots) {
        if (!slot.enabled) continue;

        // Check if current time matches slot time (within 1 minute tolerance)
        if (slot.hour24 === currentHour && slot.minute === currentMinute) {
          console.log(`Executing schedule: ${slot.name} at ${slot.timeLabel}`);
          await fetchAndUpdateSensors(slot.name);
        }
      }
    } catch (error) {
      console.error("Schedule check failed:", error);
    }
  };

  const fetchAndUpdateSensors = async (slotName: string) => {
    try {
      const ZONE_ID = "z01";
      const deviceSensors = await getDeviceSensors(ZONE_ID, "NORMAL");

      const mappedSensors = {
        airT: deviceSensors.temperature_c,
        RH: deviceSensors.humidity_pct,
        EC: deviceSensors.ec_ms_cm,
        pH: deviceSensors.ph,
      };

      // Update sensor context
      setAll(mappedSensors);

      // Ingest to ML backend
      try {
        await axios.post(`${ML_BASE_URL}/infer/iot/ingest`, {
          device_id: deviceSensors.device_id,
          zone_id: deviceSensors.zone_id,
          plant_id: "p04",
          ts: deviceSensors.timestamp,
          airT: deviceSensors.temperature_c,
          RH: deviceSensors.humidity_pct,
          EC: deviceSensors.ec_ms_cm,
          pH: deviceSensors.ph,
        });
      } catch (e) {
        console.warn("Failed to ingest scheduled sensor data:", e);
      }

      console.log(`✅ Sensors updated from schedule: ${slotName}`);

      // Optional: Show a silent notification (you can add react-native-push-notification later)
      // For now, just log it
    } catch (error) {
      console.error(`Failed to fetch sensors for schedule ${slotName}:`, error);
    }
  };

  const onToggleSlot = (id: string, value: boolean) => {
    const updated = slots.map((s) => (s.id === id ? { ...s, enabled: value } : s));
    setSlots(updated);
    saveSlots(updated);
  };

  const onRemoveSlot = (id: string) => {
    const updated = slots.filter((s) => s.id !== id);
    setSlots(updated);
    saveSlots(updated);
  };

  const openModal = () => {
    setEditingSlotId(null);
    setScheduleName("");
    setHour(8);
    setMinute(0);
    setMeridiem("AM");
    setOpen(true);
  };

  const openEditModal = (slot: Slot) => {
    const converted = convertTo12Hour(slot.hour24);
    setEditingSlotId(slot.id);
    setScheduleName(slot.name);
    setHour(converted.hour);
    setMinute(slot.minute);
    setMeridiem(converted.meridiem);
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
      (s) =>
        s.id !== editingSlotId &&
        s.hour24 === hour24 &&
        s.minute === minute
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

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      {/* Header */}
      <View className="px-4 pt-2 pb-3 bg-[#F4F6FA]">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center"
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Text className="text-[16px] font-extrabold text-gray-900">
            Schedule Time Slots
          </Text>

          <View className="w-10 h-10" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      >
        {/* Info Banner */}
        <View className="bg-[#EEF2FF] rounded-[16px] p-4 mt-2 flex-row">
          <Ionicons name="information-circle" size={20} color="#4F46E5" />
          <Text className="flex-1 ml-3 text-[11px] text-gray-700 leading-[16px]">
            Sensor readings will be automatically fetched from the device simulator at each enabled time slot.
          </Text>
        </View>

        {/* Section title row */}
        <View className="flex-row items-center justify-between mt-6">
          <Text className="text-[10px] font-extrabold text-gray-400 tracking-[1px]">
            ACTIVE TIME SLOTS
          </Text>
          <Text className="text-[10px] font-extrabold text-green-600">
            {capacityText}
          </Text>
        </View>

        {/* Slot cards */}
        <View className="mt-3">
          {slots.map((slot) => (
            <View
              key={slot.id}
              className="bg-white rounded-[18px] shadow-sm px-4 py-4 mb-4"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-[#EEF2FF] items-center justify-center mr-3">
                    <Ionicons name="sunny-outline" size={18} color="#1D4ED8" />
                  </View>
                  <Text className="text-[14px] font-extrabold text-gray-900">
                    {slot.name}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Switch
                    value={slot.enabled}
                    onValueChange={(v) => onToggleSlot(slot.id, v)}
                    trackColor={{ false: "#E5E7EB", true: "#93C5FD" }}
                    thumbColor={slot.enabled ? "#1D4ED8" : "#FFFFFF"}
                  />

                  <TouchableOpacity
                    onPress={() => openEditModal(slot)}
                    activeOpacity={0.8}
                    className="ml-3 w-9 h-9 rounded-full bg-[#EEF2FF] items-center justify-center"
                  >
                    <Ionicons name="pencil-outline" size={16} color="#1D4ED8" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => onRemoveSlot(slot.id)}
                    activeOpacity={0.8}
                    className="ml-2 w-9 h-9 rounded-full bg-[#F1F5F9] items-center justify-center"
                  >
                    <Ionicons name="close" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="mt-3 flex-row items-center justify-center">
                <View className="bg-[#E8EEF8] rounded-full px-5 py-2 flex-row items-center">
                  <Text className="text-[13px] font-extrabold text-gray-700">
                    {slot.timeLabel}
                  </Text>
                  <Ionicons name="time-outline" size={16} color="#64748B" style={{ marginLeft: 8 }} />
                </View>
              </View>

              {slot.enabled && (
                <View className="mt-2 flex-row items-center justify-center">
                  <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                  <Text className="text-[10px] text-gray-500">Auto-update enabled</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Add Time Slot button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={openModal}
          className="border border-gray-300 bg-white rounded-[16px] py-4 items-center justify-center flex-row"
        >
          <Ionicons name="add-circle-outline" size={18} color="#64748B" />
          <Text className="ml-2 text-[13px] font-extrabold text-gray-700">
            Add Time Slot
          </Text>
        </TouchableOpacity>

        {/* Save Schedule */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.goBack()}
          className="mt-4 bg-[#003B8F] rounded-[16px] py-4 items-center"
        >
          <Text className="text-white text-[14px] font-extrabold">
            Save Schedule
          </Text>
        </TouchableOpacity>

        {/* (Optional) spacer */}
        <View className="h-14" />
      </ScrollView>

      {/* ===================== MODAL ===================== */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          className="flex-1 bg-black/30 items-center justify-center px-5"
        >
          <Pressable
            onPress={() => {}}
            className="w-full bg-white rounded-[22px] overflow-hidden"
          >
            {/* Modal top bar */}
            <View className="px-5 pt-5 pb-3 border-b border-gray-100 flex-row items-center justify-between">
              <Text className="text-[11px] font-extrabold text-gray-400 tracking-[1px]">
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
              {/* Name */}
              <Text className="text-[13px] font-extrabold text-gray-900 mb-2">
                Schedule Name
              </Text>
              <View className="bg-[#F1F5F9] rounded-[14px] px-4 py-3">
                <TextInput
                  value={scheduleName}
                  onChangeText={setScheduleName}
                  placeholder="e.g., Morning Check"
                  placeholderTextColor="#94A3B8"
                  className="text-[13px] font-semibold text-gray-900"
                />
              </View>

              {/* Time picker */}
              <Text className="text-[13px] font-extrabold text-gray-900 mt-5 mb-2">
                Select Time
              </Text>

              <View className="flex-row justify-between">
                {/* Hours */}
                <View className="flex-1 items-center">
                  <View className="w-full">
                    <ScrollView
                      style={{ maxHeight: 180 }}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ alignItems: "center", paddingBottom: 6 }}
                    >
                      {hours.map((h) => (
                        <SelectionPill
                          key={`h-${h}`}
                          label={pad2(h)}
                          selected={hour === h}
                          onPress={() => setHour(h)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Minutes */}
                <View className="flex-1 items-center">
                  <View className="w-full">
                    <ScrollView
                      style={{ maxHeight: 180 }}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ alignItems: "center", paddingBottom: 6 }}
                    >
                      {minutes.map((m) => (
                        <SelectionPill
                          key={`m-${m}`}
                          label={pad2(m)}
                          selected={minute === m}
                          onPress={() => setMinute(m)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* AM/PM */}
                <View className="flex-1 items-center">
                  <SelectionPill
                    label="AM"
                    selected={meridiem === "AM"}
                    onPress={() => setMeridiem("AM")}
                  />
                  <SelectionPill
                    label="PM"
                    selected={meridiem === "PM"}
                    onPress={() => setMeridiem("PM")}
                  />
                </View>
              </View>

              {/* Buttons */}
              <View className="flex-row justify-between mt-6">
                <TouchableOpacity
                  onPress={() => setOpen(false)}
                  activeOpacity={0.9}
                  className="flex-1 bg-[#E8EEF8] rounded-[18px] py-4 items-center mr-3"
                >
                  <Text className="text-[13px] font-extrabold text-gray-700">
                    Cancel
                  </Text>
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
