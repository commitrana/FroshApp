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
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../../context/ThemeContext";
import { useHomeTheme } from "../../constants/homeThemes";

const { height: screenHeight } = Dimensions.get("window");

const hostelImage = require("../../assets/uiux/cos.jpg");

type Venue = {
  id: string;
  name: string;
  tag: string;
  description: string;
  icon: string;
  accent: string;
  image: any;
};

const SPORTS: Venue[] = [
  {
    id: "badminton",
    name: "Badminton Court",
    tag: "Indoor Courts",
    description:
      "Fast rallies, faster footwork. The indoor courts stay booked from early morning smashes to late-night doubles with the hostel crew.",
    icon: "tennisball-outline",
    accent: "#4FD1C5",
    image: hostelImage,
  },
  {
    id: "football",
    name: "Football Ground",
    tag: "Open Field",
    description:
      "The main turf for five-a-side evenings, department leagues and the odd impromptu match that turns into a two-hour tournament.",
    icon: "football-outline",
    accent: "#5CC26E",
    image: hostelImage,
  },
  {
    id: "basketball",
    name: "Basketball Ground",
    tag: "Outdoor Court",
    description:
      "Half-court pickup games at sunset, full-court runs on weekends — the hoop lights up campus energy long after classes end.",
    icon: "basketball-outline",
    accent: "#F0563C",
    image: hostelImage,
  },
  {
    id: "swimming",
    name: "Swimming Pool",
    tag: "Aquatics",
    description:
      "Laps before breakfast or a cool-off after a brutal exam week — the pool is campus's reset button, chlorine and all.",
    icon: "water-outline",
    accent: "#4C9BE8",
    image: hostelImage,
  },
];

const NOTCH_COUNT = 14;

export default function SportsScreen() {
  const navigation = useNavigation<any>();
  const { isDarkMode } = useAppTheme();
  const theme = useHomeTheme();

  const bgColor = theme.bgGradient[0];

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(screenHeight)).current;
  const isNavigating = useRef(false);

  const cardFade = useRef(SPORTS.map(() => new Animated.Value(0))).current;
  const cardSlide = useRef(SPORTS.map(() => new Animated.Value(18))).current;
  const scaleAnims = useRef(SPORTS.map(() => new Animated.Value(1))).current;

  // Disable the navigator's own push/pop transition & gesture for this screen.
  // We fully own the visual transition via slideY/fadeAnim, matching OurTeamScreen.
  useEffect(() => {
    navigation.setOptions({
      animation: "none",
      gestureEnabled: false,
    });
  }, [navigation]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    Animated.timing(slideY, {
      toValue: 0,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.stagger(
      100,
      SPORTS.map((_, i) =>
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

  const handleBack = () => {
    if (isNavigating.current) return;
    isNavigating.current = true;

    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 250,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
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
            opacity: fadeAnim,
            transform: [
              { translateY: slideY },
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 300],
                }),
              },
            ],
          },
        ]}
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

            <Text style={[styles.eyebrow, { color: theme.accent }]}>✦  CAMPUS SPORTS  ✦</Text>
            <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
              Game{"\n"}
              <Text style={{ color: theme.accent }}>Zones</Text>
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Four arenas, one campus — pick your game.
            </Text>

            <View style={styles.list}>
              {SPORTS.map((item, index) => (
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
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flexOne: { flex: 1 },
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