import React, { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../types/navigation";
import { getMyProfile, StudentProfile } from "../../services/student";

import Theme from "../../theme/theme";

import ProfileHeader from "../../Components/Account/ProfileHeader";
import InfoCard from "../../Components/Account/InfoCard";

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
  const navigation = useNavigation();

  const [role, setRole] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [facultyProfile, setFacultyProfile] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9CA3AF" />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="white" />
          </TouchableOpacity>
          <Text style={styles.heading}>My Account</Text>
          <View style={{ width: 26 }} />
        </View>

        {loading ? (
          <ActivityIndicator color={Theme.colors.primary} size="large" style={styles.loader} />
        ) : loadError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {loadError}</Text>
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
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Theme.colors.background },
  container: { padding: 20, paddingBottom: 40 },
  heading: { color: "white", fontSize: 26, fontWeight: "700" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  loader: { marginTop: 60 },
  errorBox: { marginTop: 60, alignItems: "center", paddingHorizontal: 20 },
  errorText: { color: "#EF4444", fontSize: 15, textAlign: "center" },
});