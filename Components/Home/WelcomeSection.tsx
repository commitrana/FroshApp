import React from 'react';
import { View, Text, StyleSheet } from "react-native";
import Colors from "../../constants/colors";

// ✅ Props receive karega
interface WelcomeSectionProps {
  userName?: string;
}

export default function WelcomeSection({ userName }: WelcomeSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Hello, {userName || 'Guest'}!
      </Text>

      <Text style={styles.subtitle}>
        Ready for an amazing experience?
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 36,
    fontWeight: "700",
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    marginTop: 5,
  },
});