import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../theme/theme"; // ← Changed
import { ExploreItem } from "../../constants/explore";

type Props = {
  item: ExploreItem;
  onPress: () => void;
};

export default function ExploreCard({
  item,
  onPress,
}: Props) {
  const { colors, isDarkMode } = useTheme(); // ← Added

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={onPress}
    >
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
          <Ionicons
            name={item.icon}
            size={28}
            color="white"
          />
        </View>

        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {item.title}
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {item.subtitle}
          </Text>
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={22}
        color={colors.textMuted}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 5,
    fontSize: 14,
  },
});