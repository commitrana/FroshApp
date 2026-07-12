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
import { RootStackParamList } from '../../types/navigation';
import Theme from '../../theme/theme';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { PresentRecord, getPresentRecords } from '../../services/attendance';

type RouteProps = RouteProp<RootStackParamList, 'PresentList'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PresentList'>;

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const PresentListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { sessionId, subject } = route.params;

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

  // Keep the list live while the session is still running.
  useAutoRefresh(fetchRecords, 8000);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecords();
    setRefreshing(false);
  }, [fetchRecords]);

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
          <Text style={styles.headerTitle}>Present Students</Text>
          {subject ? <Text style={styles.headerSubtitle}>{subject}</Text> : null}
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{records.length}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9CA3AF" />}
      >
        {loadError ? (
          <View style={[styles.emptyState, styles.errorState]}>
            <Text style={styles.errorStateText}>⚠️ Couldn't load the list</Text>
            <Text style={styles.emptyStateSubText}>{loadError}</Text>
          </View>
        ) : records.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No one marked present yet</Text>
            <Text style={styles.emptyStateSubText}>Students will show up here as they scan the QR code.</Text>
          </View>
        ) : (
          records.map((record, index) => (
            <View key={record._id} style={styles.card}>
              <View style={styles.rowIndex}>
                <Text style={styles.rowIndexText}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{record.student?.name}</Text>
                <Text style={styles.studentMeta}>
                  {record.student?.rollNo} · {record.student?.branch}
                </Text>
              </View>
              <View style={styles.timeCol}>
                <Text style={styles.scanTime}>{formatTime(record.scannedAt)}</Text>
                <Text style={styles.scanDistance}>{record.distanceFromAnchor}m</Text>
              </View>
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
    minWidth: 34,
    alignItems: 'center',
  },
  countBadgeText: {
    color: Theme.colors.success,
    fontWeight: '700',
    fontSize: 14,
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
  errorState: {
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  errorStateText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
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
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(52,211,153,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowIndexText: {
    color: Theme.colors.success,
    fontSize: 12,
    fontWeight: '700',
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
  timeCol: {
    alignItems: 'flex-end',
  },
  scanTime: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '600',
  },
  scanDistance: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
  },
});

export default PresentListScreen;