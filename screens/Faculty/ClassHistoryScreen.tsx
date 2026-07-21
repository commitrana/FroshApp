import React, { useCallback, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { getFacultyHistorySessions, HistorySession } from '../../services/attendance';
import { useFacultyTheme } from '../../constants/facultyTheme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ClassHistory'>;

const formatDate = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

// Read-only history of this faculty's own ended classes — kept separate
// from AttendanceRoster (the live, editable manage-attendance screen) so
// past classes are always shown as a clean record, not something you can
// accidentally still edit.
const ClassHistoryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const FacultyTheme = useFacultyTheme();
  const styles = createStyles(FacultyTheme);

  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await getFacultyHistorySessions();
      setSessions(data);
      setLoadError(null);
    } catch (error: any) {
      console.log('Error fetching class history:', error?.response?.data || error?.message);
      setLoadError(error?.response?.data?.error || 'Could not load class history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  }, [fetchHistory]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={FacultyTheme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Class History</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      {loading ? (
        <ActivityIndicator color={FacultyTheme.accent} size="large" style={styles.loader} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={FacultyTheme.accent} />}
        >
          {loadError ? (
            <View style={[styles.emptyState, styles.errorState]}>
              <Text style={styles.errorStateText}>⚠️ {loadError}</Text>
            </View>
          ) : sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={28} color={FacultyTheme.textSecondary} />
              <Text style={styles.emptyStateText}>No completed classes yet</Text>
              <Text style={styles.emptyStateSubText}>Classes appear here once you end attendance.</Text>
            </View>
          ) : (
            sessions.map((session) => (
              <TouchableOpacity
                key={session._id}
                style={styles.card}
                onPress={() =>
                  navigation.navigate('ClassHistoryRoster', {
                    sessionId: session._id,
                    subject: session.subject,
                  })
                }
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.subject}>{session.subject}</Text>
                  <Text style={styles.meta}>
                    {session.day} · {session.slot}{session.venue ? ` · ${session.venue}` : ''}
                  </Text>
                  <Text style={styles.date}>{formatDate(session.endedAt)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={FacultyTheme.textSecondary} />
              </TouchableOpacity>
            ))
          )}
          <View style={styles.footer} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const createStyles = (FacultyTheme: ReturnType<typeof useFacultyTheme>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: FacultyTheme.pageBg },
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
      backgroundColor: FacultyTheme.cardBg,
      shadowColor: FacultyTheme.shadowColor,
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    backBtnPlaceholder: { width: 40 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: FacultyTheme.textPrimary },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: FacultyTheme.cardBg,
      borderRadius: 16,
      padding: 16,
      marginBottom: 10,
      shadowColor: FacultyTheme.shadowColor,
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    subject: { fontSize: 16, fontWeight: '700', color: FacultyTheme.textPrimary },
    meta: { fontSize: 13, color: FacultyTheme.textSecondary, marginTop: 4 },
    date: { fontSize: 12, color: FacultyTheme.accent, marginTop: 4, fontWeight: '600' },
    emptyState: {
      backgroundColor: FacultyTheme.cardBg,
      borderRadius: 16,
      padding: 30,
      alignItems: 'center',
      marginTop: 30,
    },
    errorState: { borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
    errorStateText: { fontSize: 14, fontWeight: '600', color: FacultyTheme.danger, textAlign: 'center' },
    emptyStateText: { fontSize: 15, fontWeight: '600', color: FacultyTheme.textPrimary, marginTop: 10 },
    emptyStateSubText: { fontSize: 13, color: FacultyTheme.textSecondary, marginTop: 4, textAlign: 'center' },
    footer: { height: 20 },
  });

export default ClassHistoryScreen;