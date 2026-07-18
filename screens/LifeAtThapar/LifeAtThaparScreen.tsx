import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../theme/theme"; // ← Changed: using useTheme instead of useLifeTheme
import { useAppTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");
const PAGE_WIDTH = width - 36;

const heroImage = require("../../assets/uiux/cos.jpg");

const pages = [
  {
    id: "1",
    heroImage,
    cardTitle: "Cultural OAT and\nShopping Complex",
    cardDescription: "A hub for shopping, dining, and student essentials at Thapar.",
    description:
      "The COS Complex at TIET offers a range of convenient stores and eateries for students. VI Mini Store sells electronic devices, accessories, and sports gear. Shadowz Salon and Spa provides beauty services, while Fashion Point offers skincare essentials. The Stationery Store supplies college essentials, and the Dessert Club offers sweet treats. Kabir Multi-Store stocks everyday essentials, and Pizza Nation serves unique pizzas. Honey Coffee Cafe is a vegetarian snack spot. Iqbal Juice Centre offers fresh juices, and RS Laundry handles garment care.",
  },
  {
    id: "2",
    heroImage,
    cardTitle: "Sports Complex",
    cardDescription: "World-class facilities for athletes and fitness lovers.",
    description:
      "The Sports Complex at TIET has comprehensive facilities, from courts for basketball, volleyball, badminton, and tennis to a swimming pool and a cricket ground. The sports department organises tournaments such as URJA, Thaparlympics, SPADES, IGNITE, and the Annual Athletic Meet. Freshers receive tracksuits with T-shirts for easy identification, boosting fitness and enthusiasm. Eight full-time coaches and a Deputy Director of Sports ensure high-quality coaching and organisation.",
  },
  {
    id: "3",
    heroImage,
    cardTitle: "Nava Nalanda\nLibrary",
    cardDescription: "The academic heart of Thapar Institute.",
    description:
      "The Nava Nalanda Library at Thapar Institute is a state-of-the-art facility offering a vast collection of academic resources, including books, journals, and digital materials. It provides a serene environment for study and research, with spacious reading areas, group discussion rooms, and access to online resources. Its user-friendly services and knowledgeable staff support the academic endeavours of students and faculty.",
  },
  {
    id: "4",
    heroImage,
    cardTitle: "Central Park",
    cardDescription: "A green oasis in the heart of campus.",
    description:
      "Central Park serves as an oasis of tranquillity amidst the academic bustle. Its lush-green setting helps students relax and unwind, with sparkling fountains adding to the soothing ambience. The fresh air and open space foster a sense of community and well-being, encouraging both spontaneous gatherings and peaceful solitude among the seating areas.",
  },
];

export default function LifeAtThaparScreen() {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme(); // ← Changed: using useTheme
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Create theme object from global theme (same pattern as OurTeamScreen)
  const theme = {
    bgGradient: isDarkMode 
      ? ['#0A0E27', '#1A1040', '#2D1B4E'] as [string, string, string]
      : ['#F8FBFF', '#EEF6FF', '#DDEEFF'] as [string, string, string],
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    cardBg: colors.card,
    accent: colors.primary,
    shadowColor: colors.primary,
    lineColor: colors.border,
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / PAGE_WIDTH);
    setCurrentIndex(index);
  };

  const renderPage = ({ item }: { item: (typeof pages)[number] }) => (
    <ScrollView
      style={styles.pageContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.pageContent}
    >
      <View style={styles.heroSection}>
        <Image source={item.heroImage} resizeMode="cover" style={styles.heroImage} />

        <View style={[styles.libraryCard, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.libraryTitle, { color: theme.textPrimary }]}>
            {item.cardTitle}
          </Text>
          <View style={[styles.blueUnderline, { backgroundColor: theme.accent }]} />
          <Text style={[styles.libraryDescription, { color: theme.textSecondary }]}>
            {item.cardDescription}
          </Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {item.description}
        </Text>
      </View>

      <View style={styles.pagination}>
        {pages.map((_, dotIndex) => {
          const isActive = dotIndex === currentIndex;
          return (
            <View
              key={dotIndex}
              style={[
                styles.dot,
                { backgroundColor: isDarkMode ? theme.textSecondary : '#D3E3F5' },
                isActive && [
                  styles.activeDot,
                  { 
                    backgroundColor: theme.accent,
                    width: 20,
                  }
                ],
              ]}
            />
          );
        })}
      </View>
    </ScrollView>
  );

  return (
    <>
      <StatusBar 
        translucent 
        backgroundColor="transparent" 
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />
      <LinearGradient
        colors={theme.bgGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={[styles.container, { backgroundColor: theme.cardBg, shadowColor: theme.shadowColor }]}>
            <View style={styles.header}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.goBack()}
              >
                <Feather name="arrow-left" size={36} color={theme.textPrimary} />
              </TouchableOpacity>
              <View style={[styles.line, { backgroundColor: theme.lineColor }]} />
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                • LIFE AT THAPAR •
              </Text>
              <View style={[styles.line, { backgroundColor: theme.lineColor }]} />
            </View>

            <FlatList
              ref={flatListRef}
              data={pages}
              renderItem={renderPage}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              style={styles.flatList}
              snapToInterval={PAGE_WIDTH}
              snapToAlignment="start"
              decelerationRate="fast"
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: {
    flex: 1,
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 34,
    paddingTop: 22,
    paddingBottom: 20,
    overflow: "hidden",
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    marginBottom: 22,
  },
  line: { flex: 1, height: 1, marginHorizontal: 12 },
  headerTitle: { fontSize: 18, fontWeight: "700", letterSpacing: 1.5 },
  flatList: { flex: 1 },
  pageContainer: { width: PAGE_WIDTH, flex: 1 },
  pageContent: { paddingBottom: 30 },
  heroSection: { alignItems: "center", marginBottom: 120 },
  heroImage: { width: "88%", height: 300, borderRadius: 30 },
  libraryCard: {
    position: "absolute",
    bottom: -92,
    width: "82%",
    borderRadius: 28,
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  libraryTitle: { fontSize: 24, fontWeight: "800", textAlign: "center" },
  blueUnderline: { width: 70, height: 4, borderRadius: 20, marginTop: 10, marginBottom: 14 },
  libraryDescription: { fontSize: 14, lineHeight: 22, textAlign: "center" },
  contentContainer: { paddingHorizontal: 26, marginTop: 10 },
  description: { fontSize: 16, lineHeight: 28, textAlign: "justify", marginBottom: 10 },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
  },
  activeDot: {
    borderRadius: 4,
  },
});