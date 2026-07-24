import { useAppTheme } from '../context/ThemeContext';
import { darkColors, lightColors } from './colors';

// Theme tokens specific to the Our Team screen (tab pill, glass card,
// grid/row cards). Colors are derived from the shared light/dark
// palettes in colors.ts so nothing here is hardcoded independently of
// the rest of the app's theme.
export const lightOurTeamTheme = {
  bgGradient: ["#F5F9FF", "#E8F0FE", "#D6E4F5"] as [string, string, string],
  textPrimary: lightColors.textPrimary,
  textSecondary: lightColors.textSecondary,
  iconColor: lightColors.textPrimary,
  cardBg: lightColors.card,
  lineColor: lightColors.border,
  accent: lightColors.primary,
  shadowColor: lightColors.glowBlue,
  // Matches Home screen's nav bar pill exactly (light tinted background +
  // dark navy text) instead of a solid accent-colored bar.
  tabActiveBg: "#D7EAFF",
  tabActiveText: "#0A2A4A",
  // Matches Home screen's nav bar exactly: same solid background,
  // translucent border, and sheen gradient values as topCard.
  glassBg: "white",
  glassBorder: "rgba(255, 255, 255, 0.7)",
  glassSheen: ["rgba(255,255,255,0.55)", "rgba(255,255,255,0)"] as [string, string],
};

export const darkOurTeamTheme = {
  bgGradient: ["#020B18", "#0A1E38", "#123A70"] as [string, string, string],
  textPrimary: darkColors.textPrimary,
  textSecondary: darkColors.textSecondary,
  iconColor: darkColors.textPrimary,
  cardBg: darkColors.card,
  lineColor: darkColors.border,
  accent: darkColors.primary,
  shadowColor: darkColors.glowCyan,
  // Matches Home screen's nav bar pill exactly (medium-blue background +
  // white text).
  tabActiveBg: "#1C4F8F",
  tabActiveText: "#FFFFFF",
  // Matches Home screen's nav bar exactly: same solid background,
  // translucent border, and sheen gradient values as topCard.
  glassBg: "#11233D",
  glassBorder: "rgba(255, 255, 255, 0.2)",
  glassSheen: ["rgba(255,255,255,0.14)", "rgba(255,255,255,0)"] as [string, string],
};

// Hook to use the Our Team theme with context, mirroring useHomeTheme().
export const useOurTeamTheme = () => {
  const { isDarkMode } = useAppTheme();
  return isDarkMode ? darkOurTeamTheme : lightOurTeamTheme;
};