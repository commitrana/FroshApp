import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../../context/ThemeContext";
import { useHomeTheme } from "../../constants/homeThemes";

const { height: screenHeight } = Dimensions.get("window");

type CardSize = "tall" | "small" | "wide";

type CardItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  gradient: [string, string];
  size: CardSize;
  route: string;
};

const CARD_DATA: CardItem[] = [
  {
    id: "eatery",
    title: "EATERY\nPOINTS",
    subtitle: "Grab a bite, anytime",
    icon: "restaurant-outline",
    gradient: ["#FF8A50", "#FF3D71"],
    size: "tall",
    route: "EateryPoints",
  },
  {
    id: "sports",
    title: "SPORTS\nCOMPLEX",
    subtitle: "Play. Sweat. Win.",
    icon: "basketball-outline",
    gradient: ["#20D9A8", "#0E8A7A"],
    size: "small",
    route: "SportsComplex",
  },
  {
    id: "study",
    title: "STUDY\nZONES",
    subtitle: "Quiet corners, sharp minds",
    icon: "book-outline",
    gradient: ["#5B7CFA", "#2E3FA8"],
    size: "small",
    route: "StudyZones",
  },
  {
    id: "cultural",
    title: "CULTURAL CENTRES",
    subtitle: "Where talent takes the stage",
    icon: "color-palette-outline",
    gradient: ["#C24BF7", "#7B2FF7"],
    size: "wide",
    route: "CulturalCentres",
  },
];

export default function LifeScreen() {
  const navigation = useNavigation<any>();
  const { isDarkMode } = useAppTheme();
  const theme = useHomeTheme();

  const scaleAnims = useRef(CARD_DATA.map(() => new Animated.Value(1))).current;

  // --- Entry & Exit animations (slide from bottom / slide to bottom) ---
  const slideY = useRef(new Animated.Value(screenHeight)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const isNavigating = useRef(false);

  // Disable the navigator's own push/pop transition & gesture for this screen.
  // We fully own the visual transition via slideY/opacityAnim.
  useEffect(() => {
    navigation.setOptions({
      animation: "none",
      gestureEnabled: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Back navigation with exit animation (flash-free) ---
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (isNavigating.current) {
        return;
      }
      e.preventDefault();
      isNavigating.current = true;

      Animated.parallel([
        Animated.timing(slideY, {
          toValue: screenHeight,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          navigation.dispatch(e.data.action);
        }
      });
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  const handleBack = () => {
    if (isNavigating.current) return;
    navigation.goBack();
  };

  const pressIn = (i: number) =>
    Animated.spring(scaleAnims[i], {
      toValue: 0.95,
      speed: 24,
      bounciness: 4,
      useNativeDriver: true,
    }).start();

  const pressOut = (i: number) =>
    Animated.spring(scaleAnims[i], {
      toValue: 1,
      speed: 18,
      bounciness: 6,
      useNativeDriver: true,
    }).start();

  const renderCard = (item: CardItem, index: number, cardStyle: any) => (
    <Animated.View key={item.id} style={[cardStyle, { transform: [{ scale: scaleAnims[index] }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={() => pressIn(index)}
        onPressOut={() => pressOut(index)}
        onPress={() => navigation.navigate(item.route)}
        style={styles.cardTouchable}
      >
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons
          name={item.icon.replace("-outline", "") as any}
          size={item.size === "wide" ? 110 : 100}
          color="rgba(255,255,255,0.16)"
          style={[styles.bgIcon, item.size === "wide" ? styles.bgIconWide : styles.bgIconCorner]}
        />

        {item.size === "wide" ? (
          <View style={styles.wideContent}>
            <View style={styles.wideIconCircle}>
              <Ionicons name={item.icon as any} size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitleWide}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={30} color="rgba(255,255,255,0.85)" />
          </View>
        ) : (
          <View style={styles.cardContent}>
            <Ionicons
              name={item.icon as any}
              size={26}
              color="#fff"
              style={{ marginBottom: item.size === "tall" ? 14 : 8 }}
            />
            <Text style={item.size === "tall" ? styles.cardTitleTall : styles.cardTitleSmall}>
              {item.title}
            </Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bgGradient[0] }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />
      <Animated.View
        style={{
          flex: 1,
          opacity: opacityAnim,
          transform: [{ translateY: slideY }],
        }}
      >
      <LinearGradient
        colors={theme.bgGradient as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>

          <Text style={[styles.eyebrow, { color: theme.accent }]}>✦  CAMPUS LIFE  ✦</Text>
          <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
            Life at{"\n"}
            <Text style={{ color: theme.accent }}>Thapar</Text>
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            Beyond classrooms, a world of experiences.
          </Text>

          <View style={styles.bentoRow}>
            {renderCard(CARD_DATA[0], 0, styles.bentoTall)}
            <View style={styles.bentoColumn}>
              {renderCard(CARD_DATA[1], 1, styles.bentoSmall)}
              {renderCard(CARD_DATA[2], 2, styles.bentoSmall)}
            </View>
          </View>

          {renderCard(CARD_DATA[3], 3, styles.bentoWide)}
        </ScrollView>
      </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 55,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 24,
    width: 32,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 3,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 46,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: "85%",
  },
  bentoRow: {
    flexDirection: "row",
    marginTop: 28,
    gap: 14,
  },
  bentoColumn: {
    flex: 1,
    gap: 14,
  },
  bentoTall: {
    flex: 1,
    height: 268,
    borderRadius: 26,
    overflow: "hidden",
  },
  bentoSmall: {
    height: 127,
    borderRadius: 22,
    overflow: "hidden",
  },
  bentoWide: {
    marginTop: 14,
    height: 110,
    borderRadius: 24,
    overflow: "hidden",
  },
  cardTouchable: {
    flex: 1,
    position: "relative",
  },
  bgIcon: {
    position: "absolute",
  },
  bgIconCorner: {
    bottom: -22,
    right: -22,
    transform: [{ rotate: "-12deg" }],
  },
  bgIconWide: {
    top: -18,
    right: -10,
    transform: [{ rotate: "10deg" }],
  },
  cardContent: {
    flex: 1,
    padding: 18,
    justifyContent: "flex-end",
  },
  wideContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    gap: 14,
  },
  wideIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitleTall: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
    lineHeight: 25,
    marginBottom: 4,
  },
  cardTitleSmall: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
    lineHeight: 18,
    marginBottom: 2,
  },
  cardTitleWide: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12.5,
    fontWeight: "500",
    color: "rgba(255,255,255,0.85)",
  },
});