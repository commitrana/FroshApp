import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../theme/theme"; // ← Changed

export default function CampusMapScreen() {
  const { colors, isDarkMode } = useTheme(); // ← Added

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Campus Map
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Coming Soon...
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
  },
});