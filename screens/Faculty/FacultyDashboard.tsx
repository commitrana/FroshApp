import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Theme from '../../theme/theme';
import { logout } from "../../services/auth";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface LectureSlot {
  subject: string;
  venue?: string;
  batches?: string[];
}

interface FacultyData {
  _id: string;
  name: string;
  email: string;
  department: string;
  phoneNo: string;
  photo: string;
  teacherNo: string;
  timetableImage: string;
  timetable: {
    timeSlots?: string[];
    days?: string[];
    schedule: { [day: string]: { [slot: string]: LectureSlot } } | any[];
  };
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FacultyDashboard'>;

const FacultyDashboard = () => {
  const navigation = useNavigation<NavigationProp>();
  const [faculty, setFaculty] = useState<FacultyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFacultyProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('facultyToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('https://frosh-app-backend.onrender.com/api/faculty/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setFaculty(data.faculty);
      } else {
        console.log('Failed to fetch faculty profile:', data.error);
      }
    } catch (error) {
      console.log('Error fetching faculty profile:', error);
    } finally {
      setLoading(false);
    }
  };
  

  useFocusEffect(
    useCallback(() => {
      fetchFacultyProfile();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFacultyProfile();
    setRefreshing(false);
  }, []);

  const handleAttendance = () => {
    Alert.alert(
      'Attendance',
      'This feature is coming soon! ',
      [{ text: 'OK' }]
    );
  };
  

  const getScheduleMap = (): { [day: string]: { [slot: string]: LectureSlot } } => {
    const sched = faculty?.timetable?.schedule;
    if (!sched || Array.isArray(sched)) return {};
    return sched;
  };

  const timeSlots: string[] = (faculty?.timetable?.timeSlots && faculty.timetable.timeSlots.length)
    ? faculty.timetable.timeSlots
    : [];

  const scheduleMap = getScheduleMap();
  const handleLogout = () => {
  Alert.alert(
    "Logout",
    "Are you sure you want to logout?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();

          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        },
      },
    ]
  );
};
  const handleSlotPress = (day: string, slot: string, lecture: LectureSlot) => {
    navigation.navigate('ClassDetails', {
      day,
      slot,
      subject: lecture.subject,
      venue: lecture.venue,
      batches: lecture.batches || [],
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Theme.colors.primary} size="large" style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!faculty) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Failed to load profile</Text>
        </View>
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Faculty Dashboard</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Text style={styles.facultyName}>{faculty.name}</Text>
          <Text style={styles.facultyDepartment}>{faculty.department}</Text>
          <Text style={styles.facultyEmail}>{faculty.email}</Text>
          <Text style={styles.facultyPhone}> {faculty.phoneNo}</Text>
          {faculty.teacherNo ? (
            <Text style={styles.facultyTeacherNo}> Teacher ID: {faculty.teacherNo}</Text>
          ) : null}
        </View>

        {/* Weekly Schedule Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>
          {timeSlots.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No schedule assigned yet</Text>
              <Text style={styles.emptyStateSubText}>Please contact admin</Text>
            </View>
          ) : (
            <View style={styles.gridWrapper}>
              {/* Fixed day-name column */}
              <View style={styles.dayColumn}>
                <View style={styles.cornerSpacer} />
                {DAYS.map((day) => (
                  <View key={day} style={styles.dayLabelCell}>
                    <Text style={styles.dayLabelText}>{day.slice(0, 3)}</Text>
                  </View>
                ))}
              </View>

              {/* Horizontally scrollable time-slot grid */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  <View style={styles.headerRow}>
                    {timeSlots.map((slot) => (
                      <View key={slot} style={styles.slotHeaderCell}>
                        <Text style={styles.slotHeaderText}>{slot}</Text>
                      </View>
                    ))}
                  </View>

                  {DAYS.map((day) => (
                    <View key={day} style={styles.gridRow}>
                      {timeSlots.map((slot) => {
                        const lecture = scheduleMap[day]?.[slot];
                        return (
                          <TouchableOpacity
                            key={slot}
                            style={[styles.gridCell, lecture ? styles.gridCellFilled : null]}
                            disabled={!lecture}
                            onPress={() => lecture && handleSlotPress(day, slot, lecture)}
                          >
                            {lecture ? (
                              <>
                                <Text style={styles.cellSubject} numberOfLines={2}>
                                  {lecture.subject}
                                </Text>
                                {lecture.venue ? (
                                  <Text style={styles.cellVenue} numberOfLines={1}>
                                    📍 {lecture.venue}
                                  </Text>
                                ) : null}
                                {lecture.batches && lecture.batches.length > 0 ? (
                                  <Text style={styles.cellBatches} numberOfLines={1}>
                                    🎯 {lecture.batches.join(', ')}
                                  </Text>
                                ) : null}
                              </>
                            ) : (
                              <Text style={styles.cellEmptyDash}>—</Text>
                            )}
                          </TouchableOpacity>
                          
                        );
                      })}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Attendance Button - Non Working */}
        <TouchableOpacity style={styles.attendanceButton} onPress={handleAttendance}>
          <Text style={styles.attendanceButtonText}> Mark Attendance</Text>
        </TouchableOpacity>
            <TouchableOpacity
  style={styles.logoutButton}
  onPress={handleLogout}
>
  <Text style={styles.logoutText}>Logout</Text>
</TouchableOpacity>
        <View style={styles.footer} />
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

  logoutButton: {
  marginTop: 16,
  backgroundColor: "#EF4444",
  paddingVertical: 12,
  borderRadius: 10,
  alignItems: "center",
},

logoutText: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "700",
},
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
  },
  profileCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  facultyName: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  facultyDepartment: {
    color: Theme.colors.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  facultyEmail: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 2,
  },
  facultyPhone: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  facultyTeacherNo: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  timetableContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  gridWrapper: {
    flexDirection: 'row',
  },
  dayColumn: {
    width: 52,
  },
  cornerSpacer: {
    height: 40,
  },
  dayLabelCell: {
    height: 64,
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  dayLabelText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    height: 40,
  },
  slotHeaderCell: {
    width: 110,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    marginLeft: 4,
    borderRadius: 6,
  },
  slotHeaderText: {
    color: Theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  },
  gridCell: {
    width: 110,
    marginLeft: 4,
    marginVertical: 4,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    backgroundColor: 'transparent',
  },
  gridCellFilled: {
    backgroundColor: '#1F2937',
  },
  cellSubject: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  cellVenue: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  cellBatches: {
    color: Theme.colors.primary,
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '700',
  },
  cellEmptyDash: {
    color: '#374151',
    fontSize: 14,
  },
  emptyState: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateSubText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 4,
  },
  attendanceButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  attendanceButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
  },
  footer: {
    height: 20,
  },
});

export default FacultyDashboard;