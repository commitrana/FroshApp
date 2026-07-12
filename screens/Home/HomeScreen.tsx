import { useCallback, useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, ScrollView, RefreshControl, Alert } from "react-native";
import FeaturedEventCard from "../../Components/Home/FeaturedEventCard";
import EventCard from "../../Components/Home/EventCard";
import AppBackground from "../../Components/Common/AppBackground";
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Colors from "../../constants/colors";
import { Event } from "../../constants/events";
import { getEvents } from "../../services/events";
import { getMyTickets, registerForEvent } from "../../services/tickets";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

import Header from "../../Components/Home/Header";
import WelcomeSection from "../../Components/Home/WelcomeSection";
import SearchBar from "../../Components/Home/SearchBar";

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [liveEvent, setLiveEvent] = useState<Event | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [ticketedEventIds, setTicketedEventIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  // ✅ Fetch user name from AsyncStorage
  useEffect(() => {
    const getUserName = async () => {
      try {
        const studentData = await AsyncStorage.getItem('studentData');
        if (studentData) {
          const student = JSON.parse(studentData);
          setUserName(student.name || '');
        }
      } catch (error) {
        console.log('Error fetching user:', error);
      }
    };
    getUserName();
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const [events, tickets] = await Promise.all([getEvents(), getMyTickets()]);
      setLiveEvent(events.find((e) => e.status === "live") || null);
      setUpcomingEvents(events.filter((e) => e.status === "upcoming"));
      setTicketedEventIds(new Set(tickets.map((t) => t.event?._id).filter(Boolean)));
    } catch (err) {
      console.log("Failed to fetch events:", err);
    }
  }, []);

  // Auto-refresh every 30s while Home is focused
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

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#9CA3AF"
            />
          }
        >
          <Header />
          {/* ✅ Pass userName to WelcomeSection */}
          <WelcomeSection userName={userName} />
          <SearchBar />
          {liveEvent && (
            <FeaturedEventCard
              title={liveEvent.title}
              date={liveEvent.date}
              time={liveEvent.time}
              location={liveEvent.venue}
              hasTicket={ticketedEventIds.has(liveEvent.id)}
              registering={registeringId === liveEvent.id}
              onPress={() => handleRegisterPress(liveEvent.id, ticketedEventIds.has(liveEvent.id))}
            />
          )}
          {upcomingEvents.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} title={event.title} date={event.date} />
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 30,
    marginBottom: 5,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 110,
  },
});