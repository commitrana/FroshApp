import React, { useCallback, useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../types/navigation";
import { getMyProfile, StudentProfile } from "../../services/student";

import { useAppTheme } from "../../context/ThemeContext";
import { useHomeTheme } from "../../constants/homeThemes";
import ProfileHeader from "../../Components/Account/ProfileHeader";
import InfoCard from "../../Components/Account/InfoCard";

const { height: screenHeight } = Dimensions.get("window");

type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

type FacultyProfile = {
  name: string;
  email: string;
  department: string;
  phoneNo: string;
  teacherNo: string;
};

const formatDob = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
};

const getMyFacultyProfile = async (): Promise<FacultyProfile> => {
  const token = await AsyncStorage.getItem("facultyToken");
  const res = await fetch("https://frosh-app-backend.onrender.com/api/faculty/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not load your account.");
  return data.faculty;
};

export default function AccountScreen() {
  const navigation = useNavigation<RootNavProp>();
  const { isDarkMode } = useAppTheme();
  const theme = useHomeTheme();

  const [role, setRole] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [facultyProfile, setFacultyProfile] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  const fetchProfile = useCallback(async () => {
    try {
      const userRole = await AsyncStorage.getItem("userRole");
      setRole(userRole);

      if (userRole === "faculty") {
        const data = await getMyFacultyProfile();
        setFacultyProfile(data);
      } else {
        const data = await getMyProfile();
        setStudentProfile(data);
      }
      setLoadError(null);
    } catch (error: any) {
      setLoadError(error?.response?.data?.error || error?.message || "Could not load your account.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgGradient[0] }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />
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
            <ScrollView
              contentContainerStyle={styles.container}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.textSecondary}
                />
              }
            >
              <View style={styles.header}>
                <TouchableOpacity onPress={handleBack}>
                  <Ionicons name="arrow-back" size={26} color={theme.iconColor} />
                </TouchableOpacity>
                <Text style={[styles.heading, { color: theme.textPrimary }]}>My Account</Text>
                <View style={{ width: 26 }} />
              </View>

              {loading ? (
                <ActivityIndicator color={theme.accent} size="large" style={styles.loader} />
              ) : loadError ? (
                <View style={styles.errorBox}>
                  <Text style={[styles.errorText, { color: theme.danger }]}>⚠️ {loadError}</Text>
                </View>
              ) : role === "faculty" && facultyProfile ? (
                <>
                  <ProfileHeader name={facultyProfile.name} email={facultyProfile.email} />
                  <InfoCard label="Department" value={facultyProfile.department} />
                  <InfoCard label="Phone Number" value={facultyProfile.phoneNo} />
                  <InfoCard label="Teacher No." value={facultyProfile.teacherNo} />
                </>
              ) : studentProfile ? (
                <>
                  <ProfileHeader name={studentProfile.name} email={studentProfile.email} />
                  <InfoCard label="Roll Number" value={studentProfile.rollNo} />
                  <InfoCard label="Branch" value={studentProfile.branch} />
                  <InfoCard label="Phone Number" value={studentProfile.phoneNo} />
                  <InfoCard label="Date of Birth" value={formatDob(studentProfile.dob)} />
                  <InfoCard label="Slot" value={`Slot ${studentProfile.slotNumber}`} />
                  <InfoCard label="Bootcamp Batch" value={studentProfile.batch || "Not assigned yet"} />
                  <InfoCard label="Father's Name" value={studentProfile.fatherName} />
                  <InfoCard label="Mother's Name" value={studentProfile.motherName} />
                </>
              ) : null}
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: "700" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  loader: { marginTop: 60 },
  errorBox: { marginTop: 60, alignItems: "center", paddingHorizontal: 20 },
  errorText: { fontSize: 15, textAlign: "center" },
});