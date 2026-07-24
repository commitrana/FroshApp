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
  PanResponder,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
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
import HomeBootcampTab from "../../Components/Home/HomeBootcamptab";
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

// Colors for the per-slot status pill in the live event's slot picker.
const SLOT_STATUS_COLORS: Record<string, string> = {
  live: "#c62828",
  upcoming: "#ef6c00",
  past: "#9e9e9e",
};

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

  // Slide-from-bottom animation for the profile menu card
  const menuTranslateY = useRef(new Animated.Value(screenHeight)).current;
  const menuOverlayOpacity = useRef(new Animated.Value(0)).current;

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(menuTranslateY, {
        toValue: screenHeight,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(menuOverlayOpacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
    });
  };

  useEffect(() => {
    if (modalVisible) {
      menuTranslateY.setValue(screenHeight);
      menuOverlayOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(menuTranslateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(menuOverlayOpacity, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [modalVisible]);

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
  // For slotted events: which slot (1-5) the student already holds a ticket
  // for, keyed by event id. A student can only ever hold one ticket per
  // event, so once this is set for an event they can no longer pick a
  // different slot for it.
  const [ticketedEventSlots, setTicketedEventSlots] = useState<Record<string, number>>({});
  // Which slot the student currently has selected in the live-event card
  // (slotted events only — not persisted, just picker state).
  const [selectedLiveSlot, setSelectedLiveSlot] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");

  // Tab index mapping for slider animation
  const tabIndex = { bootcamp: 0, frosh: 1, about: 2 };

  const tabNames = ["bootcamp", "frosh", "about"] as const;

  // Holds the slider offset at the moment a drag begins
  const dragStartValue = useRef(0);
  // Tracks whether a finger is currently dragging the slider (disables the
  // tab-press-driven effect below from fighting the gesture)
  const isDragging = useRef(false);
  // Store the current offset during drag
  const currentOffsetRef = useRef(0);
  // PanResponder is created once, so fast-changing values are mirrored into
  // refs to avoid the gesture handlers ever reading stale state
  const containerWidthRef = useRef(0);
  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    containerWidthRef.current = containerWidth;
  }, [containerWidth]);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Smoothly animate the slider to rest on top of a given tab
  const animateToTab = (tabId: string, duration = 300) => {
    if (containerWidth === 0) return;
    const tabWidth = containerWidth / 3;
    const targetOffset = tabIndex[tabId as keyof typeof tabIndex] * tabWidth;
    Animated.timing(slideAnim, {
      toValue: targetOffset,
      duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  // Animate slider when activeTab or containerWidth changes (tap-triggered)
  useEffect(() => {
    if (containerWidth === 0 || isDragging.current) return;
    animateToTab(activeTab);
  }, [activeTab, containerWidth]);

  // Subtle "pop" for the content card whenever the active tab changes
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    contentOpacity.setValue(0);
    contentScale.setValue(0.95);
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 220,
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
  }, [activeTab]);

  // --- Drag-to-slide gesture handling ---
  const panResponder = useRef(
    PanResponder.create({
      // Let taps on the tabs pass through untouched...
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      // ...but claim the gesture as soon as it's a clear horizontal drag
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        return (
          Math.abs(gestureState.dx) > 6 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
        );
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
        slideAnim.stopAnimation((value) => {
          dragStartValue.current = value;
          currentOffsetRef.current = value;
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        const width = containerWidthRef.current;
        if (width === 0) return;
        const tabWidth = width / 3;
        const maxOffset = tabWidth * 2;
        const newOffset = Math.max(
          0,
          Math.min(maxOffset, dragStartValue.current + gestureState.dx)
        );
        slideAnim.setValue(newOffset);
        currentOffsetRef.current = newOffset;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const width = containerWidthRef.current;
        if (width === 0) {
          isDragging.current = false;
          return;
        }

        const tabWidth = width / 3;
        // Use the final offset to determine the closest tab
        const finalOffset = currentOffsetRef.current;
        let targetIndex = Math.round(finalOffset / tabWidth);
        targetIndex = Math.max(0, Math.min(2, targetIndex));

        const newTab = tabNames[targetIndex];
        isDragging.current = false;
        if (newTab === "bootcamp" || newTab === "frosh" || newTab === "about") {
          setActiveTab(newTab);
        }
        animateToTab(newTab, 180);
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        animateToTab(activeTabRef.current, 200);
      },
    })
  ).current;

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
        const slotMap: Record<string, number> = {};
        ticketsResult.value.forEach((t) => {
          if (t.event?._id) slotMap[t.event._id] = t.slot || 0;
        });
        setTicketedEventSlots(slotMap);
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
    async (eventId: string, hasTicket: boolean, slot?: number) => {
      if (hasTicket) {
        navigation.navigate("QR");
        return;
      }
      setRegisteringId(eventId);
      try {
        const ticket = await registerForEvent(eventId, slot);
        setTicketedEventIds((prev) => new Set(prev).add(eventId));
        setTicketedEventSlots((prev) => ({ ...prev, [eventId]: ticket?.slot || slot || 0 }));
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

  // Reset the slot picker only when the live event itself changes (not on
  // every 30s auto-refresh) — otherwise an in-progress selection would get
  // wiped out from under the student while they're choosing.
  useEffect(() => {
    setSelectedLiveSlot(null);
  }, [liveEvent?.id]);

 const handleLogout = () => {
    closeMenu();
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
      closeMenu();
      return;
    }
    if (id === "logout") {
      handleLogout();
      return;
    }
    closeMenu();
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
          <BlurView
            intensity={300}
            tint={isDarkMode ? "dark" : "light"}
            experimentalBlurMethod="dimezisBlurView"
            style={[
              styles.topCard,
              {
                backgroundColor: theme.topCard?.backgroundColor ?? glassBg,
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
              {...panResponder.panHandlers}
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
                onPress={() => setActiveTab("bootcamp")}
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
          </BlurView>

          {/* CONTENT */}
          <Animated.View
            style={{
              opacity: contentOpacity,
              transform: [{ scale: contentScale }],
            }}
          >
          {isBootcamp && userRole !== "faculty" ? (
            <View style={styles.bootcampSection}>
              <HomeBootcampTab theme={theme} />
            </View>
          ) : isBootcamp ? (
            <View style={styles.bootcampSection}>
              <View style={[styles.timeTableHeader, { justifyContent: "space-between" }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <MaterialCommunityIcons name="calendar-month-outline" size={22} color={theme.accent} />
                  <Text style={[styles.timeTableTitle, { color: theme.textPrimary }]}>Weekly Schedule</Text>
                </View>
                <TouchableOpacity
                  style={[styles.historyButton, { backgroundColor: theme.cardBg, shadowColor: theme.shadowColor }]}
                  onPress={() => navigation.navigate('ClassHistory')}
                >
                  <MaterialCommunityIcons name="history" size={18} color={theme.accent} />
                  <Text style={[styles.historyButtonText, { color: theme.accent }]}>Class History</Text>
                </TouchableOpacity>
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

                    {(liveEvent.slotCount ?? 0) > 0 ? (
                      // ---- Slotted event: show a slot picker, then that
                      // slot's own time/venue/status once one is picked ----
                      <>
                        {(() => {
                          const hasTicket = ticketedEventIds.has(liveEvent.id);
                          // 0/undefined both mean "no real slot on this ticket"
                          // (e.g. booked before the event had slots at all) —
                          // treat that the same as "no slot" rather than as
                          // slot 0, which doesn't exist as a chip.
                          const ticketedSlotNum = ticketedEventSlots[liveEvent.id] || null;
                          return (
                            <View style={styles.slotPickerRow}>
                              {(liveEvent.slots || []).map((slot) => {
                                const isSelected = hasTicket
                                  ? ticketedSlotNum === slot.number
                                  : selectedLiveSlot === slot.number;
                                // Once the student holds ANY ticket for this
                                // event, every chip locks — they already have
                                // their slot and can't pick another one.
                                const isLocked = hasTicket;
                                return (
                                  <TouchableOpacity
                                    key={slot.number}
                                    disabled={isLocked}
                                    onPress={() => setSelectedLiveSlot(slot.number)}
                                    style={[
                                      styles.slotChip,
                                      {
                                        borderColor: isSelected ? theme.accent : theme.lineColor,
                                        backgroundColor: isSelected ? theme.accent : "transparent",
                                        opacity: isLocked && !isSelected ? 0.4 : 1,
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.slotChipText,
                                        { color: isSelected ? "#fff" : theme.textPrimary },
                                      ]}
                                    >
                                      Slot {slot.number}
                                    </Text>
                                    <View
                                      style={[
                                        styles.slotStatusDot,
                                        {
                                          backgroundColor:
                                            SLOT_STATUS_COLORS[slot.status] || theme.lineColor,
                                        },
                                      ]}
                                    />
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          );
                        })()}

                        {(() => {
                          const hasTicket = ticketedEventIds.has(liveEvent.id);
                          const ticketedSlotNum = ticketedEventSlots[liveEvent.id] || null;

                          // Already registered: always show View Ticket, using
                          // their booked slot's details if we have a real one
                          // (falls back to the event's own venue/time for a
                          // legacy ticket from before this event had slots).
                          if (hasTicket) {
                            const registeredSlot = ticketedSlotNum
                              ? (liveEvent.slots || []).find((s) => s.number === ticketedSlotNum)
                              : null;
                            return (
                              <>
                                <View style={styles.infoRow}>
                                  <Ionicons name="location" size={18} color={theme.accent} />
                                  <Text style={[styles.location, { color: theme.accent }]}>
                                    {registeredSlot?.venue || liveEvent.venue}
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
                                      {registeredSlot?.time || liveEvent.time}
                                    </Text>
                                  </View>
                                  {userRole !== "faculty" && (
                                    <TouchableOpacity
                                      style={[styles.arrowCircle, { borderColor: theme.accent }]}
                                      onPress={() => handleRegisterPress(liveEvent.id, true)}
                                      disabled={registeringId === liveEvent.id}
                                    >
                                      {registeringId === liveEvent.id ? (
                                        <ActivityIndicator size="small" color={theme.accent} />
                                      ) : (
                                        <Ionicons name="qr-code" size={24} color={theme.accent} />
                                      )}
                                    </TouchableOpacity>
                                  )}
                                </View>

                                <Text style={[styles.slotHint, { color: theme.textSecondary }]}>
                                  {registeredSlot
                                    ? `You're registered for Slot ${registeredSlot.number}.`
                                    : "You're already registered for this event."}
                                </Text>
                              </>
                            );
                          }

                          // Not registered yet: need a slot picked before
                          // showing its details / letting them register.
                          const activeSlot = (liveEvent.slots || []).find(
                            (s) => s.number === selectedLiveSlot
                          );

                          if (!activeSlot) {
                            return (
                              <Text
                                style={[styles.infoText, { color: theme.textSecondary, marginTop: 4 }]}
                              >
                                Select a slot above to see its time and venue.
                              </Text>
                            );
                          }

                          const canRegister = activeSlot.status === "live";

                          return (
                            <>
                              <View style={styles.infoRow}>
                                <Ionicons name="location" size={18} color={theme.accent} />
                                <Text style={[styles.location, { color: theme.accent }]}>
                                  {activeSlot.venue || liveEvent.venue}
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
                                    {activeSlot.time || liveEvent.time}
                                  </Text>
                                </View>
                                {userRole !== "faculty" && (
                                  <TouchableOpacity
                                    style={[
                                      styles.arrowCircle,
                                      { borderColor: theme.accent, opacity: canRegister ? 1 : 0.4 },
                                    ]}
                                    onPress={() =>
                                      canRegister &&
                                      handleRegisterPress(liveEvent.id, false, activeSlot.number)
                                    }
                                    disabled={registeringId === liveEvent.id || !canRegister}
                                  >
                                    {registeringId === liveEvent.id ? (
                                      <ActivityIndicator size="small" color={theme.accent} />
                                    ) : (
                                      <Ionicons name="arrow-forward" size={24} color={theme.accent} />
                                    )}
                                  </TouchableOpacity>
                                )}
                              </View>

                              {activeSlot.status !== "live" && (
                                <Text style={[styles.slotHint, { color: theme.textSecondary }]}>
                                  {activeSlot.status === "upcoming"
                                    ? "Registration opens once this slot goes live."
                                    : "Registration is closed — this slot has ended."}
                                </Text>
                              )}
                            </>
                          );
                        })()}
                      </>
                    ) : (
                      // ---- No slots: unchanged single date/time/venue behavior ----
                      <>
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
                    )}
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
                      <View style={styles.upcomingTitleRow}>
                        <Text style={[styles.upcomingTitle, { color: theme.textPrimary }]}>
                          {event.title}
                        </Text>
                        {(event.slotCount ?? 0) > 0 && (
                          <View style={[styles.upcomingSlotBadge, { borderColor: theme.accent }]}>
                            <Text style={[styles.upcomingSlotBadgeText, { color: theme.accent }]}>
                              {event.slotCount} slot{event.slotCount === 1 ? "" : "s"}
                            </Text>
                          </View>
                        )}
                      </View>
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
          </Animated.View>
        </ScrollView>
      </LinearGradient>

      {/* PROFILE MENU */}
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeMenu}
      >
        <TouchableWithoutFeedback onPress={closeMenu}>
          <Animated.View
            style={[styles.modalOverlayTransparent, { opacity: menuOverlayOpacity }]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.modalBg,
              transform: [{ translateY: menuTranslateY }],
            },
          ]}
        >
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

          <TouchableOpacity style={styles.closeButton} onPress={closeMenu}>
            <Text style={[styles.closeButtonText, { color: theme.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
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
  upcomingTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  upcomingTitle: { fontSize: 16, fontWeight: "700", flexShrink: 1 },
  upcomingDate: { fontSize: 13, marginTop: 4 },
  upcomingSlotBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  upcomingSlotBadgeText: { fontSize: 11, fontWeight: "700" },

  // LIVE EVENT — slot picker (slotted events only)
  slotPickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  slotChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  slotChipText: { fontSize: 13, fontWeight: "700" },
  slotStatusDot: { width: 7, height: 7, borderRadius: 4 },
  slotHint: { fontSize: 12, marginTop: 8 },

  // BOOTCAMP TAB (faculty) - weekly schedule grid
  bootcampSection: { marginHorizontal: 22, marginTop: 24 },
  timeTableHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  historyButtonText: { fontSize: 12, fontWeight: "700", marginLeft: 6 },
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