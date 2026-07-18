import { View, Text, StyleSheet } from "react-native";

type InfoCardProps = {
  label: string;
  value: string;
  theme?: any; // ← Added optional theme prop
};

export default function InfoCard({
  label,
  value,
  theme,
}: InfoCardProps) {
  // If theme is not provided, use default colors (fallback)
  const colors = theme || {
    card: "#1F2937",
    textPrimary: "#FFFFFF",
    textSecondary: "#9CA3AF",
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.value, { color: colors.textPrimary }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
  },
  value: {
    marginTop: 6,
    fontSize: 17,
    fontWeight: "600",
  },
});