import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";

import { useHomeTheme } from "../../constants/homeThemes";

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
  const theme = useHomeTheme();

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.accent : theme.cardBg,
          borderColor: theme.lineColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.text,
          {
            color: selected ? theme.buttonTextOn : theme.textSecondary,
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
    borderWidth: 1,
  },
  text: {
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 22,
  },
});