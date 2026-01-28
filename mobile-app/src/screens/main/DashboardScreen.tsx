import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

function formatHeaderDate(d: Date) {
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  return `${month} ${day} • Sunny 24°C`;
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const headerDate = useMemo(() => formatHeaderDate(new Date()), []);

  const go = (routeName: string) => {
    try {
      navigation.navigate(routeName);
    } catch {
      Alert.alert("Navigation", `Route not found: ${routeName}`);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
    <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
      <Text className="text-[13px] text-gray-500">{headerDate}</Text>

      <View className="flex-row items-start justify-between mt-2">
        <View>
          <Text className="text-[28px] font-extrabold text-gray-900 leading-[34px]">
            Good Morning,
          </Text>
          <Text className="text-[28px] font-extrabold text-[#0046AD] leading-[34px]">
            Farmer
          </Text>
        </View>

        <View className="relative mt-1">
          <Image
            source={{ uri: "https://i.pravatar.cc/100?img=12" }}
            className="w-12 h-12 rounded-full"
          />
          <View className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
        </View>
      </View>
    </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 0,
          paddingBottom: 16,
        }}
      >
        {/* Greeting Big Card */}
          

          {/* Feature 2x2 grid */}
          <View className="mt-4 ">
            <View className="flex-row justify-between ">
              <FeatureCard
                title="Weight & Growth"
                subtitle="Forecasting & Estimation"
                iconBg="bg-[#EAF4FF]"
                icon={
                  <MaterialCommunityIcons
                    name="sprout"
                    size={22}
                    color="#0046AD"
                  />
                }
                onPress={() => go("Scan")}
              />
              <FeatureCard
                title="Disease Detection"
                subtitle="Analyze Plant Health"
                iconBg="bg-[#FFEAF2]"
                icon={<Ionicons name="medkit-outline" size={22} color="#DB2777" />}
                onPress={() => go("Scan")}
              />
            </View>

            <View className="flex-row justify-between mt-3">
              <FeatureCard
                title="Spoilage Detection"
                subtitle="Identify Crop Issues"
                iconBg="bg-[#FFF6E5]"
                icon={<Ionicons name="warning-outline" size={22} color="#F59E0B" />}
                onPress={() => go("Scan")}
              />
              <FeatureCard
                title="Water Quality"
                subtitle="Monitor Sensor data"
                iconBg="bg-[#E8F7FF]"
                icon={<Ionicons name="water-outline" size={22} color="#0284C7" />}
                onPress={() => go("Scan")}
              />
            </View>
          </View>
        

        {/* Quick Actions */}
        <Text className="text-[20px] font-extrabold text-gray-900 mt-7 mb-4">
          Quick Actions
        </Text>

        <View className="flex-row justify-between">
          <QuickAction
            top="Estimate"
            bottom="Weight"
            iconBg="bg-[#EAF4FF]"
            icon={
              <MaterialCommunityIcons
                name="scale-bathroom"
                size={20}
                color="#0046AD"
              />
            }
            onPress={() => go("Scan")}
          />
          <QuickAction
            top="Monitor"
            bottom="Growth"
            iconBg="bg-[#E9FBEF]"
            icon={<Ionicons name="analytics-outline" size={20} color="#16A34A" />}
            onPress={() => go("Scan")}
          />
          <QuickAction
            top="Detect"
            bottom="Disease"
            iconBg="bg-[#FFEAF2]"
            icon={<Ionicons name="medkit-outline" size={20} color="#DB2777" />}
            onPress={() => go("Scan")}
          />
          <QuickAction
            top="Spoilage"
            bottom="Check"
            iconBg="bg-[#FFF6E5]"
            icon={<Ionicons name="warning-outline" size={20} color="#F59E0B" />}
            onPress={() => go("Scan")}
          />
        </View>

        {/* Notifications */}
        <View className="flex-row items-center justify-between mt-8 mb-4">
          <Text className="text-[20px] font-extrabold text-gray-900">
            Notifications
          </Text>

          <View className="bg-red-500 rounded-full px-4 py-2">
            <Text className="text-white text-[12px] font-bold">2 New</Text>
          </View>
        </View>

        <NotificationCard
          accent="orange"
          iconName="alert-circle"
          title="Water Tank Low"
          body="The main reservoir level is below 20%. Refill needed within 4 hours."
          time="15 mins ago"
        />

        <View className="h-3" />

        <NotificationCard
          accent="blue"
          iconName="calendar"
          title="Nutrient Schedule"
          body="Weekly nutrient mix top-up is scheduled for tomorrow morning."
          time="1 hour ago"
        />

        {/* Recent Activities */}
        <View className="flex-row items-center justify-between mt-8 mb-3">
          <Text className="text-[18px] font-extrabold text-gray-900">
            Recent Activities
          </Text>
          <TouchableOpacity onPress={() => go("History")} activeOpacity={0.8}>
            <Text className="text-[13px] font-semibold text-green-600">
              History
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-[18px] shadow-sm overflow-hidden">
          <ActivityRow
            iconBg="bg-[#EAF4FF]"
            icon={<MaterialCommunityIcons name="sprout" size={18} color="#0046AD" />}
            title="Scanned Lettuce #4"
            subtitle="Weight recorded: 245g"
            time="10:42 AM"
          />
          <Divider />
          <ActivityRow
            iconBg="bg-[#E9FBEF]"
            icon={<Ionicons name="water-outline" size={18} color="#16A34A" />}
            title="pH Adjustment"
            subtitle="Auto-balanced to 6.2"
            time="09:15 AM"
          />
          <Divider />
          <ActivityRow
            iconBg="bg-[#F3E8FF]"
            icon={<Feather name="sun" size={18} color="#7C3AED" />}
            title="Light Cycle Started"
            subtitle="Day mode activated"
            time="08:00 AM"
          />

          <TouchableOpacity
            className="py-4 items-center"
            activeOpacity={0.85}
            onPress={() => go("History")}
          >
            <Text className="text-[13px] font-semibold text-gray-700">
              View All Activity
            </Text>
          </TouchableOpacity>
        </View>

        
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- components ---------- */

function FeatureCard({
  title,
  subtitle,
  icon,
  iconBg,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-[white] rounded-[18px] p-4 w-[48%]"
    >
      <View
        className={`w-11 h-11 rounded-full ${iconBg} items-center justify-center`}
      >
        {icon}
      </View>

      <Text className="mt-4 text-[15px] font-extrabold text-gray-900">
        {title}
      </Text>
      <Text className="mt-1 text-[12px] text-gray-500">{subtitle}</Text>
    </TouchableOpacity>
  );
}

function QuickAction({
  top,
  bottom,
  icon,
  iconBg,
  onPress,
}: {
  top: string;
  bottom: string;
  icon: React.ReactNode;
  iconBg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-white rounded-[18px] w-[23%] pt-4 pb-3 items-center shadow-sm"
    >
      <View
        className={`w-11 h-11 rounded-full ${iconBg} items-center justify-center`}
      >
        {icon}
      </View>

      <View className="mt-3 items-center">
        <Text className="text-[13px] text-gray-800 font-extrabold leading-[16px]">
          {top}
        </Text>
        <Text className="text-[13px] text-gray-800 font-extrabold leading-[16px]">
          {bottom}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function NotificationCard({
  accent,
  iconName,
  title,
  body,
  time,
}: {
  accent: "orange" | "blue";
  iconName: "alert-circle" | "calendar";
  title: string;
  body: string;
  time: string;
}) {
  const leftBar = accent === "orange" ? "bg-orange-400" : "bg-blue-600";
  const iconBg = accent === "orange" ? "bg-[#FFF6E5]" : "bg-[#EAF2FF]";
  const iconColor = accent === "orange" ? "#F59E0B" : "#2563EB";

  return (
    <View className="bg-white rounded-[18px] shadow-sm overflow-hidden">
      <View className="flex-row">
        <View className={`w-1.5 ${leftBar}`} />
        <View className="flex-1 px-4 py-4">
          <View className="flex-row items-center">
            <View
              className={`w-10 h-10 rounded-[14px] ${iconBg} items-center justify-center mr-3`}
            >
              <Feather name={iconName} size={18} color={iconColor} />
            </View>

            <View className="flex-1">
              <Text className="text-[15px] font-extrabold text-gray-900">
                {title}
              </Text>
              <Text className="text-[11px] text-gray-400 mt-0.5">{time}</Text>
            </View>
          </View>

          <Text className="text-[12px] text-gray-600 mt-3 leading-[16px]">
            {body}
          </Text>
        </View>
      </View>
    </View>
  );
}

function ActivityRow({
  iconBg,
  icon,
  title,
  subtitle,
  time,
}: {
  iconBg: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  time: string;
}) {
  return (
    <View className="flex-row items-center px-4 py-4">
      <View
        className={`w-10 h-10 rounded-full ${iconBg} items-center justify-center mr-3`}
      >
        {icon}
      </View>

      <View className="flex-1">
        <Text className="text-[14px] font-extrabold text-gray-900">{title}</Text>
        <Text className="text-[11px] text-gray-500 mt-0.5">{subtitle}</Text>
      </View>

      <Text className="text-[11px] text-gray-400">{time}</Text>
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-gray-100 mx-4" />;
}
