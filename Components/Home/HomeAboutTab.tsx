import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../../types/navigation";

// Exact layout of the ui_ux team's "About" tab (screens/AboutScreen.js),
// wired to this app's real route names instead of placeholders.
type NavProp = NativeStackNavigationProp<RootStackParamList>;

type HomeTheme = {
  cardBg: string;
  shadowColor: string;
  textPrimary: string;
  textSecondary: string;
};

export default function HomeAboutTab({ theme }: { theme: HomeTheme }) {
  const navigation = useNavigation<NavProp>();

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
    <View style={styles.container}>
      {sections.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.card, { backgroundColor: theme.cardBg, shadowColor: theme.shadowColor }]}
          onPress={item.onPress}
          activeOpacity={0.8}
        >
          <View style={styles.cardContent}>
            <View>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                {item.subtitle}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  card: {
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 14,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 18, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  cardSubtitle: { fontSize: 14, fontWeight: "400" },
});
