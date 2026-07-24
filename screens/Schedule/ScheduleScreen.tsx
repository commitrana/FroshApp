import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../../context/ThemeContext";
import { useHomeTheme } from "../../constants/homeThemes";
import { Event, EventStatus } from "../../constants/events";
import { getEvents } from "../../services/events";
import { getMyTickets, registerForEvent } from "../../services/tickets";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import FilterChip from "../../Components/Schedule/FilterChip";
import EventCard from "../../Components/Schedule/EventCard";

const { height: screenHeight } = Dimensions.get("window");

type FilterType = "all" | EventStatus;

export default function ScheduleScreen() {
  const navigation = useNavigation<any>();
  const { isDarkMode } = useAppTheme();
  const theme = useHomeTheme();

  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [events, setEvents] = useState<Event[]>([]);
  const [ticketedEventIds, setTicketedEventIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // --- Entry animation (slide up from bottom / fade in), matching OurTeamScreen ---
  const slideY = useRef(new Animated.Value(screenHeight)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const isNavigating = useRef(false);

  // Disable the navigator's own push/pop transition & gesture for this screen.
  // We fully own the visual transition via slideY/opacityAnim.
  useEffect(() => {
    navigation.setOptions({
      animation: "none",
      gestureEnabled: false,
    });
  }, [navigation]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Exit animation (slide back down / fade out) — mirrors the entry so the
  // screen closes the same way it opened, then hands off to goBack().
  const handleBack = () => {
    if (isNavigating.current) return;
    isNavigating.current = true;

    Animated.parallel([
      Animated.timing(slideY, {
        toValue: screenHeight,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.goBack();
    });
  };

  useEffect(() => {
    AsyncStorage.getItem("userRole").then(setUserRole);
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const [data, tickets] = await Promise.all([getEvents(), getMyTickets()]);
      setEvents(data);
      setTicketedEventIds(new Set(tickets.map((t) => t.event?._id).filter(Boolean)));
    } catch (err) {
      console.log("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useAutoRefresh(fetchEvents, 30000);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

  const handleRegisterPress = useCallback(
    async (eventId: string, hasTicket: boolean) => {
      if (hasTicket) {
        navigation.navigate("QR");
        return;
      }

      setRegisteringId(eventId);
      try {
        await registerForEvent(eventId);
        setTicketedEventIds((prev) => new Set(prev).add(eventId));
        navigation.navigate("QR");
      } catch (err: any) {
        const message = err?.response?.data?.error || "Failed to register. Please try again.";
        Alert.alert("Registration failed", message);
      } finally {
        setRegisteringId(null);
      }
    },
    [navigation]
  );

  const filteredEvents = useMemo(() => {
    if (selectedFilter === "all") {
      return events;
    }
    return events.filter((event) => event.status === selectedFilter);
  }, [selectedFilter, events]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgGradient[0] }}>
      <Animated.View
        style={[
          {
            flex: 1,
            opacity: opacityAnim,
            transform: [{ translateY: slideY }],
          },
        ]}
      >
        <LinearGradient
          colors={theme.bgGradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack}>
              <Ionicons name="arrow-back" size={26} color={theme.iconColor} />
            </TouchableOpacity>
            <Text style={[styles.heading, { color: theme.textPrimary }]}>Schedule</Text>
            <View style={{ width: 26 }} />
          </View>
          <Text style={[styles.subHeading, { color: theme.textSecondary }]}>
            Stay updated with every Frosh event.
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            {/* ✅ No `theme` prop – FilterChip uses useHomeTheme internally */}
            <FilterChip
              title="All"
              selected={selectedFilter === "all"}
              onPress={() => setSelectedFilter("all")}
            />
            <FilterChip
              title="Live"
              selected={selectedFilter === "live"}
              onPress={() => setSelectedFilter("live")}
            />
            <FilterChip
              title="Upcoming"
              selected={selectedFilter === "upcoming"}
              onPress={() => setSelectedFilter("upcoming")}
            />
            <FilterChip
              title="Past"
              selected={selectedFilter === "past"}
              onPress={() => setSelectedFilter("past")}
            />
          </ScrollView>

          {loading ? (
            <ActivityIndicator color={theme.accent} style={styles.loader} />
          ) : (
            <FlatList
              data={filteredEvents}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <EventCard
                  event={item}
                  hasTicket={ticketedEventIds.has(item.id)}
                  registering={registeringId === item.id}
                  hideRegister={userRole === "faculty"}
                  onRegisterPress={() =>
                    handleRegisterPress(item.id, ticketedEventIds.has(item.id))
                  }
                  // ✅ No `theme` prop – EventCard uses useHomeTheme internally
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.textSecondary}
                />
              }
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No events available.
                </Text>
              }
            />
          )}
        </View>
      </SafeAreaView>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subHeading: {
    marginTop: 6,
    marginBottom: 24,
    fontSize: 15,
  },
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterContainer: {
    paddingBottom: 20,
    alignItems: "center",
  },
  list: {
    paddingBottom: 30,
  },
  loader: {
    marginTop: 50,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },
});