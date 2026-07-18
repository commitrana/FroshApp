import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../../types/navigation";
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
import { useTheme } from "../../theme/theme";

const AboutScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDarkMode } = useTheme();

  const sections = [
    {
      id: "team",
      title: "OUR TEAM",
      subtitle: "Meet the minds behind Frosh",
      onPress: () => navigation.navigate("OurTeam"),
    },
    {
      id: "hostels",
      title: "HOSTELS",
      subtitle: "Your home away from home",
      onPress: () => navigation.navigate("Hostels"),
    },
    {
      id: "societies",
      title: "SOCIETIES",
      subtitle: "Where passions find a platform",
      onPress: () => navigation.navigate("Societies"),
    },
    {
      id: "life",
      title: "LIFE AT THAPAR",
      subtitle: "Beyond classrooms, a world of experiences",
      onPress: () => navigation.navigate("LifeAtThapar"),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.bigCard,
          {
            backgroundColor: colors.card,
            shadowColor: colors.glowCyan || colors.primary, // ← Changed to use glowCyan
          },
        ]}
      >
        <Text style={[styles.bigCardTitle, { color: colors.textPrimary }]}>
          About Us
        </Text>

        <View
          style={[styles.divider, { backgroundColor: colors.border }]}
        />

        {sections.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.optionRow,
              index < sections.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
            ]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.optionTextContainer}>
              <Text
                style={[
                  styles.optionTitle,
                  { color: colors.textPrimary },
                ]}
              >
                {item.title}
              </Text>

              <Text
                style={[
                  styles.optionSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {item.subtitle}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  bigCard: {
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  bigCardTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    fontWeight: "400",
  },
});

export default AboutScreen;