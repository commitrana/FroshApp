import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";

import { useTheme } from "../../theme/theme"; // ← Changed
import QRPlaceholder from "../../Components/QR/QRPlaceholder";
import { QR_INFO } from "../../constants/qr";
import { Ticket, getMyTickets } from "../../services/tickets";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

export default function QRScreen() {
  const { colors, isDarkMode } = useTheme(); // ← Added
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const data = await getMyTickets();
      setTickets(data);
    } catch (err) {
      console.log("Failed to fetch tickets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useAutoRefresh(fetchTickets, 15000);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  }, [fetchTickets]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  if (tickets.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <QRPlaceholder title={QR_INFO.title} description={QR_INFO.description} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} />
        }
      >
        <Text style={[styles.heading, { color: colors.textPrimary }]}>My Tickets</Text>
        <Text style={[styles.subHeading, { color: colors.textSecondary }]}>
          Show this QR code at the venue — it can only be scanned once.
        </Text>

        {tickets.map((ticket) => {
          const isUsed = ticket.status === "used";
          return (
            <View key={ticket._id} style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>{ticket.event?.name}</Text>
              {ticket.event?.club ? (
                <Text style={[styles.eventClub, { color: colors.secondary }]}>{ticket.event.club}</Text>
              ) : null}
              <Text style={[styles.eventInfo, { color: colors.textSecondary }]}>
                📍 {ticket.event?.venue}
              </Text>
              <Text style={[styles.eventInfo, { color: colors.textSecondary }]}>
                🕒 {ticket.event?.date} • {ticket.event?.time}
              </Text>

              <View style={styles.qrWrapper}>
                <View style={[styles.qrBox, isUsed && styles.qrBoxUsed]}>
                  <QRCode
                    value={ticket.qrToken}
                    size={170}
                    color={isUsed ? "#6B7280" : "#000000"}
                    backgroundColor="#FFFFFF"
                  />
                  {isUsed && (
                    <View style={styles.usedOverlay}>
                      <Text style={styles.usedOverlayText}>✅ Checked In</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={isUsed ? styles.statusUsed : [styles.statusValid, { color: colors.success }]}>
                {isUsed ? "✅ Ticket used — already checked in" : "🎟️ Valid — ready to scan"}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 110,
  },
  heading: {
    fontSize: 30,
    fontWeight: "700",
  },
  subHeading: {
    marginTop: 6,
    marginBottom: 24,
    fontSize: 15,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    alignItems: "center",
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "700",
    alignSelf: "flex-start",
  },
  eventClub: {
    marginTop: 5,
    fontWeight: "600",
    alignSelf: "flex-start",
  },
  eventInfo: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  qrWrapper: {
    marginTop: 18,
    marginBottom: 10,
  },
  qrBox: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 14,
  },
  qrBoxUsed: {
    opacity: 0.55,
  },
  usedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  usedOverlayText: {
    backgroundColor: "rgba(0,0,0,0.75)",
    color: "white",
    fontWeight: "700",
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: "hidden",
  },
  statusValid: {
    fontWeight: "600",
    fontSize: 13,
  },
  statusUsed: {
    color: "#9CA3AF",
    fontWeight: "600",
    fontSize: 13,
  },
});