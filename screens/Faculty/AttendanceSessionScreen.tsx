import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, BackHandler, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import {
  AttendanceSession,
  AttendanceLiveCounts,
  getAttendanceSession,
  getAttendanceLive,
  endAttendanceSession,
} from '../../services/attendance';
import { startSessionFeedback } from '../../services/feedback';
import { useFacultyTheme } from '../../constants/facultyTheme'; // ← Changed

type RouteProps = RouteProp<RootStackParamList, 'AttendanceSession'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AttendanceSession'>;

const AttendanceSessionScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { sessionId, subject } = route.params;
  const FacultyTheme = useFacultyTheme(); // ← Added

  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [live, setLive] = useState<AttendanceLiveCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [startingFeedback, setStartingFeedback] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [sessionData, liveData] = await Promise.all([
        getAttendanceSession(sessionId),
        getAttendanceLive(sessionId),
      ]);
      setSession(sessionData);
      setLive(liveData);
    } catch (error) {
      console.log('Error fetching attendance session:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useAutoRefresh(fetchData, 5000);

  useFocusEffect(
    useCallback(() => {
      const isActive = session?.status === 'active';
      navigation.setOptions({ gestureEnabled: !isActive });

      const onBackPress = () => {
        if (session?.status === 'active') {
          Alert.alert('Session in progress', 'Please end the attendance session before leaving this screen.');
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation, session?.status])
  );

  const handleEndSession = () => {
    Alert.alert('End Session', 'Are you sure you want to end this attendance session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Session',
        style: 'destructive',
        onPress: async () => {
          try {
            setEnding(true);
            await endAttendanceSession(sessionId);
            await fetchData();
          } catch (error: any) {
            const message = error?.response?.data?.error || 'Could not end session.';
            Alert.alert('Error', message);
          } finally {
            setEnding(false);
          }
        },
      },
    ]);
  };

  const handleStartFeedback = async () => {
    try {
      setStartingFeedback(true);
      await startSessionFeedback(sessionId);
      await fetchData();
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Could not start feedback.';
      Alert.alert('Error', message);
    } finally {
      setStartingFeedback(false);
    }
  };

  const handleBackToDashboard = () => {
    
    navigation.reset({ index: 0, routes: [{ name: 'FacultyTabs' }] });
  };

  if (loading || !session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: FacultyTheme.pageBg }]}>
        <ActivityIndicator color={FacultyTheme.accent} size="large" style={styles.loader} />
      </SafeAreaView>
    );
  }

  const isEnded = session.status === 'ended';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: FacultyTheme.pageBg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: FacultyTheme.textPrimary }]}>{subject}</Text>
        <Text style={[styles.headerSubtitle, { color: FacultyTheme.textSecondary }]}>
          {isEnded ? ' Session ended — viewing attendance' : ' Session active'}
        </Text>
      </View>

      <View style={[styles.codeCard, { shadowColor: FacultyTheme.shadowColor }]}>
        <Text style={styles.codeCardLabel}>ATTENDANCE CODE</Text>
        <Text style={[styles.codeCardValue, isEnded && styles.codeCardValueEnded]}>
          {session.attendanceCode}
        </Text>
      </View>

      <Text style={[styles.hint, { color: FacultyTheme.textSecondary }]}>
        {isEnded
          ? 'This session has ended. The code is no longer accepting entries.'
          : 'Read this code out or display it — students type it in to mark attendance.'}
      </Text>

      <View style={styles.statsRow}>
        <TouchableOpacity
          style={[styles.statBox, { backgroundColor: FacultyTheme.cardBg, shadowColor: FacultyTheme.shadowColor }]}
          onPress={() => navigation.navigate('PresentList', { sessionId, subject })}
        >
          <Text style={[styles.statValue, { color: FacultyTheme.success }]}>{live?.presentCount ?? 0}</Text>
          <Text style={[styles.statLabel, { color: FacultyTheme.textSecondary }]}>Present</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statBox, { backgroundColor: FacultyTheme.cardBg, shadowColor: FacultyTheme.shadowColor }]}
          onPress={() => navigation.navigate('FlaggedReview', { sessionId })}
        >
          <Text style={[styles.statValue, { color: FacultyTheme.warning }]}>{live?.flaggedCount ?? 0}</Text>
          <Text style={[styles.statLabel, { color: FacultyTheme.textSecondary }]}>Flagged</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statBox, { backgroundColor: FacultyTheme.cardBg, shadowColor: FacultyTheme.shadowColor }]}
          onPress={() => navigation.navigate('FlaggedReview', { sessionId })}
        >
          <Text style={[styles.statValue, { color: FacultyTheme.danger }]}>{live?.rejectedCount ?? 0}</Text>
          <Text style={[styles.statLabel, { color: FacultyTheme.textSecondary }]}>Rejected</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.flaggedButton, { backgroundColor: FacultyTheme.cardBg, borderColor: FacultyTheme.lineColor }]}
        onPress={() => navigation.navigate('FlaggedReview', { sessionId })}
      >
        <Text style={[styles.flaggedButtonText, { color: FacultyTheme.textPrimary }]}>
          View Flagged ({(live?.flaggedCount ?? 0) + (live?.rejectedCount ?? 0)})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.manageButton, { backgroundColor: 'rgba(55,148,255,0.1)', borderColor: FacultyTheme.accent }]}
        onPress={() => navigation.navigate('AttendanceRoster', { sessionId, subject })}
      >
        <Text style={[styles.manageButtonText, { color: FacultyTheme.accent }]}>👥 Manage Attendance (mark manually)</Text>
      </TouchableOpacity>

      {!isEnded ? (
        <TouchableOpacity
          style={[styles.endButton, { backgroundColor: FacultyTheme.danger }, ending && styles.endButtonDisabled]}
          onPress={handleEndSession}
          disabled={ending}
        >
          {ending ? <ActivityIndicator color="white" /> : <Text style={styles.endButtonText}>End Session</Text>}
        </TouchableOpacity>
      ) : (
        <>
          {session.feedbackStatus === 'not_set' && session.feedbackQuestions.length === 0 && (
            <TouchableOpacity
              style={[styles.manageButton, { backgroundColor: 'rgba(55,148,255,0.1)', borderColor: FacultyTheme.accent }]}
              onPress={() => navigation.navigate('FeedbackQuestions', { sessionId, subject })}
            >
              <Text style={[styles.manageButtonText, { color: FacultyTheme.accent }]}>📝 Add Feedback Questions (5)</Text>
            </TouchableOpacity>
          )}

          {session.feedbackStatus === 'not_set' && session.feedbackQuestions.length === 5 && (
            <TouchableOpacity
              style={[styles.manageButton, { backgroundColor: 'rgba(55,148,255,0.1)', borderColor: FacultyTheme.accent }, startingFeedback && styles.endButtonDisabled]}
              onPress={handleStartFeedback}
              disabled={startingFeedback}
            >
              {startingFeedback ? (
                <ActivityIndicator color={FacultyTheme.accent} />
              ) : (
                <Text style={[styles.manageButtonText, { color: FacultyTheme.accent }]}>▶️ Start Feedback</Text>
              )}
            </TouchableOpacity>
          )}

          {(session.feedbackStatus === 'open' || session.feedbackStatus === 'closed') && (
            <TouchableOpacity
              style={[styles.manageButton, { backgroundColor: 'rgba(55,148,255,0.1)', borderColor: FacultyTheme.accent }]}
              onPress={() => navigation.navigate('FeedbackResponses', { sessionId })}
            >
              <Text style={[styles.manageButtonText, { color: FacultyTheme.accent }]}>📊 View Feedback Responses</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: FacultyTheme.accent }]}
            onPress={handleBackToDashboard}
          >
            <Text style={styles.doneButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </>
      )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 30 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  codeCard: {
    backgroundColor: 'white',
    alignSelf: 'center',
    paddingVertical: 28,
    paddingHorizontal: 36,
    borderRadius: 20,
    marginBottom: 14,
    alignItems: 'center',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  codeCardLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', letterSpacing: 2, marginBottom: 10 },
  codeCardValue: { fontSize: 44, fontWeight: '800', color: '#111827', letterSpacing: 10 },
  codeCardValueEnded: { color: '#9CA3AF' },
  hint: { fontSize: 13, textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { flex: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginHorizontal: 4, shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  statValue: { fontSize: 26, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  flaggedButton: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 12, borderWidth: 1 },
  flaggedButtonText: { fontSize: 15, fontWeight: '700' },
  manageButton: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 12, borderWidth: 1 },
  manageButtonText: { fontSize: 15, fontWeight: '700' },
  endButton: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  endButtonDisabled: { opacity: 0.6 },
  endButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  doneButton: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  doneButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
});

export default AttendanceSessionScreen;