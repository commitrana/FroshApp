import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { PresentRecord, getPresentRecords } from '../../services/attendance';
import { useFacultyTheme } from '../../constants/facultyTheme'; // ← Changed

type RouteProps = RouteProp<RootStackParamList, 'PresentList'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PresentList'>;

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const PresentListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { sessionId, subject } = route.params;
  const FacultyTheme = useFacultyTheme(); // ← Added

  const [records, setRecords] = useState<PresentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      const data = await getPresentRecords(sessionId);
      setRecords(data);
      setLoadError(null);
    } catch (error: any) {
      console.log('Error fetching present records:', error?.response?.status, error?.response?.data || error?.message);
      const message =
        error?.response?.status === 404
          ? "This endpoint isn't live on the server yet — redeploy the backend."
          : error?.response?.data?.error || 'Could not load the list. Pull down to retry.';
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useAutoRefresh(fetchRecords, 8000);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecords();
    setRefreshing(false);
  }, [fetchRecords]);

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
          <Text style={[styles.headerTitle, { color: FacultyTheme.textPrimary }]}>Present Students</Text>
          {subject ? <Text style={[styles.headerSubtitle, { color: FacultyTheme.textSecondary }]}>{subject}</Text> : null}
        </View>
        <View style={[styles.countBadge, { backgroundColor: FacultyTheme.successBg }]}>
          <Text style={[styles.countBadgeText, { color: FacultyTheme.success }]}>{records.length}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={FacultyTheme.accent} />}
      >
        {loadError ? (
          <View style={[styles.emptyState, styles.errorState, { backgroundColor: FacultyTheme.cardBg }]}>
            <Text style={[styles.errorStateText, { color: FacultyTheme.danger }]}>⚠️ Couldn't load the list</Text>
            <Text style={[styles.emptyStateSubText, { color: FacultyTheme.textSecondary }]}>{loadError}</Text>
          </View>
        ) : records.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: FacultyTheme.cardBg }]}>
            <Text style={[styles.emptyStateText, { color: FacultyTheme.textPrimary }]}>No one marked present yet</Text>
            <Text style={[styles.emptyStateSubText, { color: FacultyTheme.textSecondary }]}>Students will show up here as they scan the QR code.</Text>
          </View>
        ) : (
          records.map((record, index) => (
            <View key={record._id} style={[styles.card, { backgroundColor: FacultyTheme.cardBg, shadowColor: FacultyTheme.shadowColor }]}>
              <View style={[styles.rowIndex, { backgroundColor: FacultyTheme.successBg }]}>
                <Text style={[styles.rowIndexText, { color: FacultyTheme.success }]}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.studentName, { color: FacultyTheme.textPrimary }]}>{record.student?.name}</Text>
                <Text style={[styles.studentMeta, { color: FacultyTheme.textSecondary }]}>
                  {record.student?.rollNo} · {record.student?.branch}
                </Text>
              </View>
              <View style={styles.timeCol}>
                <Text style={[styles.scanTime, { color: FacultyTheme.textPrimary }]}>{formatTime(record.scannedAt)}</Text>
                <Text style={[styles.scanDistance, { color: FacultyTheme.textSecondary }]}>{record.distanceFromAnchor}m</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  countBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, minWidth: 34, alignItems: 'center' },
  countBadgeText: { fontWeight: '700', fontSize: 14 },
  scroll: { paddingHorizontal: 20, paddingBottom: 30 },
  emptyState: { borderRadius: 16, padding: 30, alignItems: 'center', marginTop: 40 },
  errorState: { borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  errorStateText: { fontSize: 16, fontWeight: '700' },
  emptyStateText: { fontSize: 17, fontWeight: '700' },
  emptyStateSubText: { fontSize: 14, marginTop: 6, textAlign: 'center' },
  card: { borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  rowIndex: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowIndexText: { fontSize: 12, fontWeight: '700' },
  studentName: { fontSize: 15, fontWeight: '700' },
  studentMeta: { fontSize: 12, marginTop: 2 },
  timeCol: { alignItems: 'flex-end' },
  scanTime: { fontSize: 13, fontWeight: '600' },
  scanDistance: { fontSize: 11, marginTop: 2 },
});

export default PresentListScreen;