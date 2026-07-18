import { useAppTheme } from '../context/ThemeContext';
import { darkColors, lightColors } from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';
import Radius from '../constants/radius';

// Hook to use theme with context
export const useTheme = () => {
  const { isDarkMode } = useAppTheme();
  const colors = isDarkMode ? darkColors : lightColors;
  
  return {
    colors,
    typography: Typography,
    spacing: Spacing,
    radius: Radius,
    isDarkMode
  };
};

// Static theme objects for backward compatibility
export const lightThemeStatic = {
  bgGradient: ["#F8FBFF", "#EEF6FF", "#DDEEFF"],
  textPrimary: "#0B1F4F",
  textSecondary: "#64788E",
  accent: "#3E8FFF",
  cardBg: "#FFFFFF",
  shadowColor: "#6FAEFF",
  lineColor: "#D8E6F7",
};

export const darkThemeStatic = {
  bgGradient: ["#0A0E27", "#1A1040", "#2D1B4E"],
  textPrimary: "#FFFFFF",
  textSecondary: "#B0B0D0",
  accent: "#00D4FF",
  cardBg: "#1A2040",
  shadowColor: "#00D4FF",
  lineColor: "rgba(255,255,255,0.15)",
};

// Legacy Theme object (deprecated - use useTheme() hook instead)
const Theme = {
  colors: darkColors,
  typography: Typography,
  spacing: Spacing,
  radius: Radius,
};

export default Theme;