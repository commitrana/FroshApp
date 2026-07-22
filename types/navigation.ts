// Save as: src/types/navigation.ts
// Only additions vs your current file: `FacultyTabs` route, and the new
// `FacultyBottomTabParamList` type. Everything else (including
// `FacultyDashboard`, kept for AttendanceSessionScreen's internal
// back-navigation — see FacultyBootcampScreen.tsx comment) is unchanged.

export type RootStackParamList = {
  // Auth Screens
  Splash: undefined;
  Login: undefined;

  // Main App
  MainTabs: undefined;

  // Faculty entry point — Login now routes faculty here instead of
  // directly to "FacultyDashboard".
  FacultyTabs: undefined;

  // Dashboards
  SocietyAdmin: undefined;
  MemberDashboard: undefined;

  // Static Screens
  Home: undefined;
  OurTeam: undefined;
  Hostels: undefined;
  Societies: undefined;
  Boys: undefined;
  Girls: undefined;
  LifeAtThapar: undefined;
  EateryPoints: undefined;
  SportsComplex: undefined;
  StudyZones: undefined;
  CulturalCentres: undefined;
  CampusMap: undefined;
  Bootcamp: undefined;

  // Other Screens (add more as needed)
  Account: undefined;
  Profile: undefined;
  Explore: undefined;
  Connect: undefined;
  Help: undefined;
  About: undefined;
  QR: undefined;
  Schedule: undefined;

  // Kept as a route (now rendering FacultyBootcampScreen directly, full
  // screen without tab bar) purely so AttendanceSessionScreen's existing
  // `navigation.navigate('FacultyDashboard')` call keeps working unchanged.
  FacultyDashboard: undefined;

  ClassDetails: {
    day: string;
    slot: string;
    subject: string;
    venue?: string;
    batches?: string[];
  };
  AttendanceSession: {
    sessionId: string;
    subject: string;
  };
  FlaggedReview: {
    sessionId: string;
  };
  PresentList: {
    sessionId: string;
    subject?: string;
  };
  AttendanceRoster: {
    sessionId: string;
    subject?: string;
  };
  ClassHistory: undefined;
  ClassHistoryRoster: {
    sessionId: string;
    subject?: string;
  };
  StudentClassHistory: undefined;
  ScanAttendance: undefined;
  FeedbackQuestions: {
    sessionId: string;
    subject: string;
  };
  FeedbackResponses: {
    sessionId: string;
  };
  GiveFeedback: {
    sessionId: string;
  };
};

// Bottom Tab Navigator Param List (student)
export type BottomTabParamList = {
  Home: undefined;
  Explore: undefined;
  Schedule: undefined;
  QR: undefined;
  Profile: undefined;
};

// Bottom Tab Navigator Param List (faculty) — same shape minus QR, plus
// Bootcamp (the faculty schedule/attendance tab).
export type FacultyBottomTabParamList = {
  Home: undefined;
  Bootcamp: undefined;
  Explore: undefined;
  Schedule: undefined;
  Profile: undefined;
};

// Drawer Navigator Param List (if you have drawer)
export type DrawerParamList = {
  Home: undefined;
  Account: undefined;
  Profile: undefined;
  Societies: undefined;
  Hostels: undefined;
  CampusMap: undefined;
  LifeAtThapar: undefined;
  OurTeam: undefined;
  Logout: undefined;
};