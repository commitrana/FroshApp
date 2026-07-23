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
  tabActiveText: lightColors.white,
  glassBg: lightColors.glassFill,
  glassBorder: lightColors.glassBorder,
  glassSheen: [lightColors.glassHighlight, "rgba(255,255,255,0)"] as [string, string],
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
  tabActiveText: darkColors.white,
  glassBg: darkColors.glassFill,
  glassBorder: darkColors.glassBorder,
  glassSheen: [darkColors.glassHighlight, "rgba(255,255,255,0)"] as [string, string],
};

// Hook to use the Our Team theme with context, mirroring useHomeTheme().
export const useOurTeamTheme = () => {
  const { isDarkMode } = useAppTheme();
  return isDarkMode ? darkOurTeamTheme : lightOurTeamTheme;
};