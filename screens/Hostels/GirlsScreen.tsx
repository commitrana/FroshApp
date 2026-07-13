import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "@expo/vector-icons/Ionicons";

const theme = {
  bgGradient: ["#020B18", "#061528", "#041220"] as [string, string, ...string[]],
  textPrimary: "#FFFFFF",
  textSecondary: "#D5DDF0",
  cardBg: "#0A1A2E",
  accent: "#2F80FF",
};

const hostelImage = require("../../assets/uiux/cos.jpg");

const rooms = [
  { id: 1, name: "Vasudha Hall", image: hostelImage },
  { id: 2, name: "Ira Hall", image: hostelImage },
  { id: 3, name: "Ananta Hall", image: hostelImage },
  { id: 4, name: "Vahni Hall", image: hostelImage },
  { id: 5, name: "Avni Hall", image: hostelImage },
  { id: 6, name: "Dhriti Hall", image: hostelImage },
];

export default function GirlsScreen() {
  const navigation = useNavigation();

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <LinearGradient colors={theme.bgGradient} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.textPrimary }]}>GIRLS HOSTEL</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.grid}>
              {rooms.map((room) => (
                <View key={room.id} style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.accent }]}>
                  <Image source={room.image} style={styles.cardImage} />
                  <Text style={[styles.cardName, { color: theme.textPrimary }]}>{room.name}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
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
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: { width: "48%", marginBottom: 18, borderRadius: 16, overflow: "hidden", borderWidth: 1, paddingBottom: 8 },
  cardImage: { width: "100%", height: 160, resizeMode: "cover" },
  cardName: { fontSize: 16, fontWeight: "600", textAlign: "center", marginTop: 8, paddingHorizontal: 4 },
});