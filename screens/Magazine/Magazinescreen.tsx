import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
  Easing,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from "react-native";
import {
  PinchGestureHandler,
  PanGestureHandler,
  TapGestureHandler,
  State,
  HandlerStateChangeEvent,
  PinchGestureHandlerEventPayload,
  PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../../context/ThemeContext";
import { useHomeTheme } from "../../constants/homeThemes";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Real pixel dimensions of the rendered pages (1355x1667 for every page in
// this issue) — used to size each page card by its true aspect ratio instead
// of stretching/letterboxing it inside a guessed box.
const PAGE_ASPECT_RATIO = 1355 / 1667;

// TODO: point this at your real backend, ideally by importing your
// existing API client/config instead of hardcoding a URL here (e.g.
// `import { API_BASE_URL } from "../../config/api"` if you already have
// one — that's what services/api.js on the web dashboard talks to too).
const API_BASE_URL = "https://your-backend-domain.com/api";

const AnimatedFlatList = Animated.createAnimatedComponent(
  require("react-native").FlatList
);

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const CARD_HORIZONTAL_MARGIN = 24;
const CARD_WIDTH = screenWidth - CARD_HORIZONTAL_MARGIN * 2;
const CARD_HEIGHT = CARD_WIDTH / PAGE_ASPECT_RATIO;

/**
 * A single magazine page. Handles pinch-to-zoom, pan-while-zoomed, and
 * double-tap-to-zoom, the same way a native photo viewer behaves. While
 * zoomed (scale > 1) it tells the parent list to stop swallowing touches
 * so panning around the zoomed image doesn't fight the page-scroll.
 */
function ZoomablePage({
  source,
  isFocused,
  onZoomStateChange,
}: {
  source: string; // remote image URL, e.g. from Supabase storage
  isFocused: boolean;
  onZoomStateChange: (zoomed: boolean) => void;
}) {
  const { theme, shadowColor } = useHomeThemeShadow();

  // Committed values (after a gesture ends) + live in-gesture deltas that
  // get folded into the committed value on release. This is the standard
  // Animated (non-reanimated) pattern for pinch/pan.
  const scale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const scaleValue = useRef(1);
  const translateValue = useRef({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);

  const pinchRef = useRef(null);
  const panRef = useRef(null);
  const doubleTapRef = useRef(null);

  const displayScale = Animated.multiply(scale, pinchScale);
  const displayTranslateX = Animated.add(translateX, panX);
  const displayTranslateY = Animated.add(translateY, panY);

  const resetZoom = useCallback(
    (animated: boolean) => {
      scaleValue.current = 1;
      translateValue.current = { x: 0, y: 0 };
      setIsZoomed(false);
      onZoomStateChange(false);
      if (animated) {
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        ]).start();
      } else {
        scale.setValue(1);
        translateX.setValue(0);
        translateY.setValue(0);
      }
    },
    [onZoomStateChange, scale, translateX, translateY]
  );

  // If the user swipes to a different page while zoomed in, snap this page
  // back to normal so it doesn't stay zoomed when they scroll back to it.
  useEffect(() => {
    if (!isFocused && scaleValue.current !== 1) {
      resetZoom(false);
    }
  }, [isFocused, resetZoom]);

  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true }
  );

  const onPinchStateChange = (
    event: HandlerStateChangeEvent<PinchGestureHandlerEventPayload>
  ) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const gestureScale = event.nativeEvent.scale;
      const newScale = clamp(scaleValue.current * gestureScale, MIN_SCALE, MAX_SCALE);
      scaleValue.current = newScale;
      pinchScale.setValue(1);
      scale.setValue(newScale);

      if (newScale <= MIN_SCALE) {
        resetZoom(true);
      } else {
        setIsZoomed(true);
        onZoomStateChange(true);
      }
    }
  };

  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: panX, translationY: panY } }],
    { useNativeDriver: true }
  );

  const onPanStateChange = (
    event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>
  ) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const maxX = Math.max(((CARD_WIDTH * scaleValue.current) - CARD_WIDTH) / 2, 0);
      const maxY = Math.max(((CARD_HEIGHT * scaleValue.current) - CARD_HEIGHT) / 2, 0);

      const nextX = clamp(
        translateValue.current.x + event.nativeEvent.translationX,
        -maxX,
        maxX
      );
      const nextY = clamp(
        translateValue.current.y + event.nativeEvent.translationY,
        -maxY,
        maxY
      );

      translateValue.current = { x: nextX, y: nextY };
      panX.setValue(0);
      panY.setValue(0);
      translateX.setValue(nextX);
      translateY.setValue(nextY);
    }
  };

  const onDoubleTap = (event: HandlerStateChangeEvent<Record<string, unknown>>) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      if (scaleValue.current > 1) {
        resetZoom(true);
      } else {
        scaleValue.current = DOUBLE_TAP_SCALE;
        setIsZoomed(true);
        onZoomStateChange(true);
        Animated.spring(scale, {
          toValue: DOUBLE_TAP_SCALE,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  return (
    <TapGestureHandler
      ref={doubleTapRef}
      numberOfTaps={2}
      onHandlerStateChange={onDoubleTap}
    >
      <Animated.View style={styles.pageWrap}>
        <PinchGestureHandler
          ref={pinchRef}
          simultaneousHandlers={[panRef]}
          onGestureEvent={onPinchGestureEvent}
          onHandlerStateChange={onPinchStateChange}
        >
          <Animated.View>
            <PanGestureHandler
              ref={panRef}
              simultaneousHandlers={[pinchRef]}
              enabled={isZoomed}
              onGestureEvent={onPanGestureEvent}
              onHandlerStateChange={onPanStateChange}
            >
              <Animated.View
                style={[
                  styles.pageCard,
                  {
                    backgroundColor: "#ffffff",
                    shadowColor,
                    borderColor: "rgba(0,0,0,0.06)",
                    transform: [
                      { translateX: displayTranslateX },
                      { translateY: displayTranslateY },
                      { scale: displayScale },
                    ],
                  },
                ]}
              >
                <Animated.Image
                  source={{ uri: source }}
                  style={styles.pageImage}
                  resizeMode="contain"
                />
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    </TapGestureHandler>
  );
}

// Small helper so ZoomablePage can grab theme-derived shadow color without
// threading extra props through every level.
function useHomeThemeShadow() {
  const theme = useHomeTheme();
  return { theme, shadowColor: theme.shadowColor };
}

export default function MagazineScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDarkMode } = useAppTheme();
  const theme = useHomeTheme();

  const bgColor = theme.bgGradient[0];

  // Optional: navigate here with { issueNumber: 3 } to open a specific
  // issue. Without it, this screen loads whichever issue is most recent.
  const routeIssueNumber = route?.params?.issueNumber as number | undefined;

  const [pages, setPages] = useState<string[]>([]);
  const [magazineTitle, setMagazineTitle] = useState("Pulse Magazine");
  const [isLoadingPages, setIsLoadingPages] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchPages = async () => {
      setIsLoadingPages(true);
      setLoadError(null);
      try {
        const url = routeIssueNumber
          ? `${API_BASE_URL}/magazines/${routeIssueNumber}`
          : `${API_BASE_URL}/magazines/latest/pages`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Request failed");
        const data = await res.json();
        if (!isMounted) return;
        setPages(data.magazine?.pages || []);
        setPageIndex(0);
        if (data.magazine?.title) setMagazineTitle(data.magazine.title);
      } catch (err) {
        if (isMounted) {
          setLoadError("Couldn't load the magazine. Check your connection and try again.");
        }
      } finally {
        if (isMounted) setIsLoadingPages(false);
      }
    };

    fetchPages();
    return () => {
      isMounted = false;
    };
  }, [routeIssueNumber, reloadKey]);

  const slideY = useRef(new Animated.Value(screenHeight)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const isNavigating = useRef(false);
  const listRef = useRef<any>(null);

  const [pageIndex, setPageIndex] = useState(0);
  // The FlatList's own visible height (below the header) — needed so each
  // page item is sized to exactly one "screen" of vertical paging, since
  // flex:1 items can't be measured correctly inside a scroll content view.
  const [listHeight, setListHeight] = useState(screenHeight - 90);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // Drives the subtle "connected page" motion — as you scroll, the page
  // coming into view eases up in scale/opacity while the one leaving eases
  // down, instead of pages just hard-cutting past each other.
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions({
      animation: "none",
      gestureEnabled: false,
    });
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
  }, []);

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

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / listHeight);
    setPageIndex(idx);
  };

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  const handleZoomStateChange = useCallback((zoomed: boolean) => {
    setScrollEnabled(!zoomed);
  }, []);

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
            {/* Header — back arrow, title, and a small pill on the right
                styled like HomeScreen's "Class History" tag (cardBg
                background, accent-colored text). */}
            <View style={styles.header}>
              <TouchableOpacity
                style={[styles.backBtn, { backgroundColor: theme.cardBg, shadowColor: theme.shadowColor }]}
                onPress={handleBack}
              >
                <Ionicons name="arrow-back" size={22} color={theme.iconColor} />
              </TouchableOpacity>
              <Text style={[styles.heading, { color: theme.textPrimary }]}>{magazineTitle}</Text>
              <View style={[styles.pageCounterPill, { backgroundColor: theme.cardBg, shadowColor: theme.shadowColor }]}>
                <Text style={[styles.pageCounterText, { color: theme.accent }]}>
                  {pages.length > 0 ? `${pageIndex + 1}/${pages.length}` : "—"}
                </Text>
              </View>
            </View>

            {/* Loading / error states — shown in place of the pager while
                pages are being fetched from the backend, or if that fetch
                fails (e.g. no connection, or no issue uploaded yet). */}
            {isLoadingPages ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={[styles.centerStateText, { color: theme.textPrimary }]}>
                  Loading magazine...
                </Text>
              </View>
            ) : loadError ? (
              <View style={styles.centerState}>
                <Text style={[styles.centerStateText, { color: theme.textPrimary }]}>{loadError}</Text>
                <TouchableOpacity
                  style={[styles.retryBtn, { backgroundColor: theme.cardBg }]}
                  onPress={() => setReloadKey((k) => k + 1)}
                >
                  <Text style={{ color: theme.accent, fontWeight: "600" }}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : pages.length === 0 ? (
              <View style={styles.centerState}>
                <Text style={[styles.centerStateText, { color: theme.textPrimary }]}>
                  No magazine issue available yet.
                </Text>
              </View>
            ) : (
              // The list itself needs flex:1 to actually fill the remaining
              // space below the header — without it each page renders into
              // an undersized box, which is what was making pages look small,
              // off-center, and showing the raw background through the gaps.
              // onLayout captures its real measured height so each item can
              // be sized to exactly one page-worth of vertical scroll.
            <View
              style={styles.pagerList}
              onLayout={(e) => {
                const h = e.nativeEvent.layout.height;
                if (h > 0 && Math.abs(h - listHeight) > 1) setListHeight(h);
              }}
            >
              <AnimatedFlatList
                ref={listRef}
                data={pages}
                pagingEnabled
                scrollEnabled={scrollEnabled}
                decelerationRate="fast"
                showsVerticalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                onMomentumScrollEnd={onMomentumScrollEnd}
                keyExtractor={(_: any, i: number) => `page-${i}`}
                initialNumToRender={1}
                windowSize={3}
                maxToRenderPerBatch={2}
                removeClippedSubviews
                getItemLayout={(_: any, index: number) => ({
                  length: listHeight,
                  offset: listHeight * index,
                  index,
                })}
                renderItem={({ item, index }: { item: any; index: number }) => {
                  const inputRange = [
                    (index - 1) * listHeight,
                    index * listHeight,
                    (index + 1) * listHeight,
                  ];
                  // Neighbouring pages ease down slightly in scale/opacity
                  // as they leave view, and ease up as they arrive — this
                  // is what makes consecutive pages feel like one
                  // continuous magazine instead of a hard cut every swipe.
                  const cardScale = scrollY.interpolate({
                    inputRange,
                    outputRange: [0.94, 1, 0.94],
                    extrapolate: "clamp",
                  });
                  const cardOpacity = scrollY.interpolate({
                    inputRange,
                    outputRange: [0.55, 1, 0.55],
                    extrapolate: "clamp",
                  });

                  return (
                    <Animated.View
                      style={[
                        styles.pageOuterWrap,
                        { height: listHeight, opacity: cardOpacity, transform: [{ scale: cardScale }] },
                      ]}
                    >
                      <ZoomablePage
                        source={item}
                        isFocused={index === pageIndex}
                        onZoomStateChange={handleZoomStateChange}
                      />
                    </Animated.View>
                  );
                }}
              />
            </View>
            )}
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
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  centerStateText: {
    fontSize: 15,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    marginTop: 8,
    marginBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
  },
  pageCounterPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  pageCounterText: {
    fontSize: 13,
    fontWeight: "700",
  },
  pagerList: {
    flex: 1,
  },
  pageOuterWrap: {
    width: screenWidth,
    justifyContent: "center",
    alignItems: "center",
  },
  pageWrap: {
    width: screenWidth,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pageCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  pageImage: {
    width: "100%",
    height: "100%",
  },
});