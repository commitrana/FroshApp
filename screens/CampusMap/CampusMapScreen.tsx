import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  Dimensions,
  Linking,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTopInset } from '../../hooks/useTopInset';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { useTheme } from '../../theme/theme';
import { CAMPUS_LOCATIONS, CampusLocation } from '../../data/campusMapLocations';
import { campusMapImages, campusMapBackground } from '../../assets/campusMapImages';


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MAP_ASPECT_RATIO = 800 / 1600; // height / width, in the image's ORIGINAL orientation (campusmap.png is 1600x800)

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MAP_INNER_HEIGHT = SCREEN_WIDTH; // becomes the visual WIDTH after rotating
const MAP_INNER_WIDTH = SCREEN_WIDTH / MAP_ASPECT_RATIO; // becomes the visual HEIGHT after rotating
const MAP_DISPLAY_WIDTH = SCREEN_WIDTH; // outer frame — visual width post-rotation
const MAP_DISPLAY_HEIGHT = MAP_INNER_WIDTH; // outer frame — visual height post-rotation

function getLocationImages(loc: CampusLocation | null) {
  if (!loc || !loc.images?.length) return [campusMapBackground];
  return loc.images.map((filename) => campusMapImages[filename] ?? campusMapBackground);
}

function MapMarker({
  loc,
  pulse,
  isActive,
  onPress,
}: {
  loc: CampusLocation;
  pulse: Animated.Value;
  isActive: boolean;
  onPress: () => void;
}) {
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={[
        styles.marker,
        { left: `${loc.x}%`, top: `${loc.y}%` },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${loc.name} — show details`}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.markerPulse,
          { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
        ]}
      />
      <View style={[styles.markerDot, isActive && styles.markerDotActive]} />
    </TouchableOpacity>
  );
}

export default function CampusMapScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDarkMode } = useTheme();
  const topInset = useTopInset();

  const [activeLocation, setActiveLocation] = useState<CampusLocation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const titleAnim = useRef(new Animated.Value(0)).current;

  // One shared, looping pulse driving every marker's ring.
  const pulse = useRef(new Animated.Value(0)).current;
  useMemo(() => {
    Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  }, [pulse]);

  const currentImages = useMemo(() => getLocationImages(activeLocation), [activeLocation]);
  const hasGallery = currentImages.length > 1;

  const openModal = useCallback(
    (loc: CampusLocation) => {
      setActiveLocation(loc);
      setImageIndex(0);
      setIsModalOpen(true);
      titleAnim.setValue(0);
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [titleAnim]
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setActiveLocation(null), 250);
  }, []);

  const showNextImage = useCallback(() => {
    if (currentImages.length < 2) return;
    setImageIndex((i) => (i + 1) % currentImages.length);
  }, [currentImages.length]);

  const showPrevImage = useCallback(() => {
    if (currentImages.length < 2) return;
    setImageIndex((i) => (i - 1 + currentImages.length) % currentImages.length);
  }, [currentImages.length]);

  // Same GPS behaviour as the website: open the destination in Maps and
  // let the device's own location services supply the starting point.
  const openDirections = useCallback(() => {
    if (!activeLocation) return;
    const { lat, lng } = activeLocation;
    const url =
      Platform.OS === 'ios'
        ? `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    });
  }, [activeLocation]);

  const bgGradient: [string, string, string] = isDarkMode
    ? ['#020B18', '#061528', '#041220']
    : ['#F5F9FF', '#E8F0FE', '#D6E4F5'];

  const glassBg = isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.55)';
  const glassBorder = isDarkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.8)';

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <LinearGradient colors={bgGradient} style={styles.gradient}>
        <SafeAreaView style={styles.container} edges={["bottom"]}>
          <View style={[styles.header, { marginTop: topInset }]}>
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: glassBg, borderColor: glassBorder }]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Campus Map</Text>
            <View style={{ width: 36 }} />
          </View>


          <ScrollView
            style={styles.mapScroll}
            contentContainerStyle={styles.mapScrollContent}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            minimumZoomScale={1}
            maximumZoomScale={4}
            bouncesZoom
          >
            <View
              style={[
                styles.mapFrame,
                {
                  width: MAP_DISPLAY_WIDTH - 32,
                  height: MAP_DISPLAY_HEIGHT - 32,
                },
              ]}
            >
              <View
                style={[
                  styles.mapInner,
                  { width: MAP_INNER_WIDTH - 32, height: MAP_INNER_HEIGHT - 32 },
                ]}
              >
                <Image source={campusMapBackground} style={styles.mapImage} resizeMode="contain" />
                {CAMPUS_LOCATIONS.map((loc) => (
                  <MapMarker
                    key={loc.id}
                    loc={loc}
                    pulse={pulse}
                    isActive={activeLocation?.id === loc.id && isModalOpen}
                    onPress={() => openModal(loc)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Detail modal */}
          <Modal visible={isModalOpen} transparent animationType="fade" onRequestClose={closeModal}>
            <View
              style={[
                styles.modalOverlay,
                { backgroundColor: isDarkMode ? 'rgba(2, 6, 16, 0.75)' : 'rgba(15, 23, 42, 0.45)' },
              ]}
            >
              <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeModal} />

              <View
                style={[
                  styles.modalCard,
                  { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
                ]}
              >
                <TouchableOpacity style={styles.modalClose} onPress={closeModal}>
                  <Ionicons name="close" size={22} color="#1F2A1C" />
                </TouchableOpacity>

                <View style={[styles.modalMedia, { backgroundColor: colors.surface }]}>
                  <Image source={currentImages[imageIndex]} style={styles.modalImage} resizeMode="cover" />

                  {hasGallery && (
                    <>
                      <TouchableOpacity style={[styles.modalArrow, styles.modalArrowLeft]} onPress={showPrevImage}>
                        <Ionicons name="chevron-back" size={20} color="#1F2A1C" />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.modalArrow, styles.modalArrowRight]} onPress={showNextImage}>
                        <Ionicons name="chevron-forward" size={20} color="#1F2A1C" />
                      </TouchableOpacity>
                      <View style={styles.modalDots}>
                        {currentImages.map((_, i) => (
                          <View key={i} style={[styles.modalDot, i === imageIndex && styles.modalDotActive]} />
                        ))}
                      </View>
                    </>
                  )}
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {!!activeLocation?.eyebrow && (
                    <Text style={styles.modalEyebrow}>{activeLocation.eyebrow}</Text>
                  )}

                  <Animated.Text
                    style={[styles.modalTitle, { color: colors.textPrimary, opacity: titleAnim }]}
                  >
                    {activeLocation?.name ?? ''}
                  </Animated.Text>

                  {!!activeLocation?.description && (
                    <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                      {activeLocation.description}
                    </Text>
                  )}

                  {!!activeLocation?.facts && Object.keys(activeLocation.facts).length > 0 && (
                    <View style={styles.factsList}>
                      {Object.entries(activeLocation.facts).map(([label, value]) => (
                        <View key={label} style={styles.factRow}>
                          <Text style={styles.factLabel}>{label}</Text>
                          <Text style={[styles.factValue, { color: colors.textPrimary }]}>{value}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.directionsBtn, { backgroundColor: colors.primary }]}
                    onPress={openDirections}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="navigate" size={16} color="#fff" />
                    <Text style={styles.directionsBtnText}>Get Directions</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const MAROON = '#8C1D40';
const GOLD = '#C9A227';

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 26, fontWeight: '700' },
  subhead: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
  },

  mapScroll: { flex: 1 },
  mapScrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  mapFrame: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapInner: {
    position: 'relative',
    transform: [{ rotate: '90deg' }],
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },

  marker: {
    position: 'absolute',
    width: 30,
    height: 30,
    marginLeft: -15,
    marginTop: -15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: MAROON,
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  markerDotActive: {
    backgroundColor: GOLD,
  },
  markerPulse: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: MAROON,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '86%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 5,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMedia: {
    width: '100%',
    height: 210,
    backgroundColor: '#0b0c13',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -17,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalArrowLeft: { left: 10 },
  modalArrowRight: { right: 10 },
  modalDots: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  modalDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  modalDotActive: {
    backgroundColor: MAROON,
  },

  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  modalEyebrow: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: MAROON,
    marginBottom: 4,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  factsList: {
    marginBottom: 18,
  },
  factRow: {
    marginBottom: 8,
  },
  factLabel: {
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: GOLD,
    fontWeight: '600',
    marginBottom: 1,
  },
  factValue: {
    fontSize: 13.5,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 24,
  },
  directionsBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});