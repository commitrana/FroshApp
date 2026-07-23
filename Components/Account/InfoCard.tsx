import { View, Text, StyleSheet } from "react-native";
import { useHomeTheme } from "../../constants/homeThemes";

type InfoCardProps = {
  label: string;
  value: string;
};

export default function InfoCard({
  label,
  value,
}: InfoCardProps) {
  const theme = useHomeTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.cardBg, borderColor: theme.lineColor },
      ]}
    >
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.value, { color: theme.textPrimary }]}>
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
    borderWidth: 1,
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