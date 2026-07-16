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
import Colors from "../constants/colors";

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
  // The bar is `position: 'absolute'` with a fixed height, which never
  // accounted for the device's own bottom inset (gesture-nav pill or
  // 3-button nav bar). On phones with a taller system nav bar — and on
  // newer Android/Expo versions, which render edge-to-edge by default —
  // that system bar was overlapping our custom tab bar instead of sitting
  // below it. Adding the real inset on top of our base height/padding
  // pushes the bar up above whatever the device reserves at the bottom.
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
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
  },
});