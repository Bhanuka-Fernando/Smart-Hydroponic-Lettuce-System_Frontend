import React, { useEffect } from "react";
import { View, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";

type SplashNavProp = NativeStackNavigationProp<AuthStackParamList, "Splash">;

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashNavProp>();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Onboarding");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-between items-center py-12">
        <View className="flex-1 justify-center">
          <Image
            source={require("../../../assets/logo.png")}
            className="w-[180px] h-[180px]"
            resizeMode="contain"
          />
        </View>

        <Text className="text-[13px] tracking-[0.3px] text-gray-900 mb-2">
          Cultivating Smarter Growth
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default SplashScreen;