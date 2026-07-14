import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { logout, getCurrentUser, refreshMemberStatus } from "../services/auth";
import QRCode from "react-native-qrcode-svg";
import Theme from "../theme/theme";

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
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMemberData();
  }, []);

  // Poll the server for live status while the member is still pending,
  // so the QR code disappears the moment admin scans + verifies/rejects.
  useEffect(() => {
    if (!member) return;

    const currentStatus = member.status || 'pending';
    if (currentStatus !== 'pending') return; // stop polling once resolved

    const interval = setInterval(async () => {
      const updated = await refreshMemberStatus();
      if (updated) {
        console.log('🔄 Poll status:', updated.status);
        setMember(updated);
      }
    }, 4000); // check every 4 seconds

    return () => clearInterval(interval);
  }, [member?.status]);

  const loadMemberData = async () => {
    try {
      // Try live server data first so status is always current;
      // fall back to cached data if offline.
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
      { text: "Logout", style: "destructive", onPress: async () => {
        await logout();
        navigation.replace("Login");
      }}
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No member data found</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isPending = member.status === 'pending' || !member.status;
  const isVerified = member.status === 'verified';
  const isRejected = member.status === 'rejected';

  // ✅ QR Data - Simple and clean
  const qrData = JSON.stringify({
    type: 'member',
    id: member._id
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👤 Member Dashboard</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
            <Text style={styles.refreshText}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.welcomeText}>Welcome, {member.name}! </Text>

          {/* INFO */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{member.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Branch</Text>
              <Text style={styles.infoValue}>{member.branch}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Roll No</Text>
              <Text style={styles.infoValue}>{member.rollNo}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Slot</Text>
              <Text style={styles.infoValue}>Slot {member.slotNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Society</Text>
              <Text style={styles.infoValue}>{member.societyName}</Text>
            </View>
          </View>

          {/* STATUS */}
          <View style={[styles.statusContainer, { 
            backgroundColor: isVerified ? '#4CAF5020' : isRejected ? '#f4433620' : '#FF980020' 
          }]}>
            <Text style={[styles.statusText, { 
              color: isVerified ? '#4CAF50' : isRejected ? '#f44336' : '#FF9800' 
            }]}>
              {isVerified ? '✅ Verified' : isRejected ? '❌ Rejected' : '⏳ Pending Verification'}
            </Text>
          </View>

          {/* QR CODE - ONLY IF PENDING */}
          {isPending && (
            <View style={styles.qrContainer}>
              <Text style={styles.qrLabel}>Scan to verify</Text>
              <View style={styles.qrWhiteBox}>
                <QRCode value={qrData} size={220} color="black" backgroundColor="white" />
              </View>
              <Text style={styles.qrSubLabel}>Show this to admin</Text>
            </View>
          )}

          {/* VERIFIED MESSAGE */}
          {isVerified && (
            <View style={styles.verifiedMessage}>
              <Text style={styles.bigIcon}>✅</Text>
              <Text style={styles.bigText}>You are Verified!</Text>
              <Text style={styles.smallText}>Your membership is confirmed</Text>
            </View>
          )}

          {/* REJECTED MESSAGE */}
          {isRejected && (
            <View style={styles.rejectedMessage}>
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
  safeArea: { flex: 1, backgroundColor: Theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Theme.colors.background },
  loadingText: { color: "#fff", marginTop: 10, fontSize: 16 },
  container: { flex: 1, padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#333" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  headerRight: { flexDirection: "row", gap: 15, alignItems: "center" },
  refreshBtn: { padding: 8 },
  refreshText: { fontSize: 20 },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e74c3c",
  },
  logoutText: { fontSize: 13, color: "#e74c3c", fontWeight: "600" },
  card: { backgroundColor: "#1a1a2e", padding: 20, borderRadius: 12, marginBottom: 20 },
  welcomeText: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  infoSection: { gap: 12 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#333" },
  infoLabel: { color: "#aaa", fontSize: 14 },
  infoValue: { color: "#fff", fontSize: 14, fontWeight: "500" },
  statusContainer: { marginTop: 20, padding: 12, borderRadius: 8, alignItems: "center" },
  statusText: { fontSize: 18, fontWeight: "bold" },
  qrContainer: { alignItems: "center", marginTop: 20, padding: 20, backgroundColor: "#1a1a2e", borderRadius: 12 },
  qrWhiteBox: { backgroundColor: "white", padding: 16, borderRadius: 12 },
  qrLabel: { color: "white", fontSize: 16, fontWeight: "600", marginBottom: 15 },
  qrSubLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 15 },
  verifiedMessage: { marginTop: 20, padding: 20, backgroundColor: "#4CAF50", borderRadius: 12, alignItems: "center" },
  rejectedMessage: { marginTop: 20, padding: 20, backgroundColor: "#f44336", borderRadius: 12, alignItems: "center" },
  bigIcon: { fontSize: 40, marginBottom: 10 },
  bigText: { color: "white", fontSize: 22, fontWeight: "bold" },
  smallText: { color: "white", fontSize: 14, marginTop: 5, textAlign: "center", opacity: 0.9 },
  errorText: { color: "#ff6b6b", fontSize: 18, textAlign: "center", marginTop: 20 },
  logoutBtnBottom: { backgroundColor: "#e74c3c", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 10, marginBottom: 30 },
  logoutBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});