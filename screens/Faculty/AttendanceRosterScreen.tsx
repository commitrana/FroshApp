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
import { RootStackParamList } from '../../types/navigation';
import Theme from '../../theme/theme';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { RosterStudent, getSessionRoster, markStudentManually } from '../../services/attendance';

type RouteProps = RouteProp<RootStackParamList, 'AttendanceRoster'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AttendanceRoster'>;

const STATUS_STYLE: Record<RosterStudent['status'], { label: string; color: string; bg: string }> = {
  present: { label: 'Present', color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
  flagged: { label: 'Flagged', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
  rejected: { label: 'Rejected', color: '#F87171', bg: 'rgba(248,113,113,0.15)' },
  absent: { label: 'Absent', color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
};

const AttendanceRosterScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { sessionId, subject } = route.params;

  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Theme.colors.primary} size="large" style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Manage Attendance</Text>
          {subject ? <Text style={styles.headerSubtitle}>{subject}</Text> : null}
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>
            {presentCount}/{students.length}
          </Text>
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, roll no, or batch"
          placeholderTextColor="#6B7280"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9CA3AF" />}
      >
        {loadError ? (
          <View style={[styles.emptyState, styles.errorState]}>
            <Text style={styles.errorStateText}>⚠️ {loadError}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
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
                style={styles.card}
                disabled={isPresent || markingId === student._id}
                onPress={() => handleMarkPresent(student)}
                activeOpacity={isPresent ? 1 : 0.6}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentMeta}>
                    {student.rollNo} · {student.branch} · {student.batch || 'No batch'}
                  </Text>
                </View>

                {markingId === student._id ? (
                  <ActivityIndicator color={Theme.colors.primary} size="small" />
                ) : (
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                    {student.markedManually ? <Text style={styles.manualTag}>manual</Text> : null}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Text style={styles.footerHint}>Tap any non-present student to mark them present manually.</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backBtnText: {
    color: 'white',
    fontSize: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 50,
    alignItems: 'center',
  },
  countBadgeText: {
    color: Theme.colors.success,
    fontWeight: '700',
    fontSize: 13,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: 'white',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyState: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  errorState: {
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  errorStateText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentName: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  studentMeta: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  manualTag: {
    color: '#9CA3AF',
    fontSize: 9,
    marginTop: 1,
    fontStyle: 'italic',
  },
  footerHint: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
});

export default AttendanceRosterScreen;