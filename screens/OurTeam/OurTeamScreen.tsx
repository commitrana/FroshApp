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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView, BlurTargetView } from 'expo-blur';
import Icon from '@expo/vector-icons/Ionicons';
import { Platform } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useOurTeamTheme } from '../../constants/ourTeamThemes';
import MentorWall from '../../Components/OurTeam/MentorWall';

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

  // --- Team data fetch (unchanged) ---
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
    return () => { isMounted = false; };
  }, []);

  // --- Glass pill slider animation ---
  const [containerWidth, setContainerWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const blurTargetRef = useRef<View | null>(null);

  // --- Entry & Exit animations (unchanged) ---
  const slideY = useRef(new Animated.Value(screenHeight)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const isNavigating = useRef(false);

  useEffect(() => {
    navigation.setOptions({
      animation: 'none',
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

  // --- Pill drag (panResponder) – kept as is ---
  const dragStartValue = useRef(0);
  const isDragging = useRef(false);
  const containerWidthRef = useRef(0);
  const activeTabRef = useRef(activeTab);
  const currentPillOffset = useRef(0);

  useEffect(() => {
    containerWidthRef.current = containerWidth;
  }, [containerWidth]);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const animateToTab = (tabId: TabKey, duration = 300) => {
    if (containerWidthRef.current === 0) return;
    const tabWidth = containerWidthRef.current / TABS.length;
    const targetOffset = TABS.indexOf(tabId) * tabWidth;
    slideAnim.stopAnimation();
    Animated.timing(slideAnim, {
      toValue: targetOffset,
      duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  // Animate pill when activeTab changes (if not dragging)
  useEffect(() => {
    if (containerWidth === 0 || isDragging.current) return;
    animateToTab(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, containerWidth]);

  // Pill pan responder (dragging the pill itself)
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
        const newOffset = Math.max(0, Math.min(maxOffset, dragStartValue.current + gestureState.dx));
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

  // --- Back navigation with exit animation (unchanged) ---
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
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
        if (finished) navigation.dispatch(e.data.action);
      });
    });
    return unsubscribe;
  }, [navigation]);

  const handleBack = () => {
    if (isNavigating.current) return;
    navigation.goBack();
  };

  // --- Render functions (unchanged) ---
  const renderFacultyItem = useCallback(({ item }: { item: FacultyMember }) => (
    <View style={styles.gridItem}>
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.lineColor }]}>
        <Image source={item.imageUrl ? { uri: item.imageUrl } : memberImg} style={styles.cardImage} />
      </View>
      <Text style={[styles.cardName, { color: theme.textPrimary }]}>{item.name}</Text>
      <Text style={[styles.cardDesignation, { color: theme.textSecondary }]}>{item.designation}</Text>
    </View>
  ), [theme]);

  const renderBranchItem = useCallback(({ item, index }: { item: BranchMember; index: number }) => {
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
          <Text style={[styles.rowDesignation, { color: theme.textSecondary, textAlign: isLeft ? 'left' : 'right' }]}>
            {item.branch}
          </Text>
        </View>
      </View>
    );
  }, [theme]);

  const renderLoadingOrEmpty = (message: string) => (
    <View style={styles.centerFill}>
      {teamLoading ? (
        <ActivityIndicator size="large" color={theme.accent} />
      ) : (
        <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{teamError || message}</Text>
      )}
    </View>
  );

  // --- Render content for the active tab only ---
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
          <MentorWall mentors={teamData.mentor} theme={theme} />
        );
      default:
        return null;
    }
  };

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

              {/* Glass pill tab bar – still draggable */}
              <BlurView
                intensity={300}
                tint={isDarkMode ? 'dark' : 'light'}
                blurMethod="dimezisBlurView"
                blurTarget={blurTargetRef}
                style={[
                  styles.glassCard,
                  {
                    backgroundColor: theme.glassBg,
                    borderColor: theme.glassBorder,
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
                          backgroundColor: theme.tabActiveBg,
                        },
                      ]}
                    />
                  )}
                  {TABS.map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                      <TouchableOpacity
                        key={tab}
                        style={styles.tab}
                        onPress={() => {
                          setActiveTab(tab);
                        }}
                      >
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

              {/* Content area – only active tab, no swipe gesture */}
              <View style={{ flex: 1 }}>
                {renderContentForTab(activeTab)}
              </View>
            </SafeAreaView>
          </BlurTargetView>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

// Styles remain exactly the same as the original
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 60 : 50,
    paddingVertical: 8,
  },
  backBtn: { padding: 4 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
  glassCard: {
    marginHorizontal: 15,
    marginTop: 18,
    borderRadius: 28,
    height: 55,
    overflow: 'hidden',
    borderWidth: 1,
  },
  glassSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
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
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  tabText: {
    fontSize: 12,
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