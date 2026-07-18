import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useTheme } from '../../theme/theme'; // ← Changed
import {
  FeedbackQuestionItem,
  getFeedbackForm,
  submitFeedback,
  SubmitFeedbackAnswer,
} from '../../services/feedback';

type RouteProps = RouteProp<RootStackParamList, 'GiveFeedback'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GiveFeedback'>;

const keyFor = (q: { source: string; order: number }) => `${q.source}-${q.order}`;

const GiveFeedbackScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { sessionId } = route.params;
  const { colors, isDarkMode } = useTheme(); // ← Added

  const [subject, setSubject] = useState('');
  const [questions, setQuestions] = useState<FeedbackQuestionItem[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const data = await getFeedbackForm(sessionId);
          if (cancelled) return;
          setSubject(data.session.subject);
          setQuestions(data.questions);
          setLoadError(null);
        } catch (error: any) {
          if (cancelled) return;
          setLoadError(error?.response?.data?.error || 'Could not load the feedback form.');
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [sessionId])
  );

  const setRating = (q: FeedbackQuestionItem, value: number) => {
    setRatings((prev) => ({ ...prev, [keyFor(q)]: value }));
  };

  const setComment = (q: FeedbackQuestionItem, value: string) => {
    setComments((prev) => ({ ...prev, [keyFor(q)]: value }));
  };

  const allRated = questions.length > 0 && questions.every((q) => !!ratings[keyFor(q)]);

  const handleSubmit = async () => {
    if (!allRated) {
      Alert.alert('Rating required', 'Please give a rating (1–5) for every question before submitting.');
      return;
    }

    const answers: SubmitFeedbackAnswer[] = questions.map((q) => ({
      source: q.source,
      order: q.order,
      rating: ratings[keyFor(q)],
      comment: comments[keyFor(q)] || '',
    }));

    try {
      setSubmitting(true);
      await submitFeedback(sessionId, answers);
      Alert.alert('Thank you!', 'Your feedback has been submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Could not submit feedback. Please try again.';
      Alert.alert('Submission failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
            <Text style={[styles.backBtnText, { color: colors.textPrimary }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Give Feedback</Text>
        </View>
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Text style={styles.errorStateText}>⚠️ {loadError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <Text style={[styles.backBtnText, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Give Feedback</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{subject}</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.hint, { color: colors.textSecondary }]}>All {questions.length} questions are mandatory. Comments are optional.</Text>

          {questions.map((q, i) => {
            const key = keyFor(q);
            const rating = ratings[key] || 0;
            return (
              <View key={key} style={[styles.questionCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.questionLabel, { color: colors.primary }]}>
                  Question {i + 1} {q.source === 'admin' ? '· General' : '· This Class'}
                </Text>
                <Text style={[styles.questionText, { color: colors.textPrimary }]}>{q.text}</Text>

                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(q, star)} style={styles.starBtn}>
                      <Text style={[styles.star, star <= rating && styles.starFilled]}>★</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={[styles.commentInput, { color: colors.textPrimary, borderTopColor: colors.border }]}
                  placeholder="Add a comment (optional)"
                  placeholderTextColor={colors.textMuted}
                  value={comments[key] || ''}
                  onChangeText={(text) => setComment(q, text)}
                  multiline
                />
              </View>
            );
          })}

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }, (!allRated || submitting) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!allRated || submitting}
          >
            {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Submit Feedback</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backBtnText: { fontSize: 20 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  hint: { fontSize: 13, marginBottom: 18 },
  emptyState: { borderRadius: 12, padding: 30, alignItems: 'center', margin: 20 },
  errorStateText: { color: '#EF4444', fontSize: 15, textAlign: 'center' },
  questionCard: { borderRadius: 14, padding: 14, marginBottom: 14 },
  questionLabel: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  questionText: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  starsRow: { flexDirection: 'row', marginBottom: 10 },
  starBtn: { padding: 4 },
  star: { fontSize: 30, color: '#374151' },
  starFilled: { color: '#FBBF24' },
  commentInput: {
    fontSize: 14,
    minHeight: 40,
    textAlignVertical: 'top',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
});

export default GiveFeedbackScreen;