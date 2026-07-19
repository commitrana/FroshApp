// Save as: src/navigation/AppNavigator.tsx

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/Login/LoginScreen";
import { RootStackParamList } from "../types/navigation";
import DrawerNavigator from "./DrawerNavigator";
import OurTeamScreen from "../screens/OurTeam/OurTeamScreen";
import HostelsScreen from "../screens/Hostels/HostelsScreen";
import BoysScreen from "../screens/Hostels/BoysScreen";
import GirlsScreen from "../screens/Hostels/GirlsScreen";
import SocietiesScreen from "../screens/Societies/SocietiesScreen";
import LifeScreen from "../screens/LifeAtThapar/LifeScreen";
import CampusMapScreen from "../screens/CampusMap/CampusMapScreen";
import SocietyDashboardScreen from "../screens/SocietyAdmin/SocietyDashboardScreen";
import MemberDashboardScreen from "../screens/Memberdashboard";
import SplashScreen from "../screens/Splash/splashscreen";
import FacultyBootcampScreen from "../screens/Faculty/FacultyBootcampScreen";
import ClassDetails from "../screens/Faculty/ClassDetails";
import AttendanceSessionScreen from "../screens/Faculty/AttendanceSessionScreen";
import FlaggedReviewScreen from "../screens/Faculty/FlaggedReviewScreen";
import PresentListScreen from "../screens/Faculty/PresentListScreen";
import AttendanceRosterScreen from "../screens/Faculty/AttendanceRosterScreen";
import ScanAttendanceScreen from "../screens/Attendance/ScanAttendanceScreen";
import FeedbackQuestionsScreen from "../screens/Faculty/FeedbackQuestionsScreen";
import FeedbackResponsesScreen from "../screens/Faculty/FeedbackResponsesScreen";
import GiveFeedbackScreen from "../screens/Feedback/GiveFeedbackScreen";
import AccountScreen from "../screens/Account/AccountScreen";
import AboutScreen from "../screens/About/AboutScreen";
import ConnectScreen from "../screens/Connect/ConnectScreen";
import HelpScreen from "../screens/Help/HelpScreen";
import ScheduleScreen from "../screens/Schedule/ScheduleScreen";
import QRScreen from "../screens/QR/QRScreen";
import ExploreScreen from "../screens/Explore/ExploreScreen";
import ProfileScreen from "../screens/Profile/ProfileScreen";
import HomeScreen from "../screens/Home/HomeScreen";
import EateryScreen from "../screens/LifeAtThapar/EateryScreen";
import SportsScreen from "../screens/LifeAtThapar/SportsScreen";
import StudyScreen from "../screens/LifeAtThapar/StudyScreen";
import CulturalScreen from "../screens/LifeAtThapar/CulturalScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >
        <Stack.Screen name="SocietyAdmin" component={SocietyDashboardScreen} />
        <Stack.Screen name="MemberDashboard" component={MemberDashboardScreen} />
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={DrawerNavigator} />
        <Stack.Screen
          name="OurTeam"
          component={OurTeamScreen}
          options={{
            // OurTeamScreen animates itself (fadeAnim on mount, slideOutAnim
            // on handleBack) — the global "fade" transition was fighting
            // with it, cancelling out the visible motion. "none" here lets
            // the screen's own Animated logic be the only thing that plays.
            animation: "none",
            // Also stop the iOS edge-swipe / Android back gesture from
            // calling goBack() directly — that bypasses handleBack() and
            // skips the custom slide-out entirely.
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="Hostels" component={HostelsScreen} />
        <Stack.Screen name="Boys" component={BoysScreen} />
        <Stack.Screen name="Girls" component={GirlsScreen} />
        <Stack.Screen name="Societies" component={SocietiesScreen} />
        <Stack.Screen name="LifeAtThapar" component={LifeScreen} />
        <Stack.Screen name="CampusMap" component={CampusMapScreen} />

        {/* Shared screens reachable from any nested tree */}
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen name="Account" component={AccountScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Connect" component={ConnectScreen} />
        <Stack.Screen name="Schedule" component={ScheduleScreen} />
        <Stack.Screen name="QR" component={QRScreen} />
        <Stack.Screen name="Explore" component={ExploreScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />

        {/* Faculty entry point — now renders Home directly, no tab bar */}
        <Stack.Screen name="FacultyTabs" component={HomeScreen} />

        {/* Kept for AttendanceSessionScreen's internal
            navigation.navigate('FacultyDashboard') call. */}
        <Stack.Screen name="FacultyDashboard" component={FacultyBootcampScreen} />

        <Stack.Screen name="ClassDetails" component={ClassDetails} />
        <Stack.Screen name="AttendanceSession" component={AttendanceSessionScreen} />
        <Stack.Screen name="FlaggedReview" component={FlaggedReviewScreen} />
        <Stack.Screen name="PresentList" component={PresentListScreen} />
        <Stack.Screen name="AttendanceRoster" component={AttendanceRosterScreen} />
        <Stack.Screen name="ScanAttendance" component={ScanAttendanceScreen} />
        <Stack.Screen name="FeedbackQuestions" component={FeedbackQuestionsScreen} />
        <Stack.Screen name="FeedbackResponses" component={FeedbackResponsesScreen} />
        <Stack.Screen name="GiveFeedback" component={GiveFeedbackScreen} />
        <Stack.Screen name="EateryPoints" component={EateryScreen} />
        <Stack.Screen name="SportsComplex" component={SportsScreen} />
        <Stack.Screen name="StudyZones" component={StudyScreen} />
        <Stack.Screen name="CulturalCentres" component={CulturalScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}