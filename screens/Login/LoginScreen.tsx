import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Theme from "../../theme/theme";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import AppLogo from "../../Components/Logo/AppLogo";
import CustomInput from "../../Components/Input/CustomInput";
import PrimaryButton from "../../Components/buttons/PrimaryButton";
import { login } from "../../services/auth";

export default function LoginScreen() {
  type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;
  const navigation = useNavigation<LoginNavigationProp>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const result = await login(email.trim(), password.trim());
      
      if (result.success) {
        if (result.role === "student") {
          navigation.replace("MainTabs");
        } else if (result.role === "society") {
          navigation.replace("SocietyAdmin");
        } else if (result.role === "member") {
          navigation.replace("MemberDashboard");
        } else if (result.role === "faculty") {
          navigation.replace("FacultyDashboard");
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppLogo size={220} />
          <Text style={styles.heading}>Welcome</Text>

          <CustomInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <CustomInput
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {loading ? (
            <ActivityIndicator size="large" color={Theme.colors.primary} />
          ) : (
            <PrimaryButton title="Login" onPress={handleLogin} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Theme.colors.background },
  container: { flexGrow: 1, padding: 24, justifyContent: "flex-start", alignItems: "center" },
  heading: { color: "#fff", fontSize: 28, fontWeight: "700", marginBottom: 32, marginTop: 12 },
});