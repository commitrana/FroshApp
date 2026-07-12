import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../../types/navigation";
import { logout } from "../../services/auth";
import Colors from "../../constants/colors";

type HeaderNavProp = NativeStackNavigationProp<RootStackParamList>;

export default function Header() {
  const navigation = useNavigation<HeaderNavProp>();

  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { 
          text: "Cancel", 
          style: "cancel" 
        },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              navigation.replace("Login");
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={handleOpenDrawer}
        activeOpacity={0.7}
      >
        <Ionicons name="menu" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <TouchableOpacity 
        
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 8,
  },
  menuButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  
  
  logoutText: {
  fontSize: 17,
  fontWeight: "600",
  color: "#FF5A5F",
  letterSpacing: 0.3,
}
});