// Save as: src/screens/Faculty/FeedbackResponsesScreen.tsx
// LOGIC ZONE copied unchanged: average-rating computation, response list.
// Only JSX/styles were restyled.

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { FacultyFeedbackResponses, getFacultyFeedbackResponses } from '../../services/feedback';
import FacultyTheme from '../../constants/facultyTheme';

type RouteProps = RouteProp<RootStackParamList, 'FeedbackResponses'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FeedbackResponses'>;

// ============ LOGIC ZONE (unchanged) ============
const FeedbackResponsesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { sessionId } = route.params;

  const [data, setData] = useState<FacultyFeedbackResponses | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const result = await getFacultyFeedbackResponses(sessionId);
      setData(result);
      setLoadError(null);
    } catch (error: any) {
      setLoadError(error?.response?.data?.error || 'Could not load responses.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

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

  const questionAverages = data
    ? data.questions.map((q) => {
        const ratings = data.responses
          .flatMap((r) => r.answers)
          .filter((a) => a.order === q.order)
          .map((a) => a.rating);
        const avg = ratings.length ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;
        return { ...q, avg };
      })
    : [];
  // ============ END LOGIC ZONE ============

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
          <Text style={styles.headerTitle}>Feedback Responses</Text>
          {data?.subject ? <Text style={styles.headerSubtitle}>{data.subject}</Text> : null}
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{data?.count ?? 0}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={FacultyTheme.accent} />}
      >
        {loadError ? (
          <View style={[styles.emptyState, styles.errorState]}>
            <Text style={styles.errorStateText}>Couldn't load responses</Text>
            <Text style={styles.emptyStateSubText}>{loadError}</Text>
          </View>
        ) : !data || data.count === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No feedback yet</Text>
            <Text style={styles.emptyStateSubText}>
              Responses will appear here as students submit feedback for this session.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Average Ratings</Text>
            {questionAverages.map((q) => (
              <View key={q.order} style={styles.avgCard}>
                <Text style={styles.avgQuestionText}>{q.text}</Text>
                <Text style={styles.avgValue}>{q.avg != null ? `⭐ ${q.avg.toFixed(1)}` : '—'}</Text>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>All Responses</Text>
            {data.responses.map((r) => (
              <View key={r._id} style={styles.responseCard}>
                <Text style={styles.studentName}>{r.student?.name}</Text>
                <Text style={styles.studentMeta}>
                  {r.student?.rollNo} · {r.student?.branch}
                </Text>
                {r.answers.map((a) => (
                  <View key={a.order} style={styles.answerRow}>
                    <Text style={styles.answerQuestion}>{a.questionText}</Text>
                    <Text style={styles.answerRating}>{'⭐'.repeat(a.rating)}</Text>
                    {a.comment ? <Text style={styles.answerComment}>“{a.comment}”</Text> : null}
                  </View>
                ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FacultyTheme.pageBg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: FacultyTheme.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: FacultyTheme.shadowColor,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerTitle: { color: FacultyTheme.textPrimary, fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: FacultyTheme.textSecondary, fontSize: 13, marginTop: 2 },
  countBadge: {
    backgroundColor: 'rgba(55,148,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 34,
    alignItems: 'center',
  },
  countBadgeText: { color: FacultyTheme.accent, fontWeight: '700', fontSize: 14 },
  scroll: { paddingHorizontal: 20, paddingBottom: 30 },
  emptyState: {
    backgroundColor: FacultyTheme.cardBg,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 40,
  },
  errorState: { borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  errorStateText: { color: FacultyTheme.danger, fontSize: 16, fontWeight: '700' },
  emptyStateText: { color: FacultyTheme.textPrimary, fontSize: 17, fontWeight: '700' },
  emptyStateSubText: { color: FacultyTheme.textSecondary, fontSize: 14, marginTop: 6, textAlign: 'center' },
  sectionTitle: { color: FacultyTheme.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  avgCard: {
    backgroundColor: FacultyTheme.cardBg,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: FacultyTheme.shadowColor,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  avgQuestionText: { color: FacultyTheme.textSecondary, fontSize: 13, flex: 1, marginRight: 10 },
  avgValue: { color: FacultyTheme.success, fontSize: 14, fontWeight: '700' },
  responseCard: {
    backgroundColor: FacultyTheme.cardBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: FacultyTheme.shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  studentName: { color: FacultyTheme.textPrimary, fontSize: 15, fontWeight: '700' },
  studentMeta: { color: FacultyTheme.textSecondary, fontSize: 12, marginTop: 2, marginBottom: 10 },
  answerRow: { marginTop: 8 },
  answerQuestion: { color: FacultyTheme.textSecondary, fontSize: 13, fontWeight: '600' },
  answerRating: { color: FacultyTheme.warning, fontSize: 13, marginTop: 2 },
  answerComment: { color: FacultyTheme.textSecondary, fontSize: 12, marginTop: 2, fontStyle: 'italic' },
});

export default FeedbackResponsesScreen;