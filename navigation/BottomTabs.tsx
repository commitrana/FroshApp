import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";

import HomeScreen from "../screens/Home/HomeScreen";
import ExploreScreen from "../screens/Explore/ExploreScreen";
import ScheduleScreen from "../screens/Schedule/ScheduleScreen";
import QRScreen from "../screens/QR/QRScreen";
import ProfileScreen from "../screens/Profile/ProfileScreen";

import { BottomTabParamList } from "../types/navigation";
import Colors from "../constants/colors";

const Tab = createBottomTabNavigator<BottomTabParamList>();

const ICONS: Record<keyof BottomTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: "home",
  Explore: "compass",
  Schedule: "calendar",
  QR: "qr-code",
  Profile: "person",
};

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView
            intensity={50}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarIcon: ({ color, size }) => (
          <Ionicons 
            name={ICONS[route.name as keyof BottomTabParamList]} 
            color={color} 
            size={size} 
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="QR" component={QRScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    borderTopWidth: 0,
    backgroundColor: "transparent",
    elevation: 0,
    height: 70,
    paddingBottom: 10,
  },
});