import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { logout, getCurrentUser, refreshMemberStatus } from "../services/auth";
import QRCode from "react-native-qrcode-svg";
import { useTheme } from "../theme/theme"; // ← Changed

type MemberDashboardNavProp = NativeStackNavigationProp<RootStackParamList, "MemberDashboard">;

type Member = {
  _id: string;
  name: string;
  email: string;
  branch: string;
  rollNo: string;
  slotNumber: number;
  societyName?: string;
  status?: string;
  verifiedAt?: string;
  rejectedAt?: string;
};

export default function MemberDashboardScreen() {
  const navigation = useNavigation<MemberDashboardNavProp>();
  const { colors, isDarkMode } = useTheme(); // ← Added
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMemberData();
  }, []);

  useEffect(() => {
    if (!member) return;

    const currentStatus = member.status || 'pending';
    if (currentStatus !== 'pending') return;

    const interval = setInterval(async () => {
      const updated = await refreshMemberStatus();
      if (updated) {
        console.log('🔄 Poll status:', updated.status);
        setMember(updated);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [member?.status]);

  const loadMemberData = async () => {
    try {
      const liveUser = await refreshMemberStatus();
      const user = liveUser || (await getCurrentUser());
      console.log('📱 Member:', user?.name, 'Status:', user?.status);
      setMember(user);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMemberData();
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout", style: "destructive", onPress: async () => {
          await logout();
          navigation.replace("Login");
        }
      }
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>No member data found</Text>
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.danger }]} onPress={handleLogout}>
          <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isPending = member.status === 'pending' || !member.status;
  const isVerified = member.status === 'verified';
  const isRejected = member.status === 'rejected';

  const qrData = JSON.stringify({
    type: 'member',
    id: member._id
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>👤 Member Dashboard</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
            <Text style={styles.refreshText}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { borderColor: colors.danger }]}>
            <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.welcomeText, { color: colors.textPrimary }]}>Welcome, {member.name}! </Text>

          <View style={styles.infoSection}>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{member.email}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Branch</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{member.branch}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Roll No</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{member.rollNo}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Slot</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>Slot {member.slotNumber}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Society</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{member.societyName}</Text>
            </View>
          </View>

          <View style={[
            styles.statusContainer,
            {
              backgroundColor: isVerified ? 'rgba(76, 175, 80, 0.2)' : isRejected ? 'rgba(244, 67, 54, 0.2)' : 'rgba(255, 152, 0, 0.2)'
            }
          ]}>
            <Text style={[
              styles.statusText,
              {
                color: isVerified ? '#4CAF50' : isRejected ? '#f44336' : '#FF9800'
              }
            ]}>
              {isVerified ? '✅ Verified' : isRejected ? '❌ Rejected' : '⏳ Pending Verification'}
            </Text>
          </View>

          {isPending && (
            <View style={[styles.qrContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.qrLabel, { color: colors.textPrimary }]}>Scan to verify</Text>
              <View style={styles.qrWhiteBox}>
                <QRCode value={qrData} size={220} color="black" backgroundColor="white" />
              </View>
              <Text style={[styles.qrSubLabel, { color: colors.textSecondary }]}>Show this to admin</Text>
            </View>
          )}

          {isVerified && (
            <View style={[styles.verifiedMessage, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.bigIcon}>✅</Text>
              <Text style={styles.bigText}>You are Verified!</Text>
              <Text style={styles.smallText}>Your membership is confirmed</Text>
            </View>
          )}

          {isRejected && (
            <View style={[styles.rejectedMessage, { backgroundColor: '#f44336' }]}>
              <Text style={styles.bigIcon}>❌</Text>
              <Text style={styles.bigText}>Verification Rejected</Text>
              <Text style={styles.smallText}>Contact your society admin</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16 },
  scrollContainer: { flex: 1, padding: 20 },
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  headerRight: { flexDirection: "row", gap: 15, alignItems: "center" },
  refreshBtn: { padding: 8 },
  refreshText: { fontSize: 20 },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  logoutText: { fontSize: 13, fontWeight: "600" },
  card: { padding: 20, borderRadius: 12, marginBottom: 20 },
  welcomeText: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  infoSection: { gap: 12 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: "500" },
  statusContainer: { marginTop: 20, padding: 12, borderRadius: 8, alignItems: "center" },
  statusText: { fontSize: 18, fontWeight: "bold" },
  qrContainer: { alignItems: "center", marginTop: 20, padding: 20, borderRadius: 12 },
  qrWhiteBox: { backgroundColor: "white", padding: 16, borderRadius: 12 },
  qrLabel: { fontSize: 16, fontWeight: "600", marginBottom: 15 },
  qrSubLabel: { fontSize: 12, marginTop: 15 },
  verifiedMessage: { marginTop: 20, padding: 20, borderRadius: 12, alignItems: "center" },
  rejectedMessage: { marginTop: 20, padding: 20, borderRadius: 12, alignItems: "center" },
  bigIcon: { fontSize: 40, marginBottom: 10 },
  bigText: { color: "white", fontSize: 22, fontWeight: "bold" },
  smallText: { color: "white", fontSize: 14, marginTop: 5, textAlign: "center", opacity: 0.9 },
  errorText: { fontSize: 18, textAlign: "center", marginTop: 20 },
});