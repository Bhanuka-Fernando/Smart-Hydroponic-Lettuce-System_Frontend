import React, { useMemo, useState } from "react";
import {
  View,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Buffer } from "buffer";
import { H1, H2, Body, Label } from "../../components/ui/AppText";
import {
  buildLeafHealthImageUrl,
  predictLeafHealthAnnotated,
  saveLeafHealthLog,
} from "../../api/LeafHealthApi";
import { styles } from "./LeafHealthResultScreen.styles";

function formatSeverity(status?: string) {
  if (status === "ACT NOW") return "High";
  if (status === "WATCH") return "Medium";
  return "Low";
}

function formatStatusLabel(status?: string) {
  if (status === "WATCH") return "Warning";
  return status || "Unknown";
}

export default function LeafHealthResultScreen({ route, navigation }: any) {
  const { result, imageUri } = route.params || {};

  const backendImageUri = buildLeafHealthImageUrl(result?.image_path);
  const displayImageUri = imageUri || backendImageUri;

  const [annotating, setAnnotating] = useState(false);
  const [annotatedVisible, setAnnotatedVisible] = useState(false);
  const [annotatedImageUri, setAnnotatedImageUri] = useState<string | null>(null);

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
        image_path: result.image_path,
        reason: result.reason,
        classification_label: result.classification_label,
        classification_confidence: result.classification_confidence,
        raw_result: result.raw_result || result,
      });
      Alert.alert("Saved", "Saved to daily log");
    } catch (e: any) {
      Alert.alert("Save failed", e?.message || "Unknown error");
    }
  };

  const handleAnnotateTipburn = async () => {
    if (!imageUri) {
      Alert.alert(
        "Not available",
        "Annotated view is currently available only right after a fresh scan or upload."
      );
      return;
    }

    try {
      setAnnotating(true);
      const arrayBuffer = await predictLeafHealthAnnotated(imageUri);
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const dataUri = `data:image/png;base64,${base64}`;
      setAnnotatedImageUri(dataUri);
      setAnnotatedVisible(true);
    } catch (e: any) {
      Alert.alert("Annotation failed", e?.message || "Could not generate annotated image");
    } finally {
      setAnnotating(false);
    }
  };

  const top3 = useMemo(() => {
    if (result?.top3_probs) return result.top3_probs;
    if (!result?.probs) return {};
    return Object.fromEntries(
      Object.entries(result.probs)
        .sort((a: any, b: any) => Number(b[1]) - Number(a[1]))
        .slice(0, 3)
    );
  }, [result]);

  const issue = result?.primary_issue || result?.main_issue || "Unknown";
  const topPredictionName =
    Object.keys(top3).length > 0 ? Object.entries(top3)[0][0] : issue;
  const topPredictionValue =
    Object.keys(top3).length > 0 ? Number(Object.entries(top3)[0][1]) : 0;

  const scoreColor =
    result?.health_score >= 80
      ? "#15803D"
      : result?.health_score >= 60
      ? "#D97706"
      : "#111827";

  const statusBg =
    result?.status === "OK"
      ? "#E8F7ED"
      : result?.status === "WATCH"
      ? "#FDE7D8"
      : "#FDE8E8";

  const statusText =
    result?.status === "OK"
      ? "#15803D"
      : result?.status === "WATCH"
      ? "#C2410C"
      : "#B91C1C";

  const canAnnotate = !!imageUri && (result?.tipburn?.num_boxes ?? 0) > 0;

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
          {displayImageUri ? (
            <Image source={{ uri: displayImageUri }} style={styles.image} />
          ) : (
            <View style={styles.imageFallback}>
              <Ionicons name="leaf-outline" size={34} color="#173C96" />
              <Body>No scan image available</Body>
            </View>
          )}

          <View style={styles.plantTag}>
            <Label style={styles.plantTagText}>{result?.plant_id || "Plant #01"}</Label>
          </View>

          <View style={styles.timeTag}>
            <Label style={styles.timeTagText}>
              {result?.image_name || result?.captured_at || "Leaf Scan"}
            </Label>
          </View>
        </View>

        {canAnnotate && (
          <TouchableOpacity
            onPress={handleAnnotateTipburn}
            disabled={annotating}
            style={styles.annotateBtn}
          >
            {annotating ? (
              <ActivityIndicator color="#173C96" />
            ) : (
              <>
                <Ionicons name="scan-outline" size={18} color="#173C96" />
                <Label style={styles.annotateBtnText}>Annotate Tipburn Areas</Label>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.scoreCard}>
          <Label style={styles.smallMuted}>HEALTH SCORE</Label>

          <View style={styles.scoreRow}>
            <View style={styles.scoreLeft}>
              <H1 style={[styles.scoreText, { color: scoreColor }]}>
                {result?.health_score ?? 0}
              </H1>

              <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                <Label style={[styles.statusPillText, { color: statusText }]}>
                  {formatStatusLabel(result?.status)}
                </Label>
              </View>
            </View>

            <View style={styles.warningIconWrap}>
              <Ionicons name="warning-outline" size={24} color="#0B3D91" />
            </View>
          </View>

          <Body style={styles.metaSummary}>
            Main issue: <Label style={styles.metaBold}>{issue}</Label>
            {" • "}
            Severity: <Label style={styles.metaBold}>{formatSeverity(result?.status)}</Label>
          </Body>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.halfCard}>
            <Body style={styles.cardLabel}>Top prediction</Body>
            <Label style={styles.bigValue}>
              {topPredictionName} ({topPredictionValue.toFixed(2)})
            </Label>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.max(8, Math.min(100, topPredictionValue * 100))}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.halfCard}>
            <Body style={styles.cardLabel}>Tipburn risk</Body>
            <Label style={styles.bigValue}>{(result?.tipburn?.C ?? 0).toFixed(2)}</Label>
            <Body style={styles.smallHint}>
              Boxes: {result?.tipburn?.num_boxes ?? 0} • Area ratio:{" "}
              {(result?.tipburn?.A ?? 0).toFixed(2)}
            </Body>
          </View>
        </View>

        <View style={styles.explainCard}>
          <H2 style={styles.explainTitle}>Explanations</H2>

          <Body style={styles.sectionSub}>
            <Label style={styles.sectionSubBold}>Classifier</Label> — Top 3 probabilities
          </Body>

          {Object.keys(top3).length === 0 ? (
            <Body style={styles.emptyTop3Text}>No top probabilities returned</Body>
          ) : (
            Object.entries(top3).map(([k, v]: any) => (
              <View key={k} style={styles.rowBetween}>
                <Body style={styles.rowLeft}>{k}</Body>
                <Label style={styles.rowRight}>{Number(v).toFixed(2)}</Label>
              </View>
            ))
          )}

          <Body style={styles.sectionSubTipburn}>
            <Label style={styles.sectionSubBold}>Tipburn</Label> — Detector stats
          </Body>

          <View style={styles.rowBetween}>
            <Body style={styles.rowLeft}>Boxes count</Body>
            <Label style={styles.rowRight}>{result?.tipburn?.num_boxes ?? 0}</Label>
          </View>

          <View style={styles.rowBetween}>
            <Body style={styles.rowLeft}>Area ratio</Body>
            <Label style={styles.rowRight}>
              {Number(result?.tipburn?.A ?? 0).toFixed(2)}
            </Label>
          </View>

          <View style={styles.rowBetween}>
            <Body style={styles.rowLeft}>Average confidence</Body>
            <Label style={styles.rowRight}>
              {Number(result?.tipburn?.C ?? 0).toFixed(2)}
            </Label>
          </View>

          {!!result?.classification_label && (
            <>
              <Body style={styles.sectionSubTipburn}>
                <Label style={styles.sectionSubBold}>Decision summary</Label>
              </Body>

              <View style={styles.rowBetween}>
                <Body style={styles.rowLeft}>Selected class</Body>
                <Label style={styles.rowRight}>{result.classification_label}</Label>
              </View>

              <View style={styles.rowBetween}>
                <Body style={styles.rowLeft}>Confidence</Body>
                <Label style={styles.rowRight}>
                  {Number(result?.classification_confidence ?? 0).toFixed(2)}
                </Label>
              </View>
            </>
          )}
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

      <Modal visible={annotatedVisible} transparent animationType="slide">
        <View style={styles.annotateModalBackdrop}>
          <View style={styles.annotateModalCard}>
            <View style={styles.annotateModalHeader}>
              <Label style={styles.annotateModalTitle}>Annotated Tipburn Areas</Label>

              <TouchableOpacity onPress={() => setAnnotatedVisible(false)}>
                <Ionicons name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>

            {annotatedImageUri ? (
              <Image
                source={{ uri: annotatedImageUri }}
                style={styles.annotatedImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.annotatedEmpty}>
                <Body>No annotated image available</Body>
              </View>
            )}

            <View style={styles.annotateModalFooter}>
              <TouchableOpacity
                onPress={() => setAnnotatedVisible(false)}
                style={styles.annotateCloseBtn}
              >
                <Label style={styles.annotateCloseBtnText}>Close</Label>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}