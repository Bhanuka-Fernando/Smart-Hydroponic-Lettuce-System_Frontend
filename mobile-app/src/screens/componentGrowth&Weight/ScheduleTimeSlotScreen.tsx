import React, { useMemo, useState } from "react";
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

type Slot = {
  id: string;
  name: string;
  timeLabel: string; // "08:00 AM"
  enabled: boolean;
};

const MAX_SLOTS = 6;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function makeTimeLabel(hour: number, minute: number, meridiem: "AM" | "PM") {
  return `${pad2(hour)}:${pad2(minute)} ${meridiem}`;
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

  const [slots, setSlots] = useState<Slot[]>([
    { id: "1", name: "Morning", timeLabel: "08:00 AM", enabled: true },
    { id: "2", name: "Afternoon", timeLabel: "01:00 PM", enabled: true },
    { id: "3", name: "Evening", timeLabel: "08:00 PM", enabled: true },
  ]);

  // Modal state
  const [open, setOpen] = useState(false);
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
    // steps of 5 to keep UI clean
    const m: number[] = [];
    for (let i = 0; i < 60; i += 5) m.push(i);
    return m;
  }, []);

  const onToggleSlot = (id: string, value: boolean) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: value } : s)));
  };

  const onRemoveSlot = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const openModal = () => {
    setScheduleName("");
    setHour(8);
    setMinute(0);
    setMeridiem("AM");
    setOpen(true);
  };

  const addSlot = () => {
    const name = scheduleName.trim();
    if (!name) {
      Alert.alert("Missing name", "Please enter a schedule name.");
      return;
    }
    if (slots.length >= MAX_SLOTS) {
      Alert.alert("Capacity reached", `You can only have ${MAX_SLOTS} time slots.`);
      return;
    }

    const newSlot: Slot = {
      id: String(Date.now()),
      name,
      timeLabel: makeTimeLabel(hour, minute, meridiem),
      enabled: true,
    };

    setSlots((prev) => [...prev, newSlot]);
    setOpen(false);
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
        {/* Section title row */}
        <View className="flex-row items-center justify-between mt-2">
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
                    onPress={() => onRemoveSlot(slot.id)}
                    activeOpacity={0.8}
                    className="ml-3 w-9 h-9 rounded-full bg-[#F1F5F9] items-center justify-center"
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
          onPress={() => Alert.alert("Saved", "Schedule saved successfully!")}
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
                NEW SCHEDULE
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
                  placeholder=" "
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
                  {hours.slice(0, 3).map((h) => (
                    <SelectionPill
                      key={h}
                      label={pad2(h)}
                      selected={hour === h}
                      onPress={() => setHour(h)}
                    />
                  ))}
                  <View className="h-2" />
                  {/* more hours (scroll-like feel without wheel) */}
                  <View className="w-full">
                    <ScrollView
                      style={{ maxHeight: 120 }}
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
                  onPress={addSlot}
                  activeOpacity={0.9}
                  className="flex-1 bg-[#003B8F] rounded-[18px] py-4 items-center"
                >
                  <Text className="text-[13px] font-extrabold text-white">
                    Add Schedule
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
