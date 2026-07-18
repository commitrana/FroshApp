import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";

import { useTheme } from "../../theme/theme"; // ← Changed

type Props = {
  title: string;
  selected: boolean;
  onPress: () => void;
};

export default function FilterChip({
  title,
  selected,
  onPress,
}: Props) {
  const { colors, isDarkMode } = useTheme(); // ← Added

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { backgroundColor: selected ? colors.primary : colors.card },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.text,
          { 
            color: selected ? "white" : colors.textSecondary 
          },
        ]}
        allowFontScaling={false}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    marginRight: 12,
  },
  text: {
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 22,
  },
});