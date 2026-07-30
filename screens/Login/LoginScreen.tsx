// Save as: src/screens/Login/LoginScreen.tsx
// Only change vs your current file: faculty now navigates to "FacultyTabs"
// instead of "FacultyDashboard" on login. Everything else is untouched.

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
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import { login } from "../../services/auth";

export default function LoginScreen() {
  type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;
  const navigation = useNavigation<LoginNavigationProp>();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Same backend login logic as before - only the UI around it has changed.
  const handleLogin = async () => {
    const emailToUse = email;
    const passwordToUse = password;

    if (!emailToUse || !passwordToUse) {
      Alert.alert("Missing info", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const result = await login(emailToUse.trim(), passwordToUse.trim());

      if (result.success) {
        if (result.role === "student") {
          navigation.replace("MainTabs");
        } else if (result.role === "society") {
          navigation.replace("SocietyAdmin");
        } else if (result.role === "member") {
          navigation.replace("MemberDashboard");
        } else if (result.role === "faculty") {
          navigation.replace("FacultyTabs");
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      Alert.alert(
        "Login failed",
        err?.message || "Invalid email or password. Please try again."
      );
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
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/logos/frosh_logo.png")}
                style={{
                  width: 150,
                  height: 150,
                  marginBottom: 0,
                  marginTop:8
                }}
                resizeMode="contain"
              />
            </View>

            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>Welcome to FROSH!</Text>
              <Text style={styles.welcomeSub}>
                Your campus. Your events. Your Community
              </Text>
            </View>

            <View style={styles.form}>
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
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#666"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
              </View>

              

              {loading ? (
                <View style={styles.loginButton}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              ) : (
                <TouchableOpacity style={styles.loginButton} onPress={() => handleLogin()}>
                  <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.forgotPasswordLink}
                onPress={() => navigation.navigate("ResetPassword")}
                disabled={loading}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>

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
  logoContainer: { alignItems: "center", marginBottom:0 },
  logoImage: { width: 200, height: 200 },
  welcomeContainer: { marginBottom: 20, alignItems: "center" },
  welcomeTitle: { fontSize: 22, fontWeight: "600", color: "#fff", marginBottom:5,

  },
  welcomeSub: { fontSize: 14, color: "#aaa", textAlign: "center" },
  form: { width: "100%" , marginBottom:20
  },
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
  
  loginButton: {
    backgroundColor: "#6c8cff",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "center",
  },
  loginButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  forgotPasswordLink: { alignItems: "center", marginTop: -8, marginBottom: 12 },
  forgotPasswordText: { color: "#6c8cff", fontSize: 14, fontWeight: "600" },

  createAccount: { color: "#aaa", fontSize: 15, textAlign: "center" },
  createAccountBold: { color: "#6c8cff", fontWeight: "700" },
});