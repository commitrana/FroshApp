import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useTheme } from '../../theme/theme';
import {
  FeedbackQuestionItem,
  getFeedbackForm,
  submitFeedback,
  SubmitFeedbackAnswer,
} from '../../services/feedback';

type RouteProps = RouteProp<RootStackParamList, 'GiveFeedback'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GiveFeedback'>;

const keyFor = (q: { source: string; order: number }) => `${q.source}-${q.order}`;

type AnswerValue = {
  textValue?: string;
  numberValue?: number;
  selectedOptions?: string[];
};

const isAnswered = (q: FeedbackQuestionItem, v: AnswerValue | undefined): boolean => {
  if (!v) return false;
  if (q.type === 'short_answer' || q.type === 'paragraph') return !!v.textValue && v.textValue.trim().length > 0;
  if (q.type === 'numerical' || q.type === 'linear_scale') return typeof v.numberValue === 'number';
  return !!v.selectedOptions && v.selectedOptions.length > 0;
};

const GiveFeedbackScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { sessionId } = route.params;
  const { colors, isDarkMode } = useTheme();

  const [subject, setSubject] = useState('');
  const [questions, setQuestions] = useState<FeedbackQuestionItem[]>([]);
  const [values, setValues] = useState<Record<string, AnswerValue>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Tracks whether feedback has actually been submitted, so the guard below
  // knows to let the "leave" navigation action through. A ref (not state)
  // because the beforeRemove listener closes over it and must read the
  // latest value without needing to be re-subscribed every render.
  const submittedRef = useRef(false);

  // Attendance isn't final until feedback is submitted (see /mark on the
  // backend — the scan alone only creates a pending record). Leaving this
  // screen any other way — header back button, Android hardware back
  // button, or the iOS swipe-back gesture — all funnel through this single
  // 'beforeRemove' event, so blocking it here covers all three at once.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (submittedRef.current) return; // already submitted — let them leave
      e.preventDefault();
      Alert.alert(
        "You haven't submitted feedback",
        "You won't be marked present for this class until you submit the feedback form. Please complete it to finish marking your attendance.",
        [{ text: 'OK' }]
      );
    });
    return unsubscribe;
  }, [navigation]);

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

  const setValue = (q: FeedbackQuestionItem, patch: AnswerValue) => {
    setValues((prev) => ({ ...prev, [keyFor(q)]: { ...prev[keyFor(q)], ...patch } }));
  };

  const toggleCheckbox = (q: FeedbackQuestionItem, option: string) => {
    const key = keyFor(q);
    const current = values[key]?.selectedOptions || [];
    const next = current.includes(option) ? current.filter((o) => o !== option) : [...current, option];
    setValue(q, { selectedOptions: next });
  };

  const allAnswered = questions.length > 0 && questions.every((q) => isAnswered(q, values[keyFor(q)]));

  const handleSubmit = async () => {
    if (!allAnswered) {
      Alert.alert('Answer required', 'Please answer every question before submitting.');
      return;
    }

    const answers: SubmitFeedbackAnswer[] = questions.map((q) => {
      const v = values[keyFor(q)] || {};
      return {
        source: q.source,
        order: q.order,
        textValue: v.textValue,
        numberValue: v.numberValue,
        selectedOptions: v.selectedOptions,
      };
    });

    try {
      setSubmitting(true);
      await submitFeedback(sessionId, answers);
      submittedRef.current = true;
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
          <Text style={[styles.hint, { color: colors.textSecondary }]}>All {questions.length} questions are mandatory.</Text>

          {questions.map((q, i) => {
            const key = keyFor(q);
            const v = values[key] || {};
            return (
              <View key={key} style={[styles.questionCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.questionLabel, { color: colors.primary }]}>
                  Question {i + 1} {q.source === 'admin' ? '· General' : '· This Class'}
                </Text>
                <Text style={[styles.questionText, { color: colors.textPrimary }]}>{q.text}</Text>

                {(q.type === 'short_answer' || q.type === 'paragraph') && (
                  <TextInput
                    style={[
                      styles.textAnswerInput,
                      q.type === 'paragraph' && styles.paragraphInput,
                      { color: colors.textPrimary, borderColor: colors.border },
                    ]}
                    placeholder={q.type === 'paragraph' ? 'Your answer' : 'Short answer'}
                    placeholderTextColor={colors.textMuted}
                    value={v.textValue || ''}
                    onChangeText={(text) => setValue(q, { textValue: text })}
                    multiline={q.type === 'paragraph'}
                  />
                )}

                {q.type === 'numerical' && (
                  <TextInput
                    style={[styles.textAnswerInput, { color: colors.textPrimary, borderColor: colors.border }]}
                    placeholder="Enter a number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={v.numberValue != null ? String(v.numberValue) : ''}
                    onChangeText={(text) => setValue(q, { numberValue: text === '' ? undefined : Number(text) })}
                  />
                )}

                {q.type === 'linear_scale' && (
                  <View style={styles.scaleRow}>
                    {Array.from({ length: q.scaleMax - q.scaleMin + 1 }, (_, idx) => q.scaleMin + idx).map((n) => {
                      const active = v.numberValue === n;
                      return (
                        <TouchableOpacity
                          key={n}
                          onPress={() => setValue(q, { numberValue: n })}
                          style={[
                            styles.scaleBubble,
                            { borderColor: colors.primary },
                            active && { backgroundColor: colors.primary },
                          ]}
                        >
                          <Text style={[styles.scaleBubbleText, { color: active ? 'white' : colors.primary }]}>{n}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {(q.type === 'multiple_choice' || q.type === 'dropdown') &&
                  q.options.map((opt) => {
                    const active = v.selectedOptions?.[0] === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={styles.choiceRow}
                        onPress={() => setValue(q, { selectedOptions: [opt] })}
                      >
                        <View style={[styles.radioOuter, { borderColor: colors.primary }]}>
                          {active && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                        </View>
                        <Text style={[styles.choiceText, { color: colors.textPrimary }]}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}

                {q.type === 'checkboxes' &&
                  q.options.map((opt) => {
                    const active = v.selectedOptions?.includes(opt) || false;
                    return (
                      <TouchableOpacity key={opt} style={styles.choiceRow} onPress={() => toggleCheckbox(q, opt)}>
                        <View style={[styles.checkboxOuter, { borderColor: colors.primary }, active && { backgroundColor: colors.primary }]}>
                          {active && <Text style={styles.checkboxTick}>✓</Text>}
                        </View>
                        <Text style={[styles.choiceText, { color: colors.textPrimary }]}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            );
          })}

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }, (!allAnswered || submitting) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!allAnswered || submitting}
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
  textAnswerInput: { fontSize: 14, minHeight: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, textAlignVertical: 'top' },
  paragraphInput: { minHeight: 80 },
  scaleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scaleBubble: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  scaleBubbleText: { fontSize: 14, fontWeight: '700' },
  choiceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  checkboxOuter: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxTick: { color: 'white', fontSize: 13, fontWeight: '700' },
  choiceText: { fontSize: 14, flex: 1 },
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