import React, { useCallback, useMemo, useState, useEffect } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";

import Theme from "../../theme/theme";
import { Event, EventStatus } from "../../constants/events";
import { getEvents } from "../../services/events";
import { getMyTickets, registerForEvent } from "../../services/tickets";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import FilterChip from "../../Components/Schedule/FilterChip";
import EventCard from "../../Components/Schedule/EventCard";

type FilterType = "all" | EventStatus;

export default function ScheduleScreen() {
  const navigation = useNavigation<any>();
  const [selectedFilter, setSelectedFilter] =
    useState<FilterType>("all");
  const [events, setEvents] = useState<Event[]>([]);
  const [ticketedEventIds, setTicketedEventIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
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

  // Auto-refresh every 30s while this screen is focused
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

    return events.filter(
      (event) => event.status === selectedFilter
    );
  }, [selectedFilter, events]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <Text style={styles.heading}>
          Schedule
        </Text>

        <Text style={styles.subHeading}>
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
          <ActivityIndicator
            color={Theme.colors.primary ?? "#22D3EE"}
            style={styles.loader}
          />
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
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#9CA3AF"
              />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>
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
    backgroundColor: Theme.colors.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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

  // Without this, the ScrollView itself (not just its content) can stretch
  // to fill whatever vertical space is left in the flex-column container —
  // which is what caused the big empty gap around the chips even after
  // they were centered.
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },

  filterContainer: {
    paddingBottom: 20,
    // A horizontal ScrollView's contentContainerStyle stretches children to
    // fill its cross-axis (height) by default unless alignItems is set —
    // that's what was making the filter chips balloon into tall capsules
    // until layout settled. 'center' keeps every chip at its natural height.
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
    color: "#9CA3AF",
    marginTop: 50,
    fontSize: 16,
  },
});