// Save as: src/navigation/FacultyBottomTabs.tsx
//
// Parallel to BottomTabs.tsx — same tab-bar shell (blur background,
// safe-area-aware height, same styling), reused as-is. Differences from the
// student BottomTabs:
//   - No QR tab (faculty don't hold tickets, so nothing to scan)
//   - "Bootcamp" tab renders FacultyBootcampScreen (real faculty schedule +
//     attendance flow) instead of the student cohort schedule
//
// ⚠️ Home and Profile currently import the SAME components the student tabs
// use, completely unmodified:
//   - HomeScreen: still shows the register/ticket button on the live event
//     card. Per your answer ("no QR tab, explore same, profile shows
//     faculty data, upcoming events shown") the register button should be
//     hidden for faculty — I don't have HomeScreen.tsx yet, so I can't make
//     that change. Send it over and I'll wire up a `hideRegisterButton` (or
//     role-based) prop.
//   - ProfileScreen: same story — I don't have its source, so it'll render
//     whatever it already reads from AsyncStorage generically. If it
//     already reads userRole/facultyData generically it may just work; if
//     it's hardcoded to student fields, send it over and I'll point it at
//     `facultyData` explicitly.
// Explore and Schedule are reused unmodified on purpose (Explore per your
// answer; Schedule wasn't one of the 4 confirmed questions so I defaulted
// it to "same as student" — flag if that's wrong).

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeScreen from "../screens/Home/HomeScreen";
import ExploreScreen from "../screens/Explore/ExploreScreen";
import ScheduleScreen from "../screens/Schedule/ScheduleScreen";
import ProfileScreen from "../screens/Profile/ProfileScreen";
import FacultyBootcampScreen from "../screens/Faculty/FacultyBootcampScreen";

import { FacultyBottomTabParamList } from "../types/navigation";
import Colors from "../constants/colors";

const Tab = createBottomTabNavigator<FacultyBottomTabParamList>();

const ICONS: Record<keyof FacultyBottomTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: "home",
  Bootcamp: "school",
  Explore: "compass",
  Schedule: "calendar",
  Profile: "person",
};

const BASE_TAB_HEIGHT = 60;
const BASE_BOTTOM_PADDING = 10;

export default function FacultyBottomTabs() {
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
            name={ICONS[route.name as keyof FacultyBottomTabParamList]}
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Bootcamp" component={FacultyBootcampScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
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