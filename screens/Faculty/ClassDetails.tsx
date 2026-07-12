import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { RootStackParamList } from '../../types/navigation';
import Theme from '../../theme/theme';
import { startAttendanceSession, getTodaysSessionForSlot, AttendanceSession } from '../../services/attendance';

type ClassDetailsRouteProp = RouteProp<RootStackParamList, 'ClassDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ClassDetails'>;

const ClassDetails = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ClassDetailsRouteProp>();
  const { day, slot, subject, venue, batches } = route.params;
  const [starting, setStarting] = useState(false);

  // Whether a session for this exact day+slot was already started today.
  // Once one exists, this screen shows "View Attendance" instead of letting
  // the professor start a second/duplicate session for the same class.
  const [todaysSession, setTodaysSession] = useState<AttendanceSession | null>(null);
  const [checkingToday, setCheckingToday] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setCheckingToday(true);
      getTodaysSessionForSlot(day, slot)
        .then((session) => {
          if (!cancelled) setTodaysSession(session);
        })
        .catch((error) => {
          console.log('Error checking today\'s session:', error);
        })
        .finally(() => {
          if (!cancelled) setCheckingToday(false);
        });
      return () => {
        cancelled = true;
      };
    }, [day, slot])
  );

  const handleStartAttendance = async () => {
    try {
      setStarting(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location permission required',
          'Please allow location access so students can be verified against your classroom location.'
        );
        setStarting(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const session = await startAttendanceSession({
        subject,
        venue,
        day,
        slot,
        professorLocation: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        professorAccuracy: position.coords.accuracy ?? 20,
        batches: batches || [],
      });

      navigation.navigate('AttendanceSession', { sessionId: session._id, subject: session.subject });
    } catch (error: any) {
      console.log('Error starting attendance session:', error);
      const message = error?.response?.data?.error || 'Could not start attendance. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setStarting(false);
    }
  };

  const handleViewAttendance = () => {
    if (!todaysSession) return;
    navigation.navigate('AttendanceSession', { sessionId: todaysSession._id, subject: todaysSession.subject });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Class Details</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.subject}>{subject}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅 Day</Text>
            <Text style={styles.detailValue}>{day}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🕒 Time</Text>
            <Text style={styles.detailValue}>{slot}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍 Venue</Text>
            <Text style={styles.detailValue}>{venue ? venue : 'Not specified'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🎯 Batches</Text>
            <Text style={styles.detailValue}>
              {batches && batches.length > 0 ? batches.join(', ') : 'All batches'}
            </Text>
          </View>
        </View>

        {checkingToday ? (
          <View style={styles.checkingBox}>
            <ActivityIndicator color={Theme.colors.primary} />
          </View>
        ) : todaysSession ? (
          <>
            <View style={styles.alreadyRanBanner}>
              <Text style={styles.alreadyRanText}>
                {todaysSession.status === 'active'
                  ? '🟢 Attendance is currently running for this class.'
                  : '✅ Attendance was already taken for this class today.'}
              </Text>
            </View>
            <TouchableOpacity style={styles.attendanceButton} onPress={handleViewAttendance}>
              <Text style={styles.attendanceButtonText}>View Attendance</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.attendanceButton, starting && styles.attendanceButtonDisabled]}
            onPress={handleStartAttendance}
            disabled={starting}
          >
            {starting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.attendanceButtonText}>Start Attendance</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: 'white',
    fontSize: 20,
  },
  backBtnPlaceholder: {
    width: 36,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  subject: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  detailLabel: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
  detailValue: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  checkingBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  alreadyRanBanner: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  alreadyRanText: {
    color: '#D1D5DB',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  attendanceButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  attendanceButtonDisabled: {
    opacity: 0.6,
  },
  attendanceButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ClassDetails;