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
        // A previous fix here only bumped lineHeight, which isn't always
        // enough — if the device has a larger system font-scale
        // (accessibility setting), Android can still clip the bottom of
        // descenders like the "p"/"g" in "Upcoming". Locking font scaling
        // for this small fixed-size chip label is the more robust fix.
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
    backgroundColor: "#1F2937",
    marginRight: 12,
  },

  selectedChip: {
    backgroundColor: Theme.colors.primary,
  },

  text: {
    color: "#D1D5DB",
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 22,
  },

  selectedText: {
    color: "white",
  },
});