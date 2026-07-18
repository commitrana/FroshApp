import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { FacultyFeedbackResponses, getFacultyFeedbackResponses } from '../../services/feedback';
import { useFacultyTheme } from '../../constants/facultyTheme'; // ← Changed

type RouteProps = RouteProp<RootStackParamList, 'FeedbackResponses'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FeedbackResponses'>;

const FeedbackResponsesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { sessionId } = route.params;
  const FacultyTheme = useFacultyTheme(); // ← Added

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
          <Text style={[styles.headerTitle, { color: FacultyTheme.textPrimary }]}>Feedback Responses</Text>
          {data?.subject ? <Text style={[styles.headerSubtitle, { color: FacultyTheme.textSecondary }]}>{data.subject}</Text> : null}
        </View>
        <View style={[styles.countBadge, { backgroundColor: 'rgba(55,148,255,0.1)' }]}>
          <Text style={[styles.countBadgeText, { color: FacultyTheme.accent }]}>{data?.count ?? 0}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={FacultyTheme.accent} />}
      >
        {loadError ? (
          <View style={[styles.emptyState, styles.errorState, { backgroundColor: FacultyTheme.cardBg }]}>
            <Text style={[styles.errorStateText, { color: FacultyTheme.danger }]}>Couldn't load responses</Text>
            <Text style={[styles.emptyStateSubText, { color: FacultyTheme.textSecondary }]}>{loadError}</Text>
          </View>
        ) : !data || data.count === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: FacultyTheme.cardBg }]}>
            <Text style={[styles.emptyStateText, { color: FacultyTheme.textPrimary }]}>No feedback yet</Text>
            <Text style={[styles.emptyStateSubText, { color: FacultyTheme.textSecondary }]}>
              Responses will appear here as students submit feedback for this session.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: FacultyTheme.textPrimary }]}>Average Ratings</Text>
            {questionAverages.map((q) => (
              <View key={q.order} style={[styles.avgCard, { backgroundColor: FacultyTheme.cardBg, shadowColor: FacultyTheme.shadowColor }]}>
                <Text style={[styles.avgQuestionText, { color: FacultyTheme.textSecondary }]}>{q.text}</Text>
                <Text style={[styles.avgValue, { color: FacultyTheme.success }]}>{q.avg != null ? `⭐ ${q.avg.toFixed(1)}` : '—'}</Text>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { color: FacultyTheme.textPrimary }, { marginTop: 20 }]}>All Responses</Text>
            {data.responses.map((r) => (
              <View key={r._id} style={[styles.responseCard, { backgroundColor: FacultyTheme.cardBg, shadowColor: FacultyTheme.shadowColor }]}>
                <Text style={[styles.studentName, { color: FacultyTheme.textPrimary }]}>{r.student?.name}</Text>
                <Text style={[styles.studentMeta, { color: FacultyTheme.textSecondary }]}>
                  {r.student?.rollNo} · {r.student?.branch}
                </Text>
                {r.answers.map((a) => (
                  <View key={a.order} style={styles.answerRow}>
                    <Text style={[styles.answerQuestion, { color: FacultyTheme.textSecondary }]}>{a.questionText}</Text>
                    <Text style={[styles.answerRating, { color: FacultyTheme.warning }]}>{'⭐'.repeat(a.rating)}</Text>
                    {a.comment ? <Text style={[styles.answerComment, { color: FacultyTheme.textSecondary }]}>“{a.comment}”</Text> : null}
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
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  avgCard: { borderRadius: 14, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  avgQuestionText: { fontSize: 13, flex: 1, marginRight: 10 },
  avgValue: { fontSize: 14, fontWeight: '700' },
  responseCard: { borderRadius: 16, padding: 14, marginBottom: 12, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  studentName: { fontSize: 15, fontWeight: '700' },
  studentMeta: { fontSize: 12, marginTop: 2, marginBottom: 10 },
  answerRow: { marginTop: 8 },
  answerQuestion: { fontSize: 13, fontWeight: '600' },
  answerRating: { fontSize: 13, marginTop: 2 },
  answerComment: { fontSize: 12, marginTop: 2, fontStyle: 'italic' },
});

export default FeedbackResponsesScreen;