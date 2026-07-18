import { useAppTheme } from '../context/ThemeContext';

export const lightHomeTheme = {
  bgGradient: ["#FFFFFF", "#EDF6FF", "#D7EAFF"],
  textPrimary: "#0B1F4F",
  textSecondary: "#6F88B2",
  iconColor: "#222",
  cardBg: "white",
  shadowColor: "#75B5FF",
  topCard: {
    backgroundColor: "white",
    shadowColor: "#6BAEFF",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  liveCard: {
    backgroundColor: "white",
    shadowColor: "#66AAFF",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  tabActiveBg: "#D7EAFF",
  tabActiveText: "#0A2A4A",
  tabInactiveText: "#6F88B2",
  accent: "#3794FF",
  lineColor: "#B8D9FF",
  modalBg: "white",
};

export const darkHomeTheme = {
  bgGradient: ["#02060D", "#081525", "#123A70"],
  textPrimary: "#FFFFFF",
  textSecondary: "#AFC7EA",
  iconColor: "#FFFFFF",
  cardBg: "#0C1728",
  shadowColor: "#4FA3FF",
  topCard: {
    backgroundColor: "#11233D",
    shadowColor: "#4FA3FF",
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  liveCard: {
    backgroundColor: "#11233D",
    shadowColor: "#57A9FF",
    shadowOpacity: 0.4,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 18,
  },
  tabActiveBg: "#1C4F8F",
  tabActiveText: "#FFFFFF",
  tabInactiveText: "#7EA6D8",
  accent: "#58AFFF",
  lineColor: "#3A6CA8",
  modalBg: "#111E32",
};

// Hook to use home theme with context
export const useHomeTheme = () => {
  const { isDarkMode } = useAppTheme();
  return isDarkMode ? darkHomeTheme : lightHomeTheme;
};