import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Image,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../../context/ThemeContext";
import { useHomeTheme } from "../../constants/homeThemes";

const { height: screenHeight } = Dimensions.get("window");

const mainaudi = require("../../assets/cultural/mainaudi.png");
const oat = require("../../assets/cultural/oat.png");
const fete = require("../../assets/cultural/fete.png");
type CulturalSpot = {
  id: string;
  name: string;
  tag: string;
  description: string;
  icon: string;
  accent: string;
  image: any;
};

const CULTURAL_SPOTS: CulturalSpot[] = [
  {
    id: "main-audi",
    name: "Main Audi",
    tag: "Flagship Venue",
    description:
      "The big stage for the big nights — annual fests, guest lectures and the shows that fill every seat and half the aisles.",
    icon: "film-outline",
    accent: "#B571E8",
    image: mainaudi,
  },
  {
    id: "oat",
    name: "OAT",
    tag: "Open Air Theatre",
    description:
      "Under-the-sky performances, open mics and jam sessions — the OAT trades a roof for atmosphere, and it's worth it every time.",
    icon: "partly-sunny-outline",
    accent: "#F0A63C",
    image: oat,
  },
  {
    id: "fete-area",
    name: "Fete Area",
    tag: "Festival Grounds",
    description:
      "Stalls, lights and pop-up chaos — the fete area turns into a mini carnival every time campus has something to celebrate.",
    icon: "balloon-outline",
    accent: "#E85BA0",
    image: fete,
  },
];

const NOTCH_COUNT = 14;

export default function CulturalScreen() {
  const navigation = useNavigation<any>();
  const { isDarkMode } = useAppTheme();
  const theme = useHomeTheme();

  const bgColor = theme.bgGradient[0];

  // --- Entry / exit animations (same as AccountScreen) ---
  const slideY = useRef(new Animated.Value(screenHeight)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const isNavigating = useRef(false);

  // Card stagger animations
  const cardFade = useRef(CULTURAL_SPOTS.map(() => new Animated.Value(0))).current;
  const cardSlide = useRef(CULTURAL_SPOTS.map(() => new Animated.Value(18))).current;
  const scaleAnims = useRef(CULTURAL_SPOTS.map(() => new Animated.Value(1))).current;

  // Disable default navigator transitions
  useEffect(() => {
    navigation.setOptions({
      animation: "none",
      gestureEnabled: false,
    });
  }, [navigation]);

  // Entry animation
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

    Animated.stagger(
      100,
      CULTURAL_SPOTS.map((_, i) =>
        Animated.parallel([
          Animated.timing(cardFade[i], {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(cardSlide[i], {
            toValue: 0,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      )
    ).start();
  }, []);

  // Exit animation (intercept back actions)
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (isNavigating.current) return;
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
        isNavigating.current = false;
      });
    });

    return unsubscribe;
  }, [navigation]);

  const handleBack = () => {
    if (isNavigating.current) return;
    navigation.goBack();
  };

  const pressIn = (i: number) =>
    Animated.spring(scaleAnims[i], {
      toValue: 0.97,
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

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={Platform.OS === "android"}
      />
      <Animated.View
        style={[
          styles.flexOne,
          {
            opacity: opacityAnim,
            transform: [{ translateY: slideY }],
          },
        ]}
      >
        <LinearGradient
          colors={theme.bgGradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.safeArea}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={styles.header}>
                <TouchableOpacity onPress={handleBack}>
                  <Ionicons name="arrow-back" size={26} color={theme.iconColor} />
                </TouchableOpacity>
                <Text style={[styles.heading, { color: theme.textPrimary }]}>Culture</Text>
                <View style={{ width: 26 }} />
              </View>

              <Text style={[styles.eyebrow, { color: theme.accent }]}>✦  CAMPUS CULTURE  ✦</Text>
              <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
                Culture{"\n"}
                <Text style={{ color: theme.accent }}>Spots</Text>
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                Three stages, endless moments — where campus performs.
              </Text>

              <View style={styles.list}>
                {CULTURAL_SPOTS.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    style={{
                      opacity: cardFade[index],
                      transform: [{ translateY: cardSlide[index] }, { scale: scaleAnims[index] }],
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.92}
                      onPressIn={() => pressIn(index)}
                      onPressOut={() => pressOut(index)}
                      style={[styles.card, { borderColor: `${item.accent}55`, shadowColor: item.accent }]}
                    >
                      <View style={styles.photoWrap}>
                        <Image source={item.image} style={styles.photo} />
                        <LinearGradient
                          colors={["transparent", "rgba(3,8,18,0.85)"]}
                          style={styles.photoFade}
                          pointerEvents="none"
                        />
                        <View
                          style={[
                            styles.tagChip,
                            { borderColor: item.accent, backgroundColor: "rgba(6,14,26,0.55)" },
                          ]}
                        >
                          <Ionicons name={item.icon as any} size={15} color={item.accent} />
                          <Text style={[styles.tagChipText, { color: item.accent }]}>{item.tag}</Text>
                        </View>
                      </View>

                      <View style={styles.seamRow} pointerEvents="none">
                        {Array.from({ length: NOTCH_COUNT }).map((_, n) => (
                          <View key={n} style={[styles.notch, { backgroundColor: bgColor }]} />
                        ))}
                      </View>

                      <View
                        style={[
                          styles.panel,
                          {
                            backgroundColor: theme.cardBg,
                            borderTopColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
                          },
                        ]}
                      >
                        <View style={styles.panelHeaderRow}>
                          <Text style={[styles.stallName, { color: item.accent }]}>{item.name}</Text>
                        </View>
                        <Text style={[styles.description, { color: theme.textSecondary }]}>{item.description}</Text>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flexOne: { flex: 1 },
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Platform.OS === "ios" ? 20 : 8,
    marginBottom: 16,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 3,
    marginBottom: 6,
  },
  heroTitle: {
    fontFamily: "Baloo2_800ExtraBold",
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: "85%",
  },
  list: {
    marginTop: 28,
    gap: 26,
  },
  card: {
    borderRadius: 26,
    borderWidth: 1,
    overflow: "hidden",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  photoWrap: {
    height: 190,
    width: "100%",
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  photoFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "55%",
  },
  tagChip: {
    position: "absolute",
    left: 14,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  seamRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    marginTop: -9,
    marginBottom: -9,
    zIndex: 2,
  },
  notch: {
    width: 14,
    height: 18,
    borderRadius: 9,
  },
  panel: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  panelHeaderRow: {
    marginBottom: 8,
  },
  stallName: {
    fontFamily: "Baloo2_800ExtraBold",
    fontSize: 22,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
  },
});