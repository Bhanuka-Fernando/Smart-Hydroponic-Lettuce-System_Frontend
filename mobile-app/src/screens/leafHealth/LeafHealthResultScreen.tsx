import React from "react";
import {
  View,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { H1, H2, Body, Label } from "../../components/ui/AppText";
import { saveLeafHealthLog } from "../../api/LeafHealthApi";
import { styles } from "./LeafHealthResultScreen.styles";

export default function LeafHealthResultScreen({ route, navigation }: any) {
  const { result, imageUri } = route.params;

  const saveLog = async () => {
    try {
      await saveLeafHealthLog({
        plant_id: result.plant_id,
        captured_at: result.captured_at,
        health_score: result.health_score,
        status: result.status,
        main_issue: result.primary_issue || result.main_issue,
        probs: result.probs,
        tipburn: result.tipburn,
        image_name: result.image_name,
      });
      Alert.alert("Saved", "Saved to daily log");
    } catch (e: any) {
      Alert.alert("Save failed", e?.message || "Unknown error");
    }
  };

  const top3 = result.top3_probs || {};
  const issue = result.primary_issue || result.main_issue || "Unknown";

  const scoreColor =
    result.health_score >= 80
      ? "#15803D"
      : result.health_score >= 60
      ? "#D97706"
      : "#DC2626";

  const statusBg =
    result.status === "OK"
      ? "#E8F7ED"
      : result.status === "WATCH"
      ? "#FFF2DD"
      : "#FDE8E8";

  const statusText =
    result.status === "OK"
      ? "#15803D"
      : result.status === "WATCH"
      ? "#C2410C"
      : "#B91C1C";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Label style={styles.topBarTitle}>Health Report</Label>

          <View style={styles.topSpacer} />
        </View>

        <View style={styles.imageCard}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.imageFallback}>
              <Body>No image</Body>
            </View>
          )}

          <View style={styles.plantTag}>
            <Label style={styles.plantTagText}>{result.plant_id || "Plant #01"}</Label>
          </View>

          <View style={styles.timeTag}>
            <Label style={styles.timeTagText}>{result.image_name || "IMG_012 • 10:42 AM"}</Label>
          </View>
        </View>

        <View style={styles.scoreCard}>
          <Label style={styles.smallMuted}>HEALTH SCORE</Label>

          <View style={styles.scoreRow}>
            <View>
              <H1 style={[styles.scoreText, { color: scoreColor }]}>
                {result.health_score ?? 0}
              </H1>

              <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                <Label style={[styles.statusPillText, { color: statusText }]}>
                  {result.status === "WATCH" ? "Warning" : result.status}
                </Label>
              </View>
            </View>

            <View style={styles.warningIconWrap}>
              <Ionicons name="warning-outline" size={26} color="#0B3D91" />
            </View>
          </View>

          <Body style={styles.metaText}>
            Main issue: <Label style={styles.metaBold}>{issue}</Label>
          </Body>

          <Body style={styles.metaText}>
            Severity:{" "}
            <Label style={styles.metaBold}>
              {result.status === "ACT NOW"
                ? "High"
                : result.status === "WATCH"
                ? "Medium"
                : "Low"}
            </Label>
          </Body>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.halfCard}>
            <Body style={styles.cardLabel}>Top prediction</Body>
            <Label style={styles.bigValue}>
              {Object.keys(top3).length > 0
                ? `${Object.entries(top3)[0][0]} (${Number(Object.entries(top3)[0][1]).toFixed(2)})`
                : issue}
            </Label>

            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>

          <View style={styles.halfCard}>
            <Body style={styles.cardLabel}>Tipburn risk</Body>
            <Label style={styles.bigValue}>{(result.tipburn?.C ?? 0).toFixed(2)}</Label>
            <Body style={styles.smallHint}>
              Boxes: {result.tipburn?.num_boxes ?? 0} • Area ratio: {(result.tipburn?.A ?? 0).toFixed(2)}
            </Body>
          </View>
        </View>

        <View style={styles.explainCard}>
          <H2 style={styles.explainTitle}>Explanations</H2>

          <Body style={styles.sectionSub}>Classifier — Top 3 probabilities</Body>

          {Object.keys(top3).length === 0 ? (
            <Body style={styles.emptyTop3Text}>No top3_probs returned</Body>
          ) : (
            Object.entries(top3).map(([k, v]: any) => (
              <View key={k} style={styles.rowBetween}>
                <Body style={styles.rowLeft}>{k}</Body>
                <Label style={styles.rowRight}>{Number(v).toFixed(2)}</Label>
              </View>
            ))
          )}

          <Body style={styles.sectionSubTipburn}>Tipburn — Detector stats</Body>

          <View style={styles.rowBetween}>
            <Body style={styles.rowLeft}>Boxes count</Body>
            <Label style={styles.rowRight}>{result.tipburn?.num_boxes ?? 0}</Label>
          </View>
        </View>

        <TouchableOpacity onPress={saveLog} style={styles.primaryBtn}>
          <Label style={styles.primaryBtnText}>Save to Daily Log</Label>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("LeafHealthScan")}
          style={styles.secondaryBtn}
        >
          <Label style={styles.secondaryBtnText}>New Scan</Label>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}