export type RootStackParamList = {
  // Auth Screens
  Splash: undefined;
  Login: undefined;
  
  // Main App
  MainTabs: undefined;
  
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

// Bottom Tab Navigator Param List (if you have bottom tabs)
export type BottomTabParamList = {
  Home: undefined;
  Explore: undefined;
  Schedule: undefined;
  QR: undefined;
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