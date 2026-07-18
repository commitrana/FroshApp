import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { user } from "../../constants/user";
import { RootStackParamList } from "../../types/navigation";
import { logout } from "../../services/auth";

import { useTheme } from "../../theme/theme";

import ProfileHeader from "../../Components/Account/ProfileHeader";
import InfoCard from "../../Components/Account/InfoCard";
import PrimaryButton from "../../Components/buttons/PrimaryButton";

type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

export default function AccountScreen() {
  const navigation = useNavigation();
  const rootNavigation = navigation.getParent<RootNavProp>();
  const { colors, isDarkMode } = useTheme();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          rootNavigation
            ? rootNavigation.replace("Login")
            : navigation.getParent()?.getParent<RootNavProp>()?.replace("Login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>

          <Text style={[styles.heading, { color: colors.textPrimary }]}>
            My Account
          </Text>

          <View style={{ width: 26 }} />
        </View>

        {/* Pass theme colors to ProfileHeader */}
        <ProfileHeader 
          name={user.name} 
          email={user.email} 
          theme={colors} // ← Added
        />

        {/* Pass theme colors to InfoCard */}
        <InfoCard 
          label="Roll Number" 
          value={user.rollNo} 
          theme={colors} // ← Added
        />
        <InfoCard 
          label="Department" 
          value={user.department} 
          theme={colors} // ← Added
        />
        <InfoCard 
          label="Semester" 
          value={user.semester} 
          theme={colors} // ← Added
        />
        <InfoCard 
          label="Program" 
          value={user.program} 
          theme={colors} // ← Added
        />

        <PrimaryButton title="Edit Profile" onPress={() => {}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
});