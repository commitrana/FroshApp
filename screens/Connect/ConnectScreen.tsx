import React, { useRef, useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
  Linking,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView, BlurTargetView } from "expo-blur";
import Icon from "@expo/vector-icons/Ionicons";
import { Feather } from "@expo/vector-icons";

import { useAppTheme } from "../../context/ThemeContext";
import { useHomeTheme } from "../../constants/homeThemes";

const { width, height: screenHeight } = Dimensions.get("window");

type IconSet = "Ionicons" | "Feather";

type HelpLink = {
  id: string;
  label: string;
  icon: string;
  iconSet: IconSet;
  url: string | null;
};

const helpLinks: HelpLink[] = [
  { id: "website", label: "Website", icon: "globe-outline", iconSet: "Ionicons", url: "https://tr.ee/ufjIxJszUK" },
  { id: "instagram", label: "Instagram", icon: "logo-instagram", iconSet: "Ionicons", url: "https://tr.ee/h1y6A_eYSg" },
  { id: "youtube", label: "YouTube", icon: "logo-youtube", iconSet: "Ionicons", url: "https://youtube.com/@froshtiet?si=NUlQHxHSWGTSjJ73" },
  { id: "facebook", label: "Facebook", icon: "logo-facebook", iconSet: "Ionicons", url: "https://tr.ee/1G-pzEBp1E" },
  { id: "github", label: "GitHub", icon: "github", iconSet: "Feather", url: "https://tr.ee/OczIWYVBps" },
  { id: "phone", label: "Phone", icon: "phone-call", iconSet: "Feather", url: null },
];

type Contact = { name: string; number: string };

const contacts: Contact[] = [
  { name: "Vanshaj Kaushik", number: "8439818347" },
  { name: "Snehil Jhanwar", number: "9057241613" },
];

export default function ConnectScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useAppTheme();
  const theme = useHomeTheme();

  const [modalVisible, setModalVisible] = useState(false);

  // --- Animations ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(screenHeight)).current;
  const isNavigating = useRef(false);
  const blurTargetRef = useRef<View | null>(null);

  // Disable default transitions
  useEffect(() => {
    navigation.setOptions({
      animation: "none",
      gestureEnabled: false,
    });
  }, [navigation]);

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideY, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // --- Exit animation (intercept any back action) ---
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
        Animated.timing(fadeAnim, {
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

  // Header back button now just calls goBack()
  const handleBack = () => {
    if (isNavigating.current) return;
    navigation.goBack();
  };

  const handlePress = (item: HelpLink) => {
    if (item.id === "phone") {
      setModalVisible(true);
    } else if (item.url) {
      Linking.openURL(item.url).catch(() => {});
    }
  };

  const renderIcon = (item: HelpLink) => {
    const color = theme.textPrimary;
    const size = 48;
    if (item.iconSet === "Feather") {
      return <Feather name={item.icon as any} size={size} color={color} />;
    }
    return <Icon name={item.icon as any} size={size} color={color} />;
  };

  const glassBg = isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.35)";
  const glassBorder = isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.7)";
  const glassSheen = isDarkMode
    ? (["rgba(255,255,255,0.14)", "rgba(255,255,255,0)"] as [string, string])
    : (["rgba(255,255,255,0.55)", "rgba(255,255,255,0)"] as [string, string]);

  const bgColor = theme.bgGradient[0];

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: bgColor,
            opacity: fadeAnim,
          },
          {
            transform: [{ translateY: slideY }],
          },
        ]}
      >
        <LinearGradient
          colors={theme.bgGradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.container}
        >
          <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                  <Icon name="arrow-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.textPrimary }]}>Connect with us</Text>
                <View style={{ width: 40 }} />
              </View>

              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Connect with us through any of these channels
              </Text>

              <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.grid}>
                  {helpLinks.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.card, { borderColor: glassBorder }]}
                      onPress={() => handlePress(item)}
                      activeOpacity={0.7}
                    >
                      <BlurView
                        intensity={80}
                        tint={isDarkMode ? "dark" : "light"}
                        blurMethod="dimezisBlurView"
                        blurTarget={blurTargetRef}
                        style={[StyleSheet.absoluteFill, { backgroundColor: glassBg, borderRadius: 24 }]}
                      >
                        <LinearGradient
                          colors={glassSheen}
                          start={{ x: 0.5, y: 0 }}
                          end={{ x: 0.5, y: 1 }}
                          style={styles.glassSheen}
                          pointerEvents="none"
                        />
                      </BlurView>
                      <View style={[styles.iconCircle, { borderColor: theme.accent }]}>
                        {renderIcon(item)}
                      </View>
                      <Text style={[styles.label, { color: theme.textPrimary }]}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </SafeAreaView>
          </BlurTargetView>
        </LinearGradient>
      </Animated.View>

      {/* Phone Modal (unchanged) */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <BlurView
                intensity={120}
                tint={isDarkMode ? "dark" : "light"}
                blurMethod="dimezisBlurView"
                style={[
                  styles.modalCard,
                  { backgroundColor: glassBg, borderColor: glassBorder, borderWidth: 1, shadowColor: theme.shadowColor },
                ]}
              >
                <LinearGradient
                  colors={glassSheen}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.glassSheen}
                  pointerEvents="none"
                />
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Contact Support</Text>
                <View style={[styles.divider, { backgroundColor: theme.lineColor }]} />
                {contacts.map((contact, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.contactRow,
                      index < contacts.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: theme.lineColor,
                      },
                    ]}
                    onPress={() => Linking.openURL(`tel:${contact.number}`)}
                  >
                    <Feather name="phone" size={20} color={theme.accent} />
                    <View style={styles.contactTextContainer}>
                      <Text style={[styles.contactName, { color: theme.textPrimary }]}>{contact.name}</Text>
                      <Text style={[styles.contactNumber, { color: theme.textSecondary }]}>{contact.number}</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.accent }]} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </BlurView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
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
  title: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 0,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
  },
  card: {
    width: "46%",
    height: 180,
    borderRadius: 24,
    marginBottom: 18,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: width * 0.88,
    borderRadius: 28,
    padding: 24,
    overflow: "hidden",
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  glassSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "45%",
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  contactTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
  },
  contactNumber: {
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});