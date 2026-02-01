import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<AuthStackParamList, "Onboarding">;

const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-4">
        {/* Logo */}
        <View className="items-center mt-2 mb-3">
          <Image
            source={require("../../../assets/logo.png")}
            className="w-16 h-16"
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text className="text-[22px] font-bold text-center text-gray-900">
          Welcome to
        </Text>
        <Text className="text-[22px] font-bold text-center text-gray-900 mb-3">
          Asia Plantation
        </Text>

        {/* Subtitle */}
        <Text className="text-[13px] text-center text-gray-500 mb-5 leading-[18px]">
          Your smart solution for Hydroponic farm management. Monitor Growth,
          Detect issues and ensure quality with ease
        </Text>

        {/* Feature cards */}
        <View className="mb-6">
          <FeatureCard
            icon={<Ionicons name="analytics-outline" size={22} color="#0046AD" />}
            title="Monitor Growth"
            subtitle="Track key metrics in real-time."
          />
          <FeatureCard
            icon={<Ionicons name="alert-circle-outline" size={22} color="#0046AD" />}
            title="Detect Deficiencies"
            subtitle="Get early alerts for plant health."
          />
          <FeatureCard
            icon={
              <MaterialCommunityIcons
                name="check-decagram-outline"
                size={22}
                color="#0046AD"
              />
            }
            title="Assess Quality"
            subtitle="Ensure your harvest meets standards."
          />
          <FeatureCard
            icon={<MaterialCommunityIcons name="scale-bathroom" size={22} color="#0046AD" />}
            title="Weight Estimation"
            subtitle="Ensure weights of the plants at harvest."
          />
        </View>

        {/* Buttons */}
        <View className="mt-2">
          <TouchableOpacity
            className="h-[52px] rounded-[10px] bg-primary items-center justify-center mb-3"
            onPress={() => navigation.navigate("Register")}
          >
            <Text className="text-white text-[15px] font-semibold">
              Create an Account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="h-[52px] rounded-[10px] bg-gray-200 items-center justify-center"
            onPress={() => navigation.navigate("Login")}
          >
            <Text className="text-gray-900 text-[15px] font-semibold">Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
};

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, subtitle }) => {
  return (
    <View className="flex-row items-center bg-lightgray rounded-xl px-4 py-3 mb-3">
      <View className="w-9 h-9 rounded-full bg-[#E5EDF8] items-center justify-center mr-3">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-[14px] font-semibold text-gray-900 mb-0.5">
          {title}
        </Text>
        <Text className="text-[11px] text-gray-500">{subtitle}</Text>
      </View>
    </View>
  );
};

export default OnboardingScreen;
