import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../types/navigation";
import { Event } from "../../services/events";
import { getEvents } from "../../services/events";
import { getMyTickets, registerForEvent } from "../../services/tickets";
import { logout } from "../../services/auth";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { useHomeTheme } from "../../constants/homeThemes";
import { useAppTheme } from "../../context/ThemeContext";
import HomeAboutTab from "../../Components/Home/HomeAboutTab";
import Loader from "../../Components/Loader";
import ImageWithLoader from "../../Components/ImageWithLoader";
import { useRoute } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";

const FACULTY_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface FacultyLectureSlot {
  subject: string;
  venue?: string;
  batches?: string[];
}

interface FacultyProfileData {
  _id: string;
  name: string;
  timetable: {
    timeSlots?: string[];
    days?: string[];
    schedule: { [day: string]: { [slot: string]: FacultyLectureSlot } } | any[];
  };
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const SERVER_ORIGIN = "https://frosh-app-backend.onrender.com";
const DEFAULT_IMAGE = require('../../assets/uiux/concert.jpg');

// Converts a "#RRGGBB" hex color + 0-1 alpha into an "rgba(...)" string,
// for use inside a CSS boxShadow value.
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type HomeNavProp = NativeStackNavigationProp<RootStackParamList>;

// Type for menu icons
type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { isDarkMode, toggleDarkMode } = useAppTheme();
  const theme = useHomeTheme();

