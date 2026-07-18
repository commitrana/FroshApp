// Dark colors (your existing ones)
export const darkColors = {
  background: "#05080D",
  gradientTop: "#060A11",
  gradientMid: "#0B1420",
  gradientBottom: "#101B2C",
  surface: "#0D1B2A",
  card: "#132238",
  primary: "#00D4FF",
  secondary: "#4B6CB7",
  white: "#FFFFFF",
  textPrimary: "#FFFFFF",
  textSecondary: "#AAB8D6",
  textMuted: "#7C8AA5",
  border: "#22385C",
  success: "#34C759",
  warning: "#FFCC00",
  danger: "#FF3B30",
  glassFill: "rgba(255,255,255,0.20)",
  glassFillStrong: "rgba(255,255,255,0.24)",
  glassBorder: "rgba(255,255,255,0.35)",
  glassHighlight: "rgba(255,255,255,0.45)",
  glowCyan: "rgba(0,212,255,0.55)",
  glowBlue: "rgba(75,108,183,0.5)",
};

// Light colors (mapped from dark)
export const lightColors = {
  background: "#F8FAFC",
  gradientTop: "#FFFFFF",
  gradientMid: "#F0F4F8",
  gradientBottom: "#E2E8F0",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  primary: "#3B82F6",
  secondary: "#64748B",
  white: "#FFFFFF",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  border: "#CBD5E1",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  glassFill: "rgba(255,255,255,0.70)",
  glassFillStrong: "rgba(255,255,255,0.85)",
  glassBorder: "rgba(255,255,255,0.90)",
  glassHighlight: "rgba(255,255,255,0.95)",
  glowCyan: "rgba(59,130,246,0.20)",
  glowBlue: "rgba(100,116,139,0.15)",
};

// Default export for backward compatibility (will be dark by default)
const Colors = darkColors;
export default Colors;