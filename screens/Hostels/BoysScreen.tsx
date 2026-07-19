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

import { useTheme } from "../../theme/theme";

const hostelImage = require("../../assets/uiux/cos.jpg");

type Room = {
  id: number;
  name: string;
  nickname: string;
  seating: string;
  capacity: string;
  image: any;
};

// ---------- ROOM DATA (nickname / seating / capacity added) ----------
const rooms: Room[] = [
  { id: 1, name: "Agira Hall", nickname: "Hostel A", seating: "Two seater(AC)", capacity: "928 capacity", image: hostelImage },
  { id: 2, name: "Amritam Hall", nickname: "Hostel B", seating: "One seater (AC)/Two seater(AC)", capacity: "928 capacity", image: hostelImage },
  { id: 3, name: "Prithvi Hall", nickname: "Hostel C", seating: "Two seater(AC)/Three seater(AC)", capacity: "387 capacity", image: hostelImage },
  { id: 4, name: "Neeram Hall", nickname: "Hostel D", seating: "Two seater(AC)", capacity: "928 capacity", image: hostelImage },
  { id: 5, name: "Vyan Hall", nickname: "Hostel H", seating: "Four seater(AC)", capacity: "670 capacity", image: hostelImage },
  { id: 6, name: "Tejas Hall", nickname: "Hostel J", seating: "One seater(Non AC)/Two seater(AC)", capacity: "950 capacity", image: hostelImage },
  { id: 7, name: "Ambaram Hall", nickname: "Hostel K", seating: "Two seater (AC/Non AC)", capacity: "600 capacity", image: hostelImage },
  { id: 8, name: "Viyat Hall", nickname: "Hostel L", seating: "Two seater (AC)", capacity: "200 capacity", image: hostelImage },
  { id: 9, name: "Anantam Hall", nickname: "Hostel M", seating: "Two seater(AC)/One seater(AC)", capacity: "1148 capacity", image: hostelImage },
  { id: 10, name: "Vyom Hall", nickname: "Hostel O", seating: "Two seater(AC)", capacity: "928 capacity", image: hostelImage },
];

export default function BoysScreen() {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();

  const theme = {
    bgGradient: isDarkMode
      ? (["#020B18", "#061528", "#041220"] as [string, string, string])
      : (["#F5F9FF", "#E8F0FE", "#D6E4F5"] as [string, string, string]),
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    accent: colors.primary,
    cardBg: colors.card,
  };

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />
      <LinearGradient colors={theme.bgGradient} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.textPrimary }]}>BOYS HOSTEL</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {rooms.map((room) => (
              <View
                key={room.id}
                style={[
                  styles.hallCard,
                  { borderColor: theme.accent, backgroundColor: theme.cardBg, shadowColor: theme.accent },
                ]}
              >
                <Image source={room.image} style={styles.hallImage} />
                <View style={styles.cardContent}>
                  <Text style={[styles.hallTitle, { color: theme.textPrimary }]}>{room.name}</Text>
                  <Text style={[styles.hallSubtitle, { color: theme.textSecondary }]}>{room.nickname}</Text>
                  <Text style={[styles.hallSubtitle, { color: theme.textSecondary }]}>{room.seating}</Text>
                  <Text style={[styles.hallSubtitle, { color: theme.textSecondary }]}>{room.capacity}</Text>
                </View>
              </View>
            ))}
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
  scrollContent: { paddingBottom: 30, paddingTop: 8 },
  hallCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  hallImage: { width: 90, height: 100, borderRadius: 12, resizeMode: "cover" },
  cardContent: { flex: 1, marginLeft: 12, justifyContent: "center" },
  hallTitle: { fontSize: 16, fontWeight: "700" },
  hallSubtitle: { fontSize: 13, marginTop: 1 },
});