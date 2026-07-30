import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";

import { useAppTheme } from "../../context/ThemeContext";
import { useHomeTheme } from "../../constants/homeThemes";
import { useTopInset } from "../../hooks/useTopInset";

const { height: screenHeight } = Dimensions.get("window");

const girls = require("../../assets/girlshostel/pavani.png");
const boys = require("../../assets/boyshostel/anantam.png");

const NOTCH_COUNT = 14;

type FacilityLib = "feather" | "mci";

type Facility = {
  lib: FacilityLib;
  name: string;
  label: string;
};

type Wing = {
  id: string;
  name: string;
  tag: string;
  description: string;
  icon: string;
  accent: string;
  image: any;
  route: string;
  facilities: Facility[];
};

const FacilityIcon = ({
  lib,
  name,
  size,
  color,
}: {
  lib: FacilityLib;
  name: string;
  size: number;
  color: string;
}) => {
  if (lib === "feather") return <Feather name={name as any} size={size} color={color} />;
  return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
};

export default function HostelsScreen() {
  const navigation = useNavigation<any>();
  const { isDarkMode } = useAppTheme();
  const theme = useHomeTheme();
  const topInset = useTopInset();

  // --- Entry / exit animations (same as AccountScreen) ---
  const slideY = useRef(new Animated.Value(screenHeight)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const isNavigating = useRef(false);

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

  // --- Hostel data (unchanged) ---
  const HOSTELS: Wing[] = [
    {
      id: "boys",
      name: "Boys Hostel",
      tag: "Brotherhood Wing",
      description:
        "Built for comfort, made for brotherhood — late-night mess runs, early gym sessions and a room that always feels like home base.",
      icon: "man-outline",
      accent: theme.accent,
      image: boys,
      route: "Boys",
      facilities: [
        { lib: "feather", name: "wifi", label: "Wi-Fi" },
        { lib: "mci", name: "silverware-fork-knife", label: "Mess" },
        { lib: "mci", name: "dumbbell", label: "Gym" },
      ],
    },
    {
      id: "girls",
      name: "Girls Hostel",
      tag: "Sisterhood Wing",
      description:
        "A space to thrive and a community to grow — cozy common rooms, warm mess evenings and friendships that outlast the degree.",
      icon: "woman-outline",
      accent: "#A86CFF",
      image: girls,
      route: "Girls",
      facilities: [
        { lib: "feather", name: "wifi", label: "Wi-Fi" },
        { lib: "mci", name: "silverware-fork-knife", label: "Mess" },
        { lib: "mci", name: "sofa-outline", label: "Common Room" },
      ],
    },
  ];

  // Scale animations for card press (unchanged)
  const scaleAnims = useRef(HOSTELS.map(() => new Animated.Value(1))).current;

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

  const bgColor = theme.bgGradient[0];

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={Platform.OS === "android"}
      />
      <Animated.View
        style={[
          {
            flex: 1,
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
          <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Header with back button (matches AccountScreen style) */}
              <View style={[styles.header, { marginTop: topInset }]}>
                <TouchableOpacity onPress={handleBack}>
                  <Icon name="arrow-back" size={26} color={theme.iconColor} />
                </TouchableOpacity>
                <Text style={[styles.heading, { color: theme.textPrimary }]}>Hostels</Text>
                <View style={{ width: 26 }} />
              </View>

              <Text style={[styles.eyebrow, { color: theme.accent }]}>✦  CAMPUS HOSTELS  ✦</Text>
              <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
                Hostel{"\n"}
                <Text style={{ color: theme.accent }}>Wings</Text>
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                Boys' and Girls' hostels on campus.
              </Text>

              <View style={styles.list}>
                {HOSTELS.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    style={{
                      transform: [{ scale: scaleAnims[index] }],
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.92}
                      onPressIn={() => pressIn(index)}
                      onPressOut={() => pressOut(index)}
                      onPress={() => navigation.navigate(item.route)}
                      style={[
                        styles.card,
                        {
                          borderColor: isDarkMode ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.1)",
                          shadowColor: item.accent,
                        },
                      ]}
                    >
                      <View style={styles.photoWrap}>
                        <Image source={item.image} style={styles.photo} />
                        <LinearGradient
                          colors={[`${item.accent}33`, "transparent"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0.8 }}
                          style={StyleSheet.absoluteFill}
                          pointerEvents="none"
                        />
                        <LinearGradient
                          colors={["transparent", "rgba(3,8,18,0.85)"]}
                          style={styles.photoFade}
                          pointerEvents="none"
                        />
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
                            borderTopColor: isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
                          },
                        ]}
                      >
                        <View style={styles.panelHeaderRow}>
                          <Text style={[styles.stallName, { color: item.accent }]}>{item.name}</Text>
                        </View>
                        <Text style={[styles.description, { color: theme.textSecondary }]}>
                          {item.description}
                        </Text>

                        <View style={[styles.facilityDivider, { backgroundColor: `${item.accent}40` }]} />

                        <View style={styles.facilityRow}>
                          {item.facilities.map((f) => (
                            <View key={f.name} style={styles.facilityItem}>
                              <FacilityIcon lib={f.lib} name={f.name} size={18} color={item.accent} />
                              <Text style={[styles.facilityText, { color: theme.textPrimary }]}>{f.label}</Text>
                            </View>
                          ))}
                        </View>
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
  facilityDivider: {
    height: 1,
    marginTop: 16,
    marginBottom: 14,
  },
  facilityRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  facilityItem: {
    alignItems: "center",
    gap: 4,
  },
  facilityText: {
    fontSize: 11,
    fontWeight: "600",
  },
});