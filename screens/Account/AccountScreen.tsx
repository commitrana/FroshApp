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

import Theme from "../../theme/theme";

import ProfileHeader from "../../Components/Account/ProfileHeader";
import InfoCard from "../../Components/Account/InfoCard";
import PrimaryButton from "../../Components/buttons/PrimaryButton";

type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

export default function AccountScreen() {
    const navigation = useNavigation();
    // AccountScreen sits inside the Drawer, which sits inside the root Stack.
    // getParent() reaches up to the root Stack so we can navigate to "Login".
    const rootNavigation = navigation.getParent<RootNavProp>();

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
    <SafeAreaView style={styles.safeArea}>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.header}>

  <TouchableOpacity
    onPress={() => navigation.goBack()}
  >
    <Ionicons
      name="arrow-back"
      size={26}
      color="white"
    />
  </TouchableOpacity>

  <Text style={styles.heading}>
    My Account
  </Text>

  {/* Keeps the title centered */}
  <View style={{ width: 26 }} />

</View>

        <ProfileHeader
          name= {user.name}
          email={user.email}
        />

        <InfoCard
          label="Roll Number"
          value={user.rollNo}
        />

        <InfoCard
          label="Department"
          value={user.department}
        />

        <InfoCard
          label="Semester"
          value={user.semester}
        />

        <InfoCard
          label="Program"
          value={user.program}
        />

        <PrimaryButton
          title="Edit Profile"
          onPress={() => {}}
        />

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  safeArea:{
    flex:1,
    backgroundColor:Theme.colors.background,
  },

  container:{
    padding:20,
    paddingBottom:40,
  },

  heading: {
  color: "white",
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