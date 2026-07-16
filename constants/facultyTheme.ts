// Save as: src/constants/facultyTheme.ts
//
// Shared design tokens for the Faculty flow (Bootcamp tab + the whole
// attendance chain: ClassDetails -> AttendanceSession -> Roster/Flagged/
// PresentList/FeedbackQuestions/FeedbackResponses).
//
// UPDATED: now ships a light AND a dark palette (dark values reused from
// src/constants/theme.ts -> darkTheme, so faculty screens match the same
// dark look already used elsewhere in the app) plus a `useFacultyTheme()`
// hook that switches between them based on the device color scheme.
//
// Every faculty screen should now do:
//   import { useFacultyTheme } from '../../constants/facultyTheme';
//   const FacultyTheme = useFacultyTheme();
// instead of a static default import, so the colors actually update in
// dark mode. The default export below is kept (light palette) only so
// any screen not migrated yet doesn't crash — migrate it next.

import { useAppTheme } from '../context/ThemeContext';

export const lightFacultyTheme = {
  textPrimary: "#0B1F4F",
  textSecondary: "#6F88B2",
  accent: "#3794FF",
  cardBg: "#FFFFFF",
  pageBg: "#F4F8FF",
  shadowColor: "#66AAFF",
  lineColor: "#B8D9FF",
  success: "#22C55E",
  successBg: "rgba(34,197,94,0.12)",
  warning: "#F59E0B",
  warningBg: "rgba(245,158,11,0.12)",
  danger: "#EF4444",
  dangerBg: "rgba(239,68,68,0.12)",
};

export const darkFacultyTheme = {
  textPrimary: "#FFFFFF",
  textSecondary: "#B0B0D0",
  accent: "#00D4FF",
  cardBg: "#1A2040",
  pageBg: "#0A0E27",
  shadowColor: "#00D4FF",
  lineColor: "rgba(255,255,255,0.15)",
  success: "#22C55E",
  successBg: "rgba(34,197,94,0.18)",
  warning: "#F59E0B",
  warningBg: "rgba(245,158,11,0.18)",
  danger: "#EF4444",
  dangerBg: "rgba(239,68,68,0.18)",
};

export const useFacultyTheme = () => {
  const { isDarkMode } = useAppTheme();
  return isDarkMode ? darkFacultyTheme : lightFacultyTheme;
};

// Kept for backward compatibility with screens not yet migrated to the hook.
const FacultyTheme = lightFacultyTheme;
export default FacultyTheme;