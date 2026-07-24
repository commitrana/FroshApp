import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";

import { useAppTheme } from "../../context/ThemeContext";
import { useHomeTheme } from "../../constants/homeThemes";
import QRPlaceholder from "../../Components/QR/QRPlaceholder";
import { QR_INFO } from "../../constants/qr";
import { Ticket, getMyTickets } from "../../services/tickets";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

export default function QRScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useAppTheme();
  const theme = useHomeTheme();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Entry animation (matches HomeScreen's content pop)
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(contentScale, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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

  const handleBack = () => navigation.goBack();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bgGradient[0] }}>
        <ActivityIndicator color={theme.accent} style={{ marginTop: 50 }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgGradient[0] }}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={Platform.OS === "android"}
      />
      <LinearGradient
        colors={theme.bgGradient as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <Animated.View
            style={[
              styles.container,
              {
                opacity: contentOpacity,
                transform: [{ scale: contentScale }],
              },
            ]}
          >
            {/* Header with back button – matches HomeScreen style */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.heading, { color: theme.textPrimary }]}>My Tickets</Text>
              <View style={{ width: 40 }} />
            </View>

            <Text style={[styles.subHeading, { color: theme.textSecondary }]}>
              Show this QR code at the venue — it can only be scanned once.
            </Text>

            {tickets.length === 0 ? (
              <QRPlaceholder title={QR_INFO.title} description={QR_INFO.description} />
            ) : (
              <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={theme.textSecondary}
                  />
                }
              >
                {tickets.map((ticket) => {
                  const isUsed = ticket.status === "used";
                  return (
                    <BlurView
                      key={ticket._id}
                      intensity={300}
                      tint={isDarkMode ? "dark" : "light"}
                      experimentalBlurMethod="dimezisBlurView"
                      style={[
                        styles.card,
                        {
                          backgroundColor:
                            theme.liveCard?.backgroundColor ??
                            (isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.35)"),
                          borderColor: isDarkMode
                            ? "rgba(255,255,255,0.2)"
                            : "rgba(255,255,255,0.7)",
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={
                          isDarkMode
                            ? ["rgba(255,255,255,0.14)", "rgba(255,255,255,0)"]
                            : ["rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]
                        }
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={styles.cardSheen}
                        pointerEvents="none"
                      />
                      <Text style={[styles.eventTitle, { color: theme.textPrimary }]}>
                        {ticket.event?.name}
                      </Text>
                      {ticket.event?.club ? (
                        <Text style={[styles.eventClub, { color: theme.accent }]}>
                          {ticket.event.club}
                        </Text>
                      ) : null}
                      <Text style={[styles.eventInfo, { color: theme.textSecondary }]}>
                        📍 {ticket.event?.venue}
                      </Text>
                      <Text style={[styles.eventInfo, { color: theme.textSecondary }]}>
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

                      <Text
                        style={
                          isUsed
                            ? [styles.statusUsed, { color: theme.textSecondary }]
                            : [styles.statusValid, { color: theme.accent }]
                        }
                      >
                        {isUsed
                          ? "✅ Ticket used — already checked in"
                          : "🎟️ Valid — ready to scan"}
                      </Text>
                    </BlurView>
                  );
                })}
              </ScrollView>
            )}
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  backButton: { padding: 4 },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subHeading: {
    marginTop: 2,
    marginBottom: 24,
    fontSize: 15,
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  scroll: {
    paddingBottom: 30,
  },
  card: {
    borderRadius: 28,
    padding: 18,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cardSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "55%",
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
  },
  eventTitle: {
    fontSize: 20,
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
    alignItems: "center",
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
    fontWeight: "600",
    fontSize: 13,
  },
});