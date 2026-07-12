import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

type AppCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function AppCard({
  children,
  style,
}: AppCardProps) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
});