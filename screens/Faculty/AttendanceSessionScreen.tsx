// Save as: src/screens/Faculty/AttendanceSessionScreen.tsx
// LOGIC ZONE copied unchanged: polling via useAutoRefresh, back-button-block
// while active, end-session confirm, conditional feedback buttons based on
// session.feedbackStatus, QR code, handleBackToDashboard. Only JSX/styles
// were restyled.

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg';
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
import FacultyTheme from '../../constants/facultyTheme';

type RouteProps = RouteProp<RootStackParamList, 'AttendanceSession'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AttendanceSession'>;

// ============ LOGIC ZONE (unchanged) ============
const AttendanceSessionScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { sessionId, subject } = route.params;

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
    // Jumps straight back to the faculty Bootcamp tab, skipping past
    // ClassDetails in the stack. Kept pointing at the 'FacultyDashboard'
    // route name unchanged (still registered in AppNavigator) so this
    // logic didn't need to be touched.
    navigation.navigate('FacultyDashboard');
  };

  if (loading || !session) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={FacultyTheme.accent} size="large" style={styles.loader} />
      </SafeAreaView>
    );
  }

  const isEnded = session.status === 'ended';
  // ============ END LOGIC ZONE ============

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{subject}</Text>
        <Text style={styles.headerSubtitle}>
          {isEnded ? '⚪ Session ended — viewing attendance' : '🟢 Session active'}
        </Text>
      </View>

      <View style={styles.qrCard}>
        <QRCode
          value={session.qrToken}
          size={220}
          color={isEnded ? '#9CA3AF' : '#000000'}
          backgroundColor="#FFFFFF"
        />
      </View>

      <Text style={styles.hint}>
        {isEnded
          ? 'This session has ended. QR code is no longer accepting scans.'
          : "Show this QR code to your students — they'll scan it to mark attendance."}
      </Text>

      <View style={styles.statsRow}>
        <TouchableOpacity
          style={styles.statBox}
          onPress={() => navigation.navigate('PresentList', { sessionId, subject })}
        >
          <Text style={[styles.statValue, { color: FacultyTheme.success }]}>{live?.presentCount ?? 0}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statBox}
          onPress={() => navigation.navigate('FlaggedReview', { sessionId })}
        >
          <Text style={[styles.statValue, { color: FacultyTheme.warning }]}>{live?.flaggedCount ?? 0}</Text>
          <Text style={styles.statLabel}>Flagged</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statBox}
          onPress={() => navigation.navigate('FlaggedReview', { sessionId })}
        >
          <Text style={[styles.statValue, { color: FacultyTheme.danger }]}>{live?.rejectedCount ?? 0}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.flaggedButton}
        onPress={() => navigation.navigate('FlaggedReview', { sessionId })}
      >
        <Text style={styles.flaggedButtonText}>
          View Flagged ({(live?.flaggedCount ?? 0) + (live?.rejectedCount ?? 0)})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.manageButton}
        onPress={() => navigation.navigate('AttendanceRoster', { sessionId, subject })}
      >
        <Text style={styles.manageButtonText}>👥 Manage Attendance (mark manually)</Text>
      </TouchableOpacity>

      {!isEnded ? (
        <TouchableOpacity
          style={[styles.endButton, ending && styles.endButtonDisabled]}
          onPress={handleEndSession}
          disabled={ending}
        >
          {ending ? <ActivityIndicator color="white" /> : <Text style={styles.endButtonText}>End Session</Text>}
        </TouchableOpacity>
      ) : (
        <>
          {session.feedbackStatus === 'not_set' && session.feedbackQuestions.length === 0 && (
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => navigation.navigate('FeedbackQuestions', { sessionId, subject })}
            >
              <Text style={styles.manageButtonText}>📝 Add Feedback Questions (5)</Text>
            </TouchableOpacity>
          )}

          {session.feedbackStatus === 'not_set' && session.feedbackQuestions.length === 5 && (
            <TouchableOpacity
              style={[styles.manageButton, startingFeedback && styles.endButtonDisabled]}
              onPress={handleStartFeedback}
              disabled={startingFeedback}
            >
              {startingFeedback ? (
                <ActivityIndicator color={FacultyTheme.accent} />
              ) : (
                <Text style={styles.manageButtonText}>▶️ Start Feedback</Text>
              )}
            </TouchableOpacity>
          )}

          {(session.feedbackStatus === 'open' || session.feedbackStatus === 'closed') && (
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => navigation.navigate('FeedbackResponses', { sessionId })}
            >
              <Text style={styles.manageButtonText}>📊 View Feedback Responses</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.doneButton} onPress={handleBackToDashboard}>
            <Text style={styles.doneButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FacultyTheme.pageBg,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: FacultyTheme.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: FacultyTheme.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  qrCard: {
    backgroundColor: 'white',
    alignSelf: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 14,
    shadowColor: FacultyTheme.shadowColor,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  hint: {
    color: FacultyTheme.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: FacultyTheme.cardBg,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: FacultyTheme.shadowColor,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
  },
  statLabel: {
    color: FacultyTheme.textSecondary,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  flaggedButton: {
    backgroundColor: FacultyTheme.cardBg,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: FacultyTheme.lineColor,
  },
  flaggedButtonText: {
    color: FacultyTheme.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  manageButton: {
    backgroundColor: 'rgba(55,148,255,0.1)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: FacultyTheme.accent,
  },
  manageButtonText: {
    color: FacultyTheme.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  endButton: {
    backgroundColor: FacultyTheme.danger,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  endButtonDisabled: {
    opacity: 0.6,
  },
  endButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  doneButton: {
    backgroundColor: FacultyTheme.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AttendanceSessionScreen;