import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../auth/useAuth";
import { usePreferences } from "../../context/PreferencesContext";

export default function SettingsScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const {
    pushNotifications,
    setPushNotifications,
    emailNotifications,
    setEmailNotifications,
    autoSync,
    setAutoSync,
    darkMode,
    setDarkMode,
    clearCache,
    getStorageInfo,
  } = usePreferences();

  const [storageInfo, setStorageInfo] = useState({
    appData: "0 MB",
    cache: "0 MB",
    images: "0 MB",
    total: "0 MB",
  });
  const [clearingCache, setClearingCache] = useState(false);

  React.useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    const info = await getStorageInfo();
    setStorageInfo(info);
  };

  const handleClearCache = async () => {
    Alert.alert(
      "Clear Cache",
      "Are you sure you want to clear the cache? This will free up storage space.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              setClearingCache(true);
              await clearCache();
              await loadStorageInfo();
              Alert.alert("Success", "Cache cleared successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to clear cache");
            } finally {
              setClearingCache(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert("Error", "Failed to logout");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Header - Matching DashboardScreen */}
      <View className="px-4 pt-4 pb-3 bg-white">
        <Text className="text-[24px] font-extrabold text-gray-900">Settings</Text>
        <Text className="text-[11px] text-gray-500 mt-1 font-semibold tracking-[0.4px]">
          Manage your preferences
        </Text>
      </View>

      <View className="flex-1 bg-[#F4F6FA]">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        >
        {/* Profile Section */}
        <View className="mt-4">
          <Text className="text-[20px] font-extrabold text-gray-900 mb-3">Profile</Text>
          
          <View className="bg-white rounded-[18px] p-4 shadow-slate-50">
            <View className="flex-row items-center">
              <Image
                source={{ uri: "https://i.pravatar.cc/100?img=12" }}
                className="w-14 h-14 rounded-full"
              />
              <View className="ml-3 flex-1">
                <Text className="text-[16px] font-extrabold text-gray-900">
                  {user?.name || "User Name"}
                </Text>
                <Text className="text-[12px] text-gray-500 mt-0.5">
                  {user?.email || "user@example.com"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => Alert.alert("Edit Profile", "Feature coming soon")}
                className="w-9 h-9 rounded-full bg-[#F3F4F6] items-center justify-center"
                activeOpacity={0.85}
              >
                <Ionicons name="pencil" size={16} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View className="mt-6">
          <Text className="text-[20px] font-extrabold text-gray-900 mb-3">Notifications</Text>

          <View className="bg-white rounded-[18px] shadow-sm overflow-hidden">
            <SettingRow
              icon={<Ionicons name="notifications-outline" size={20} color="#0046AD" />}
              iconBg="bg-[#EAF4FF]"
              title="Push Notifications"
              subtitle="Receive alerts on device"
              rightComponent={
                <Switch
                  value={pushNotifications}
                  onValueChange={setPushNotifications}
                  trackColor={{ false: "#D1D5DB", true: "#0046AD" }}
                  thumbColor="#FFFFFF"
                />
              }
            />

            <Divider />

            <SettingRow
              icon={<Ionicons name="mail-outline" size={20} color="#16A34A" />}
              iconBg="bg-[#E9FBEF]"
              title="Email Notifications"
              subtitle="Get updates via email"
              rightComponent={
                <Switch
                  value={emailNotifications}
                  onValueChange={setEmailNotifications}
                  trackColor={{ false: "#D1D5DB", true: "#0046AD" }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          </View>
        </View>

        {/* App Settings */}
        <View className="mt-6">
          <Text className="text-[20px] font-extrabold text-gray-900 mb-3">App Settings</Text>

          <View className="bg-white rounded-[18px] shadow-sm overflow-hidden">
            <SettingRow
              icon={<Ionicons name="sync-outline" size={20} color="#0284C7" />}
              iconBg="bg-[#E8F7FF]"
              title="Auto Sync"
              subtitle="Sync data automatically"
              rightComponent={
                <Switch
                  value={autoSync}
                  onValueChange={setAutoSync}
                  trackColor={{ false: "#D1D5DB", true: "#0046AD" }}
                  thumbColor="#FFFFFF"
                />
              }
            />

            <Divider />

            <SettingRow
              icon={<Ionicons name="moon-outline" size={20} color="#7C3AED" />}
              iconBg="bg-[#F3E8FF]"
              title="Dark Mode"
              subtitle="Toggle dark theme"
              rightComponent={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: "#D1D5DB", true: "#0046AD" }}
                  thumbColor="#FFFFFF"
                />
              }
            />

            <Divider />

            <TouchableOpacity
              onPress={() => Alert.alert("Language", "Feature coming soon")}
              activeOpacity={0.85}
            >
              <SettingRow
                icon={<Ionicons name="language-outline" size={20} color="#F59E0B" />}
                iconBg="bg-[#FFF6E5]"
                title="Language"
                subtitle="English"
                rightComponent={<Ionicons name="chevron-forward" size={18} color="#9CA3AF" />}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* System */}
        <View className="mt-6">
          <Text className="text-[20px] font-extrabold text-gray-900 mb-3">System</Text>

          <View className="bg-white rounded-[18px] shadow-sm overflow-hidden">
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Storage",
                  `App data: ${storageInfo.appData}\nCache: ${storageInfo.cache}\nImages: ${storageInfo.images}\n\nTotal: ${storageInfo.total}`
                )
              }
              activeOpacity={0.85}
            >
              <SettingRow
                icon={<Ionicons name="folder-outline" size={20} color="#0046AD" />}
                iconBg="bg-[#EAF4FF]"
                title="Storage"
                subtitle={storageInfo.total + " used"}
                rightComponent={<Ionicons name="chevron-forward" size={18} color="#9CA3AF" />}
              />
            </TouchableOpacity>

            <Divider />

            <TouchableOpacity onPress={handleClearCache} activeOpacity={0.85} disabled={clearingCache}>
              <SettingRow
                icon={<Ionicons name="trash-outline" size={20} color="#EF4444" />}
                iconBg="bg-[#FFEAF2]"
                title="Clear Cache"
                subtitle="Free up storage"
                rightComponent={
                  clearingCache ? (
                    <ActivityIndicator size="small" color="#0046AD" />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  )
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View className="mt-6">
          <Text className="text-[20px] font-extrabold text-gray-900 mb-3">About</Text>

          <View className="bg-white rounded-[18px] shadow-sm overflow-hidden">
            <TouchableOpacity
              onPress={() => Alert.alert("Terms & Conditions", "Terms content here...")}
              activeOpacity={0.85}
            >
              <SettingRow
                icon={<Ionicons name="document-text-outline" size={20} color="#6B7280" />}
                iconBg="bg-gray-100"
                title="Terms & Conditions"
                rightComponent={<Ionicons name="chevron-forward" size={18} color="#9CA3AF" />}
              />
            </TouchableOpacity>

            <Divider />

            <TouchableOpacity
              onPress={() => Alert.alert("Privacy Policy", "Privacy policy content here...")}
              activeOpacity={0.85}
            >
              <SettingRow
                icon={<Ionicons name="shield-checkmark-outline" size={20} color="#6B7280" />}
                iconBg="bg-gray-100"
                title="Privacy Policy"
                rightComponent={<Ionicons name="chevron-forward" size={18} color="#9CA3AF" />}
              />
            </TouchableOpacity>

            <Divider />

            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "App Version",
                  "Version 1.0.0 (Build 1)\n\nSmart Hydroponic Lettuce System\n© 2026"
                )
              }
              activeOpacity={0.85}
            >
              <SettingRow
                icon={<Ionicons name="information-circle-outline" size={20} color="#6B7280" />}
                iconBg="bg-gray-100"
                title="App Version"
                subtitle="1.0.0"
                rightComponent={<Ionicons name="chevron-forward" size={18} color="#9CA3AF" />}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="mt-6 bg-white rounded-[18px] p-4 shadow-slate-50"
          activeOpacity={0.85}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text className="text-[16px] font-extrabold text-red-500 ml-2">Logout</Text>
          </View>
        </TouchableOpacity>

        {/* Footer */}
        <Text className="text-center text-[11px] text-gray-400 mt-6">
          Smart Hydroponic Lettuce System{"\n"}Version 1.0.0 © 2026
        </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* Components */

function SettingRow({
  icon,
  iconBg,
  title,
  subtitle,
  rightComponent,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  rightComponent?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center p-4">
      <View className={`w-10 h-10 rounded-full ${iconBg} items-center justify-center mr-3`}>
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-[14px] font-extrabold text-gray-900">{title}</Text>
        {subtitle && <Text className="text-[11px] text-gray-500 mt-0.5">{subtitle}</Text>}
      </View>
      {rightComponent}
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-gray-100 mx-4" />;
}
