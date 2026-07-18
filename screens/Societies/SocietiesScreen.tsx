import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  Easing,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Icon from '@expo/vector-icons/Ionicons';

import { useTheme } from '../../theme/theme'; // ← Added

const { width, height } = Dimensions.get('window');

interface Society {
  id: number;
  name: string;
  category: 'tech' | 'cultural' | 'other';
  description: string;
}

// Single shared logo asset
const logo = require('../../assets/uiux/logo.png');

// Society data
const societies: Society[] = [
  // Tech
  { id: 1, name: 'ACM', category: 'tech', description: 'Association for Computing Machinery – the premier tech society.' },
  { id: 2, name: 'OWASP', category: 'tech', description: 'Institute of Electrical and Electronics Engineers – empowering tech innovation.' },
  { id: 3, name: 'CCS', category: 'tech', description: 'Computer Society of India – bridging academia and industry.' },
  { id: 4, name: 'GDSC', category: 'tech', description: 'Google Developer Student Clubs – building with Google tech.' },
  // Cultural
  { id: 5, name: 'TNT', category: 'cultural', description: 'Express yourself through rhythm and movement.' },
  { id: 6, name: 'MUDRA', category: 'cultural', description: 'Harmony, melody, and the joy of music.' },
  { id: 7, name: 'DANCE CLUB', category: 'cultural', description: 'Act, improvise, and bring stories to life.' },
  { id: 8, name: 'VIRSA', category: 'cultural', description: 'Unleash your creativity with colours and crafts.' },
  // Other
  { id: 9, name: 'FAPS', category: 'other', description: 'Capture moments, tell stories through the lens.' },
  { id: 10, name: 'ECHOES', category: 'other', description: 'Ideate, innovate, and build your startup.' },
  { id: 11, name: 'ECON', category: 'other', description: 'Protect nature, promote sustainability.' },
  { id: 12, name: 'TICC', category: 'other', description: 'Speak, persuade, and argue with clarity.' },
];

const categories: { key: Society['category']; label: string }[] = [
  { key: 'tech', label: 'Tech' },
  { key: 'cultural', label: 'Cultural' },
  { key: 'other', label: 'Other' },
];

export default function SocietiesScreen() {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme(); // ← Added

  const [activeCategory, setActiveCategory] = useState<Society['category']>('tech');
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);

  // Create theme object from global theme
  const t = {
    bgGradient: isDarkMode 
      ? ['#020B18', '#061528', '#041220'] as [string, string, string]
      : ['#F5F9FF', '#E8F0FE', '#D6E4F5'] as [string, string, string],
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    cardBg: colors.card,
    accent: colors.primary,
    shadowColor: colors.primary,
    lineColor: colors.border,
    tabInactiveBg: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    tabActiveBg: colors.primary,
    tabActiveText: '#FFFFFF',
    tabInactiveText: colors.textSecondary,
    modalBg: colors.card,
  };

  // --- Fade‑in animation ---
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const filtered = societies.filter(s => s.category === activeCategory);

  const openPopup = (society: Society) => setSelectedSociety(society);
  const closePopup = () => setSelectedSociety(null);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <LinearGradient colors={t.bgGradient} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color={t.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: t.textPrimary }]}>SOCIETIES</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Category Tabs – centered */}
          <View style={styles.tabContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.tab,
                  { backgroundColor: t.tabInactiveBg },
                  activeCategory === cat.key && {
                    backgroundColor: t.tabActiveBg,
                  },
                ]}
                onPress={() => setActiveCategory(cat.key)}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: activeCategory === cat.key
                        ? t.tabActiveText
                        : t.tabInactiveText,
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Grid of societies */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.grid}>
              {filtered.map((society) => (
                <TouchableOpacity
                  key={society.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: t.cardBg,
                      borderColor: t.lineColor,
                    },
                  ]}
                  onPress={() => openPopup(society)}
                  activeOpacity={0.8}
                >
                  <Image source={logo} style={styles.cardImage} />
                  <Text style={[styles.cardName, { color: t.textPrimary }]}>
                    {society.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Modal Popup with Blur */}
      <Modal visible={selectedSociety !== null} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={closePopup}>
          <BlurView
            intensity={80}
            style={styles.blurContainer}
            tint={isDarkMode ? 'dark' : 'light'}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={[
                  styles.popupCard,
                  {
                    backgroundColor: t.modalBg,
                    shadowColor: t.shadowColor,
                  },
                ]}
              >
                <View style={styles.popupHeader}>
                  <Image source={logo} style={styles.popupLogo} />
                  <Text style={[styles.popupName, { color: t.textPrimary }]}>
                    {selectedSociety?.name}
                  </Text>
                </View>
                <Text style={[styles.popupDescription, { color: t.textSecondary }]}>
                  {selectedSociety?.description}
                </Text>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: t.accent }]}
                  onPress={closePopup}
                >
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </BlurView>
        </TouchableWithoutFeedback>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 50,
    paddingVertical: 8,
  },
  backBtn: { padding: 4 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 12,
    justifyContent: 'center',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cardImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupCard: {
    width: width * 0.85,
    borderRadius: 28,
    padding: 24,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  popupLogo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginRight: 16,
  },
  popupName: {
    fontSize: 22,
    fontWeight: '700',
  },
  popupDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});