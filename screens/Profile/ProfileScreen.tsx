import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import { useTheme } from "../../theme/theme";
import { getMyProfile, StudentProfile } from "../../services/student";
import { logout } from "../../services/auth";

import ProfileHeader from "../../Components/Account/ProfileHeader";
import InfoCard from "../../Components/Account/InfoCard";
import PrimaryButton from "../../Components/buttons/PrimaryButton";

type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

const formatDob = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const rootNavigation = navigation.getParent<RootNavProp>();
  const { colors, isDarkMode } = useTheme();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getMyProfile();
      setProfile(data);
      setLoadError(null);
    } catch (error: any) {
      setLoadError(error?.response?.data?.error || "Could not load your profile.");
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

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          rootNavigation?.replace("Login");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (loadError || !profile) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.errorBox}>
          <Text style={[styles.errorText, { color: colors.danger || "#EF4444" }]}>
            ⚠️ {loadError || "Could not load your profile."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.textSecondary} 
          />
        }
      >
        <Text style={[styles.heading, { color: colors.textPrimary }]}>My Profile</Text>

        <ProfileHeader
          name={profile.name}
          email={profile.email}
        />

        <InfoCard 
          label="Roll Number" 
          value={profile.rollNo} 
        />
        <InfoCard 
          label="Branch" 
          value={profile.branch} 
        />
        <InfoCard 
          label="Phone Number" 
          value={profile.phoneNo} 
        />
        <InfoCard 
          label="Date of Birth" 
          value={formatDob(profile.dob)} 
        />
        <InfoCard 
          label="Slot" 
          value={`Slot ${profile.slotNumber}`} 
        />
        <InfoCard 
          label="Bootcamp Batch" 
          value={profile.batch || "Not assigned yet"} 
        />
        <InfoCard 
          label="Father's Name" 
          value={profile.fatherName} 
        />
        <InfoCard 
          label="Mother's Name" 
          value={profile.motherName} 
        />

        <View style={{ marginTop: 10 }}>
          <PrimaryButton title="Logout" onPress={handleLogout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 6,
  },
});