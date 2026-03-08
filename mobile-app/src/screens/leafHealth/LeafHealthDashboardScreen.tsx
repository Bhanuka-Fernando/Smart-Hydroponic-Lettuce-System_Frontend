import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Body, H1, Label } from "../../components/ui/AppText";
import {
  getLeafHealthDashboardCritical,
  getLeafHealthLogById,
  type LeafHealthRecentItem,
} from "../../api/LeafHealthApi";
import { styles } from "./LeafHealthDashboardScreen.styles";

function formatCapturedAt(value?: string) {
  if (!value) return "Unknown time";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusTheme(status: string) {
  if (status === "OK") {
    return {
      badgeBg: "#E8F7ED",
      badgeText: "#15803D",
      scoreBg: "#E8F7ED",
      scoreText: "#15803D",
    };
  }

  if (status === "WATCH") {
    return {
      badgeBg: "#FFF2DD",
      badgeText: "#C2410C",
      scoreBg: "#FFF2DD",
      scoreText: "#C2410C",
    };
  }

  return {
    badgeBg: "#FDE8E8",
    badgeText: "#B91C1C",
    scoreBg: "#EEF4FF",
    scoreText: "#173C96",
  };
}

export default function LeafHealthDashboardScreen({ navigation }: any) {
  const [items, setItems] = useState<LeafHealthRecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingId, setOpeningId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    const res = await getLeafHealthDashboardCritical(3);
    setItems(res?.items ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadData();
      } catch (e: any) {
        Alert.alert("Load failed", e?.message || "Could not load leaf health dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadData();
    } catch (e: any) {
      Alert.alert("Refresh failed", e?.message || "Could not refresh dashboard");
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const openFullReport = useCallback(
    async (logId: number) => {
      try {
        setOpeningId(logId);
        const res = await getLeafHealthLogById(logId);
        const item = res?.item;

        if (!item) {
          Alert.alert("Not found", "Could not load full report");
          return;
        }

        const sortedTop3 = item?.probs
          ? Object.fromEntries(
              Object.entries(item.probs)
                .sort((a: any, b: any) => Number(b[1]) - Number(a[1]))
                .slice(0, 3)
            )
          : {};

        navigation.navigate("LeafHealthResult", {
          result: {
            ...item,
            top3_probs: item.top3_probs || sortedTop3,
            primary_issue: item.primary_issue || item.main_issue,
          },
          imageUri: undefined,
        });
      } catch (e: any) {
        Alert.alert("Load failed", e?.message || "Could not open report");
      } finally {
        setOpeningId(null);
      }
    },
    [navigation]
  );

  const openFullHistory = useCallback(() => {
  navigation.navigate("LeafHealthHistory");
}, [navigation]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <Label style={styles.todayLabel}>Leaf Health</Label>
            <H1 style={styles.pageTitle}>Disease Dashboard</H1>
            <Body style={styles.pageSubtitle}>
              Review recent detections and start a fresh scan.
            </Body>
          </View>

          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate("LeafHealthScan")}
        >
          <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
          <Label style={styles.primaryBtnText}>Start New Scan</Label>
        </TouchableOpacity>

        <View style={styles.sectionHeaderRow}>
          <H1 style={styles.sectionTitle}>Recent Critical Activity</H1>

          <TouchableOpacity onPress={openFullHistory} activeOpacity={0.75}>
            <Label style={styles.historyLink}>View full history</Label>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator color="#173C96" />
            <Body style={styles.emptyDesc}>Loading recent critical reports...</Body>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyCard}>
            <H1 style={styles.emptyTitle}>No critical reports yet</H1>
            <Body style={styles.emptyDesc}>
              Critical leaf health detections will appear here after you save scan logs.
            </Body>
          </View>
        ) : (
          items.map((item) => {
            const theme = getStatusTheme(item.status);

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View style={styles.cardMain}>
                    <View style={[styles.chip, { backgroundColor: theme.badgeBg }]}>
                      <Label style={[styles.chipText, { color: theme.badgeText }]}>
                        {item.status}
                      </Label>
                    </View>

                    <Label style={styles.plantId}>{item.plant_id}</Label>
                    <Body style={styles.mainIssue}>{item.main_issue}</Body>
                    <Body style={styles.capturedAt}>{formatCapturedAt(item.captured_at)}</Body>
                  </View>

                  <View style={styles.scoreMiniWrap}>
                    <View style={[styles.scoreCircle, { backgroundColor: theme.scoreBg }]}>
                      <Label style={[styles.scoreText, { color: theme.scoreText }]}>
                        {item.health_score}
                      </Label>
                    </View>
                    <Label style={styles.scoreLabel}>Score</Label>
                  </View>
                </View>

                <View style={styles.cardFooterRow}>
                  <TouchableOpacity onPress={() => openFullReport(item.id)}>
                    <Label style={styles.reportBtnText}>View full report</Label>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.arrowBtn}
                    onPress={() => openFullReport(item.id)}
                  >
                    {openingId === item.id ? (
                      <ActivityIndicator size="small" color="#173C96" />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color="#334155" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoTitleRow}>
            <Ionicons name="information-circle-outline" size={18} color="#FFFFFF" />
            <Label style={styles.infoTitle}>Quick tips</Label>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoDot}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
            <Body style={styles.infoText}>
              Capture a clear top-view image of one leaf or one plant at a time.
            </Body>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoDot}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
            <Body style={styles.infoText}>
              Use good lighting and avoid blurry motion while scanning.
            </Body>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoDot}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
            <Body style={styles.infoText}>
              Saved reports can be reopened later from history for detailed review.
            </Body>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}