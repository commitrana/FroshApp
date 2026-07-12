import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";

import Theme from "../../theme/theme";

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
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && styles.selectedChip,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.text,
          selected && styles.selectedText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: "#1F2937",
    marginRight: 12,
  },

  selectedChip: {
    backgroundColor: Theme.colors.primary,
  },

  text: {
    color: "#D1D5DB",
    fontWeight: "600",
  },

  selectedText: {
    color: "white",
  },
});