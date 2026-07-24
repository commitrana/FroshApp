import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { FlaggedRecord, getFlaggedRecords, reviewAttendanceRecord } from '../../services/attendance';
import { useFacultyTheme } from '../../constants/facultyTheme';

type RouteProps = RouteProp<RootStackParamList, 'FlaggedReview'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FlaggedReview'>;

const FlaggedReviewScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { sessionId } = route.params;
  const FacultyTheme = useFacultyTheme();

  const [records, setRecords] = useState<FlaggedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingOnId, setActingOnId] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      const data = await getFlaggedRecords(sessionId);
      setRecords(data);
    } catch (error) {
      console.log('Error fetching flagged records:', error);
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

  const handleResolve = async (recordId: string, finalStatus: 'present' | 'absent') => {
    try {
      setActingOnId(recordId);
      await reviewAttendanceRecord(sessionId, recordId, finalStatus);
      await fetchRecords();
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Could not update this record.';
      Alert.alert('Error', message);
    } finally {
      setActingOnId(null);
    }
  };

  const reasonFor = (record: FlaggedRecord) =>
    record.status === 'flagged'
      ? `Borderline — ${record.distanceFromAnchor}m away`
      : `Too far — ${record.distanceFromAnchor}m away`;

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
        <Text style={[styles.headerTitle, { color: FacultyTheme.textPrimary }]}>Flagged for Review</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={FacultyTheme.accent} />}
      >
        {records.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: FacultyTheme.cardBg }]}>
            <Text style={[styles.emptyStateText, { color: FacultyTheme.textPrimary }]}>Nothing to review </Text>
            <Text style={[styles.emptyStateSubText, { color: FacultyTheme.textSecondary }]}>All scans are within range.</Text>
          </View>
        ) : (
          records.map((record) => (
            <View key={record._id} style={[styles.card, { backgroundColor: FacultyTheme.cardBg, shadowColor: FacultyTheme.shadowColor }]}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.studentName, { color: FacultyTheme.textPrimary }]}>{record.student?.name}</Text>
                  <Text style={[styles.studentMeta, { color: FacultyTheme.textSecondary }]}>
                    {record.student?.rollNo} · {record.student?.branch}
                  </Text>
                </View>
                <View style={[
                  styles.reasonChip, 
                  { backgroundColor: record.status === 'rejected' ? FacultyTheme.dangerBg : FacultyTheme.warningBg }
                ]}>
                  <Text style={[
                    styles.reasonChipText, 
                    { color: record.status === 'rejected' ? FacultyTheme.danger : FacultyTheme.warning }
                  ]}>
                    {reasonFor(record)}
                  </Text>
                </View>
              </View>

              {record.reviewedByProfessor ? (
                <View style={styles.resolvedRow}>
                  <Text style={[styles.resolvedText, { color: FacultyTheme.textSecondary }]}>
                     Marked {record.finalStatus === 'present' ? 'Present' : 'Absent'}
                  </Text>
                </View>
              ) : (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.approveBtn, { backgroundColor: FacultyTheme.success }]}
                    disabled={actingOnId === record._id}
                    onPress={() => handleResolve(record._id, 'present')}
                  >
                    {actingOnId === record._id ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.approveBtnText}>Mark Present</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectBtn, { borderColor: FacultyTheme.lineColor }]}
                    disabled={actingOnId === record._id}
                    onPress={() => handleResolve(record._id, 'absent')}
                  >
                    <Text style={[styles.rejectBtnText, { color: FacultyTheme.textSecondary }]}>Mark Absent</Text>
                  </TouchableOpacity>
                </View>
              )}
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
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    paddingBottom: 15 
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowOpacity: 0.12, 
    shadowRadius: 8, 
    shadowOffset: { width: 0, height: 2 }, 
    elevation: 3 
  },
  backBtnPlaceholder: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { paddingHorizontal: 20, paddingBottom: 30 },
  emptyState: { borderRadius: 16, padding: 30, alignItems: 'center', marginTop: 40 },
  emptyStateText: { fontSize: 17, fontWeight: '700' },
  emptyStateSubText: { fontSize: 14, marginTop: 6 },
  card: { 
    borderRadius: 18, 
    padding: 16, 
    marginBottom: 14, 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 3 
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  studentName: { fontSize: 16, fontWeight: '700' },
  studentMeta: { fontSize: 13, marginTop: 2 },
  reasonChip: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  reasonChipText: { fontSize: 11, fontWeight: '700' },
  actionsRow: { flexDirection: 'row' },
  approveBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginRight: 8 },
  approveBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  rejectBtn: { flex: 1, backgroundColor: 'transparent', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1 },
  rejectBtnText: { fontWeight: '700', fontSize: 14 },
  resolvedRow: { paddingTop: 4 },
  resolvedText: { fontSize: 13, fontWeight: '600' },
});

export default FlaggedReviewScreen;