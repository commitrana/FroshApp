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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { useTheme } from '../../theme/theme';
import { CAMPUS_LOCATIONS, CampusLocation } from '../../data/campusMapLocations';
import { campusMapImages, campusMapBackground } from '../../assets/campusMapImages';

/* ============================================================
   Ported from the website's src/pages/CampusMap.tsx.
   Same data (43 campus locations), same interactions (tap a
   marker → preview → open a detail card with an image gallery,
   facts, and "Get Directions"), same GPS behaviour — Directions
   opens the device's Maps app with the destination coordinates,
   which uses the phone's own GPS location as the starting point,
   exactly like the website's `window.open(...google.com/maps/dir)`.
============================================================ */

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Intrinsic size of campus-map.webp (2640×1290) — used to keep markers
// aligned with the image regardless of how wide it's rendered.
const MAP_ASPECT_RATIO = 1290 / 2640;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_DISPLAY_WIDTH = SCREEN_WIDTH;
const MAP_DISPLAY_HEIGHT = MAP_DISPLAY_WIDTH * MAP_ASPECT_RATIO;

function getLocationImages(loc: CampusLocation | null) {
  if (!loc || !loc.images?.length) return [campusMapBackground];
  return loc.images.map((filename) => campusMapImages[filename] ?? campusMapBackground);
}

/* ------------------------------------------------------------
   A single marker: dot + looping pulse ring, driven off one
   shared Animated.Value so 43 markers don't each run their own
   native loop.
------------------------------------------------------------ */
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Campus Map</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={[styles.subhead, { color: colors.textSecondary }]}>
        Pinch to zoom in, tap a marker to open the full record.
      </Text>

      <ScrollView
        style={styles.mapScroll}
        contentContainerStyle={styles.mapScrollContent}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        minimumZoomScale={1}
        maximumZoomScale={4}
        bouncesZoom
      >
        <View style={[styles.mapFrame, { width: MAP_DISPLAY_WIDTH, height: MAP_DISPLAY_HEIGHT }]}>
          <Image
            source={campusMapBackground}
            style={styles.mapImage}
            resizeMode="contain"
          />
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
      </ScrollView>

      {/* Detail modal */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeModal} />

          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={styles.modalClose} onPress={closeModal}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.modalMedia}>
              <Image
                source={currentImages[imageIndex]}
                style={styles.modalImage}
                resizeMode="cover"
              />

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
                      <View
                        key={i}
                        style={[styles.modalDot, i === imageIndex && styles.modalDotActive]}
                      />
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
                style={[
                  styles.modalTitle,
                  { color: colors.textPrimary, opacity: titleAnim },
                ]}
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
  );
}

const MAROON = '#8C1D40';
const GOLD = '#C9A227';

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'android' ? 30 : 0,
    paddingVertical: 8,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: 2 },
  subhead: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },

  mapScroll: { flex: 1 },
  mapScrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
  },
  mapFrame: {
    position: 'relative',
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
    backgroundColor: 'rgba(20, 26, 17, 0.6)',
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