import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../theme/theme"; // ← Changed
import { APP_INFO, SOCIAL_LINKS } from "../../constants/app";

export default function ConnectScreen() {
  const { colors, isDarkMode } = useTheme(); // ← Added

  const openLink = async (url: string) => {
    if (!url) {
      Alert.alert(
        "Coming Soon",
        "This link will be added soon."
      );
      return;
    }

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        "Error",
        "Unable to open this link."
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Connect With Us
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Stay connected with Frosh through our official platforms.
        </Text>

        {SOCIAL_LINKS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, { backgroundColor: colors.card }]}
            activeOpacity={0.8}
            onPress={() => openLink(item.url)}
          >
            <Ionicons
              name={item.icon}
              size={24}
              color={colors.textPrimary}
            />

            <Text style={[styles.cardText, { color: colors.textPrimary }]}>
              {item.title}
            </Text>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
              style={styles.arrow}
            />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.card }]}
          activeOpacity={0.8}
          onPress={() => openLink(`mailto:${APP_INFO.support.email}`)}
        >
          <Ionicons
            name="mail-outline"
            size={24}
            color={colors.textPrimary}
          />

          <Text style={[styles.cardText, { color: colors.textPrimary }]}>
            Email Us
          </Text>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textMuted}
            style={styles.arrow}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.card }]}
          activeOpacity={0.8}
          onPress={() => openLink(`tel:${APP_INFO.support.phone}`)}
        >
          <Ionicons
            name="call-outline"
            size={24}
            color={colors.textPrimary}
          />

          <Text style={[styles.cardText, { color: colors.textPrimary }]}>
            Call Us
          </Text>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textMuted}
            style={styles.arrow}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 30,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 18,
    marginBottom: 15,
  },
  cardText: {
    fontSize: 17,
    marginLeft: 16,
    fontWeight: "600",
  },
  arrow: {
    marginLeft: "auto",
  },
});