import React, { useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { H1, Body, Label } from "../../components/ui/AppText";
import { predictLeafHealth } from "../../api/LeafHealthApi";
import { styles } from "./LeafHealthCameraScreen.styles";

export default function LeafHealthCameraScreen({ navigation }: any) {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const takePhoto = async () => {
    try {
      if (!cameraRef.current) {
        Alert.alert("Camera not ready", "Camera ref is not available yet.");
        return;
      }

      if (!cameraReady) {
        Alert.alert("Camera not ready", "Please wait a moment and try again.");
        return;
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
      });

      if (photo?.uri) {
        setCapturedUri(photo.uri);
      }
    } catch (e: any) {
      Alert.alert("Camera error", e?.message || "Failed to capture image");
    }
  };

  const retake = () => {
    setCapturedUri(null);
  };

  const analyzePhoto = async () => {
    if (!capturedUri) {
      Alert.alert("No image", "Capture an image first");
      return;
    }

    try {
      setLoading(true);
      const data = await predictLeafHealth(capturedUri);
      navigation.navigate("LeafHealthResult", {
        result: data,
        imageUri: capturedUri,
      });
    } catch (e: any) {
      Alert.alert("Prediction failed", e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#0B3D91" />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#111827" />
            </TouchableOpacity>
            <Label style={styles.topTitle}>Mobile Camera</Label>
            <View style={styles.topSpacer} />
          </View>

          <View style={styles.permissionCard}>
            <H1 style={styles.permissionTitle}>Camera access needed</H1>
            <Body style={styles.permissionText}>
              Allow camera permission to capture a top-view leaf image.
            </Body>

            <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
              <Label style={styles.primaryBtnText}>Allow Camera</Label>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Label style={styles.topTitle}>Mobile Camera</Label>
          <View style={styles.topSpacer} />
        </View>

        <View style={styles.cameraCard}>
          {!capturedUri ? (
            <View style={styles.cameraWrapper}>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="back"
                onCameraReady={() => setCameraReady(true)}
              />

              <View style={styles.overlayTop}>
                <View style={styles.hintPill}>
                  <Label style={styles.hintText}>Align leaf in frame</Label>
                </View>

                <View style={styles.livePill}>
                  <Label style={styles.liveText}>LIVE • MOBILE CAM</Label>
                </View>
              </View>

              <View style={styles.frameBox} />
            </View>
          ) : (
            <Image source={{ uri: capturedUri }} style={styles.camera} />
          )}
        </View>

        {!capturedUri ? (
          <View style={styles.bottomRow}>
            <TouchableOpacity style={styles.refreshBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="close-outline" size={22} color="#111827" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
              <Ionicons name="camera" size={18} color="#fff" />
              <Label style={styles.captureBtnText}>Capture Frame</Label>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bottomRow}>
            <TouchableOpacity style={styles.refreshBtn} onPress={retake}>
              <Ionicons name="refresh" size={22} color="#111827" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.captureBtn, loading && styles.captureBtnDisabled]}
              onPress={analyzePhoto}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="sparkles-outline" size={18} color="#fff" />
                  <Label style={styles.captureBtnText}>Analyze Capture</Label>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}