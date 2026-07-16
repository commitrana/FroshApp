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
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../types/navigation";
import { Event } from "../../services/events";
import { getEvents } from "../../services/events";
import { getMyTickets, registerForEvent } from "../../services/tickets";
import { logout } from "../../services/auth";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { lightTheme, darkTheme } from "../../constants/homeThemes";
import HomeAboutTab from "../../Components/Home/HomeAboutTab";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
// Event photo paths from the backend are relative (e.g. "/uploads/events/xyz.jpg") —
// prefix with the backend's own origin (not /api) to load them as an <Image> source.
const SERVER_ORIGIN = "https://frosh-app-backend.onrender.com";
// Fallback image for events without a real photo (uses an asset that
// actually exists — assets/images/event-placeholder.jpg was never added
// to the project, which crashed Metro's bundler on this require()).
const DEFAULT_IMAGE = require('../../assets/uiux/concert.jpg');

type HomeNavProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();

  // ----- ui_ux Home shell state (exact behaviour from the design) -----
  const [activeTab, setActiveTab] = useState("frosh"); // "frosh" tab (live event) shown by default
  const [modalVisible, setModalVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const isFrosh = activeTab === "frosh";
  const isAbout = activeTab === "about";

  // ----- Real backend data (unchanged logic from the original Home screen) -----
  const [liveEvent, setLiveEvent] = useState<Event | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const getUserName = async () => {
      try {
        const studentData = await AsyncStorage.getItem("studentData");
        if (studentData) {
          const student = JSON.parse(studentData);
          setUserName(student.name || "");
        }
      } catch (error) {
        console.log("Error fetching user:", error);
      }
    };
    getUserName();
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const [events, tickets] = await Promise.all([getEvents(), getMyTickets()]);
      setLiveEvent(events.find((e) => e.status === "live") || null);
      setUpcomingEvents(events.filter((e) => e.status === "upcoming"));
    } catch (err) {
      console.log("Failed to fetch events:", err);
    }
  }, []);

  useAutoRefresh(fetchEvents, 30000);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

 

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

  const menuOptions = [
    { id: "account", label: "Account", icon: "person-outline" as const },
    { id: "help", label: "Help & Support", icon: "help-circle-outline" as const },
    { id: "about", label: "About Frosh", icon: "information-circle-outline" as const },
    { id: "connect", label: "Connect with us", icon: "chatbubble-outline" as const },
    {
      id: "switch",
      label: "Switch Mode",
      icon: isDarkMode ? ("sunny-outline" as const) : ("moon-outline" as const),
    },
    { id: "logout", label: "Logout", icon: "log-out-outline" as const },
  ];

  const handleMenuPress = (id: string) => {
    if (id === "switch") {
      setIsDarkMode(!isDarkMode);
      setModalVisible(false);
      return;
    }
    if (id === "logout") {
      handleLogout();
      return;
    }
    setModalVisible(false);
    if (id === "account") navigation.navigate("Account");
    else if (id === "help") navigation.navigate("Help");
    else if (id === "about") navigation.navigate("About");
    else if (id === "connect") navigation.navigate("Connect");
  };

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: modalVisible ? 1 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [modalVisible]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight * 0.5, 0],
  });

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

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
              style={[
                styles.profileCircle,
                { backgroundColor: theme.cardBg, shadowColor: theme.shadowColor },
              ]}
              onPress={() => setModalVisible(true)}
            >
              <Feather name="user" size={24} color={theme.iconColor} />
            </TouchableOpacity>
          </View>

          {/* TOP CARD - 3 tabs, same as the ui_ux design */}
          <View style={[styles.topCard, theme.topCard]}>
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={styles.tab}
                onPress={() => navigation.navigate("Bootcamp")}
              >
                <View style={styles.tabContent}>
                  <Ionicons name="calendar-outline" size={24} color={theme.tabInactiveText} />
                  <Text style={[styles.tabInactive, { color: theme.tabInactiveText }]}>
                    Bootcamp
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, isFrosh && { backgroundColor: theme.tabActiveBg }]}
                onPress={() => setActiveTab("frosh")}
              >
                <View style={styles.tabContent}>
                  <Image
                    source={require("../../assets/uiux/star.png")}
                    resizeMode="contain"
                    style={{
                      width:130,
                      height:150
                    }}
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, isAbout && { backgroundColor: theme.tabActiveBg }]}
                onPress={() => setActiveTab("about")}
              >
                <View style={styles.tabContent}>
                  <Ionicons
                    name="information-circle-outline"
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
          {isFrosh ? (
            <>
              <View style={[styles.liveCard, theme.liveCard]}>
                <View style={styles.liveHeadingContainer}>
                  <View style={[styles.line, { backgroundColor: theme.lineColor }]} />
                  <Text style={[styles.liveHeading, { color: theme.accent }]}>• LIVE EVENT •</Text>
                  <View style={[styles.line, { backgroundColor: theme.lineColor }]} />
                </View>

                {liveEvent ? (
                  <>
                    <Image
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
                      <Text style={[styles.infoText, { color: theme.textPrimary }]}>
                        {liveEvent.date}
                      </Text>
                    </View>

                    <View style={[styles.bottomRow, { marginTop: 0 }]}>
                      <View style={styles.infoRow}>
                        <Feather name="clock" size={16} color={theme.accent} />
                        <Text style={[styles.infoText, { color: theme.textPrimary }]}>
                          {liveEvent.time}
                        </Text>
                      </View>
                      
                    </View>
                  </>
                ) : (
                  <Text style={[styles.infoText, { color: theme.textSecondary, marginTop: 4 }]}>
                    No live event right now. Check back soon!
                  </Text>
                )} 
              </View>

              {upcomingEvents.length > 0 && (
                <View style={styles.upcomingSection}>
                  <Text style={[styles.upcomingHeading, { color: theme.textPrimary }]}>
                    Upcoming Events
                  </Text>
                  {upcomingEvents.map((event) => (
                    <View
                      key={event.id}
                      style={[styles.upcomingCard, { backgroundColor: theme.cardBg, shadowColor: theme.shadowColor }]}
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
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY }] },
            { backgroundColor: theme.modalBg },
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

          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Text style={[styles.closeButtonText, { color: theme.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
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
  topCard: { marginHorizontal: 22, marginTop: 18, borderRadius: 28, height: 80, overflow: "hidden" },
  tabsContainer: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  tab: { flex: 1, height: 80, justifyContent: "center", alignItems: "center", backgroundColor: "transparent", borderRadius: 20 },
  tabContent: { justifyContent: "center", alignItems: "center", gap: 2 },
  tabLogoLarge: { width: 100, height: 100 },
  tabActive: { fontSize: 12, fontWeight: "700" },
  tabInactive: { fontSize: 12, fontWeight: "500" },
  liveCard: { marginHorizontal: 22, marginTop: 24, borderRadius: 28, padding: 18 },
  liveHeadingContainer: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  line: { flex: 1, height: 2 },
  liveHeading: { marginHorizontal: 10, fontWeight: "700", fontSize: 16, letterSpacing: 2 },
  eventImage: { width: "100%", height: 200, borderRadius: 20 },
  liveNow: { marginTop: 14, borderWidth: 2, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, alignSelf: "flex-start" },
  liveNowText: { fontSize: 14, fontWeight: "700" },
  eventTitle: { marginTop: 12, fontSize: 26, fontWeight: "800" },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  location: { marginLeft: 10, fontSize: 18, fontWeight: "700" },
  infoText: { marginLeft: 10, fontSize: 16 },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  arrowCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, justifyContent: "center", alignItems: "center" },
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
  },
  upcomingTitle: { fontSize: 16, fontWeight: "700" },
  upcomingDate: { fontSize: 13, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
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
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1 },
  menuText: { fontSize: 18, fontWeight: "500", marginLeft: 16 },
  closeButton: { marginTop: 8, paddingVertical: 14, alignItems: "center" },
  closeButtonText: { fontSize: 18, fontWeight: "600" },
});