import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F4F6FA",
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  topCenter: {
    alignItems: "center",
  },
  topLabel: {
    fontSize: 11,
    color: "#98A2B3",
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  pageTitle: {
    marginTop: 6,
    fontSize: 22,
    lineHeight: 28,
    color: "#111827",
    fontWeight: "900",
  },
  topSpacer: {
    width: 44,
  },
  pageSubtitle: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    color: "#667085",
    textAlign: "center",
  },

  emptyCard: {
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "800",
  },
  emptyDesc: {
    marginTop: 8,
    fontSize: 13,
    color: "#667085",
    textAlign: "center",
    lineHeight: 20,
  },

  card: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardLeft: {
    flex: 1,
    paddingRight: 10,
  },
  cardTopMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  idText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "800",
  },
  plantId: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "900",
  },
  mainIssue: {
    marginTop: 3,
    fontSize: 13,
    color: "#475467",
    fontWeight: "700",
  },
  timeText: {
    marginTop: 5,
    fontSize: 11,
    color: "#98A2B3",
    fontWeight: "600",
  },

  cardRight: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontSize: 17,
    fontWeight: "900",
  },
  scoreLabel: {
    marginTop: 6,
    fontSize: 10,
    color: "#98A2B3",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reportText: {
    fontSize: 14,
    color: "#173C96",
    fontWeight: "900",
  },
  arrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EEF2F7",
    justifyContent: "center",
    alignItems: "center",
  },
});