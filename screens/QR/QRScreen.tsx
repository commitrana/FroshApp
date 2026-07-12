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

import Theme from "../../theme/theme";
import QRPlaceholder from "../../Components/QR/QRPlaceholder";
import { QR_INFO } from "../../constants/qr";
import { Ticket, getMyTickets } from "../../services/tickets";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

export default function QRScreen() {
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

  // Auto-refresh every 15s while this screen is focused — so a ticket
  // flips from "valid" to "used" soon after the admin scans it.
  useAutoRefresh(fetchTickets, 15000);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  }, [fetchTickets]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Theme.colors.primary} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  if (tickets.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <QRPlaceholder title={QR_INFO.title} description={QR_INFO.description} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9CA3AF" />
        }
      >
        <Text style={styles.heading}>My Tickets</Text>
        <Text style={styles.subHeading}>
          Show this QR code at the venue — it can only be scanned once.
        </Text>

        {tickets.map((ticket) => {
          const isUsed = ticket.status === "used";
          return (
            <View key={ticket._id} style={styles.card}>
              <Text style={styles.eventTitle}>{ticket.event?.name}</Text>
              {ticket.event?.club ? (
                <Text style={styles.eventClub}>{ticket.event.club}</Text>
              ) : null}
              <Text style={styles.eventInfo}>
                📍 {ticket.event?.venue}
              </Text>
              <Text style={styles.eventInfo}>
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

              <Text style={isUsed ? styles.statusUsed : styles.statusValid}>
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
    backgroundColor: Theme.colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 110,
  },
  heading: {
    color: "white",
    fontSize: 30,
    fontWeight: "700",
  },
  subHeading: {
    color: "#9CA3AF",
    marginTop: 6,
    marginBottom: 24,
    fontSize: 15,
  },
  card: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    alignItems: "center",
  },
  eventTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    alignSelf: "flex-start",
  },
  eventClub: {
    color: "#A78BFA",
    marginTop: 5,
    fontWeight: "600",
    alignSelf: "flex-start",
  },
  eventInfo: {
    color: "#D1D5DB",
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
    color: "#34D399",
    fontWeight: "600",
    fontSize: 13,
  },
  statusUsed: {
    color: "#9CA3AF",
    fontWeight: "600",
    fontSize: 13,
  },
});