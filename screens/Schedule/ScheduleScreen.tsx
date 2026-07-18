import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../theme/theme"; // ← Changed
import { Event, EventStatus } from "../../constants/events";
import { getEvents } from "../../services/events";
import { getMyTickets, registerForEvent } from "../../services/tickets";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import FilterChip from "../../Components/Schedule/FilterChip";
import EventCard from "../../Components/Schedule/EventCard";

type FilterType = "all" | EventStatus;

export default function ScheduleScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDarkMode } = useTheme(); // ← Added
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [events, setEvents] = useState<Event[]>([]);
  const [ticketedEventIds, setTicketedEventIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Schedule</Text>
        <Text style={[styles.subHeading, { color: colors.textSecondary }]}>
          Stay updated with every Frosh event.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
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
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={filteredEvents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <EventCard
                event={item}
                hasTicket={ticketedEventIds.has(item.id)}
                registering={registeringId === item.id}
                onRegisterPress={() =>
                  handleRegisterPress(item.id, ticketedEventIds.has(item.id))
                }
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.textSecondary}
              />
            }
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No events available.
              </Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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