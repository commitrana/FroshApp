import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../theme/theme"; // ← Changed
import { APP_INFO } from "../../constants/app";

export default function HelpScreen() {
  const { colors, isDarkMode } = useTheme(); // ← Added

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Help & Support
        </Text>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Need assistance? Reach out to us using the contact details below.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>
            {APP_INFO.support.email}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Phone</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>
            {APP_INFO.support.phone}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Working Hours</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>
            {APP_INFO.support.workingHours}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    marginBottom: 25,
    lineHeight: 22,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
});