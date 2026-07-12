import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import Colors from "../../constants/colors";

interface Props {
  title: string;
  onPress: () => void;
}

export default function PrimaryButton({ title, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.wrapper} activeOpacity={0.85} onPress={onPress}>
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.button}
      >
        <Text style={styles.text}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
  button: {
    height: 55,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#04121A",
    fontWeight: "700",
    fontSize: 17,
  },
});