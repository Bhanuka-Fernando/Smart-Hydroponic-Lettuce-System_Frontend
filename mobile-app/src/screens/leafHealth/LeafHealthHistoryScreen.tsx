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
  getLeafHealthAllLogs,
  getLeafHealthLogById,
  type LeafHealthRecentItem,
} from "../../api/LeafHealthApi";
import { styles } from "./LeafHealthHistoryScreen.styles";

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

export default function LeafHealthHistoryScreen({ navigation }: any) {
  const [items, setItems] = useState<LeafHealthRecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingId, setOpeningId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    const res = await getLeafHealthAllLogs(100, 0);
    setItems(res?.items ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadData();
      } catch (e: any) {
        Alert.alert("Load failed", e?.message || "Could not load disease history");
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
      Alert.alert("Refresh failed", e?.message || "Could not refresh history");
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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <View style={styles.topCenter}>
            <Label style={styles.topLabel}>Leaf Health</Label>
            <H1 style={styles.pageTitle}>Full History</H1>
          </View>

          <View style={styles.topSpacer} />
        </View>

        <Body style={styles.pageSubtitle}>
          Review all saved disease detection logs and reopen full reports.
        </Body>

        {loading ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator color="#173C96" />
            <Body style={styles.emptyDesc}>Loading saved logs...</Body>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyCard}>
            <H1 style={styles.emptyTitle}>No saved logs yet</H1>
            <Body style={styles.emptyDesc}>
              Saved disease scan reports will appear here after you tap Save to Daily Log.
            </Body>
          </View>
        ) : (
          items.map((item) => {
            const theme = getStatusTheme(item.status);

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.88}
                style={styles.card}
                onPress={() => openFullReport(item.id)}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.cardLeft}>
                    <View style={styles.cardTopMetaRow}>
                      <View style={[styles.badge, { backgroundColor: theme.badgeBg }]}>
                        <Label style={[styles.badgeText, { color: theme.badgeText }]}>
                          {item.status}
                        </Label>
                      </View>

                      <Label style={styles.idText}>#{item.id}</Label>
                    </View>

                    <Label style={styles.plantId}>{item.plant_id}</Label>
                    <Body style={styles.mainIssue}>{item.main_issue}</Body>
                    <Body style={styles.timeText}>{formatCapturedAt(item.captured_at)}</Body>
                  </View>

                  <View style={styles.cardRight}>
                    <View style={[styles.scoreCircle, { backgroundColor: theme.scoreBg }]}>
                      <Label style={[styles.scoreText, { color: theme.scoreText }]}>
                        {item.health_score}
                      </Label>
                    </View>
                    <Label style={styles.scoreLabel}>Score</Label>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Label style={styles.reportText}>Open full report</Label>

                  <View style={styles.arrowBtn}>
                    {openingId === item.id ? (
                      <ActivityIndicator size="small" color="#173C96" />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color="#334155" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}