import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Theme from "../../theme/theme";
import Colors from "../../constants/colors";
import { RootStackParamList } from "../../types/navigation";
import AppCard from "../../Components/Common/AppCard";
import CustomInput from "../../Components/Input/CustomInput";
import PrimaryButton from "../../Components/buttons/PrimaryButton";
import { logout } from "../../services/auth";
import {
  getSocietyMembers, createMember, updateMember, deleteMember,
} from "../../services/societyAdmin";

const BRANCHES = ["CSE", "ECE", "ME", "CE", "EE", "IT", "Other"];
const TOTAL_SLOT1 = 5;
const TOTAL_SLOT2 = 2;
const TOTAL_MEMBERS = TOTAL_SLOT1 + TOTAL_SLOT2;

type Member = {
  _id: string; name: string; branch: string; rollNo: string;
  email: string; slotNumber: 1 | 2;
};

type NavProp = NativeStackNavigationProp<RootStackParamList, "SocietyAdmin">;

export default function SocietyDashboardScreen() {
  const navigation = useNavigation<NavProp>();
  const [societyName, setSocietyName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [form, setForm] = useState({
    name: "", branch: "", rollNo: "", email: "", password: "", slotNumber: 1 as 1 | 2,
  });

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSocietyMembers();
      setMembers(data.members || []);
    } catch (err) {
      Alert.alert("Error", "Could not load members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem("societyData");
      if (raw) setSocietyName(JSON.parse(raw).societyName || "");
    })();
    loadMembers();
  }, [loadMembers]);

  const resetForm = () => {
    setForm({ name: "", branch: "", rollNo: "", email: "", password: "", slotNumber: 1 });
    setEditingMember(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setForm({
      name: member.name, branch: member.branch, rollNo: member.rollNo,
      email: member.email, password: "", slotNumber: member.slotNumber,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    const { name, branch, rollNo, email, password, slotNumber } = form;
    if (!name || !branch || !rollNo || !email || (!editingMember && !password)) {
      Alert.alert("Missing info", "Please fill all required fields.");
      return;
    }
    if (password && password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    setSaving(true);
    try {
      if (editingMember) {
        await updateMember(editingMember._id, {
          name, branch, rollNo, email, ...(password ? { password } : {}),
        });
      } else {
        if (members.length >= TOTAL_MEMBERS) {
          Alert.alert("Full", `Maximum of ${TOTAL_MEMBERS} members reached.`);
          setSaving(false);
          return;
        }
        await createMember({ name, branch, rollNo, email, password }, slotNumber);
      }
      setModalVisible(false);
      resetForm();
      loadMembers();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (member: Member) => {
    Alert.alert("Remove member", `Remove "${member.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive", onPress: async () => {
          try {
            await deleteMember(member._id);
            loadMembers();
          } catch {
            Alert.alert("Error", "Could not remove member.");
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace("Login");
  };

  const renderMember = ({ item }: { item: Member }) => (
    <AppCard style={styles.memberCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberMeta}>{item.branch} • {item.rollNo}</Text>
        <Text style={styles.memberMeta}>{item.email}</Text>
        <Text style={styles.slotTag}>Slot {item.slotNumber}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => openEditModal(item)} style={[styles.actionBtn, { backgroundColor: "#FF9800" }]}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={[styles.actionBtn, { backgroundColor: Colors.danger }]}>
          <Text style={styles.actionText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </AppCard>
  );

  const isFull = members.length >= TOTAL_MEMBERS;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>{societyName || "Society Dashboard"}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <AppCard style={styles.countCard}>
        <Text style={styles.countNumber}>{members.length} / {TOTAL_MEMBERS}</Text>
        <Text style={styles.memberMeta}>
          {isFull ? "All slots are filled!" : `${TOTAL_MEMBERS - members.length} slot(s) remaining`}
        </Text>
      </AppCard>

      {loading ? (
        <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item._id}
          renderItem={renderMember}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.memberMeta}>No members yet.</Text>}
        />
      )}

      {!isFull && (
        <View style={{ padding: 16 }}>
          <PrimaryButton title="+ Add Member" onPress={openAddModal} />
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView>
              <Text style={styles.modalTitle}>{editingMember ? "Edit Member" : "Add Member"}</Text>

              <CustomInput placeholder="Full Name" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
              <CustomInput placeholder="Roll No" value={form.rollNo} onChangeText={(t) => setForm({ ...form, rollNo: t })} />
              <CustomInput placeholder="Email" value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} keyboardType="email-address" autoCapitalize="none" />
              <CustomInput
                placeholder={editingMember ? "New Password (optional)" : "Password"}
                secureTextEntry
                value={form.password}
                onChangeText={(t) => setForm({ ...form, password: t })}
              />

              <Text style={styles.label}>Branch</Text>
              <View style={styles.chipRow}>
                {BRANCHES.map((b) => (
                  <TouchableOpacity
                    key={b}
                    onPress={() => setForm({ ...form, branch: b })}
                    style={[styles.chip, form.branch === b && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, form.branch === b && styles.chipTextActive]}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {!editingMember && (
                <>
                  <Text style={styles.label}>Slot</Text>
                  <View style={styles.chipRow}>
                    {[1, 2].map((s) => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setForm({ ...form, slotNumber: s as 1 | 2 })}
                        style={[styles.chip, form.slotNumber === s && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, form.slotNumber === s && styles.chipTextActive]}>Slot {s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <View style={{ marginTop: 20, gap: 10 }}>
                {saving ? (
                  <ActivityIndicator color={Theme.colors.primary} />
                ) : (
                  <PrimaryButton title={editingMember ? "Update" : "Add"} onPress={handleSubmit} />
                )}
                <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                  <Text style={styles.cancel}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 16,
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  logout: { color: Colors.danger, fontWeight: "600" },
  countCard: { marginHorizontal: 16, alignItems: "center" },
  countNumber: { color: Colors.primary, fontSize: 28, fontWeight: "700" },
  memberMeta: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  memberCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  memberName: { color: "#fff", fontWeight: "700", fontSize: 16 },
  slotTag: { color: Colors.primary, marginTop: 4, fontSize: 12, fontWeight: "600" },
  actions: { gap: 8 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  actionText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: Theme.colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "85%" },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 16 },
  label: { color: Colors.textSecondary, marginBottom: 8, fontWeight: "600" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: 13 },
  chipTextActive: { color: "#04121A", fontWeight: "700" },
  cancel: { color: Colors.textMuted, textAlign: "center", marginTop: 4 },
});