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
    language,
    clearCache,
    getStorageInfo,
    loading,
  } = usePreferences();

  const [storageInfo, setStorageInfo] = useState({
    appData: "0 MB",
    cache: "0 MB",
    images: "0 MB",
    total: "0 MB",
  });
  const [clearingCache, setClearingCache] = useState(false);

  // Load storage info on mount
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

  const handleViewProfile = () => {
    navigation.navigate("Profile");
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
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
      ]
    );
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      {/* Header */}
      <View className="px-4 pt-4 pb-3">
        <Text className="text-[24px] font-extrabold text-gray-900">
          Settings
        </Text>
        <Text className="text-[11px] text-gray-500 mt-1 font-semibold tracking-[0.4px]">
          Manage your account and preferences
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      >
        {/* Profile Section */}
        <View className="bg-white rounded-[18px] p-4 shadow-sm mb-4">
          <Text className="text-[13px] font-extrabold text-gray-900 mb-4 tracking-[0.6px]">
            PROFILE
          </Text>

          <View className="flex-row items-center mb-4">
            <Image
              source={{ uri: "https://i.pravatar.cc/100?img=12" }}
              className="w-16 h-16 rounded-full"
            />
            <View className="ml-4 flex-1">
              <Text className="text-[18px] font-extrabold text-gray-900">
                {user?.name || "User Name"}
              </Text>
              <Text className="text-[13px] text-gray-500 mt-1">
                {user?.email || "user@example.com"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => Alert.alert("Edit Profile", "Feature coming soon")}
              className="w-9 h-9 rounded-full bg-[#F3F4F6] items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={16} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleViewProfile}
            className="py-3 border-t border-gray-100"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="person-outline" size={20} color="#6B7280" />
                <Text className="text-[14px] text-gray-700 ml-3 font-semibold">
                  View Full Profile
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <View className="bg-white rounded-[18px] p-4 shadow-sm mb-4">
          <Text className="text-[13px] font-extrabold text-gray-900 mb-4 tracking-[0.6px]">
            NOTIFICATIONS
          </Text>

          <SettingRow
            icon={<Ionicons name="notifications-outline" size={20} color="#6B7280" />}
            title="Push Notifications"
            subtitle="Receive alerts on your device"
            rightComponent={
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: "#D1D5DB", true: "#0046AD" }}
                thumbColor="#FFFFFF"
              />
            }
          />

          <View className="h-px bg-gray-100 my-3" />

          <SettingRow
            icon={<Ionicons name="mail-outline" size={20} color="#6B7280" />}
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

        {/* App Settings */}
        <View className="bg-white rounded-[18px] p-4 shadow-sm mb-4">
          <Text className="text-[13px] font-extrabold text-gray-900 mb-4 tracking-[0.6px]">
            APP SETTINGS
          </Text>

          <SettingRow
            icon={<Ionicons name="sync-outline" size={20} color="#6B7280" />}
            title="Auto Sync"
            subtitle="Automatically sync data"
            rightComponent={
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: "#D1D5DB", true: "#0046AD" }}
                thumbColor="#FFFFFF"
              />
            }
          />

          <View className="h-px bg-gray-100 my-3" />

          <SettingRow
            icon={<Ionicons name="moon-outline" size={20} color="#6B7280" />}
            title="Dark Mode"
            subtitle="Switch between light and dark theme"
            rightComponent={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: "#D1D5DB", true: "#0046AD" }}
                thumbColor="#FFFFFF"
              />
            }
          />

          <View className="h-px bg-gray-100 my-3" />

          <TouchableOpacity
            onPress={() => Alert.alert("Language", "Feature coming soon")}
            activeOpacity={0.7}
          >
            <SettingRow
              icon={<Ionicons name="language-outline" size={20} color="#6B7280" />}
              title="Language"
              subtitle="English"
              rightComponent={
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              }
            />
          </TouchableOpacity>
        </View>

        {/* System */}
        <View className="bg-white rounded-[18px] p-4 shadow-sm mb-4">
          <Text className="text-[13px] font-extrabold text-gray-900 mb-4 tracking-[0.6px]">
            SYSTEM
          </Text>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                "Storage",
                `App data: ${storageInfo.appData}\nCache: ${storageInfo.cache}\nImages: ${storageInfo.images}\n\nTotal: ${storageInfo.total}`
              )
            }
            activeOpacity={0.7}
          >
            <SettingRow
              icon={<Ionicons name="folder-outline" size={20} color="#6B7280" />}
              title="Storage"
              subtitle={storageInfo.total + " used"}
              rightComponent={
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              }
            />
          </TouchableOpacity>

          <View className="h-px bg-gray-100 my-3" />

          <TouchableOpacity
            onPress={handleClearCache}
            activeOpacity={0.7}
            disabled={clearingCache}
          >
            <SettingRow
              icon={<Ionicons name="trash-outline" size={20} color="#6B7280" />}
              title="Clear Cache"
              subtitle="Free up storage space"
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

        {/* About */}
        <View className="bg-white rounded-[18px] p-4 shadow-sm mb-4">
          <Text className="text-[13px] font-extrabold text-gray-900 mb-4 tracking-[0.6px]">
            ABOUT
          </Text>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                "Terms & Conditions",
                "Terms and conditions content here..."
              )
            }
            activeOpacity={0.7}
          >
            <SettingRow
              icon={<Ionicons name="document-text-outline" size={20} color="#6B7280" />}
              title="Terms & Conditions"
              rightComponent={
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              }
            />
          </TouchableOpacity>

          <View className="h-px bg-gray-100 my-3" />

          <TouchableOpacity
            onPress={() =>
              Alert.alert("Privacy Policy", "Privacy policy content here...")
            }
            activeOpacity={0.7}
          >
            <SettingRow
              icon={<Ionicons name="shield-checkmark-outline" size={20} color="#6B7280" />}
              title="Privacy Policy"
              rightComponent={
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              }
            />
          </TouchableOpacity>

          <View className="h-px bg-gray-100 my-3" />

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                "App Version",
                "Version 1.0.0 (Build 1)\n\nSmart Hydroponic Lettuce System\n© 2026"
              )
            }
            activeOpacity={0.7}
          >
            <SettingRow
              icon={<Ionicons name="information-circle-outline" size={20} color="#6B7280" />}
              title="App Version"
              subtitle="1.0.0"
              rightComponent={
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              }
            />
          </TouchableOpacity>
        </View>

        {/* Help & Support */}
        <View className="bg-white rounded-[18px] p-4 shadow-sm mb-4">
          <Text className="text-[13px] font-extrabold text-gray-900 mb-4 tracking-[0.6px]">
            HELP & SUPPORT
          </Text>

          <TouchableOpacity
            onPress={() => Alert.alert("Help Center", "Opening help center...")}
            activeOpacity={0.7}
          >
            <SettingRow
              icon={<Ionicons name="help-circle-outline" size={20} color="#6B7280" />}
              title="Help Center"
              rightComponent={
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              }
            />
          </TouchableOpacity>

          <View className="h-px bg-gray-100 my-3" />

          <TouchableOpacity
            onPress={() =>
              Alert.alert("Contact Support", "Email: support@hydroponics.com")
            }
            activeOpacity={0.7}
          >
            <SettingRow
              icon={<Ionicons name="chatbubble-outline" size={20} color="#6B7280" />}
              title="Contact Support"
              rightComponent={
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              }
            />
          </TouchableOpacity>

          <View className="h-px bg-gray-100 my-3" />

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                "Report a Bug",
                "Please describe the issue you encountered"
              )
            }
            activeOpacity={0.7}
          >
            <SettingRow
              icon={<MaterialCommunityIcons name="bug-outline" size={20} color="#6B7280" />}
              title="Report a Bug"
              rightComponent={
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              }
            />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-white rounded-[18px] p-4 shadow-sm mb-4"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text className="text-[16px] font-extrabold text-red-500 ml-2">
              Logout
            </Text>
          </View>
        </TouchableOpacity>

        {/* Footer */}
        <Text className="text-center text-[12px] text-gray-400 mt-4">
          Smart Hydroponic Lettuce System{"\n"}Version 1.0.0 © 2026
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/* Components */

function SettingRow({
  icon,
  title,
  subtitle,
  rightComponent,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  rightComponent?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        {icon}
        <View className="ml-3 flex-1">
          <Text className="text-[14px] font-semibold text-gray-900">
            {title}
          </Text>
          {subtitle && (
            <Text className="text-[12px] text-gray-500 mt-0.5">{subtitle}</Text>
          )}
        </View>
      </View>
      {rightComponent}
    </View>
  );
}

