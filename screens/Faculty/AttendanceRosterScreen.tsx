import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { RosterStudent, getSessionRoster, markStudentManually } from '../../services/attendance';
import { useFacultyTheme } from '../../constants/facultyTheme'; // ← Changed

type RouteProps = RouteProp<RootStackParamList, 'AttendanceRoster'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AttendanceRoster'>;

const AttendanceRosterScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { sessionId, subject } = route.params;
  const FacultyTheme = useFacultyTheme(); // ← Added

  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const STATUS_STYLE = useMemo(() => ({
    present: { label: 'Present', color: FacultyTheme.success, bg: FacultyTheme.successBg },
    flagged: { label: 'Flagged', color: FacultyTheme.warning, bg: FacultyTheme.warningBg },
    rejected: { label: 'Rejected', color: FacultyTheme.danger, bg: FacultyTheme.dangerBg },
    absent: { label: 'Absent', color: FacultyTheme.textSecondary, bg: 'rgba(111,136,178,0.12)' },
  }), [FacultyTheme]);

  const fetchRoster = useCallback(async () => {
    try {
      const data = await getSessionRoster(sessionId);
      setStudents(data);
      setLoadError(null);
    } catch (error: any) {
      console.log('Error fetching roster:', error?.response?.data || error?.message);
      setLoadError(error?.response?.data?.error || 'Could not load the student list.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useAutoRefresh(fetchRoster, 10000);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRoster();
    setRefreshing(false);
  }, [fetchRoster]);

  const handleMarkPresent = (student: RosterStudent) => {
    Alert.alert('Mark Present', `Mark ${student.name} (${student.rollNo}) as present?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Present',
        onPress: async () => {
          try {
            setMarkingId(student._id);
            await markStudentManually(sessionId, student._id);
            await fetchRoster();
          } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.error || 'Could not mark this student.');
          } finally {
            setMarkingId(null);
          }
        },
      },
    ]);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q) || (s.batch || '').toLowerCase().includes(q)
    );
  }, [students, search]);

  const presentCount = students.filter((s) => s.status === 'present').length;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: FacultyTheme.pageBg }]}>
        <ActivityIndicator color={FacultyTheme.accent} size="large" style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: FacultyTheme.pageBg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: FacultyTheme.cardBg, shadowColor: FacultyTheme.shadowColor }]}>
          <Ionicons name="arrow-back" size={20} color={FacultyTheme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: FacultyTheme.textPrimary }]}>Manage Attendance</Text>
          {subject ? <Text style={[styles.headerSubtitle, { color: FacultyTheme.textSecondary }]}>{subject}</Text> : null}
        </View>
        <View style={[styles.countBadge, { backgroundColor: FacultyTheme.successBg }]}>
          <Text style={[styles.countBadgeText, { color: FacultyTheme.success }]}>
            {presentCount}/{students.length}
          </Text>
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: FacultyTheme.cardBg, 
            color: FacultyTheme.textPrimary,
            borderColor: FacultyTheme.lineColor
          }]}
          placeholder="Search by name, roll no, or batch"
          placeholderTextColor={FacultyTheme.textSecondary}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={FacultyTheme.accent} />}
      >
        {loadError ? (
          <View style={[styles.emptyState, styles.errorState, { backgroundColor: FacultyTheme.cardBg }]}>
            <Text style={[styles.errorStateText, { color: FacultyTheme.danger }]}>⚠️ {loadError}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: FacultyTheme.cardBg }]}>
            <Text style={[styles.emptyStateText, { color: FacultyTheme.textSecondary }]}>
              {search ? 'No students match your search' : 'No students found for this batch'}
            </Text>
          </View>
        ) : (
          filtered.map((student) => {
            const statusInfo = STATUS_STYLE[student.status];
            const isPresent = student.status === 'present';
            return (
              <TouchableOpacity
                key={student._id}
                style={[styles.card, { backgroundColor: FacultyTheme.cardBg, shadowColor: FacultyTheme.shadowColor }]}
                disabled={isPresent || markingId === student._id}
                onPress={() => handleMarkPresent(student)}
                activeOpacity={isPresent ? 1 : 0.6}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.studentName, { color: FacultyTheme.textPrimary }]}>{student.name}</Text>
                  <Text style={[styles.studentMeta, { color: FacultyTheme.textSecondary }]}>
                    {student.rollNo} · {student.branch} · {student.batch || 'No batch'}
                  </Text>
                </View>

                {markingId === student._id ? (
                  <ActivityIndicator color={FacultyTheme.accent} size="small" />
                ) : (
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                    {student.markedManually ? <Text style={[styles.manualTag, { color: FacultyTheme.textSecondary }]}>manual</Text> : null}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Text style={[styles.footerHint, { color: FacultyTheme.textSecondary }]}>Tap any non-present student to mark them present manually.</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  countBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, minWidth: 50, alignItems: 'center' },
  countBadgeText: { fontWeight: '700', fontSize: 13 },
  searchWrapper: { paddingHorizontal: 20, marginBottom: 10 },
  searchInput: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, borderWidth: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },
  emptyState: { borderRadius: 16, padding: 30, alignItems: 'center', marginTop: 20 },
  errorState: { borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  errorStateText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  emptyStateText: { fontSize: 15, fontWeight: '600' },
  card: { borderRadius: 16, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  studentName: { fontSize: 15, fontWeight: '700' },
  studentMeta: { fontSize: 12, marginTop: 2 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  manualTag: { fontSize: 9, marginTop: 1, fontStyle: 'italic' },
  footerHint: { fontSize: 12, textAlign: 'center', paddingVertical: 10, paddingHorizontal: 20 },
});

export default AttendanceRosterScreen;