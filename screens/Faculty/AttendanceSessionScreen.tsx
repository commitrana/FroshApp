import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg';
import { RootStackParamList } from '../../types/navigation';
import Theme from '../../theme/theme';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import {
  AttendanceSession,
  AttendanceLiveCounts,
  getAttendanceSession,
  getAttendanceLive,
  endAttendanceSession,
} from '../../services/attendance';
import { startSessionFeedback } from '../../services/feedback';

type RouteProps = RouteProp<RootStackParamList, 'AttendanceSession'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AttendanceSession'>;

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

  // Live counter refreshes every 5s while this screen is focused.
  useAutoRefresh(fetchData, 5000);

  // While the session is active, block hardware back button + swipe-back
  // gesture so the professor can't accidentally leave without ending it.
  useFocusEffect(
    useCallback(() => {
      const isActive = session?.status === 'active';
      navigation.setOptions({ gestureEnabled: !isActive });

      const onBackPress = () => {
        if (session?.status === 'active') {
          Alert.alert('Session in progress', 'Please end the attendance session before leaving this screen.');
          return true; // swallow the back press
        }
        return false; // let it behave normally (e.g. once ended)
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
            // Stay on this screen in its "ended" view-only state instead of
            // popping back to ClassDetails (which has the Start Attendance button).
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
    // Jumps straight to FacultyDashboard, skipping past ClassDetails
    // (and its Start Attendance button) in the stack.
    navigation.navigate('FacultyDashboard');
  };

  if (loading || !session) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Theme.colors.primary} size="large" style={styles.loader} />
      </SafeAreaView>
    );
  }

  const isEnded = session.status === 'ended';

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
          <Text style={styles.statValue}>{live?.presentCount ?? 0}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statBox}
          onPress={() => navigation.navigate('FlaggedReview', { sessionId })}
        >
          <Text style={[styles.statValue, styles.statFlagged]}>{live?.flaggedCount ?? 0}</Text>
          <Text style={styles.statLabel}>Flagged</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statBox}
          onPress={() => navigation.navigate('FlaggedReview', { sessionId })}
        >
          <Text style={[styles.statValue, styles.statRejected]}>{live?.rejectedCount ?? 0}</Text>
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
                <ActivityIndicator color={Theme.colors.primary} />
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
    backgroundColor: Theme.colors.background,
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
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  qrCard: {
    backgroundColor: 'white',
    alignSelf: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 14,
  },
  hint: {
    color: '#9CA3AF',
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
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    color: Theme.colors.success,
    fontSize: 26,
    fontWeight: '700',
  },
  statFlagged: {
    color: Theme.colors.warning,
  },
  statRejected: {
    color: Theme.colors.danger,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  flaggedButton: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  flaggedButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  manageButton: {
    backgroundColor: 'rgba(79,70,229,0.15)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  manageButtonText: {
    color: Theme.colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  endButton: {
    backgroundColor: Theme.colors.danger,
    borderRadius: 12,
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
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
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