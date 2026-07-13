import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Icon from "@expo/vector-icons/Ionicons";

const { width } = Dimensions.get("window");

// Same dark theme used across the ui_ux screens (Login / Home / Life at
// Thapar / Our Team) so Societies matches the rest of the app.
const theme = {
  bgGradient: ["#020B18", "#061528", "#041220"] as [string, string, ...string[]],
  textPrimary: "#FFFFFF",
  textSecondary: "#D5DDF0",
  cardBg: "#0A1A2E",
  accent: "#2F80FF",
  shadowColor: "#2F80FF",
  lineColor: "rgba(255,255,255,0.1)",
};

const logo = require("../../assets/uiux/logo.png");

type Society = {
  id: number;
  name: string;
  category: "tech" | "cultural" | "other";
  description: string;
};

// TODO: replace with a real /societies endpoint from the backend once one exists.
const societies: Society[] = [
  { id: 1, name: "ACM", category: "tech", description: "Association for Computing Machinery – the premier tech society." },
  { id: 2, name: "OWASP", category: "tech", description: "Institute of Electrical and Electronics Engineers – empowering tech innovation." },
  { id: 3, name: "CCS", category: "tech", description: "Computer Society of India – bridging academia and industry." },
  { id: 4, name: "GDSC", category: "tech", description: "Google Developer Student Clubs – building with Google tech." },
  { id: 5, name: "TNT", category: "cultural", description: "Express yourself through rhythm and movement." },
  { id: 6, name: "MUDRA", category: "cultural", description: "Harmony, melody, and the joy of music." },
  { id: 7, name: "DANCE CLUB", category: "cultural", description: "Act, improvise, and bring stories to life." },
  { id: 8, name: "VIRSA", category: "cultural", description: "Unleash your creativity with colours and crafts." },
  { id: 9, name: "FAPS", category: "other", description: "Capture moments, tell stories through the lens." },
  { id: 10, name: "ECHOES", category: "other", description: "Ideate, innovate, and build your startup." },
  { id: 11, name: "ECON", category: "other", description: "Protect nature, promote sustainability." },
  { id: 12, name: "TICC", category: "other", description: "Speak, persuade, and argue with clarity." },
];

const categories: { key: Society["category"]; label: string }[] = [
  { key: "tech", label: "Tech" },
  { key: "cultural", label: "Cultural" },
  { key: "other", label: "Other" },
];

export default function SocietiesScreen() {
  const navigation = useNavigation();
  const [activeCategory, setActiveCategory] = useState<Society["category"]>("tech");
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);

  const filtered = societies.filter((s) => s.category === activeCategory);

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <LinearGradient colors={theme.bgGradient} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.textPrimary }]}>SOCIETIES</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.tabContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.tab,
                  { backgroundColor: theme.lineColor },
                  activeCategory === cat.key && { backgroundColor: theme.accent },
                ]}
                onPress={() => setActiveCategory(cat.key)}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: activeCategory === cat.key ? "#FFFFFF" : theme.textSecondary },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.grid}>
              {filtered.map((society) => (
                <TouchableOpacity
                  key={society.id}
                  style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.lineColor }]}
                  onPress={() => setSelectedSociety(society)}
                  activeOpacity={0.8}
                >
                  <Image source={logo} style={styles.cardImage} />
                  <Text style={[styles.cardName, { color: theme.textPrimary }]}>{society.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      <Modal visible={selectedSociety !== null} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setSelectedSociety(null)}>
          <BlurView intensity={80} style={styles.blurContainer} tint="dark">
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.popupCard, { backgroundColor: theme.cardBg, shadowColor: theme.shadowColor }]}>
                <View style={styles.popupHeader}>
                  <Image source={logo} style={styles.popupLogo} />
                  <Text style={[styles.popupName, { color: theme.textPrimary }]}>
                    {selectedSociety?.name}
                  </Text>
                </View>
                <Text style={[styles.popupDescription, { color: theme.textSecondary }]}>
                  {selectedSociety?.description}
                </Text>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: theme.accent }]}
                  onPress={() => setSelectedSociety(null)}
                >
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </BlurView>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 50,
    paddingVertical: 8,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: "700", letterSpacing: 2 },
  tabContainer: { flexDirection: "row", paddingHorizontal: 16, marginVertical: 12, justifyContent: "center" },
  tab: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, marginHorizontal: 5 },
  tabText: { fontSize: 14, fontWeight: "600" },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: { width: "48%", marginBottom: 16, borderRadius: 16, paddingVertical: 12, alignItems: "center", borderWidth: 1 },
  cardImage: { width: 80, height: 80, resizeMode: "contain", marginBottom: 8 },
  cardName: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  blurContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  popupCard: {
    width: width * 0.85,
    borderRadius: 28,
    padding: 24,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    alignItems: "center",
  },
  popupHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  popupLogo: { width: 60, height: 60, resizeMode: "contain", marginRight: 16 },
  popupName: { fontSize: 22, fontWeight: "700" },
  popupDescription: { fontSize: 16, lineHeight: 24, textAlign: "center", marginBottom: 24 },
  closeButton: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  closeText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});