import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/Login/LoginScreen";
import { RootStackParamList } from "../types/navigation";
import DrawerNavigator from "./DrawerNavigator";
import OurTeamScreen from "../screens/OurTeam/OurTeamScreen";
import HostelsScreen from "../screens/Hostels/HostelsScreen";
import SocietiesScreen from "../screens/Societies/SocietiesScreen";
import LifeAtThaparScreen from "../screens/LifeAtThapar/LifeAtThaparScreen";
import CampusMapScreen from "../screens/CampusMap/CampusMapScreen";
import SocietyDashboardScreen from "../screens/SocietyAdmin/SocietyDashboardScreen";
import MemberDashboardScreen from "../screens/Memberdashboard";
import SplashScreen from "../screens/Splash/splashscreen";
import FacultyDashboard from '../screens/Faculty/FacultyDashboard';
import ClassDetails from '../screens/Faculty/ClassDetails';
import AttendanceSessionScreen from '../screens/Faculty/AttendanceSessionScreen';
import FlaggedReviewScreen from '../screens/Faculty/FlaggedReviewScreen';
import PresentListScreen from '../screens/Faculty/PresentListScreen';
import AttendanceRosterScreen from '../screens/Faculty/AttendanceRosterScreen';
import ScanAttendanceScreen from '../screens/Attendance/ScanAttendanceScreen';

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
        <Stack.Screen name="Societies" component={SocietiesScreen} />
        <Stack.Screen name="LifeAtThapar" component={LifeAtThaparScreen} />
        <Stack.Screen name="CampusMap" component={CampusMapScreen} />
        <Stack.Screen name="FacultyDashboard" component={FacultyDashboard} />
        <Stack.Screen name="ClassDetails" component={ClassDetails} />
        <Stack.Screen name="AttendanceSession" component={AttendanceSessionScreen} />
        <Stack.Screen name="FlaggedReview" component={FlaggedReviewScreen} />
        <Stack.Screen name="PresentList" component={PresentListScreen} />
        <Stack.Screen name="AttendanceRoster" component={AttendanceRosterScreen} />
        <Stack.Screen name="ScanAttendance" component={ScanAttendanceScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}