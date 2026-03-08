// src/screens/leafHealth/LeafHealthScanScreen.tsx
import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { H1, Body, Label } from "../../components/ui/AppText";
import { predictLeafHealth } from "../../api/LeafHealthApi";
import { styles } from "./LeafHealthScanScreen.styles";

export default function LeafHealthScanScreen({ navigation }: any) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
    }
  };

  const runPredict = async () => {
    if (!imageUri) {
      return Alert.alert("Select an image first");
    }

    try {
      setLoading(true);
      const data = await predictLeafHealth(imageUri);
      navigation.navigate("LeafHealthResult", { result: data, imageUri });
    } catch (e: any) {
      Alert.alert("Prediction failed", e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        overScrollMode="never"
  >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Label style={styles.topBarTitle}>New Scan</Label>

          <View style={styles.topSpacer} />
        </View>

        <View style={styles.headerBlock}>
          <H1 style={styles.title}>Analyze Plant</H1>
          <Body style={styles.subtitle}>
            Upload a top-view leaf photo or use the mobile camera to run disease + deficiency + tipburn detection.
          </Body>
        </View>

        <TouchableOpacity
          onPress={pickImage}
          activeOpacity={0.9}
          style={styles.uploadBox}
        >
          {!imageUri ? (
            <View style={styles.uploadInner}>
              <View style={styles.uploadIconWrap}>
                <Ionicons name="arrow-up-outline" size={28} color="#0B3D91" />
              </View>
              <Label style={styles.uploadText}>Drop / Click to upload</Label>
              <Label style={styles.uploadText}>Top-view leaf image</Label>
            </View>
          ) : (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          )}
        </TouchableOpacity>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage}>
            <Ionicons name="search-outline" size={20} color="#111827" />
            <Label style={styles.secondaryBtnText}>Upload Photo</Label>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mobileCamBtn}
            onPress={() => navigation.navigate("LeafHealthCamera")}
          >
            <Ionicons name="camera-outline" size={18} color="#0B3D91" />
            <Label style={styles.mobileCamBtnText}>Use Mobile Camera</Label>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={runPredict}
          disabled={loading}
          style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="play" size={14} color="#fff" />
              <Label style={styles.primaryBtnText}>Start Analysis</Label>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <View style={styles.tipsHeaderIcon}>
              <Ionicons name="warning-outline" size={14} color="#0B3D91" />
            </View>
            <Label style={styles.tipsHeaderText}>QUICK TIPS</Label>
          </View>

          <View style={styles.tipItem}>
            <View style={[styles.tipIconBox, styles.tipIconBlue]}>
              <Ionicons name="ellipse-outline" size={18} color="#295CFF" />
            </View>
            <View style={styles.tipContent}>
              <Label style={styles.tipTitle}>Use a clear image</Label>
              <Body style={styles.tipDesc}>Keep focus and avoid motion blur.</Body>
            </View>
          </View>

          <View style={styles.tipItem}>
            <View style={[styles.tipIconBox, styles.tipIconOrange]}>
              <Ionicons name="reorder-three-outline" size={18} color="#F97316" />
            </View>
            <View style={styles.tipContent}>
              <Label style={styles.tipTitle}>Top-down view</Label>
              <Body style={styles.tipDesc}>Capture directly above the plant/leaf.</Body>
            </View>
          </View>

          <View style={styles.tipItem}>
            <View style={[styles.tipIconBox, styles.tipIconBlue]}>
              <Ionicons name="square-outline" size={16} color="#295CFF" />
            </View>
            <View style={styles.tipContent}>
              <Label style={styles.tipTitle}>One plant at a time</Label>
              <Body style={styles.tipDesc}>Keep only one leaf/plant in frame.</Body>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}