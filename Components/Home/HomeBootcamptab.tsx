import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import {
  getBatchTimetableImage,
  getMyBatch,
  getMyTimetable,
  MyTimetableResponse,
} from '../../services/batches';
import { getActiveSessionForStudent, ActiveSessionInfo } from '../../services/attendance';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useAppTheme } from '../../context/ThemeContext';
import ImageWithLoader from '../ImageWithLoader';

// Converts a "#RRGGBB" hex color + 0-1 alpha into an "rgba(...)" string,
// for use inside a CSS boxShadow value.
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// This is the student "Bootcamp" tab content — batch, weekly class
// schedule (grid), live-class/attendance card and timetable image.
export default function HomeBootcampTab({ theme }: { theme: any }) {
  const navigation = useNavigation<any>();
  const { isDarkMode } = useAppTheme();

  const glassBg = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.35)';
  const glassBorder = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.7)';
  const glassSheen: [string, string] = isDarkMode
    ? ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']
    : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)'];

  const cardShadow = (shadowColor: string, shadowOpacity: number, shadowRadius: number, offsetY: number) =>
    ({ boxShadow: `0px ${offsetY}px ${shadowRadius}px 0px ${hexToRgba(shadowColor, shadowOpacity)}` } as any);

  const [batch, setBatch] = useState<string | null>(null);
  
  const [classSchedule, setClassSchedule] = useState<MyTimetableResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const [activeSession, setActiveSession] = useState<ActiveSessionInfo>(null);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [cardType, setCardType] = useState<'attendance' | 'feedback'>('attendance');

  const fetchData = useCallback(async (isInitial: boolean) => {
    try {
      if (isInitial) setLoading(true);

      const [studentDataRaw, freshBatch, schedule] = await Promise.all([
        AsyncStorage.getItem('studentData'),
        getMyBatch(),
        getMyTimetable(),
      ]);

      setClassSchedule(schedule);

      if (!studentDataRaw) {
        return;
      }

      const student = JSON.parse(studentDataRaw);
      const batchCode = freshBatch ?? student.batch;
      setBatch(batchCode);

      if (freshBatch && freshBatch !== student.batch) {
        student.batch = freshBatch;
        await AsyncStorage.setItem('studentData', JSON.stringify(student));
      }

     
    } catch (error) {
      console.error('Error fetching batch data:', error);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const isInitial = !hasLoadedOnce.current;
      hasLoadedOnce.current = true;
      fetchData(isInitial);
    }, [fetchData])
  );

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

  // Pop-in animation
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(contentScale, {
          toValue: 1,
          friction: 7,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  if (loading) {
    return <ActivityIndicator color={theme.accent} size="large" style={{ marginTop: 60 }} />;
  }

  // Prepare grid data
  const timeSlots = classSchedule?.timeSlots ?? [];
  const days = classSchedule?.days ?? [];
  // Build a map: day -> slot -> class
  const scheduleMap: { [day: string]: { [slot: string]: any } } = {};
  if (classSchedule) {
    classSchedule.classes.forEach((cls) => {
      if (!scheduleMap[cls.day]) scheduleMap[cls.day] = {};
      scheduleMap[cls.day][cls.slot] = cls;
    });
  }

  return (
    <Animated.View
      style={{
        opacity: contentOpacity,
        transform: [{ scale: contentScale }],
      }}
    >
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
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.markAttendanceBtn, { backgroundColor: theme.accent, flex: 1 }]}
                onPress={() => navigation.navigate('ScanAttendance')}
              >
                <Text style={styles.markAttendanceBtnText}>📷 Scan QR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.markAttendanceBtn, { backgroundColor: theme.accent, flex: 1 }]}
                onPress={() => navigation.navigate('EnterAttendanceCode')}
              >
                <Text style={styles.markAttendanceBtnText}>⌨️ Enter Code</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <View style={styles.timeTableHeader}>
        <MaterialCommunityIcons name="calendar-month-outline" size={28} color={theme.accent} />
        <Text style={[styles.timeTableTitle, { color: theme.textPrimary }]}>Your Batch</Text>
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

          <TouchableOpacity
            style={[styles.historyBtn, { backgroundColor: theme.accent }]}
            onPress={() => navigation.navigate('StudentClassHistory')}
          >
            <MaterialCommunityIcons name="history" size={18} color="#fff" />
            <Text style={styles.historyBtnText}>Attendance History</Text>
          </TouchableOpacity>

          {/* Weekly Schedule Grid - exactly like faculty */}
          <View style={styles.timeTableHeader}>
            <MaterialCommunityIcons name="calendar-month-outline" size={22} color={theme.accent} />
            <Text style={[styles.timeTableTitle, { color: theme.textPrimary }]}>Weekly Schedule</Text>
          </View>

          {timeSlots.length === 0 || days.length === 0 ? (
            <View
              style={[
                styles.emptyBox,
                { backgroundColor: theme.topCard?.backgroundColor || theme.cardBg, marginBottom: 18 },
              ]}
            >
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No schedule assigned yet
              </Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary, marginTop: 4 }]}>
                Please contact admin
              </Text>
            </View>
          ) : (
            <View style={styles.gridWrapper}>
              <View style={styles.dayColumn}>
                <View style={styles.cornerSpacer} />
                {days.map((day) => (
                  <View key={day} style={[styles.dayLabelCell, { borderBottomColor: theme.lineColor }]}>
                    <Text style={[styles.dayLabelText, { color: theme.textSecondary }]}>
                      {day.slice(0, 3)}
                    </Text>
                  </View>
                ))}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  <View style={styles.gridHeaderRow}>
                    {timeSlots.map((slot) => (
                      <View key={slot} style={[styles.slotHeaderCell, { backgroundColor: theme.cardBg }]}>
                        <Text style={[styles.slotHeaderText, { color: theme.accent }]}>{slot}</Text>
                      </View>
                    ))}
                  </View>

                  {days.map((day) => (
                    <View key={day} style={[styles.gridRow, { borderBottomColor: theme.lineColor }]}>
                      {timeSlots.map((slot) => {
                        const cls = scheduleMap[day]?.[slot];
                        return (
                          <View
                            key={slot}
                            style={[
                              styles.gridCell,
                              cls && { backgroundColor: theme.cardBg, shadowColor: theme.shadowColor },
                            ]}
                          >
                            {cls ? (
                              <>
                                <Text style={[styles.cellSubject, { color: theme.textPrimary }]} numberOfLines={2}>
                                  {cls.subject}
                                </Text>
                                {cls.venue ? (
                                  <Text style={[styles.cellVenue, { color: theme.textSecondary }]} numberOfLines={1}>
                                    {cls.venue}
                                  </Text>
                                ) : null}
                                {cls.faculty ? (
                                  <Text style={[styles.cellFaculty, { color: theme.accent }]} numberOfLines={1}>
                                    {cls.faculty}
                                  </Text>
                                ) : null}
                              </>
                            ) : (
                              <Text style={[styles.cellEmptyDash, { color: theme.lineColor }]}>—</Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          <Text style={[styles.note, { color: theme.textSecondary }]}>
            Tap a class to view details.
          </Text>

          <View
            style={[
              
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
            
          </View>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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

  batchCard: {
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 18,
  },
  batchLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  batchName: { fontSize: 32, fontWeight: '800', marginTop: 6 },

  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 18,
  },
  historyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Grid styles (identical to faculty)
  gridWrapper: { flexDirection: 'row' },
  dayColumn: { width: 52 },
  cornerSpacer: { height: 40 },
  dayLabelCell: { height: 64, justifyContent: 'center', alignItems: 'flex-start', borderBottomWidth: 1 },
  dayLabelText: { fontSize: 12, fontWeight: '700' },
  gridHeaderRow: { flexDirection: 'row', height: 40 },
  slotHeaderCell: { width: 110, justifyContent: 'center', alignItems: 'center', marginLeft: 4, borderRadius: 6 },
  slotHeaderText: { fontSize: 11, fontWeight: '700' },
  gridRow: { flexDirection: 'row', height: 64, borderBottomWidth: 1 },
  gridCell: { width: 110, marginLeft: 4, marginVertical: 4, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  cellSubject: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  cellVenue: { fontSize: 10, marginTop: 2, textAlign: 'center' },
  cellFaculty: { fontSize: 9, marginTop: 2, textAlign: 'center', fontWeight: '700' },
  cellEmptyDash: { fontSize: 14 },
  note: { fontSize: 12, marginTop: 10, textAlign: 'center' },

  
  timetableLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, alignSelf: 'flex-start' },
  timetableImage: { width: '100%', height: 300, borderRadius: 14 },
  noImageBox: { width: '100%', height: 180, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  noImageText: { fontSize: 16, fontWeight: '600' },
  noImageSubText: { fontSize: 13, marginTop: 4 },

  emptyBox: { borderRadius: 24, padding: 24 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});