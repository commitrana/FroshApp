import { useAppTheme } from '../context/ThemeContext';

export const lightLifeTheme = {
  bgGradient: ["#F8FBFF", "#EEF6FF", "#DDEEFF"],
  textPrimary: "#0B1F4F",
  textSecondary: "#64788E",
  accent: "#3E8FFF",
  cardBg: "#FFFFFF",
  shadowColor: "#6FAEFF",
  lineColor: "#D8E6F7",
};

export const darkLifeTheme = {
  bgGradient: ["#0A0E27", "#1A1040", "#2D1B4E"],
  textPrimary: "#FFFFFF",
  textSecondary: "#B0B0D0",
  accent: "#00D4FF",
  cardBg: "#1A2040",
  shadowColor: "#00D4FF",
  lineColor: "rgba(255,255,255,0.15)",
};

// Hook to use life theme with context
export const useLifeTheme = () => {
  const { isDarkMode } = useAppTheme();
  return isDarkMode ? darkLifeTheme : lightLifeTheme;
};

// Legacy exports for backward compatibility
export const lightTheme = lightLifeTheme;
export const darkTheme = darkLifeTheme;