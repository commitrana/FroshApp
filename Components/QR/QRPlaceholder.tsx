import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Theme from "../../theme/theme";

type Props = {
  title: string;
  description: string;
};

export default function QRPlaceholder({
  title,
  description,
}: Props) {
  return (
    <View style={styles.container}>

      <Ionicons
        name="qr-code-outline"
        size={120}
        color={Theme.colors.primary}
      />

      <Text style={styles.title}>
        {title}
      </Text>

      <Text style={styles.description}>
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
    color: "white",
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },

  description: {
    marginTop: 12,
    color: "#9CA3AF",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});