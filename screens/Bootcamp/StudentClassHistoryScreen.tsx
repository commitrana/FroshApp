import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { getStudentHistorySessions, StudentHistorySession } from '../../services/attendance';
import { getMyTimetable, MyTimetableResponse } from '../../services/batches';
import { useHomeTheme } from '../../constants/homeThemes';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'StudentClassHistory'>;

type Row = {
  key: string;
  subject: string;
  day: string;
  slot: string;
  venue?: string;
  faculty?: string;
  dateLabel: string;
  status: 'present' | 'absent' | 'upcoming';
};

const formatDate = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const STATUS_META: Record<Row['status'], { label: string; color: string; bg: string; icon: any }> = {
  present: { label: 'Present', color: '#22C55E', bg: 'rgba(34,197,94,0.14)', icon: 'checkmark-circle' },
  absent: { label: 'Absent', color: '#EF4444', bg: 'rgba(239,68,68,0.14)', icon: 'close-circle' },
  upcoming: { label: 'Upcoming', color: '#F59E0B', bg: 'rgba(245,158,11,0.14)', icon: 'time-outline' },
};

// Read-only attendance history for the logged-in student — every class
// they've ever attended/missed (from AttendanceSession/AttendanceRecord,
// via /attendance/student/history), plus today's classes from the
// recurring weekly timetable that haven't been conducted yet, shown as
// "Upcoming" so the student sees their whole day at a glance.
const StudentClassHistoryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const theme = useHomeTheme();
  const styles = createStyles(theme);

  const [history, setHistory] = useState<StudentHistorySession[]>([]);
  const [timetable, setTimetable] = useState<MyTimetableResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [historyData, timetableData] = await Promise.all([
        getStudentHistorySessions(),
        getMyTimetable(),
      ]);
      setHistory(historyData);
      setTimetable(timetableData);
      setLoadError(null);
    } catch (error: any) {
      console.log('Error fetching student class history:', error?.response?.data || error?.message);
      setLoadError(error?.response?.data?.error || 'Could not load your class history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const rows: Row[] = useMemo(() => {
    const historyRows: Row[] = history.map((session) => ({
      key: session._id,
      subject: session.subject,
      day: session.day,
      slot: session.slot,
      venue: session.venue,
      faculty: session.faculty?.name,
      dateLabel: formatDate(session.endedAt),
      status: session.status,
    }));

    // Today's classes from the recurring weekly timetable that don't yet
    // have a matching ended session today — i.e. haven't happened yet.
    const upcomingRows: Row[] = [];
    if (timetable) {
      const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todayHistorySlots = new Set(
        history
          .filter((s) => s.day === todayName)
          .map((s) => `${s.slot}__${s.subject}`)
      );
      timetable.classes
        .filter((cls) => cls.day === todayName && !todayHistorySlots.has(`${cls.slot}__${cls.subject}`))
        .forEach((cls) => {
          upcomingRows.push({
            key: `upcoming-${cls.day}-${cls.slot}-${cls.subject}`,
            subject: cls.subject,
            day: cls.day,
            slot: cls.slot,
            venue: cls.venue,
            faculty: cls.faculty,
            dateLabel: 'Today',
            status: 'upcoming',
          });
        });
    }

    return [...upcomingRows, ...historyRows];
  }, [history, timetable]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Class History</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      {loading ? (
        <ActivityIndicator color={theme.accent} size="large" style={styles.loader} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        >
          {loadError ? (
            <View style={[styles.emptyState, styles.errorState, { backgroundColor: theme.cardBg }]}>
              <Text style={styles.errorStateText}>⚠️ {loadError}</Text>
            </View>
          ) : rows.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.cardBg }]}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={28} color={theme.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.textPrimary }]}>No classes yet</Text>
              <Text style={[styles.emptyStateSubText, { color: theme.textSecondary }]}>
                Your attendance history will show up here once classes start.
              </Text>
            </View>
          ) : (
            rows.map((row) => {
              const meta = STATUS_META[row.status];
              return (
                <View key={row.key} style={[styles.card, { backgroundColor: theme.cardBg }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.subject, { color: theme.textPrimary }]}>{row.subject}</Text>
                    <Text style={[styles.meta, { color: theme.textSecondary }]}>
                      {row.day} · {row.slot}
                      {row.venue ? ` · ${row.venue}` : ''}
                    </Text>
                    {row.faculty ? (
                      <Text style={[styles.meta, { color: theme.textSecondary }]}>{row.faculty}</Text>
                    ) : null}
                    <Text style={[styles.date, { color: theme.accent }]}>{row.dateLabel}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon} size={14} color={meta.color} />
                    <Text style={[styles.statusBadgeText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>
              );
            })
          )}
          <View style={styles.footer} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof useHomeTheme>) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 15,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.cardBg,
    },
    backBtnPlaceholder: { width: 40 },
    headerTitle: { fontSize: 20, fontWeight: '700' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      padding: 16,
      marginBottom: 10,
    },
    subject: { fontSize: 16, fontWeight: '700' },
    meta: { fontSize: 12, marginTop: 2 },
    date: { fontSize: 12, marginTop: 4, fontWeight: '600' },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    statusBadgeText: { fontSize: 12, fontWeight: '700' },
    emptyState: { borderRadius: 16, padding: 30, alignItems: 'center', marginTop: 30 },
    errorState: { borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
    errorStateText: { fontSize: 14, fontWeight: '600', color: '#EF4444', textAlign: 'center' },
    emptyStateText: { fontSize: 15, fontWeight: '600', marginTop: 10 },
    emptyStateSubText: { fontSize: 13, marginTop: 4, textAlign: 'center' },
    footer: { height: 20 },
  });

export default StudentClassHistoryScreen;