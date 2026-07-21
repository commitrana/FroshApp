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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { RosterStudent, getSessionRoster } from '../../services/attendance';
import { useFacultyTheme } from '../../constants/facultyTheme';

type RouteProps = RouteProp<RootStackParamList, 'ClassHistoryRoster'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ClassHistoryRoster'>;

// Read-only sibling of AttendanceRosterScreen — same data source
// (getSessionRoster, which already works for ended sessions since it only
// checks faculty ownership, not status) but no tap-to-mark-present action,
// since a class in history is a closed record.
const ClassHistoryRosterScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { sessionId, subject } = route.params;
  const FacultyTheme = useFacultyTheme();
  const styles = createStyles(FacultyTheme);

  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
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
      console.log('Error fetching history roster:', error?.response?.data || error?.message);
      setLoadError(error?.response?.data?.error || 'Could not load the attendance for this class.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useFocusEffect(
    useCallback(() => {
      fetchRoster();
    }, [fetchRoster])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRoster();
    setRefreshing(false);
  }, [fetchRoster]);

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
        <ActivityIndicator color={FacultyTheme.accent} size="large" style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={FacultyTheme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Attendance</Text>
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
            return (
              <View key={student._id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentMeta}>
                    {student.rollNo} · {student.branch} · {student.batch || 'No batch'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                  {student.markedManually ? <Text style={styles.manualTag}>manual</Text> : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Text style={styles.footerHint}>This class has ended — attendance is shown for reference only.</Text>
    </SafeAreaView>
  );
};

const createStyles = (FacultyTheme: ReturnType<typeof useFacultyTheme>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: FacultyTheme.pageBg },
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
      backgroundColor: FacultyTheme.cardBg,
      shadowColor: FacultyTheme.shadowColor,
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: FacultyTheme.textPrimary },
    headerSubtitle: { fontSize: 13, marginTop: 2, color: FacultyTheme.textSecondary },
    countBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, minWidth: 50, alignItems: 'center', backgroundColor: FacultyTheme.successBg },
    countBadgeText: { fontWeight: '700', fontSize: 13, color: FacultyTheme.success },
    searchWrapper: { paddingHorizontal: 20, marginBottom: 10 },
    searchInput: {
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      borderWidth: 1,
      backgroundColor: FacultyTheme.cardBg,
      color: FacultyTheme.textPrimary,
      borderColor: FacultyTheme.lineColor,
    },
    scroll: { paddingHorizontal: 20, paddingBottom: 20 },
    emptyState: { borderRadius: 16, padding: 30, alignItems: 'center', marginTop: 20, backgroundColor: FacultyTheme.cardBg },
    errorState: { borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
    errorStateText: { fontSize: 14, fontWeight: '600', textAlign: 'center', color: FacultyTheme.danger },
    emptyStateText: { fontSize: 15, fontWeight: '600', color: FacultyTheme.textPrimary },
    card: {
      borderRadius: 16,
      padding: 14,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: FacultyTheme.cardBg,
      shadowColor: FacultyTheme.shadowColor,
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    studentName: { fontSize: 15, fontWeight: '700', color: FacultyTheme.textPrimary },
    studentMeta: { fontSize: 12, marginTop: 2, color: FacultyTheme.textSecondary },
    statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
    statusBadgeText: { fontSize: 12, fontWeight: '700' },
    manualTag: { fontSize: 9, marginTop: 1, fontStyle: 'italic', color: FacultyTheme.textSecondary },
    footerHint: { fontSize: 12, textAlign: 'center', paddingVertical: 10, paddingHorizontal: 20, color: FacultyTheme.textSecondary },
  });

export default ClassHistoryRosterScreen;