import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { getBatchTimetableImage, getMyBatch, getMyTimetable, MyTimetableResponse } from '../../services/batches';
import { getActiveSessionForStudent, ActiveSessionInfo } from '../../services/attendance';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useHomeTheme } from '../../constants/homeThemes';
import { useAppTheme } from '../../context/ThemeContext';
import ImageWithLoader from "../../Components/ImageWithLoader";

// Converts a "#RRGGBB" hex color + 0-1 alpha into an "rgba(...)" string,
// for use inside a CSS boxShadow value. Plain shadowColor+elevation can't
// render a colored shadow on Android, so every glow on this screen goes
// through this instead.
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const BootcampScreen = () => {
  const navigation = useNavigation<any>();
  const { isDarkMode } = useAppTheme();
  const theme = useHomeTheme();

  // Glass panel colors - matched to teammate's UI (same values used on HomeScreen)
  const glassBg = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.35)';
  const glassBorder = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.7)';
  const glassSheen: [string, string] = isDarkMode
    ? ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']
    : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)'];

  const cardShadow = (shadowColor: string, shadowOpacity: number, shadowRadius: number, offsetY: number) =>
    ({ boxShadow: `0px ${offsetY}px ${shadowRadius}px 0px ${hexToRgba(shadowColor, shadowOpacity)}` } as any);


  const [batch, setBatch] = useState<string | null>(null);
  const [timetableImage, setTimetableImage] = useState<string | null>(null);
  const [classSchedule, setClassSchedule] = useState<MyTimetableResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  const [activeSession, setActiveSession] = useState<ActiveSessionInfo>(null);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [cardType, setCardType] = useState<'attendance' | 'feedback'>('attendance');

  // Sliding tab indicator — same animation as Home's tab bar (Animated.timing +
  // Easing.inOut), but here it just slides in to the "Bootcamp" position on
  // mount, since this screen only ever shows Bootcamp as active (the other
  // two tabs navigate away instead of switching state locally).
  const [containerWidth, setContainerWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (containerWidth === 0) return;
    const tabWidth = containerWidth / 3;
    slideAnim.setValue(-tabWidth);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [containerWidth]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const studentData = await AsyncStorage.getItem('studentData');
      if (!studentData) {
        setLoading(false);
        return;
      }

      const student = JSON.parse(studentData);
      setUserName(student.name ?? null);


      const freshBatch = await getMyBatch();
      const batchCode = freshBatch ?? student.batch;
      setBatch(batchCode);

      if (freshBatch && freshBatch !== student.batch) {
        student.batch = freshBatch;
        await AsyncStorage.setItem('studentData', JSON.stringify(student));
      }

      if (batchCode) {
        const imageUrl = await getBatchTimetableImage(batchCode);
        setTimetableImage(imageUrl);
      }

      const schedule = await getMyTimetable();
      setClassSchedule(schedule);
    } catch (error) {
      console.error('Error fetching batch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const fetchActiveSession = useCallback(async () => {
    try {
      const data = await getActiveSessionForStudent();
      setActiveSession(data.session);
      setAlreadyMarked(data.alreadyMarked);
      setMyStatus(data.myStatus);
      setCardType(data.type);
    } catch (error) {
      console.log('Error fetching active session:', error);
    }
  }, []);

  useAutoRefresh(fetchActiveSession, 8000);


  return (
    <LinearGradient colors={theme.bgGradient as [string, string, ...string[]]} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
          }
        >
          {/* HEADER - kept visible here too, matching teammate's design where
              Bootcamp is just an internal tab switch, not a separate screen */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.hello, { color: theme.textPrimary }]}>
                Hi, {userName || 'Guest'}
              </Text>
              <Text style={[styles.welcome, { color: theme.textSecondary }]}>Welcome back!</Text>
            </View>
            <TouchableOpacity
              style={[styles.profileCircle, { backgroundColor: theme.cardBg }]}
              onPress={() => navigation.navigate('Account')}
            >
              <Ionicons name="person-outline" size={24} color={theme.iconColor ?? theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.topCard,
              {
                backgroundColor: theme.topCard?.backgroundColor ?? glassBg,
                borderColor: glassBorder,
                overflow: 'hidden',
              },
            ]}
          >
            <LinearGradient
              colors={glassSheen}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.glassSheen}
              pointerEvents="none"
            />
            <View
              style={styles.tabsContainer}
              onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
            >
              {containerWidth > 0 && (
                <Animated.View
                  style={[
                    styles.slider,
                    {
                      width: containerWidth / 3,
                      transform: [{ translateX: slideAnim }],
                      backgroundColor: theme.tabActiveBg,
                    },
                  ]}
                />
              )}

              <View style={styles.tab}>
                <View style={styles.tabContent}>
                  <Ionicons name="calendar-outline" size={24} color={theme.tabActiveText} />
                  <Text style={[styles.tabActive, { color: theme.tabActiveText }]}>Bootcamp</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Main')}>
                <View style={styles.tabContent}>
                  <Image
                    source={require('../../assets/uiux/star.png')}
                    resizeMode="contain"
                    style={styles.tabLogoLarge}
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Main', { initialTab: 'about' })}>
                <View style={styles.tabContent}>
                  <Ionicons name="document-text-outline" size={28} color={theme.tabInactiveText} />
                  <Text style={[styles.tabInactive, { color: theme.tabInactiveText }]}>About</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
              {loading ? (
            <ActivityIndicator color={theme.accent} size="large" style={{ marginTop: 60 }} />
          ) : (
            <>
          {activeSession && (
            <View style={styles.liveSection}>
              <View style={styles.liveHeadingRow}>
                <View style={[styles.headingLine, { backgroundColor: theme.lineColor }]} />
                <Text style={[styles.liveHeading, { color: theme.accent }]}>
                  • {cardType === 'feedback' ? 'FEEDBACK OPEN' : 'LIVE CLASS'} •
                </Text>
                <View style={[styles.headingLine, { backgroundColor: theme.lineColor }]} />
              </View>

              <View
                style={[
                  styles.liveCard,
                  cardShadow(
                    theme.liveCard?.shadowColor ?? theme.shadowColor,
                    theme.liveCard?.shadowOpacity ?? 0.3,
                    theme.liveCard?.shadowRadius ?? 24,
                    theme.liveCard?.shadowOffset?.height ?? 10
                  ),
                  {
                    backgroundColor: theme.liveCard?.backgroundColor ?? glassBg,
                    borderColor: glassBorder,
                    borderWidth: 1,
                    overflow: 'hidden',
                  },
                ]}
              >
                <LinearGradient
                  colors={glassSheen}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.glassSheen}
                  pointerEvents="none"
                />
                <LinearGradient colors={['#4DA2FF', '#2D7EFF']} style={styles.liveIcon}>
                  <MaterialCommunityIcons
                    name={cardType === 'feedback' ? 'clipboard-text-outline' : 'broadcast'}
                    size={34}
                    color="#fff"
                  />
                </LinearGradient>

                <View style={styles.classInfo}>
                  <Text style={[styles.classTitle, { color: theme.textPrimary }]}>
                    {activeSession.subject}
                  </Text>
                  {activeSession.faculty ? (
                    <Text style={[styles.liveMeta, { color: theme.textSecondary }]}>
                      {activeSession.faculty.name} · {activeSession.faculty.department}
                    </Text>
                  ) : null}
                  {activeSession.venue ? (
                    <View style={styles.locationRow}>
                      <Ionicons name="location-sharp" size={16} color={theme.textSecondary} />
                      <Text style={[styles.location, { color: theme.textSecondary }]}>
                        {activeSession.venue}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveBadgeText}>
                    {cardType === 'feedback' ? 'OPEN' : 'LIVE'}
                  </Text>
                </View>
              </View>

              {cardType === 'feedback' ? (
                <TouchableOpacity
                  style={[styles.markAttendanceBtn, { backgroundColor: theme.accent }]}
                  onPress={() => navigation.navigate('GiveFeedback', { sessionId: activeSession._id })}
                >
                  <Text style={styles.markAttendanceBtnText}>📝 Give Feedback</Text>
                </TouchableOpacity>
              ) : alreadyMarked ? (
                <View style={styles.markedBox}>
                  <Text style={[styles.markedText, { color: theme.textSecondary }]}>
                    {myStatus === 'present' && '✅ Attendance marked'}
                    {myStatus === 'flagged' && '⚠️ Marked — pending review'}
                    {myStatus === 'rejected' && '❌ Not verified — ask your professor to mark you manually'}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.markAttendanceBtn, { backgroundColor: theme.accent }]}
                  onPress={() => navigation.navigate('ScanAttendance')}
                >
                  <Text style={styles.markAttendanceBtnText}>📷 Mark Attendance</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.batchHeaderRow}>
            <View style={styles.timeTableHeader}>
              <MaterialCommunityIcons name="calendar-month-outline" size={28} color={theme.accent} />
              <Text style={[styles.timeTableTitle, { color: theme.textPrimary }]}>Your Batch</Text>
            </View>
            <TouchableOpacity
              style={[styles.historyBtn, { backgroundColor: theme.cardBg }]}
              onPress={() => navigation.navigate('StudentClassHistory')}
            >
              <MaterialCommunityIcons name="history" size={16} color={theme.accent} />
              <Text style={[styles.historyBtnText, { color: theme.accent }]}>Class History</Text>
            </TouchableOpacity>
          </View>

          {!batch ? (
            <View style={[styles.emptyBox, { backgroundColor: theme.topCard?.backgroundColor || theme.cardBg }]}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                You haven't been assigned to a batch yet. Check back soon!
              </Text>
            </View>
          ) : (
            <>
              <View
                style={[
                  styles.batchCard,
                  cardShadow(
                    theme.topCard?.shadowColor ?? theme.shadowColor,
                    theme.topCard?.shadowOpacity ?? 0.2,
                    theme.topCard?.shadowRadius ?? 22,
                    theme.topCard?.shadowOffset?.height ?? 10
                  ),
                  {
                    backgroundColor: theme.topCard?.backgroundColor ?? glassBg,
                    borderColor: glassBorder,
                    borderWidth: 1,
                    overflow: 'hidden',
                  },
                ]}
              >
                <LinearGradient
                  colors={glassSheen}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.glassSheen}
                  pointerEvents="none"
                />
                <Text style={[styles.batchLabel, { color: theme.textSecondary }]}>Your Batch</Text>
                <Text style={[styles.batchName, { color: theme.accent }]}>{batch}</Text>
              </View>

              <View style={styles.timeTableHeader}>
                <MaterialCommunityIcons name="table-large" size={22} color={theme.accent} />
                <Text style={[styles.timeTableTitle, { color: theme.textPrimary }]}>Class Schedule</Text>
              </View>

              {!classSchedule || classSchedule.classes.length === 0 ? (
                <View
                  style={[
                    styles.emptyBox,
                    { backgroundColor: theme.topCard?.backgroundColor || theme.cardBg, marginBottom: 18 },
                  ]}
                >
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    No classes have been assigned to your batch yet.
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.scheduleCard,
                    cardShadow(
                      theme.topCard?.shadowColor ?? theme.shadowColor,
                      theme.topCard?.shadowOpacity ?? 0.2,
                      theme.topCard?.shadowRadius ?? 22,
                      theme.topCard?.shadowOffset?.height ?? 10
                    ),
                    {
                      backgroundColor: theme.topCard?.backgroundColor ?? glassBg,
                      borderColor: glassBorder,
                      borderWidth: 1,
                      overflow: 'hidden',
                    },
                  ]}
                >
                  <LinearGradient
                    colors={glassSheen}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.glassSheen}
                    pointerEvents="none"
                  />
                  {classSchedule.days.map((day) => {
                    // More than one faculty can teach this batch in the same
                    // time slot. The old `.find()` kept only the first one
                    // (for example, Rana Sir) and hid every other class.
                    const dayClasses = classSchedule.classes
                      .filter((c) => c.day === day)
                      .sort(
                        (a, b) =>
                          classSchedule.timeSlots.indexOf(a.slot) -
                          classSchedule.timeSlots.indexOf(b.slot)
                      );

                    if (dayClasses.length === 0) return null;

                    return (
                      <View key={day} style={styles.scheduleDayBlock}>
                        <Text style={[styles.scheduleDayLabel, { color: theme.accent }]}>{day}</Text>
                        {dayClasses.map((cls) => (
                          <View
                            key={`${cls.day}-${cls.slot}-${cls.faculty}-${cls.subject}`}
                            style={styles.scheduleRow}
                          >
                            <View style={styles.scheduleTimeCol}>
                              <Text style={[styles.scheduleTime, { color: theme.textSecondary }]}>
                                {cls.slot}
                              </Text>
                            </View>
                            <View style={styles.scheduleDetailsCol}>
                              <Text style={[styles.scheduleSubject, { color: theme.textPrimary }]}>
                                {cls.subject}
                              </Text>
                              <Text style={[styles.scheduleMeta, { color: theme.textSecondary }]}>
                                {cls.faculty}
                                {cls.venue ? ` · 📍 ${cls.venue}` : ''}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    );
                  })}
                </View>
              )}

              <View
                style={[
                  styles.timetableCard,
                  cardShadow(
                    theme.topCard?.shadowColor ?? theme.shadowColor,
                    theme.topCard?.shadowOpacity ?? 0.2,
                    theme.topCard?.shadowRadius ?? 22,
                    theme.topCard?.shadowOffset?.height ?? 10
                  ),
                  {
                    backgroundColor: theme.topCard?.backgroundColor ?? glassBg,
                    borderColor: glassBorder,
                    borderWidth: 1,
                    overflow: 'hidden',
                  },
                ]}
              >
                <LinearGradient
                  colors={glassSheen}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.glassSheen}
                  pointerEvents="none"
                />
                <Text style={[styles.timetableLabel, { color: theme.textSecondary }]}>Timetable</Text>
                {timetableImage ? (
                  <ImageWithLoader 
                    source={{ uri: timetableImage }}
                    style={styles.timetableImage}
                    resizeMode="contain"
                    onError={() => setTimetableImage(null)}
                  />
                ) : (
                  <View style={[styles.noImageBox, { backgroundColor: 'rgba(255,255,255,0.04)' }]}>
                    <Text style={[styles.noImageText, { color: theme.textSecondary }]}>
                      No timetable uploaded yet
                    </Text>
                    <Text style={[styles.noImageSubText, { color: theme.textSecondary }]}>
                      Check back later!
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
          </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 110 },
  heading: { fontSize: 28, fontWeight: '800', marginBottom: 20 },

  // HEADER + TAB BAR (kept persistent here to match teammate's design)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  hello: { fontSize: 28, fontWeight: '800' },
  welcome: { marginTop: 2, fontSize: 16, fontWeight: '500' },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topCard: {
    borderRadius: 28,
    height: 80,
    borderWidth: 1,
    marginBottom: 24,
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
  slider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 20,
  },
  tabContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  tabLogoLarge: { width: 120, height: 120 },
  tabActive: { fontSize: 12, fontWeight: '700' },
  tabInactive: { fontSize: 12, fontWeight: '500' },

  liveSection: { marginBottom: 24 },
  liveHeadingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  headingLine: { flex: 1, height: 2 },
  liveHeading: { marginHorizontal: 10, fontWeight: '700', fontSize: 15, letterSpacing: 2 },

  liveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
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
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30', marginRight: 6 },
  liveBadgeText: { color: '#FF3B30', fontWeight: '700', fontSize: 13 },
  liveIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  classInfo: { flex: 1 },
  classTitle: { fontSize: 18, fontWeight: '700' },
  liveMeta: { fontSize: 13, marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  location: { fontSize: 14, marginLeft: 4 },

  markAttendanceBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  markAttendanceBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  markedBox: { paddingVertical: 10 },
  markedText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },

  timeTableHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  timeTableTitle: { fontSize: 20, fontWeight: '800' },
  batchHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  historyBtnText: { fontSize: 13, fontWeight: '700' },

  batchCard: {
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 18,
  },
  batchLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  batchName: { fontSize: 32, fontWeight: '800', marginTop: 6 },

  scheduleCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
  },
  scheduleDayBlock: { marginBottom: 16 },
  scheduleDayLabel: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  scheduleRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  scheduleTimeCol: { width: 92 },
  scheduleTime: { fontSize: 12, fontWeight: '600' },
  scheduleDetailsCol: { flex: 1 },
  scheduleSubject: { fontSize: 15, fontWeight: '700' },
  scheduleMeta: { fontSize: 12, marginTop: 2 },

  timetableCard: {
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
  },
  timetableLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, alignSelf: 'flex-start' },
  timetableImage: { width: '100%', height: 300, borderRadius: 14 },
  noImageBox: { width: '100%', height: 180, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  noImageText: { fontSize: 16, fontWeight: '600' },
  noImageSubText: { fontSize: 13, marginTop: 4 },

  emptyBox: { borderRadius: 24, padding: 24 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});

export default BootcampScreen;