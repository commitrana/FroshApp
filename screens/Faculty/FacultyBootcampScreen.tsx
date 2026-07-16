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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { logout } from '../../services/auth';
import { useFacultyTheme } from '../../constants/facultyTheme';

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

// ============ LOGIC ZONE (unchanged from FacultyDashboard.tsx) ============
const FacultyBootcampScreen = () => {
  // Nested inside FacultyBottomTabs, which is registered directly under the
  // root Stack — `useNavigation<any>()` (same pattern the student
  // BootcampScreen.tsx uses) lets `navigate('ClassDetails', ...)` bubble up
  // to the root Stack without needing a strict nested param-list type.
  const navigation = useNavigation<any>();
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
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();

            // FacultyBottomTabs is registered directly under the root
            // Stack, so its parent navigator is that root Stack.
            navigation.getParent()?.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            }) ?? navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
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
  // ============ END LOGIC ZONE ============

  // Theme now reacts to the device color scheme (light/dark) instead of
  // being a fixed, always-light object.
  const FacultyTheme = useFacultyTheme();
  const styles = createStyles(FacultyTheme);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={FacultyTheme.accent} size="large" style={styles.loader} />
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={FacultyTheme.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bootcamp</Text>
        </View>


        {/* Weekly Schedule Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="calendar-month-outline" size={22} color={FacultyTheme.accent} />
            <Text style={styles.sectionTitle}>Weekly Schedule</Text>
          </View>

          {timeSlots.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No schedule assigned yet</Text>
              <Text style={styles.emptyStateSubText}>Please contact admin</Text>
            </View>
          ) : (
            <View style={styles.gridWrapper}>
              <View style={styles.dayColumn}>
                <View style={styles.cornerSpacer} />
                {DAYS.map((day) => (
                  <View key={day} style={styles.dayLabelCell}>
                    <Text style={styles.dayLabelText}>{day.slice(0, 3)}</Text>
                  </View>
                ))}
              </View>

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
                                     {lecture.venue}
                                  </Text>
                                ) : null}
                                {lecture.batches && lecture.batches.length > 0 ? (
                                  <Text style={styles.cellBatches} numberOfLines={1}>
                                     {lecture.batches.join(', ')}
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

          <Text style={styles.note}>Tap a class to start or view attendance.</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles are now generated per-render from the active theme (light or
// dark) instead of being frozen once at module load via a static
// StyleSheet.create call.
const createStyles = (FacultyTheme: ReturnType<typeof useFacultyTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: FacultyTheme.pageBg,
    },
    loader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 15,
      paddingBottom: 40,
    },
    header: {
      marginTop: 15,
      marginBottom: 16,
    },
    headerTitle: {
      color: FacultyTheme.textPrimary,
      fontSize: 28,
      fontWeight: '700',
    },
    profileCard: {
      backgroundColor: FacultyTheme.cardBg,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      marginBottom: 20,
      shadowColor: FacultyTheme.shadowColor,
      shadowOpacity: 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    avatarCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(55,148,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    facultyName: {
      color: FacultyTheme.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 4,
    },
    facultyDepartment: {
      color: FacultyTheme.accent,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 6,
    },
    facultyEmail: {
      color: FacultyTheme.textSecondary,
      fontSize: 14,
      marginBottom: 2,
    },
    facultyPhone: {
      color: FacultyTheme.textSecondary,
      fontSize: 14,
    },
    facultyTeacherNo: {
      color: FacultyTheme.textSecondary,
      fontSize: 14,
      marginTop: 4,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      color: FacultyTheme.textPrimary,
      fontSize: 20,
      fontWeight: '700',
      marginLeft: 8,
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
      borderBottomColor: FacultyTheme.lineColor,
    },
    dayLabelText: {
      color: FacultyTheme.textSecondary,
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
      backgroundColor: FacultyTheme.cardBg,
      marginLeft: 4,
      borderRadius: 6,
    },
    slotHeaderText: {
      color: FacultyTheme.accent,
      fontSize: 11,
      fontWeight: '700',
    },
    gridRow: {
      flexDirection: 'row',
      height: 64,
      borderBottomWidth: 1,
      borderBottomColor: FacultyTheme.lineColor,
    },
    gridCell: {
      width: 110,
      marginLeft: 4,
      marginVertical: 4,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      backgroundColor: 'transparent',
    },
    gridCellFilled: {
      backgroundColor: FacultyTheme.cardBg,
      shadowColor: FacultyTheme.shadowColor,
      shadowOpacity: 0.1,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    cellSubject: {
      color: FacultyTheme.textPrimary,
      fontSize: 12,
      fontWeight: '700',
      textAlign: 'center',
    },
    cellVenue: {
      color: FacultyTheme.textSecondary,
      fontSize: 10,
      marginTop: 2,
      textAlign: 'center',
    },
    cellBatches: {
      color: FacultyTheme.accent,
      fontSize: 9,
      marginTop: 2,
      textAlign: 'center',
      fontWeight: '700',
    },
    cellEmptyDash: {
      color: FacultyTheme.lineColor,
      fontSize: 14,
    },
    emptyState: {
      backgroundColor: FacultyTheme.cardBg,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
    },
    emptyStateText: {
      color: FacultyTheme.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    emptyStateSubText: {
      color: FacultyTheme.textSecondary,
      fontSize: 14,
      marginTop: 4,
    },
    note: {
      color: FacultyTheme.textSecondary,
      fontSize: 12,
      marginTop: 10,
      textAlign: 'center',
    },
    logoutButton: {
      flexDirection: 'row',
      backgroundColor: FacultyTheme.danger,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    logoutText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    errorText: {
      color: FacultyTheme.danger,
      fontSize: 16,
    },
    footer: {
      height: 20,
    },
  });

export default FacultyBootcampScreen;