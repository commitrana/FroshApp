import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { startAttendanceSession, getTodaysSessionForSlot, AttendanceSession } from '../../services/attendance';
import { useFacultyTheme } from '../../constants/facultyTheme'; // ← Changed

type ClassDetailsRouteProp = RouteProp<RootStackParamList, 'ClassDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ClassDetails'>;

const ClassDetails = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ClassDetailsRouteProp>();
  const { day, slot, subject, venue, batches } = route.params;
  const FacultyTheme = useFacultyTheme(); // ← Added
  const [starting, setStarting] = useState(false);

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
    <SafeAreaView style={[styles.container, { backgroundColor: FacultyTheme.pageBg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: FacultyTheme.cardBg, shadowColor: FacultyTheme.shadowColor }]}>
          <Ionicons name="arrow-back" size={20} color={FacultyTheme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: FacultyTheme.textPrimary }]}>Class Details</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: FacultyTheme.cardBg, shadowColor: FacultyTheme.shadowColor }]}>
          <Text style={[styles.subject, { color: FacultyTheme.textPrimary }]}>{subject}</Text>
          <View style={[styles.divider, { backgroundColor: FacultyTheme.lineColor }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: FacultyTheme.textSecondary }]}> Day</Text>
            <Text style={[styles.detailValue, { color: FacultyTheme.textPrimary }]}>{day}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: FacultyTheme.lineColor }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: FacultyTheme.textSecondary }]}> Time</Text>
            <Text style={[styles.detailValue, { color: FacultyTheme.textPrimary }]}>{slot}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: FacultyTheme.lineColor }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: FacultyTheme.textSecondary }]}> Venue</Text>
            <Text style={[styles.detailValue, { color: FacultyTheme.textPrimary }]}>{venue ? venue : 'Not specified'}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: FacultyTheme.lineColor }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: FacultyTheme.textSecondary }]}> Batches</Text>
            <Text style={[styles.detailValue, { color: FacultyTheme.textPrimary }]}>
              {batches && batches.length > 0 ? batches.join(', ') : 'All batches'}
            </Text>
          </View>
        </View>

        {checkingToday ? (
          <View style={styles.checkingBox}>
            <ActivityIndicator color={FacultyTheme.accent} />
          </View>
        ) : todaysSession ? (
          <>
            <View style={[styles.alreadyRanBanner, { backgroundColor: FacultyTheme.cardBg, shadowColor: FacultyTheme.shadowColor }]}>
              <Text style={[styles.alreadyRanText, { color: FacultyTheme.textSecondary }]}>
                {todaysSession.status === 'active'
                  ? ' Attendance is currently running for this class.'
                  : ' Attendance was already taken for this class today.'}
              </Text>
            </View>
            <TouchableOpacity style={[styles.attendanceButton, { backgroundColor: FacultyTheme.accent }]} onPress={handleViewAttendance}>
              <Text style={styles.attendanceButtonText}>View Attendance</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.attendanceButton, { backgroundColor: FacultyTheme.accent }, starting && styles.attendanceButtonDisabled]}
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
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  backBtnPlaceholder: { width: 40 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 10 },
  card: { borderRadius: 20, padding: 24, marginBottom: 24, shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  subject: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  divider: { height: 1 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  detailLabel: { fontSize: 15, fontWeight: '600' },
  detailValue: { fontSize: 15, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  checkingBox: { paddingVertical: 20, alignItems: 'center' },
  alreadyRanBanner: { borderRadius: 14, padding: 14, marginBottom: 14, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  alreadyRanText: { fontSize: 13, textAlign: 'center', fontWeight: '600' },
  attendanceButton: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  attendanceButtonDisabled: { opacity: 0.6 },
  attendanceButtonText: { color: 'white', fontSize: 18, fontWeight: '700' },
});

export default ClassDetails;