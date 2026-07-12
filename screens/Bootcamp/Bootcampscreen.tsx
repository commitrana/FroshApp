import React, { useState, useEffect, useCallback } from 'react';
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
import Theme from '../../theme/theme';
import { getBatchTimetableImage } from '../../services/batches';
import { getActiveSessionForStudent, ActiveSessionInfo } from '../../services/attendance';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

// ✅ Default image if no timetable image found
const DEFAULT_TIMETABLE_IMAGE = 'https://via.placeholder.com/400x300/1F2937/FFFFFF?text=No+Timetable';

const BootcampScreen = () => {
  const navigation = useNavigation<any>();
  const [batch, setBatch] = useState<string | null>(null);
  const [timetableImage, setTimetableImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeSession, setActiveSession] = useState<ActiveSessionInfo>(null);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [myStatus, setMyStatus] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // ✅ Get student's batch from storage
      const studentData = await AsyncStorage.getItem('studentData');
      if (!studentData) {
        setLoading(false);
        return;
      }
      
      const student = JSON.parse(studentData);
      const batchCode = student.batch; // e.g., "BlueA"
      setBatch(batchCode);
      
      // ✅ Fetch timetable image for this batch
      if (batchCode) {
        const imageUrl = await getBatchTimetableImage(batchCode);
        setTimetableImage(imageUrl);
      }
      
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
    } catch (error) {
      console.log('Error fetching active session:', error);
    }
  }, []);

  // Poll every 8s while this screen is focused, so the Live Class card
  // appears/disappears automatically as a faculty starts/ends attendance.
  useAutoRefresh(fetchActiveSession, 8000);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Theme.colors.primary} size="large" style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9CA3AF" />
        }
      >
        {activeSession && (
          <View style={styles.liveCard}>
            <View style={styles.liveBadgeRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE CLASS</Text>
            </View>
            <Text style={styles.liveSubject}>{activeSession.subject}</Text>
            {activeSession.faculty ? (
              <Text style={styles.liveMeta}>
                👨‍🏫 {activeSession.faculty.name} · {activeSession.faculty.department}
              </Text>
            ) : null}
            {activeSession.venue ? <Text style={styles.liveMeta}>📍 {activeSession.venue}</Text> : null}

            {alreadyMarked ? (
              <View style={styles.markedBox}>
                <Text style={styles.markedText}>
                  {myStatus === 'present' && '✅ Attendance marked'}
                  {myStatus === 'flagged' && '⚠️ Marked — pending review'}
                  {myStatus === 'rejected' && '❌ Not verified — ask your professor to mark you manually'}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.markAttendanceBtn}
                onPress={() => navigation.navigate('ScanAttendance')}
              >
                <Text style={styles.markAttendanceBtnText}>📷 Mark Attendance</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.heading}> My Timetable</Text>

        {!batch ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              You haven't been assigned to a batch yet. Check back soon!
            </Text>
          </View>
        ) : (
          <>
            {/* ✅ Batch Info */}
            <View style={styles.batchCard}>
              <Text style={styles.batchLabel}>Your Batch</Text>
              <Text style={styles.batchName}>{batch}</Text>
            </View>

            {/* ✅ Timetable Image */}
            <View style={styles.timetableCard}>
              <Text style={styles.timetableLabel}>Timetable</Text>
              {timetableImage ? (
                <Image
                  source={{ uri: timetableImage }}
                  style={styles.timetableImage}
                  resizeMode="contain"
                  onError={() => setTimetableImage(null)}
                />
              ) : (
                <View style={styles.noImageBox}>
                  <Text style={styles.noImageText}>No timetable uploaded yet</Text>
                  <Text style={styles.noImageSubText}>Check back later!</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 110,
  },
  heading: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  liveCard: {
    backgroundColor: '#132238',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.success,
    marginRight: 8,
  },
  liveBadgeText: {
    color: Theme.colors.success,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  liveSubject: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  liveMeta: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 4,
  },
  markAttendanceBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  markAttendanceBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  markedBox: {
    marginTop: 12,
    paddingVertical: 12,
  },
  markedText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  batchCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  batchLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  batchName: {
    color: 'white',
    fontSize: 34,
    fontWeight: '800',
    marginTop: 8,
  },
  timetableCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  timetableLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  timetableImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  noImageBox: {
    width: '100%',
    height: 200,
    backgroundColor: '#111827',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  noImageSubText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 4,
  },
  emptyBox: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
  },
  emptyText: {
    color: '#D1D5DB',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default BootcampScreen;