import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet } from "react-native";

import Theme from "../../theme/theme";
import { APP_INFO } from "../../constants/app";

export default function HelpScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <Text style={styles.title}>
          Help & Support
        </Text>

        <Text style={styles.description}>
          Need assistance? Reach out to us using the contact details below.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>
            {APP_INFO.support.email}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>
            {APP_INFO.support.phone}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Working Hours</Text>
          <Text style={styles.value}>
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
    backgroundColor: Theme.colors.background,
  },

  content: {
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
    marginBottom: 12,
  },

  description: {
    color: "#A1A1AA",
    fontSize: 15,
    marginBottom: 25,
    lineHeight: 22,
  },

  card: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },

  label: {
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 6,
  },

  value: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});