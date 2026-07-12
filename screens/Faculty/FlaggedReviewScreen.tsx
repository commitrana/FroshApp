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
import { RootStackParamList } from '../../types/navigation';
import Theme from '../../theme/theme';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { FlaggedRecord, getFlaggedRecords, reviewAttendanceRecord } from '../../services/attendance';

type RouteProps = RouteProp<RootStackParamList, 'FlaggedReview'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FlaggedReview'>;

const FlaggedReviewScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { sessionId } = route.params;

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
        <Text style={styles.headerTitle}>Flagged for Review</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9CA3AF" />}
      >
        {records.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nothing to review 🎉</Text>
            <Text style={styles.emptyStateSubText}>All scans are within range.</Text>
          </View>
        ) : (
          records.map((record) => (
            <View key={record._id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{record.student?.name}</Text>
                  <Text style={styles.studentMeta}>
                    {record.student?.rollNo} · {record.student?.branch}
                  </Text>
                </View>
                <View style={[styles.reasonChip, record.status === 'rejected' && styles.reasonChipRejected]}>
                  <Text style={styles.reasonChipText}>{reasonFor(record)}</Text>
                </View>
              </View>

              {record.reviewedByProfessor ? (
                <View style={styles.resolvedRow}>
                  <Text style={styles.resolvedText}>
                    ✅ Marked {record.finalStatus === 'present' ? 'Present' : 'Absent'}
                  </Text>
                </View>
              ) : (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.approveBtn}
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
                    style={styles.rejectBtn}
                    disabled={actingOnId === record._id}
                    onPress={() => handleResolve(record._id, 'absent')}
                  >
                    <Text style={styles.rejectBtnText}>Mark Absent</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: 'white',
    fontSize: 20,
  },
  backBtnPlaceholder: {
    width: 36,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  emptyState: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyStateText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  emptyStateSubText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 6,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  studentMeta: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
  reasonChip: {
    backgroundColor: 'rgba(255,204,0,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  reasonChipRejected: {
    backgroundColor: 'rgba(255,59,48,0.15)',
  },
  reasonChipText: {
    color: Theme.colors.warning,
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
  },
  approveBtn: {
    flex: 1,
    backgroundColor: Theme.colors.success,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  approveBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  rejectBtnText: {
    color: '#9CA3AF',
    fontWeight: '700',
    fontSize: 14,
  },
  resolvedRow: {
    paddingTop: 4,
  },
  resolvedText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default FlaggedReviewScreen;
