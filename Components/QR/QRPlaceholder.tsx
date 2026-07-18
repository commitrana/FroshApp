import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../theme/theme"; // ← Changed

type Props = {
  title: string;
  description: string;
};

export default function QRPlaceholder({
  title,
  description,
}: Props) {
  const { colors, isDarkMode } = useTheme(); // ← Added

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Ionicons
        name="qr-code-outline"
        size={120}
        color={colors.primary}
      />

      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {title}
      </Text>

      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  title: {
    marginTop: 25,
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    marginTop: 12,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});