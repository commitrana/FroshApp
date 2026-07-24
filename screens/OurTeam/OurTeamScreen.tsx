import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  FlatList,
  Dimensions,
  Animated,
  Easing,
  LayoutChangeEvent,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView, BlurTargetView } from 'expo-blur';
import Icon from '@expo/vector-icons/Ionicons';

import { useAppTheme } from '../../context/ThemeContext';
import { useOurTeamTheme } from '../../constants/ourTeamThemes';

const { width, height: screenHeight } = Dimensions.get('window');

const H_PADDING = 12;
const GRID_GAP = 8;
const CARD_SIZE = Math.floor((width - H_PADDING * 2 - GRID_GAP) / 2);

const memberImg = require('../../assets/uiux/person.jpg');

const API_BASE = 'https://frosh-app-backend.onrender.com/api';

type FacultyMember = { id: string; name: string; designation: string; imageUrl: string };
type BranchMember = { id: string; name: string; branch: string; imageUrl: string };
type MentorMember = { id: string; name: string; imageUrl: string };

type TeamData = {
  faculty: FacultyMember[];
  osc: BranchMember[];
  core: BranchMember[];
  mentor: MentorMember[];
};

const EMPTY_TEAM_DATA: TeamData = { faculty: [], osc: [], core: [], mentor: [] };

type TabKey = 'faculty' | 'osc' | 'core' | 'mentor';
const TABS: TabKey[] = ['faculty', 'osc', 'core', 'mentor'];

