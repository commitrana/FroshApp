import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBatchTimetableImage, getMyBatch, getMyTimetable, MyTimetableResponse } from '../../services/batches';
import { getActiveSessionForStudent, ActiveSessionInfo } from '../../services/attendance';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useHomeTheme } from '../../constants/homeThemes';
import { useAppTheme } from '../../context/ThemeContext';

const BootcampScreen = () => {
  const navigation = useNavigation<any>();
  const { isDarkMode } = useAppTheme();
  const theme = useHomeTheme();

  const [batch, setBatch] = useState<string | null>(null);
  const [timetableImage, setTimetableImage] = useState<string | null>(null);
  const [classSchedule, setClassSchedule] = useState<MyTimetableResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeSession, setActiveSession] = useState<ActiveSessionInfo>(null);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [cardType, setCardType] = useState<'attendance' | 'feedback'>('attendance');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const studentData = await AsyncStorage.getItem('studentData');
      if (!studentData) {
        setLoading(false);
        return;
      }

      const student = JSON.parse(studentData);

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

  if (loading) {
    return (
      <LinearGradient colors={theme.bgGradient as [string, string, ...string[]]} style={styles.container}>
        <SafeAreaView style={styles.container}>
          <ActivityIndicator color={theme.accent} size="large" style={styles.loader} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

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
          <Text style={[styles.heading, { color: theme.textPrimary }]}>My Timetable</Text>

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
                  { 
                    backgroundColor: theme.liveCard?.backgroundColor || theme.cardBg, 
                    shadowColor: theme.liveCard?.shadowColor || theme.shadowColor || theme.accent, // ← Added fallback
                  },
                ]}
              >
                <LinearGradient colors={['#4DA2FF', '#2D7EFF']} style={styles.liveIcon}>
                  <MaterialCommunityIcons
                    name={cardType === 'feedback' ? 'clipboard-text-outline' : 'broadcast'}
                    size={30}
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
                    <Text style={[styles.liveMeta, { color: theme.textSecondary }]}>
                      📍 {activeSession.venue}
                    </Text>
                  ) : null}
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

          <View style={styles.timeTableHeader}>
            <MaterialCommunityIcons name="calendar-month-outline" size={26} color={theme.accent} />
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
                  { 
                    backgroundColor: theme.topCard?.backgroundColor || theme.cardBg, 
                    shadowColor: theme.topCard?.shadowColor || theme.shadowColor || theme.accent,
                  },
                ]}
              >
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
                    { 
                      backgroundColor: theme.topCard?.backgroundColor || theme.cardBg, 
                      shadowColor: theme.topCard?.shadowColor || theme.shadowColor || theme.accent,
                    },
                  ]}
                >
                  {classSchedule.days.map((day) => {
                    const dayClasses = classSchedule.timeSlots
                      .map((slot) => classSchedule.classes.find((c) => c.day === day && c.slot === slot))
                      .filter((c): c is NonNullable<typeof c> => !!c);

                    if (dayClasses.length === 0) return null;

                    return (
                      <View key={day} style={styles.scheduleDayBlock}>
                        <Text style={[styles.scheduleDayLabel, { color: theme.accent }]}>{day}</Text>
                        {dayClasses.map((cls) => (
                          <View key={`${cls.day}-${cls.slot}`} style={styles.scheduleRow}>
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
                  { 
                    backgroundColor: theme.topCard?.backgroundColor || theme.cardBg, 
                    shadowColor: theme.topCard?.shadowColor || theme.shadowColor || theme.accent,
                  },
                ]}
              >
                <Text style={[styles.timetableLabel, { color: theme.textSecondary }]}>Timetable</Text>
                {timetableImage ? (
                  <Image
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

  liveSection: { marginBottom: 24 },
  liveHeadingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  headingLine: { flex: 1, height: 2 },
  liveHeading: { marginHorizontal: 10, fontWeight: '700', fontSize: 15, letterSpacing: 2 },

  liveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 16,
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    marginBottom: 14,
  },
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
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  batchLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  batchName: { fontSize: 32, fontWeight: '800', marginTop: 6 },

  scheduleCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
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
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
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