// Save as: src/screens/Login/ResetPasswordScreen.tsx
// Reset-password flow for STUDENT and FACULTY logins only (society/member
// login is untouched, per requirements). User picks a role, enters email +
// old password + new password. Backend checks the old password is correct
// before updating it.

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import { resetPassword } from "../../services/auth";

type Role = "student" | "faculty";

export default function ResetPasswordScreen() {
  type NavProp = NativeStackNavigationProp<RootStackParamList, "ResetPassword">;
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();

  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email || !oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Weak password", "New password should be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords don't match", "New password and confirm password must match.");
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(role, email.trim(), oldPassword, newPassword);
      if (result.success) {
        Alert.alert("Success", "Your password has been updated. Please log in again.", [
          { text: "OK", onPress: () => navigation.replace("Login") },
        ]);
      }
    } catch (err: any) {
      Alert.alert("Reset failed", err?.message || "Could not reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#0b0f1a", "#1a1f2f"]}
      style={[styles.gradient, { paddingTop: insets.top }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>{"‹ Back"}</Text>
            </TouchableOpacity>

            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>Change Password</Text>
              <Text style={styles.welcomeSub}>
                For Student and Faculty accounts only
              </Text>
            </View>

            <View style={styles.form}>
              {/* Role picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>I am a</Text>
                <View style={styles.roleRow}>
                  <TouchableOpacity
                    style={[styles.roleButton, role === "student" && styles.roleButtonActive]}
                    onPress={() => setRole("student")}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        role === "student" && styles.roleButtonTextActive,
                      ]}
                    >
                      Student
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleButton, role === "faculty" && styles.roleButtonActive]}
                    onPress={() => setRole("faculty")}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        role === "faculty" && styles.roleButtonTextActive,
                      ]}
                    >
                      Faculty
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Old password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter current password"
                  placeholderTextColor="#666"
                  secureTextEntry
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#666"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm new password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#666"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!loading}
                />
              </View>

              {loading ? (
                <View style={styles.submitButton}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              ) : (
                <TouchableOpacity style={styles.submitButton} onPress={handleReset}>
                  <Text style={styles.submitButtonText}>Update Password</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center" },
  content: { flex: 1, paddingHorizontal: 30, justifyContent: "flex-start" },
  backBtn: { marginTop: 12, marginBottom: 8 },
  backBtnText: { color: "#6c8cff", fontSize: 16, fontWeight: "600" },
  welcomeContainer: { marginBottom: 20, alignItems: "center" },
  welcomeTitle: { fontSize: 22, fontWeight: "600", color: "#fff", marginBottom: 5 },
  welcomeSub: { fontSize: 14, color: "#aaa", textAlign: "center" },
  form: { width: "100%", marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { color: "#ddd", fontSize: 14, fontWeight: "500", marginBottom: 10 },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  roleRow: { flexDirection: "row", gap: 12 },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  roleButtonActive: {
    backgroundColor: "#6c8cff",
    borderColor: "#6c8cff",
  },
  roleButtonText: { color: "#aaa", fontSize: 15, fontWeight: "600" },
  roleButtonTextActive: { color: "#fff" },
  submitButton: {
    backgroundColor: "#6c8cff",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    justifyContent: "center",
  },
  submitButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});