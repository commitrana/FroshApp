import React, { useEffect, useState } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { getSlotFeedbackQuestions, setSlotFeedbackQuestions, QuestionDef, QuestionType } from '../../services/feedback';
import { useFacultyTheme } from '../../constants/facultyTheme';

type RouteProps = RouteProp<RootStackParamList, 'FeedbackQuestions'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FeedbackQuestions'>;

const QUESTION_COUNT = 5;

const TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'short_answer', label: 'Short answer' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'checkboxes', label: 'Checkboxes' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'linear_scale', label: 'Linear scale' },
  { value: 'numerical', label: 'Numerical' },
];

const CHOICE_TYPES: QuestionType[] = ['multiple_choice', 'checkboxes', 'dropdown'];

type DraftQuestion = {
  text: string;
  type: QuestionType;
  options: string[];
  scaleMin: number;
  scaleMax: number;
};

const emptyQuestion = (): DraftQuestion => ({
  text: '',
  type: 'linear_scale',
  options: ['', ''],
  scaleMin: 1,
  scaleMax: 5,
});

const FeedbackQuestionsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { day, slot, subject, sessionId } = route.params;
  const FacultyTheme = useFacultyTheme();

  const [questions, setQuestions] = useState<DraftQuestion[]>(
    Array.from({ length: QUESTION_COUNT }, emptyQuestion)
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing = await getSlotFeedbackQuestions(day, slot);
        if (cancelled) return;
        if (existing.length === 5) {
          setQuestions(
            existing.map((q) => ({
              text: q.text,
              type: q.type,
              options: q.options && q.options.length >= 2 ? q.options : ['', ''],
              scaleMin: q.scaleMin ?? 1,
              scaleMax: q.scaleMax ?? 5,
            }))
          );
        }
      } catch (error) {
        console.log('Error loading slot feedback questions:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [day, slot]);

  const updateQuestion = (index: number, patch: Partial<DraftQuestion>) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.map((o, oi) => (oi === optIndex ? value : o)) } : q
      )
    );
  };

  const addOption = (qIndex: number) => {
    setQuestions((prev) => prev.map((q, i) => (i === qIndex ? { ...q, options: [...q.options, ''] } : q)));
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, options: q.options.filter((_, oi) => oi !== optIndex) } : q))
    );
  };

  const handleSave = async () => {
    for (const q of questions) {
      if (!q.text.trim()) {
        Alert.alert('All 5 required', 'Please fill in all 5 feedback questions.');
        return;
      }
      if (CHOICE_TYPES.includes(q.type)) {
        const filled = q.options.map((o) => o.trim()).filter(Boolean);
        if (filled.length < 2) {
          Alert.alert('Options needed', `"${q.text}" needs at least 2 options.`);
          return;
        }
      }
      if (q.type === 'linear_scale' && q.scaleMin >= q.scaleMax) {
        Alert.alert('Invalid scale', `"${q.text}" has an invalid scale range.`);
        return;
      }
    }

    const payload: QuestionDef[] = questions.map((q) => ({
      text: q.text.trim(),
      type: q.type,
      options: CHOICE_TYPES.includes(q.type) ? q.options.map((o) => o.trim()).filter(Boolean) : undefined,
      scaleMin: q.type === 'linear_scale' ? q.scaleMin : undefined,
      scaleMax: q.type === 'linear_scale' ? q.scaleMax : undefined,
    }));

    try {
      setSaving(true);
      await setSlotFeedbackQuestions(day, slot, payload, sessionId);
      Alert.alert('Questions saved', sessionId
        ? 'Students will see the updated questions right away.'
        : 'Students will be asked these right after marking attendance for this class.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Could not save questions.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: FacultyTheme.pageBg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: FacultyTheme.cardBg, shadowColor: FacultyTheme.shadowColor }]}>
          <Ionicons name="arrow-back" size={20} color={FacultyTheme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: FacultyTheme.textPrimary }]}>Feedback Questions</Text>
          <Text style={[styles.headerSubtitle, { color: FacultyTheme.textSecondary }]}>{subject}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={FacultyTheme.accent} size="large" style={{ marginTop: 40 }} />
      ) : (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.hint, { color: FacultyTheme.textSecondary }]}>
            Add exactly 5 questions for this class — pick any question type per question, just
            like Google Forms. Students answer these (plus 5 fixed admin questions) right after
            marking attendance, and must submit them before attendance is marked.
          </Text>

          {questions.map((q, i) => (
            <View key={i} style={[styles.questionCard, { backgroundColor: FacultyTheme.cardBg, shadowColor: FacultyTheme.shadowColor }]}>
              <Text style={[styles.questionLabel, { color: FacultyTheme.accent }]}>Question {i + 1}</Text>
              <TextInput
                style={[styles.input, { color: FacultyTheme.textPrimary }]}
                placeholder="e.g. Was the pace of the class appropriate?"
                placeholderTextColor={FacultyTheme.textSecondary}
                value={q.text}
                onChangeText={(text) => updateQuestion(i, { text })}
                multiline
              />

              <View style={styles.typeRow}>
                {TYPE_OPTIONS.map((opt) => {
                  const active = q.type === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() =>
                        updateQuestion(i, {
                          type: opt.value,
                          options: CHOICE_TYPES.includes(opt.value) && q.options.length < 2 ? ['', ''] : q.options,
                        })
                      }
                      style={[
                        styles.typeChip,
                        { borderColor: FacultyTheme.accent },
                        active && { backgroundColor: FacultyTheme.accent },
                      ]}
                    >
                      <Text style={[styles.typeChipText, { color: active ? 'white' : FacultyTheme.accent }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {CHOICE_TYPES.includes(q.type) && (
                <View style={styles.optionsBlock}>
                  {q.options.map((opt, oi) => (
                    <View key={oi} style={styles.optionRow}>
                      <TextInput
                        style={[styles.optionInput, { color: FacultyTheme.textPrimary, borderColor: FacultyTheme.textSecondary }]}
                        placeholder={`Option ${oi + 1}`}
                        placeholderTextColor={FacultyTheme.textSecondary}
                        value={opt}
                        onChangeText={(text) => updateOption(i, oi, text)}
                      />
                      {q.options.length > 2 && (
                        <TouchableOpacity onPress={() => removeOption(i, oi)} style={styles.removeOptBtn}>
                          <Ionicons name="close-circle" size={20} color={FacultyTheme.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  <TouchableOpacity onPress={() => addOption(i)}>
                    <Text style={[styles.addOptText, { color: FacultyTheme.accent }]}>+ Add option</Text>
                  </TouchableOpacity>
                </View>
              )}

              {q.type === 'linear_scale' && (
                <View style={styles.scaleRow}>
                  <Text style={[styles.scaleLabel, { color: FacultyTheme.textSecondary }]}>Scale:</Text>
                  <TextInput
                    style={[styles.scaleInput, { color: FacultyTheme.textPrimary, borderColor: FacultyTheme.textSecondary }]}
                    keyboardType="number-pad"
                    value={String(q.scaleMin)}
                    onChangeText={(t) => updateQuestion(i, { scaleMin: parseInt(t, 10) || 1 })}
                  />
                  <Text style={[styles.scaleLabel, { color: FacultyTheme.textSecondary }]}>to</Text>
                  <TextInput
                    style={[styles.scaleInput, { color: FacultyTheme.textPrimary, borderColor: FacultyTheme.textSecondary }]}
                    keyboardType="number-pad"
                    value={String(q.scaleMax)}
                    onChangeText={(t) => updateQuestion(i, { scaleMax: parseInt(t, 10) || 5 })}
                  />
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: FacultyTheme.accent }, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Save Questions</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  hint: { fontSize: 13, lineHeight: 19, marginBottom: 20 },
  questionCard: { borderRadius: 16, padding: 14, marginBottom: 14, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  questionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  input: { fontSize: 15, minHeight: 44, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1.5 },
  typeChipText: { fontSize: 12, fontWeight: '600' },
  optionsBlock: { marginTop: 12 },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  optionInput: { flex: 1, fontSize: 14, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  removeOptBtn: { marginLeft: 8 },
  addOptText: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  scaleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  scaleLabel: { fontSize: 13 },
  scaleInput: { width: 50, fontSize: 14, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, textAlign: 'center' },
  saveButton: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
});

export default FeedbackQuestionsScreen;