// Save as: src/navigation/AppNavigator.tsx

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/Login/LoginScreen";
import { RootStackParamList } from "../types/navigation";
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
import ClassDetails from "../screens/Faculty/ClassDetails";
import AttendanceSessionScreen from "../screens/Faculty/AttendanceSessionScreen";
import FlaggedReviewScreen from "../screens/Faculty/FlaggedReviewScreen";
import PresentListScreen from "../screens/Faculty/PresentListScreen";
import AttendanceRosterScreen from "../screens/Faculty/AttendanceRosterScreen";
import ClassHistoryScreen from "../screens/Faculty/ClassHistoryScreen";
import ClassHistoryRosterScreen from "../screens/Faculty/ClassHistoryRosterScreen";
import StudentClassHistoryScreen from "../screens/Bootcamp/StudentClassHistoryScreen";
import EnterAttendanceCodeScreen from '../screens/Faculty/Enterattendancecodescreen';
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
        <Stack.Screen
          name="OurTeam"
          component={OurTeamScreen}
          options={{
            presentation: "transparentModal",
            animation: "none",
            gestureEnabled: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="Hostels"
          component={HostelsScreen}
          options={{
            presentation: "transparentModal",
            animation: "none",
            gestureEnabled: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="Boys"
          component={BoysScreen}
          options={{
            presentation: "transparentModal",
            animation: "none",
            gestureEnabled: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="Girls"
          component={GirlsScreen}
          options={{
            presentation: "transparentModal",
            animation: "none",
            gestureEnabled: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="Societies"
          component={SocietiesScreen}
          options={{
            presentation: "transparentModal",
            animation: "none",
            gestureEnabled: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="LifeAtThapar"
          component={LifeScreen}
          options={{
            presentation: "transparentModal",
            animation: "none",
            gestureEnabled: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen name="CampusMap" component={CampusMapScreen} />

        {/* Shared screens reachable from any nested tree */}
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen
          name="Account"
          component={AccountScreen}
          options={{
            presentation: "transparentModal",
            animation: "none",
            gestureEnabled: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{
            presentation: "transparentModal",
            animation: "none",
            gestureEnabled: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="Connect"
          component={ConnectScreen}
          options={{
            presentation: "transparentModal",
            animation: "none",
            gestureEnabled: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="Schedule"
          component={ScheduleScreen}
          options={{
            presentation: "transparentModal",
            animation: "none",
            gestureEnabled: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen name="QR" component={QRScreen} />
        <Stack.Screen name="Explore" component={ExploreScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />

        {/* Student entry point — HomeScreen itself branches on userRole, so
            MainTabs (student) and FacultyTabs (faculty) both point here. */}
        <Stack.Screen name="MainTabs" component={HomeScreen} />

        {/* Faculty entry point — HomeScreen itself branches on userRole and
            renders the faculty Weekly Schedule (with Class History button)
            under its own "Bootcamp" tab. FacultyDashboard / FacultyBootcampScreen
            / FacultyBottomTabs are retired — do not re-add them. */}
        <Stack.Screen name="FacultyTabs" component={HomeScreen} />

        <Stack.Screen name="ClassDetails" component={ClassDetails} />
        <Stack.Screen name="AttendanceSession" component={AttendanceSessionScreen} />
        <Stack.Screen name="FlaggedReview" component={FlaggedReviewScreen} />
        <Stack.Screen name="PresentList" component={PresentListScreen} />
        <Stack.Screen name="AttendanceRoster" component={AttendanceRosterScreen} />
        <Stack.Screen name="ClassHistory" component={ClassHistoryScreen} />
        <Stack.Screen name="ClassHistoryRoster" component={ClassHistoryRosterScreen} />
        <Stack.Screen name="StudentClassHistory" component={StudentClassHistoryScreen} />
        <Stack.Screen name="EnterAttendanceCode" component={EnterAttendanceCodeScreen} />
        <Stack.Screen name="FeedbackQuestions" component={FeedbackQuestionsScreen} />
        <Stack.Screen name="FeedbackResponses" component={FeedbackResponsesScreen} />
        <Stack.Screen name="GiveFeedback" component={GiveFeedbackScreen} />
        <Stack.Screen
          name="EateryPoints"
          component={EateryScreen}
          options={{
            presentation: "transparentModal",
            animation: "none",
            gestureEnabled: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="SportsComplex"
          component={SportsScreen}
          options={{
            presentation: "transparentModal",
            animation: "none",
            gestureEnabled: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="StudyZones"
          component={StudyScreen}
          options={{
            presentation: "transparentModal",
            animation: "none",
            gestureEnabled: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="CulturalCentres"
          component={CulturalScreen}
          options={{
            presentation: "transparentModal",
            animation: "none",
            gestureEnabled: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}