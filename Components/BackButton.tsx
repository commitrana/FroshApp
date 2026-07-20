import React from "react";
import { StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = {
  color?: string;
  backgroundColor?: string;
  top?: number;
  onPress?: () => void; // override default goBack() if a screen needs custom behavior
  style?: ViewStyle;
};

/**
 * Small floating back arrow, positioned top-left with safe-area-ish top
 * offset. Drop this into any screen that doesn't already have its own
 * header/back button:
 *
 *   <BackButton />
 *
 * as the first child inside your screen's root View/SafeAreaView.
 */
export default function BackButton({
  color = "#FFFFFF",
  backgroundColor = "rgba(255,255,255,0.12)",
  top = 50,
  onPress,
  style,
}: Props) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={[styles.button, { top, backgroundColor }, style]}
      onPress={onPress ?? (() => navigation.goBack())}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="arrow-back" size={22} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});