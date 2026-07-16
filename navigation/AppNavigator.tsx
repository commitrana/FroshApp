// Save as: src/navigation/AppNavigator.tsx
// Changes vs your current file:
//   1. New import: FacultyBottomTabs (the tab shell) and FacultyBootcampScreen
//      (replaces the old FacultyDashboard import).
//   2. New <Stack.Screen name="FacultyTabs" .../> — this is where Login now
//      sends faculty on login.
//   3. <Stack.Screen name="FacultyDashboard" .../> now points at
//      FacultyBootcampScreen instead of the old FacultyDashboard component,
//      kept only so AttendanceSessionScreen's existing
//      navigation.navigate('FacultyDashboard') call still resolves.
// Everything else — every other Stack.Screen — is untouched.

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
import LifeAtThaparScreen from "../screens/LifeAtThapar/LifeAtThaparScreen";
import CampusMapScreen from "../screens/CampusMap/CampusMapScreen";
import SocietyDashboardScreen from "../screens/SocietyAdmin/SocietyDashboardScreen";
import MemberDashboardScreen from "../screens/Memberdashboard";
import SplashScreen from "../screens/Splash/splashscreen";
import FacultyBottomTabs from "./FacultyBottomTabs";
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
        <Stack.Screen name="OurTeam" component={OurTeamScreen} />
        <Stack.Screen name="Hostels" component={HostelsScreen} />
        <Stack.Screen name="Boys" component={BoysScreen} />
        <Stack.Screen name="Girls" component={GirlsScreen} />
        <Stack.Screen name="Societies" component={SocietiesScreen} />
        <Stack.Screen name="LifeAtThapar" component={LifeAtThaparScreen} />
        <Stack.Screen name="CampusMap" component={CampusMapScreen} />

        {/* Faculty entry point — Login sends faculty here now */}
        <Stack.Screen name="FacultyTabs" component={FacultyBottomTabs} />

        {/* Kept for AttendanceSessionScreen's internal
            navigation.navigate('FacultyDashboard') call — renders the same
            Bootcamp content, just without the tab bar around it. */}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}