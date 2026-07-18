import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeScreen from "../screens/Home/HomeScreen";
import ExploreScreen from "../screens/Explore/ExploreScreen";
import ScheduleScreen from "../screens/Schedule/ScheduleScreen";
import QRScreen from "../screens/QR/QRScreen";
import ProfileScreen from "../screens/Profile/ProfileScreen";

import { BottomTabParamList } from "../types/navigation";
import { useTheme } from "../theme/theme"; // ← Changed

const Tab = createBottomTabNavigator<BottomTabParamList>();

const ICONS: Record<keyof BottomTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: "home",
  Explore: "compass",
  Schedule: "calendar",
  QR: "qr-code",
  Profile: "person",
};

const BASE_TAB_HEIGHT = 60;
const BASE_BOTTOM_PADDING = 10;

export default function BottomTabs() {
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode } = useTheme(); // ← Added

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [
          styles.tabBar,
          {
            height: BASE_TAB_HEIGHT + insets.bottom,
            paddingBottom: BASE_BOTTOM_PADDING + insets.bottom,
          },
        ],
        tabBarBackground: () => (
          <BlurView
            intensity={50}
            tint={isDarkMode ? "dark" : "light"} // ← Dynamic tint
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
  },
});