  // ----- ui_ux Home shell state -----
  const [activeTab, setActiveTab] = useState("frosh");
  const [modalVisible, setModalVisible] = useState(false);
  const route = useRoute<any>();

useFocusEffect(
  React.useCallback(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
      navigation.setParams({ initialTab: undefined });
    }
  }, [route.params?.initialTab])
);
  
  // Sliding indicator for top tabs
  const [containerWidth, setContainerWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const isFrosh = activeTab === "frosh";
  const isAbout = activeTab === "about";
  const isBootcamp = activeTab === "bootcamp";
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ----- Faculty weekly schedule (inline Bootcamp tab content, faculty only) -----
  const [facultyProfile, setFacultyProfile] = useState<FacultyProfileData | null>(null);
  const [facultyLoading, setFacultyLoading] = useState(true);

  const fetchFacultyProfile = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("facultyToken");
      if (!token) {
        setFacultyLoading(false);
        return;
      }
      const response = await fetch("https://frosh-app-backend.onrender.com/api/faculty/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setFacultyProfile(data.faculty);
      } else {
        console.log("Failed to fetch faculty profile:", data.error);
      }
    } catch (error) {
      console.log("Error fetching faculty profile:", error);
    } finally {
      setFacultyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userRole === "faculty") {
      fetchFacultyProfile();
    }
  }, [userRole, fetchFacultyProfile]);
  

  const facultyScheduleMap: { [day: string]: { [slot: string]: FacultyLectureSlot } } = (() => {
    const sched = facultyProfile?.timetable?.schedule;
    if (!sched || Array.isArray(sched)) return {};
    return sched;
  })();
  const facultyTimeSlots: string[] =
    facultyProfile?.timetable?.timeSlots && facultyProfile.timetable.timeSlots.length
      ? facultyProfile.timetable.timeSlots
      : [];

  const handleFacultySlotPress = (day: string, slot: string, lecture: FacultyLectureSlot) => {
    navigation.navigate("ClassDetails", {
      day,
      slot,
      subject: lecture.subject,
      venue: lecture.venue,
      batches: lecture.batches || [],
    });
  };

  // ----- Real backend data -----
  const [liveEvent, setLiveEvent] = useState<Event | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [ticketedEventIds, setTicketedEventIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");

  // Tab index mapping for slider animation
  const tabIndex = { bootcamp: 0, frosh: 1, about: 2 };

  // Animate slider when activeTab or containerWidth changes
  useEffect(() => {
    if (containerWidth === 0) return;
    const tabWidth = containerWidth / 3;
    const targetOffset = tabIndex[activeTab as keyof typeof tabIndex] * tabWidth;
    Animated.timing(slideAnim, {
      toValue: targetOffset,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [activeTab, containerWidth]);

  useEffect(() => {
    const getUserName = async () => {
      try {
        const role = await AsyncStorage.getItem("userRole");
        setUserRole(role);

        const dataKey = role === "faculty" ? "facultyData" : "studentData";
        const rawData = await AsyncStorage.getItem(dataKey);
        if (rawData) {
          const parsed = JSON.parse(rawData);
          setUserName(parsed.name || "");
        }
      } catch (error) {
        console.log("Error fetching user:", error);
      }
    };
    getUserName();
  }, []);
  const fetchEvents = useCallback(async () => {
    try {
      const role = await AsyncStorage.getItem("userRole");
      const isStudent = role === "student";

      const eventsPromise = getEvents();
      const ticketsPromise = isStudent ? getMyTickets() : Promise.resolve([]);

      const [eventsResult, ticketsResult] = await Promise.allSettled([
        eventsPromise,
        ticketsPromise,
      ]);

      if (eventsResult.status === "fulfilled") {
        setLiveEvent(eventsResult.value.find((e) => e.status === "live") || null);
        setUpcomingEvents(eventsResult.value.filter((e) => e.status === "upcoming"));
      } else {
        console.log("Failed to fetch events:", eventsResult.reason);
      }

      if (ticketsResult.status === "fulfilled") {
        setTicketedEventIds(
          new Set(ticketsResult.value.map((t) => t.event?._id).filter(Boolean))
        );
      } else {
        console.log("Failed to fetch tickets:", ticketsResult.reason);
      }
    } catch (err) {
      console.log("Failed to fetch events:", err);
    }
    finally {
    setLoading(false); }
  }, []);

  useAutoRefresh(fetchEvents, 30000);

  const onRefresh = useCallback(async () => {
  setRefreshing(true);
  await Promise.allSettled([
    fetchEvents(),
    userRole === "faculty" ? fetchFacultyProfile() : Promise.resolve(),
  ]);
  setRefreshing(false);
}, [fetchEvents, fetchFacultyProfile, userRole]);

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

 const handleLogout = () => {
    setModalVisible(false);
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            navigation.replace("Login");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  const menuOptions: Array<{ id: string; label: string; icon: IconName }> = [
    { id: "account", label: "Account", icon: "person-outline" },
    { id: "schedule", label: "Schedule", icon: "calendar-outline" },
    { id: "connect", label: "Connect with us", icon: "chatbubble-outline" },
    { id: "logout", label: "Logout", icon: "log-out-outline" as const },

    { id: "switch", label: "Switch Mode", icon: isDarkMode ? "sunny-outline" : "moon-outline" },
  ];

  const handleMenuPress = (id: string) => {
    if (id === "switch") {
      toggleDarkMode();
      setModalVisible(false);
      return;
    }
    if (id === "logout") {
      handleLogout();
      return;
    }
    setModalVisible(false);
    if (id === "account") navigation.navigate("Account");
    else if (id === "schedule") navigation.navigate("Schedule");
    else if (id === "help") navigation.navigate("Help");
    else if (id === "connect") navigation.navigate("Connect");
  };

  // Glass effect styles - matched to teammate's UI values
  const glassBg = isDarkMode
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(255, 255, 255, 0.35)';
  const glassBorder = isDarkMode
    ? 'rgba(255, 255, 255, 0.2)'
    : 'rgba(255, 255, 255, 0.7)';
  const glassSheen: [string, string] = isDarkMode
    ? ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']
    : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)'];

    if (loading) return <Loader color={theme.accent} />;

  return (
    <View style={[styles.rootShell, { backgroundColor: (theme.bgGradient as string[])[0] }]}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={Platform.OS === "android"}
      />

      <LinearGradient
        colors={theme.bgGradient as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
          }
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.hello, { color: theme.textPrimary }]}>
                Hi, {userName || "Guest"}
              </Text>
              <Text style={[styles.welcome, { color: theme.textSecondary }]}>Welcome back!</Text>
            </View>
            <TouchableOpacity
              style={[styles.profileCircle, { backgroundColor: theme.cardBg, shadowColor: theme.shadowColor }]}
              onPress={() => setModalVisible(true)}
            >
              <Feather name="user" size={24} color={theme.iconColor} />
            </TouchableOpacity>
          </View>

          {/* GLASS TOP CARD with sliding indicator */}
          <View
            style={[
              styles.topCard,
              {
                backgroundColor: glassBg,
                borderColor: glassBorder,
              },
            ]}
          >
            <LinearGradient
              colors={glassSheen}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.glassSheen}
              pointerEvents="none"
            />
            <View
              style={styles.tabsContainer}
              onLayout={(e) => {
                const { width } = e.nativeEvent.layout;
                setContainerWidth(width);
                if (width > 0) {
                  const initialOffset = tabIndex[activeTab as keyof typeof tabIndex] * (width / 3);
                  slideAnim.setValue(initialOffset);
                }
              }}
            >
              {/* Sliding indicator */}
              {containerWidth > 0 && (
                <Animated.View
                  style={[
                    styles.slider,
                    {
                      width: containerWidth / 3,
                      transform: [{ translateX: slideAnim }],
                      backgroundColor: theme.tabActiveBg,
                    },
                  ]}
                />
              )}

              <TouchableOpacity
                style={styles.tab}
                onPress={() => {
                  if (userRole === "faculty") {
                    setActiveTab("bootcamp");
                  } else {
                    navigation.navigate("Bootcamp");
                  }
                }}
              >
                <View style={styles.tabContent}>
                  <Ionicons
                    name="calendar-outline"
                    size={24}
                    color={isBootcamp ? theme.tabActiveText : theme.tabInactiveText}
                  />
                  <Text
                    style={[
                      isBootcamp ? styles.tabActive : styles.tabInactive,
                      { color: isBootcamp ? theme.tabActiveText : theme.tabInactiveText },
                    ]}
                  >
                    Bootcamp
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tab}
                onPress={() => setActiveTab("frosh")}
              >
                <View style={styles.tabContent}>
                  <Image
                    source={require("../../assets/uiux/star.png")}
                    resizeMode="contain"
                    style={styles.tabLogoLarge}
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tab}
                onPress={() => setActiveTab("about")}
              >
                <View style={styles.tabContent}>
                  <Ionicons
                    name="document-text-outline"
                    size={28}
                    color={isAbout ? theme.tabActiveText : theme.tabInactiveText}
                  />
                  <Text
                    style={[
                      isAbout ? styles.tabActive : styles.tabInactive,
                      { color: isAbout ? theme.tabActiveText : theme.tabInactiveText },
                    ]}
                  >
                    About
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* CONTENT */}
          {isBootcamp ? (
            <View style={styles.bootcampSection}>
              <View style={styles.timeTableHeader}>
                <MaterialCommunityIcons name="calendar-month-outline" size={22} color={theme.accent} />
                <Text style={[styles.timeTableTitle, { color: theme.textPrimary }]}>Weekly Schedule</Text>
              </View>

              {facultyLoading ? (
                <ActivityIndicator color={theme.accent} size="large" style={{ marginTop: 20 }} />
              ) : facultyTimeSlots.length === 0 ? (
                <View style={[styles.emptyBox, { backgroundColor: theme.cardBg }]}>
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    No schedule assigned yet
                  </Text>
                  <Text style={[styles.emptyText, { color: theme.textSecondary, marginTop: 4 }]}>
                    Please contact admin
                  </Text>
                </View>
              ) : (
                <View style={styles.gridWrapper}>
                  <View style={styles.dayColumn}>
                    <View style={styles.cornerSpacer} />
                    {FACULTY_DAYS.map((day) => (
                      <View key={day} style={[styles.dayLabelCell, { borderBottomColor: theme.lineColor }]}>
                        <Text style={[styles.dayLabelText, { color: theme.textSecondary }]}>
                          {day.slice(0, 3)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                      <View style={styles.gridHeaderRow}>
                        {facultyTimeSlots.map((slot) => (
                          <View key={slot} style={[styles.slotHeaderCell, { backgroundColor: theme.cardBg }]}>
                            <Text style={[styles.slotHeaderText, { color: theme.accent }]}>{slot}</Text>
                          </View>
                        ))}
                      </View>

                      {FACULTY_DAYS.map((day) => (
                        <View key={day} style={[styles.gridRow, { borderBottomColor: theme.lineColor }]}>
                          {facultyTimeSlots.map((slot) => {
                            const lecture = facultyScheduleMap[day]?.[slot];
                            return (
                              <TouchableOpacity
                                key={slot}
                                style={[
                                  styles.gridCell,
                                  lecture && { backgroundColor: theme.cardBg, shadowColor: theme.shadowColor },
                                ]}
                                disabled={!lecture}
                                onPress={() => lecture && handleFacultySlotPress(day, slot, lecture)}
                              >
                                {lecture ? (
                                  <>
                                    <Text style={[styles.cellSubject, { color: theme.textPrimary }]} numberOfLines={2}>
                                      {lecture.subject}
                                    </Text>
                                    {lecture.venue ? (
                                      <Text style={[styles.cellVenue, { color: theme.textSecondary }]} numberOfLines={1}>
                                        {lecture.venue}
                                      </Text>
                                    ) : null}
                                    {lecture.batches && lecture.batches.length > 0 ? (
                                      <Text style={[styles.cellBatches, { color: theme.accent }]} numberOfLines={1}>
                                        {lecture.batches.join(", ")}
                                      </Text>
                                    ) : null}
                                  </>
                                ) : (
                                  <Text style={[styles.cellEmptyDash, { color: theme.lineColor }]}>—</Text>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              <Text style={[styles.note, { color: theme.textSecondary }]}>
                Tap a class to start or view attendance.
              </Text>
            </View>
          ) : isFrosh ? (
            <>
              <View
                style={[
                  styles.liveCardShadowWrapper,
                  {
                    boxShadow: `0px ${theme.liveCard?.shadowOffset?.height ?? 8}px ${theme.liveCard?.shadowRadius ?? 18}px 0px ${hexToRgba(
                      theme.liveCard?.shadowColor ?? theme.shadowColor,
                      theme.liveCard?.shadowOpacity ?? 0.15
                    )}`,
                  } as any,
                ]}
              >
              <View
                style={[
                  styles.liveCard,
                  {
                    backgroundColor: theme.liveCard?.backgroundColor ?? glassBg,
                    borderColor: glassBorder,
                  },
                ]}
              >
                <LinearGradient
                  colors={glassSheen}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={[styles.glassSheen, styles.liveCardSheen]}
                  pointerEvents="none"
                />
                <View style={styles.liveHeadingContainer}>
                  <View style={[styles.line, { backgroundColor: theme.lineColor }]} />
                  <Text style={[styles.liveHeading, { color: theme.accent }]}>• LIVE EVENT •</Text>
                  <View style={[styles.line, { backgroundColor: theme.lineColor }]} />
                </View>

                {liveEvent ? (
                  <>
                    <ImageWithLoader 
                      source={liveEvent.imageUrl ? { uri: `${SERVER_ORIGIN}${liveEvent.imageUrl}` } : DEFAULT_IMAGE}
                      style={styles.eventImage}
                    />

                    <View style={[styles.liveNow, { borderColor: theme.accent }]}>
                      <Text style={[styles.liveNowText, { color: theme.accent }]}>LIVE NOW</Text>
                    </View>

                    <Text style={[styles.eventTitle, { color: theme.textPrimary }]}>
                      {liveEvent.title}
                    </Text>

                    <View style={styles.infoRow}>
                      <Ionicons name="location" size={18} color={theme.accent} />
                      <Text style={[styles.location, { color: theme.accent }]}>
                        {liveEvent.venue}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Feather name="calendar" size={16} color={theme.accent} />
                      <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                        {liveEvent.date}
                      </Text>
                    </View>

                    <View style={[styles.bottomRow, { marginTop: 0 }]}>
                      <View style={styles.infoRow}>
                        <Feather name="clock" size={16} color={theme.accent} />
                        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                          {liveEvent.time}
                        </Text>
                      </View>
                      {userRole !== "faculty" && (
                        <TouchableOpacity
                          style={[styles.arrowCircle, { borderColor: theme.accent }]}
                          onPress={() =>
                            handleRegisterPress(liveEvent.id, ticketedEventIds.has(liveEvent.id))
                          }
                          disabled={registeringId === liveEvent.id}
                        >
                          {registeringId === liveEvent.id ? (
                            <ActivityIndicator size="small" color={theme.accent} />
                          ) : (
                            <Ionicons
                              name={ticketedEventIds.has(liveEvent.id) ? "qr-code" : "arrow-forward"}
                              size={24}
                              color={theme.accent}
                            />
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                ) : (
                  <Text style={[styles.infoText, { color: theme.textSecondary, marginTop: 4 }]}>
                    No live event right now. Check back soon!
                  </Text>
                )}
              </View>
              </View>

              {upcomingEvents.length > 0 && (
                <View style={styles.upcomingSection}>
                  <Text style={[styles.upcomingHeading, { color: theme.textPrimary }]}>
                    Upcoming Events
                  </Text>
                  {upcomingEvents.map((event) => (
                    <View
                      key={event.id}
                      style={[
                        styles.upcomingCard,
                        {
                          backgroundColor: theme.liveCard?.backgroundColor ?? glassBg,
                          borderColor: glassBorder,
                          shadowColor: theme.shadowColor,
                        },
                      ]}
                    >
                      <Text style={[styles.upcomingTitle, { color: theme.textPrimary }]}>
                        {event.title}
                      </Text>
                      <Text style={[styles.upcomingDate, { color: theme.textSecondary }]}>
                        {event.date}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <HomeAboutTab theme={theme} />
          )}
        </ScrollView>
      </LinearGradient>

      {/* PROFILE MENU */}
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlayTransparent} />
        </TouchableWithoutFeedback>

        <View style={[styles.modalContainer, { backgroundColor: theme.modalBg }]}>
          <View style={[styles.modalHandle, { backgroundColor: theme.lineColor }]} />

          {menuOptions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, { borderBottomColor: theme.lineColor }]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons name={item.icon} size={24} color={theme.textPrimary} />
              <Text style={[styles.menuText, { color: theme.textPrimary }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Text style={[styles.closeButtonText, { color: theme.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rootShell: { flex: 1 },
  container: { flex: 1 },
  header: {
    marginTop: 55,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hello: { fontSize: 28, fontWeight: "800" },
  welcome: { marginTop: 2, fontSize: 16, fontWeight: "500" },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  topCard: {
    marginHorizontal: 22,
    marginTop: 18,
    borderRadius: 28,
    height: 80,
    overflow: "hidden",
    borderWidth: 1,
  },
  glassSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "55%",
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
  },
  // Shorter than the default 55% so the gradient's cutoff edge lands
  // inside the event image (hidden by the opaque photo) instead of
  // landing on the plain card background below it, which was creating
  // a visible two-tone seam regardless of the photo's own colour.
  liveCardSheen: {
    height: 110,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    position: "relative",
  },
  tab: {
    flex: 1,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 20,
  },
  tabContent: {
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  tabLogoLarge: { width: 120, height: 120 },
  tabActive: { fontSize: 12, fontWeight: "700" },
  tabInactive: { fontSize: 12, fontWeight: "500" },
  slider: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 20,
  },
  liveCardShadowWrapper: {
    marginHorizontal: 22,
    marginTop: 24,
    borderRadius: 28,
  },
  liveCard: {
    borderRadius: 28,
    padding: 18,
    overflow: "hidden",
    borderWidth: 1,
  },
  liveHeadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  line: { flex: 1, height: 2 },
  liveHeading: {
    marginHorizontal: 10,
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 2,
  },
  eventImage: {
    width: "100%",
    height: 200,
    borderRadius: 20,
  },
  liveNow: {
    marginTop: 14,
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  liveNowText: { fontSize: 14, fontWeight: "700" },
  eventTitle: {
    marginTop: 12,
    fontSize: 26,
    fontWeight: "800",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  location: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: "700",
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  arrowCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  upcomingSection: { marginHorizontal: 22, marginTop: 24 },
  upcomingHeading: { fontSize: 20, fontWeight: "800", marginBottom: 10 },
  upcomingCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderWidth: 1,
    overflow: "hidden",
  },
  upcomingTitle: { fontSize: 16, fontWeight: "700" },
  upcomingDate: { fontSize: 13, marginTop: 4 },

  // BOOTCAMP TAB (faculty) - weekly schedule grid
  bootcampSection: { marginHorizontal: 22, marginTop: 24 },
  timeTableHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  timeTableTitle: { fontSize: 20, fontWeight: "800" },
  emptyBox: { borderRadius: 16, padding: 24, alignItems: "center" },
  emptyText: { fontSize: 15, textAlign: "center" },
  gridWrapper: { flexDirection: "row" },
  dayColumn: { width: 52 },
  cornerSpacer: { height: 40 },
  dayLabelCell: { height: 64, justifyContent: "center", alignItems: "flex-start", borderBottomWidth: 1 },
  dayLabelText: { fontSize: 12, fontWeight: "700" },
  gridHeaderRow: { flexDirection: "row", height: 40 },
  slotHeaderCell: { width: 110, justifyContent: "center", alignItems: "center", marginLeft: 4, borderRadius: 6 },
  slotHeaderText: { fontSize: 11, fontWeight: "700" },
  gridRow: { flexDirection: "row", height: 64, borderBottomWidth: 1 },
  gridCell: { width: 110, marginLeft: 4, marginVertical: 4, borderRadius: 10, justifyContent: "center", alignItems: "center", paddingHorizontal: 6 },
  cellSubject: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  cellVenue: { fontSize: 10, marginTop: 2, textAlign: "center" },
  cellBatches: { fontSize: 9, marginTop: 2, textAlign: "center", fontWeight: "700" },
  cellEmptyDash: { fontSize: 14 },
  note: { fontSize: 12, marginTop: 10, textAlign: "center" },
  modalOverlayTransparent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  menuText: { fontSize: 18, fontWeight: "500", marginLeft: 16 },
  closeButton: { marginTop: 8, paddingVertical: 14, alignItems: "center" },
  closeButtonText: { fontSize: 18, fontWeight: "600" },
});