export default function OurTeamScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useAppTheme();
  const theme = useOurTeamTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('faculty');

  // --- Team data fetch ---
  const [teamData, setTeamData] = useState<TeamData>(EMPTY_TEAM_DATA);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTeam = async () => {
      try {
        setTeamLoading(true);
        setTeamError(null);
        const response = await fetch(`${API_BASE}/team`);
        if (!response.ok) throw new Error('Failed to load team data');
        const data = await response.json();
        const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
        if (isMounted) {
          setTeamData({
            faculty: [...(data.faculty || [])].sort(byName),
            osc: [...(data.osc || [])].sort(byName),
            core: [...(data.core || [])].sort(byName),
            mentor: [...(data.mentor || [])].sort(byName),
          });
        }
      } catch (err) {
        if (isMounted) setTeamError('Could not load team. Pull to retry later.');
        console.error('❌ Error fetching team data:', err);
      } finally {
        if (isMounted) setTeamLoading(false);
      }
    };

    fetchTeam();
    return () => {
      isMounted = false;
    };
  }, []);

  // --- Glass pill slider animation ---
  const [containerWidth, setContainerWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const blurTargetRef = useRef<View | null>(null);

  // --- Entry & Exit animations (slide from bottom / slide to bottom) ---
  const slideY = useRef(new Animated.Value(screenHeight)).current; // start off‑screen bottom
  const opacityAnim = useRef(new Animated.Value(0)).current;      // subtle fade
  const isNavigating = useRef(false);

  // Disable the navigator's own push/pop transition & gesture for this screen.
  // We fully own the visual transition via slideY/opacityAnim, so letting the
  // default stack transition also run is what causes the flash at the end
  // (it snaps the screen back to its normal opacity/position for one frame
  // before removing it).
  useEffect(() => {
    navigation.setOptions({
      animation: 'none',
      gestureEnabled: false,
    });
  }, [navigation]);

  // Run entry animation on mount
  useEffect(() => {
    // Start both animations simultaneously
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

  // --- Full-screen swipe-to-change-page effect ---
  const contentDragX = useRef(new Animated.Value(-width * TABS.indexOf('faculty'))).current;
  const contentDragStartIndex = useRef(0);
  const contentDragStartValue = useRef(-width * TABS.indexOf('faculty'));
  const isContentDragging = useRef(false);

  const dragStartValue = useRef(0);
  const dragStartIndex = useRef(0);
  const isDragging = useRef(false);
  const containerWidthRef = useRef(0);
  const activeTabRef = useRef(activeTab);

  // New ref to track current pill offset during drag (for multi‑tab rounding)
  const currentPillOffset = useRef(0);

  useEffect(() => {
    containerWidthRef.current = containerWidth;
  }, [containerWidth]);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const animateToTab = (tabId: TabKey, duration = 200) => {
    if (containerWidth === 0) return;
    const tabWidth = containerWidth / TABS.length;
    const targetOffset = TABS.indexOf(tabId) * tabWidth;

    slideAnim.stopAnimation();

    Animated.timing(slideAnim, {
      toValue: targetOffset,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (containerWidth === 0 || isDragging.current) return;
    animateToTab(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, containerWidth]);

  useEffect(() => {
    if (isContentDragging.current) return;
    const idx = TABS.indexOf(activeTab);
    Animated.timing(contentDragX, {
      toValue: -idx * width,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // --- Tab bar swipe gesture (drag the pill itself) - multi‑tab skipping ---
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        return (
          Math.abs(gestureState.dx) > 6 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
        );
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
        dragStartIndex.current = TABS.indexOf(activeTabRef.current);
        slideAnim.stopAnimation((value: number) => {
          dragStartValue.current = value;
          currentPillOffset.current = value;
        });
      },
      onPanResponderMove: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const w = containerWidthRef.current;
        if (w === 0) return;
        const tabWidth = w / TABS.length;
        const maxOffset = tabWidth * (TABS.length - 1);
        const newOffset = Math.max(
          0,
          Math.min(maxOffset, dragStartValue.current + gestureState.dx)
        );
        slideAnim.setValue(newOffset);
        currentPillOffset.current = newOffset;
      },
      onPanResponderRelease: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const w = containerWidthRef.current;
        if (w === 0) {
          isDragging.current = false;
          return;
        }
        const tabWidth = w / TABS.length;

        // Round to nearest tab using final pill offset
        const finalOffset = currentPillOffset.current;
        let targetIndex = Math.round(finalOffset / tabWidth);
        targetIndex = Math.max(0, Math.min(TABS.length - 1, targetIndex));

        const newTab = TABS[targetIndex];
        isDragging.current = false;
        setActiveTab(newTab);
        animateToTab(newTab, 180);
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        animateToTab(activeTabRef.current, 200);
      },
    })
  ).current;

  // --- Content swipe gesture (swipe the page itself) - optimised ---
  const contentPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        return (
          Math.abs(gestureState.dx) > 10 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
        );
      },
      onPanResponderGrant: () => {
        isContentDragging.current = true;
        contentDragStartIndex.current = TABS.indexOf(activeTabRef.current);
        contentDragX.stopAnimation((value: number) => {
          contentDragStartValue.current = value;
        });
        slideAnim.stopAnimation((value: number) => {
          dragStartValue.current = value;
          currentPillOffset.current = value;
        });
      },
      onPanResponderMove: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const startIndex = contentDragStartIndex.current;
        let dx = gestureState.dx;

        // Apply resistance at edges
        if (startIndex === 0 && dx > 0) dx *= 0.35;
        if (startIndex === TABS.length - 1 && dx < 0) dx *= 0.35;

        contentDragX.setValue(contentDragStartValue.current + dx);

        const cw = containerWidthRef.current;
        if (cw > 0) {
          const tabWidth = cw / TABS.length;
          const totalWidth = width * TABS.length;
          const currentOffset = contentDragStartValue.current + dx;
          const progress = -currentOffset / totalWidth;
          const pillPosition = progress * (cw - tabWidth);
          const clampedPill = Math.max(0, Math.min(cw - tabWidth, pillPosition));

          slideAnim.setValue(clampedPill);
          currentPillOffset.current = clampedPill;
        }
      },
      onPanResponderRelease: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const startIndex = contentDragStartIndex.current;
        const dx = gestureState.dx;
        const vx = gestureState.vx;

        // Velocity-based projection for skipping multiple tabs
        const velocityFactor = 0.25;
        const projectedDx = dx + vx * velocityFactor;
        const currentTranslation = contentDragStartValue.current + projectedDx;
        let targetIndex = Math.round(-currentTranslation / width);
        targetIndex = Math.max(0, Math.min(TABS.length - 1, targetIndex));

        const targetPillOffset = targetIndex * (containerWidthRef.current / TABS.length);

        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: targetPillOffset,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(contentDragX, {
            toValue: -targetIndex * width,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(() => {
          isContentDragging.current = false;
          // Use InteractionManager to avoid blocking the animation thread
          InteractionManager.runAfterInteractions(() => {
            if (targetIndex !== startIndex) {
              setActiveTab(TABS[targetIndex]);
            }
          });
        });
      },
      onPanResponderTerminate: () => {
        const startIndex = contentDragStartIndex.current;
        isContentDragging.current = false;
        const startPillOffset = startIndex * (containerWidthRef.current / TABS.length);

        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: startPillOffset,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(contentDragX, {
            toValue: -startIndex * width,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      },
    })
  ).current;

  // --- Back navigation with exit animation (flash-free) ---
  // Strategy: intercept EVERY way this screen can be removed (button press,
  // hardware back, swipe-back gesture) via `beforeRemove`. We prevent the
  // default removal, run our own slide+fade animation to completion, and
  // only then dispatch the action that was originally requested. Because the
  // default transition is prevented up front, there's nothing left to snap
  // back to a visible state after our animation ends — which is what was
  // causing the flash.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (isNavigating.current) {
        // Animation already ran and we're the ones dispatching this action;
        // let it through.
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

  // --- Render functions (unchanged) ---
  const renderFacultyItem = useCallback(
    ({ item }: { item: FacultyMember }) => (
      <View style={styles.gridItem}>
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.lineColor }]}>
          <Image source={item.imageUrl ? { uri: item.imageUrl } : memberImg} style={styles.cardImage} />
        </View>
        <Text style={[styles.cardName, { color: theme.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.cardDesignation, { color: theme.textSecondary }]}>{item.designation}</Text>
      </View>
    ),
    [theme]
  );

  const renderMentorItem = useCallback(
    ({ item }: { item: MentorMember }) => (
      <View style={styles.gridItem}>
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.lineColor }]}>
          <Image source={item.imageUrl ? { uri: item.imageUrl } : memberImg} style={styles.cardImage} />
        </View>
        <Text style={[styles.cardName, { color: theme.textPrimary }]}>{item.name}</Text>
      </View>
    ),
    [theme]
  );

  const renderBranchItem = useCallback(
    ({ item, index }: { item: BranchMember; index: number }) => {
      const isLeft = index % 2 === 0;
      return (
        <View style={[styles.alternatingRow, { flexDirection: isLeft ? 'row' : 'row-reverse' }]}>
          <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.lineColor }]}>
            <Image source={item.imageUrl ? { uri: item.imageUrl } : memberImg} style={styles.cardImage} />
          </View>
          <View style={[styles.textContainer, { alignItems: isLeft ? 'flex-start' : 'flex-end' }]}>
            <Text style={[styles.rowName, { color: theme.textPrimary, textAlign: isLeft ? 'left' : 'right' }]}>
              {item.name}
            </Text>
            <Text
              style={[styles.rowDesignation, { color: theme.textSecondary, textAlign: isLeft ? 'left' : 'right' }]}
            >
              {item.branch}
            </Text>
          </View>
        </View>
      );
    },
    [theme]
  );

  const renderLoadingOrEmpty = (message: string) => (
    <View style={styles.centerFill}>
      {teamLoading ? (
        <ActivityIndicator size="large" color={theme.accent} />
      ) : (
        <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{teamError || message}</Text>
      )}
    </View>
  );

  const renderContentForTab = (tabId: TabKey) => {
    switch (tabId) {
      case 'faculty':
        return teamData.faculty.length === 0 ? (
          renderLoadingOrEmpty('No faculty members added yet.')
        ) : (
          <FlatList
            key="faculty-cols-2"
            data={teamData.faculty}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.listContainer}
            renderItem={renderFacultyItem}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={7}
            removeClippedSubviews
          />
        );
      case 'osc':
        return teamData.osc.length === 0 ? (
          renderLoadingOrEmpty('No OSC members added yet.')
        ) : (
          <FlatList
            key="osc-cols-1"
            data={teamData.osc}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            renderItem={renderBranchItem}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={7}
            removeClippedSubviews
          />
        );
      case 'core':
        return teamData.core.length === 0 ? (
          renderLoadingOrEmpty('No core members added yet.')
        ) : (
          <FlatList
            key="core-cols-1"
            data={teamData.core}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            renderItem={renderBranchItem}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={7}
            removeClippedSubviews
          />
        );
      case 'mentor':
        return teamData.mentor.length === 0 ? (
          renderLoadingOrEmpty('No mentors added yet.')
        ) : (
          <FlatList
            key="mentor-cols-2"
            data={teamData.mentor}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.listContainer}
            renderItem={renderMentorItem}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={9}
            removeClippedSubviews
          />
        );
      default:
        return null;
    }
  };

  const tabPanes = useMemo(
    () =>
      TABS.map((tabId) => (
        <View key={tabId} style={{ width }}>
          {renderContentForTab(tabId)}
        </View>
      )),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, teamData, teamLoading, teamError]
  );

  // --- Render ---
  return (
    <View style={{ flex: 1, backgroundColor: theme.bgGradient[0] }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: theme.bgGradient[0],
            opacity: opacityAnim,
            transform: [{ translateY: slideY }],
          },
        ]}
      >
        <LinearGradient colors={theme.bgGradient} style={styles.container}>
          <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                  <Icon name="arrow-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.textPrimary }]}>OUR TEAM</Text>
                <View style={{ width: 40 }} />
              </View>

              <BlurView
                intensity={80}
                tint={isDarkMode ? 'dark' : 'light'}
                blurMethod="dimezisBlurView"
                blurTarget={blurTargetRef}
                style={[
                  styles.glassCard,
                  {
                    backgroundColor: theme.glassBg,
                    borderColor: theme.glassBorder,
                    shadowColor: theme.shadowColor,
                  },
                ]}
              >
                <LinearGradient
                  colors={theme.glassSheen}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.glassSheen}
                  pointerEvents="none"
                />
                <View
                  style={styles.tabsContainer}
                  {...panResponder.panHandlers}
                  onLayout={(e: LayoutChangeEvent) => {
                    const { width: w } = e.nativeEvent.layout;
                    setContainerWidth(w);
                    if (w > 0) {
                      const initialOffset = TABS.indexOf(activeTab) * (w / TABS.length);
                      slideAnim.setValue(initialOffset);
                      currentPillOffset.current = initialOffset;
                    }
                  }}
                >
                  {containerWidth > 0 && (
                    <Animated.View
                      style={[
                        styles.slider,
                        {
                          width: containerWidth / TABS.length,
                          transform: [{ translateX: slideAnim }],
                          backgroundColor: theme.accent,
                        },
                      ]}
                    />
                  )}

                  {TABS.map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                      <TouchableOpacity key={tab} style={styles.tab} onPress={() => setActiveTab(tab)}>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.tabText,
                            {
                              color: isActive ? theme.tabActiveText : theme.textSecondary,
                              fontWeight: isActive ? '700' : '500',
                            },
                          ]}
                        >
                          {tab.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </BlurView>

              <View style={{ flex: 1, overflow: 'hidden' }} {...contentPanResponder.panHandlers}>
                <Animated.View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    width: width * TABS.length,
                    transform: [{ translateX: contentDragX }],
                  }}
                >
                  {tabPanes}
                </Animated.View>
              </View>
            </SafeAreaView>
          </BlurTargetView>
        </LinearGradient>
      </Animated.View>
    </View>
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
    letterSpacing: 1,
  },
  glassCard: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 24,
    height: 52,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  glassSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'relative',
  },
  tab: {
    flex: 1,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
  slider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 20,
  },
  listContainer: {
    paddingHorizontal: H_PADDING,
    paddingBottom: 30,
  },
  centerFill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  card: {
    marginTop: 10,
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridItem: {
    width: CARD_SIZE,
    marginBottom: 10,
    alignItems: 'center',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
  },
  cardDesignation: {
    fontSize: 14,
    marginTop: 2,
  },
  alternatingRow: {
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: H_PADDING,
  },
  textContainer: {
    flex: 1,
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  rowName: {
    fontSize: 26,
    fontWeight: '800',
  },
  rowDesignation: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
});