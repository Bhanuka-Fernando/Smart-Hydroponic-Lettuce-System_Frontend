import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  TextInput,
} from "react-native";

type Key = "airT" | "RH" | "EC" | "pH";

type Props = {
  visible: boolean;
  mode?: "all" | "single";
  singleKey?: Key;
  initial?: { airT: number | null; RH: number | null; EC: number | null; pH: number | null };
  onClose: () => void;
  onSubmit: (vals: { airT: number | null; RH: number | null; EC: number | null; pH: number | null }) => void;
};

function Field({
  label,
  suffix,
  value,
  onChange,
  autoFocus,
}: {
  label: string;
  suffix?: string;
  value: string;
  onChange: (t: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="text-[12px] font-extrabold text-gray-700 mb-2">{label}</Text>
      <View className="flex-row items-center bg-[#F8FAFC] border border-gray-200 rounded-[16px] px-4 py-3">
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor="#94A3B8"
          className="flex-1 text-[14px] font-extrabold text-gray-900"
          autoFocus={autoFocus}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        {suffix ? <Text className="text-[12px] font-bold text-gray-400 ml-2">{suffix}</Text> : null}
      </View>
    </View>
  );
}

const toStr = (n: number | null | undefined) => (n == null ? "" : String(n));

const parseNum = (s: string) => {
  const t = s.replace(",", ".").trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export default function SensorReadingsModal({
  visible,
  mode = "all",
  singleKey = "airT",
  initial,
  onClose,
  onSubmit,
}: Props) {
  const onlyKeys: Key[] = useMemo(() => {
    if (mode === "single") return [singleKey];
    return ["airT", "RH", "EC", "pH"];
  }, [mode, singleKey]);

  const [airT, setAirT] = useState("");
  const [RH, setRH] = useState("");
  const [EC, setEC] = useState("");
  const [pH, setPH] = useState("");

  useEffect(() => {
    if (!visible) return;
    setAirT(toStr(initial?.airT));
    setRH(toStr(initial?.RH));
    setEC(toStr(initial?.EC));
    setPH(toStr(initial?.pH));
  }, [visible, initial?.airT, initial?.RH, initial?.EC, initial?.pH]);

  const title = mode === "single" ? "Update Sensor Reading" : "Update Sensor Readings";

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSave = () => {
    const vals = {
      airT: parseNum(airT),
      RH: parseNum(RH),
      EC: parseNum(EC),
      pH: parseNum(pH),
    };

    onSubmit(vals);
    Keyboard.dismiss();
    onClose();
  };

  const renderField = (k: Key, idx: number) => {
    if (k === "airT")
      return (
        <Field
          key="airT"
          label="Temperature"
          suffix="°C"
          value={airT}
          onChange={setAirT}
          autoFocus={idx === 0}
        />
      );
    if (k === "RH")
      return (
        <Field
          key="RH"
          label="Humidity"
          suffix="%"
          value={RH}
          onChange={setRH}
          autoFocus={idx === 0}
        />
      );
    if (k === "EC")
      return (
        <Field
          key="EC"
          label="EC"
          suffix="ms/cm"
          value={EC}
          onChange={setEC}
          autoFocus={idx === 0}
        />
      );
    return (
      <Field
        key="pH"
        label="pH"
        value={pH}
        onChange={setPH}
        autoFocus={idx === 0}
      />
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      {/* backdrop */}
      <Pressable className="flex-1 bg-black/40" onPress={handleClose} />

      {/* bottom sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
      >
        <View className="bg-white rounded-t-[22px] px-5 pt-4 pb-3">
          {/* grabber */}
          <View className="w-10 h-1.5 rounded-full bg-gray-200 self-center mb-3" />

          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-[14px] font-extrabold text-gray-900">{title}</Text>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.8} className="w-9 h-9 items-center justify-center">
              <Text className="text-[18px] font-extrabold text-gray-400">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 10 }}
            style={{ maxHeight: 320 }}
          >
            {onlyKeys.map((k, idx) => renderField(k, idx))}
          </ScrollView>

          {/* footer always visible */}
          <View className="flex-row" style={{ gap: 12 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleClose}
              className="flex-1 border border-gray-200 rounded-[16px] py-4 items-center justify-center"
            >
              <Text className="text-[12px] font-extrabold text-gray-900">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSave}
              className="flex-1 bg-[#003B8F] rounded-[16px] py-4 items-center justify-center"
            >
              <Text className="text-[12px] font-extrabold text-white">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
