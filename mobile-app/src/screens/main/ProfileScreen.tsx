// src/screens/main/ProfileScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../auth/useAuth";

export default function ProfileScreen({ navigation }: any) {
  const { user } = useAuth();
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");

  const handleSave = async () => {
    try {
      setSaving(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      Alert.alert("Success", "Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setName(user?.name || "");
    setEmail(user?.email || "");
    setIsEditing(false);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F4F6FA]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-9 h-9 rounded-full bg-white items-center justify-center shadow-sm"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <Text className="text-[18px] font-extrabold text-gray-900">
          My Profile
        </Text>

        {!isEditing ? (
          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            className="w-9 h-9 rounded-full bg-white items-center justify-center shadow-sm"
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={18} color="#0046AD" />
          </TouchableOpacity>
        ) : (
          <View className="w-9 h-9" />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      >
        {/* Profile Picture */}
        <View className="items-center mt-4 mb-6">
          <View className="relative">
            <Image
              source={{ uri: "https://i.pravatar.cc/150?img=12" }}
              className="w-24 h-24 rounded-full"
            />
            {isEditing && (
              <TouchableOpacity
                onPress={() => Alert.alert("Change Photo", "Feature coming soon")}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#0046AD] items-center justify-center border-2 border-white"
                activeOpacity={0.7}
              >
                <Ionicons name="camera" size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>
          {!isEditing && (
            <>
              <Text className="text-[22px] font-extrabold text-gray-900 mt-3">
                {user?.name || "User Name"}
              </Text>
              <Text className="text-[14px] text-gray-500 mt-1">
                {user?.email || "user@example.com"}
              </Text>
            </>
          )}
        </View>

        {/* Profile Info */}
        <View className="bg-white rounded-[18px] p-4 shadow-sm mb-4">
          <Text className="text-[16px] font-extrabold text-gray-900 mb-4">
            Personal Information
          </Text>

          <ProfileField
            label="Full Name"
            value={name}
            onChangeText={setName}
            icon={<Ionicons name="person-outline" size={18} color="#6B7280" />}
            editable={isEditing}
          />

          <View className="h-3" />

          <ProfileField
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            icon={<Ionicons name="mail-outline" size={18} color="#6B7280" />}
            editable={isEditing}
            keyboardType="email-address"
          />

          <View className="h-3" />

          <ProfileField
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            icon={<Ionicons name="call-outline" size={18} color="#6B7280" />}
            placeholder="+1 (555) 000-0000"
            editable={isEditing}
            keyboardType="phone-pad"
          />

          <View className="h-3" />

          <ProfileField
            label="Location"
            value={location}
            onChangeText={setLocation}
            icon={<Ionicons name="location-outline" size={18} color="#6B7280" />}
            placeholder="City, Country"
            editable={isEditing}
          />
        </View>

        {/* Bio */}
        <View className="bg-white rounded-[18px] p-4 shadow-sm mb-4">
          <Text className="text-[16px] font-extrabold text-gray-900 mb-4">
            About Me
          </Text>

          <View className="bg-gray-50 rounded-xl p-3">
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              editable={isEditing}
              className="text-[14px] text-gray-900 min-h-[80px]"
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Stats */}
        <View className="bg-white rounded-[18px] p-4 shadow-sm mb-4">
          <Text className="text-[16px] font-extrabold text-gray-900 mb-4">
            Activity Stats
          </Text>

          <View className="flex-row justify-between">
            <StatCard
              icon={<MaterialCommunityIcons name="sprout" size={24} color="#0046AD" />}
              value="48"
              label="Plants Monitored"
            />
            <StatCard
              icon={<Ionicons name="trending-up" size={24} color="#16A34A" />}
              value="156"
              label="Forecasts Made"
            />
            <StatCard
              icon={<MaterialCommunityIcons name="scale-bathroom" size={24} color="#F59E0B" />}
              value="89"
              label="Weight Scans"
            />
          </View>
        </View>

        {/* Account Settings */}
        {!isEditing && (
          <View className="bg-white rounded-[18px] p-4 shadow-sm mb-4">
            <Text className="text-[16px] font-extrabold text-gray-900 mb-4">
              Account Settings
            </Text>

            <TouchableOpacity
              onPress={() =>
                Alert.alert("Change Password", "Feature coming soon")
              }
              className="py-3 border-b border-gray-100"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                  <Text className="text-[14px] text-gray-700 ml-3 font-semibold">
                    Change Password
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Two-Factor Authentication",
                  "Secure your account with 2FA"
                )
              }
              className="py-3 border-b border-gray-100"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="shield-checkmark-outline" size={20} color="#6B7280" />
                  <Text className="text-[14px] text-gray-700 ml-3 font-semibold">
                    Two-Factor Authentication
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Delete Account",
                  "Are you sure? This action cannot be undone.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive" },
                  ]
                )
              }
              className="py-3"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  <Text className="text-[14px] text-red-500 ml-3 font-semibold">
                    Delete Account
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons (Edit Mode) */}
        {isEditing && (
          <View className="flex-row space-x-3 mt-2">
            <TouchableOpacity
              onPress={handleCancel}
              className="flex-1 py-4 rounded-xl bg-gray-200"
              activeOpacity={0.7}
              disabled={saving}
            >
              <Text className="text-center text-[16px] font-bold text-gray-700">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              className="flex-1 py-4 rounded-xl bg-[#0046AD]"
              activeOpacity={0.7}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-center text-[16px] font-bold text-white">
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* Components */

function ProfileField({
  label,
  value,
  onChangeText,
  icon,
  placeholder,
  editable,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: React.ReactNode;
  placeholder?: string;
  editable: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View>
      <View className="flex-row items-center mb-2">
        {icon}
        <Text className="text-[12px] font-semibold text-gray-500 ml-2">
          {label}
        </Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        editable={editable}
        keyboardType={keyboardType}
        className={`bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 ${
          !editable ? "opacity-60" : ""
        }`}
      />
    </View>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <View className="flex-1 items-center bg-gray-50 rounded-xl py-4 mx-1">
      {icon}
      <Text className="text-[20px] font-extrabold text-gray-900 mt-2">
        {value}
      </Text>
      <Text className="text-[11px] text-gray-500 mt-1 text-center">
        {label}
      </Text>
    </View>
  );
}
