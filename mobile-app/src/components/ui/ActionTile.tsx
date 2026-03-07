import React from "react";
import { TouchableOpacity, Text, View } from "react-native";

type ActionTileProps = {
  iconBg: string;
  icon: React.ReactNode;
  labelTop: string;
  labelBottom: string;
  onPress: () => void;
};

export default function ActionTile({
  iconBg,
  icon,
  labelTop,
  labelBottom,
  onPress,
}: ActionTileProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="bg-white rounded-[18px] p-4 w-[31%] items-center"
    >
      <View className={`w-11 h-11 rounded-full ${iconBg} items-center justify-center`}>
        {icon}
      </View>
      <Text className="mt-3 text-[12px] font-bold text-gray-700">{labelTop}</Text>
      <Text className="text-[12px] font-bold text-gray-900">{labelBottom}</Text>
    </TouchableOpacity>
  );
}