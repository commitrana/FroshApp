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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../theme/theme";

const hostelImage = require("../../assets/uiux/cos.jpg");

type StudySpot = {
  id: string;
  name: string;
  tag: string;
  description: string;
  icon: string;
  accent: string;
  image: any;
};

const STUDY_SPOTS: StudySpot[] = [
  {
    id: "ltlp",
    name: "LT/LP",
    tag: "Lecture Halls",
    description:
      "Rows of lecture theatres and labs where the actual syllabus happens — from 8 AM back-to-backs to last-minute pre-quiz cramming.",
    icon: "school-outline",
    accent: "#5B8DEF",
    image: hostelImage,
  },
  {
    id: "activity-space",
    name: "Activity Space",
    tag: "Clubs & Workshops",
    description:
      "Where societies build, rehearse and tinker — robotics rigs, dance practice and workshop prototypes all share the same buzzing floor.",
    icon: "construct-outline",
    accent: "#4FBF8B",
    image: hostelImage,
  },
  {
    id: "library",
    name: "Nava Nalanda Library",
    tag: "Study & Reference",
    description:
      "Silent floors, endless stacks and the only place on campus where a pin-drop is actually audible during finals week.",
    icon: "library-outline",
    accent: "#C9974B",
    image: hostelImage,
  },
];

const NOTCH_COUNT = 14;

export default function StudyScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDarkMode } = useTheme();

  const theme = {
    bgGradient: isDarkMode
      ? (["#0A0E27", "#1A1040", "#2D1B4E"] as [string, string, string])
      : (["#F8FBFF", "#EEF6FF", "#DDEEFF"] as [string, string, string]),
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    accent: colors.primary,
    cardBg: colors.card,
  };

  const bgColor = theme.bgGradient[0];

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const isNavigating = useRef(false);

  const cardFade = useRef(STUDY_SPOTS.map(() => new Animated.Value(0))).current;
  const cardSlide = useRef(STUDY_SPOTS.map(() => new Animated.Value(18))).current;
  const scaleAnims = useRef(STUDY_SPOTS.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    Animated.stagger(
      100,
      STUDY_SPOTS.map((_, i) =>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <LinearGradient colors={theme.bgGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>

            <Text style={[styles.eyebrow, { color: theme.accent }]}>✦  CAMPUS STUDY  ✦</Text>
            <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
              Study{"\n"}
              <Text style={{ color: theme.accent }}>Spaces</Text>
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Three spots, every kind of focus — find yours.
            </Text>

            <View style={styles.list}>
              {STUDY_SPOTS.map((item, index) => (
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

                    {/* Description panel (solid, no glass blur) */}
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