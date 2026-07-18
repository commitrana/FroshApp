import React, { useState } from 'react';
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
import { setSessionFeedbackQuestions } from '../../services/feedback';
import { useFacultyTheme } from '../../constants/facultyTheme'; // ← Changed

type RouteProps = RouteProp<RootStackParamList, 'FeedbackQuestions'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FeedbackQuestions'>;

const QUESTION_COUNT = 5;

const FeedbackQuestionsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { sessionId, subject } = route.params;
  const FacultyTheme = useFacultyTheme(); // ← Added

  const [questions, setQuestions] = useState<string[]>(Array(QUESTION_COUNT).fill(''));
  const [saving, setSaving] = useState(false);

  const updateQuestion = (index: number, value: string) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? value : q)));
  };

  const handleSave = async () => {
    const trimmed = questions.map((q) => q.trim());
    if (trimmed.some((q) => !q)) {
      Alert.alert('All 5 required', 'Please fill in all 5 feedback questions.');
      return;
    }

    try {
      setSaving(true);
      await setSessionFeedbackQuestions(sessionId, trimmed);
      Alert.alert('Questions saved', 'Tap "Start Feedback" on the session screen to open it to students.', [
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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.hint, { color: FacultyTheme.textSecondary }]}>
            Add exactly 5 questions for this session. Students will rate each 1–5 with an
            optional comment, along with the 5 fixed questions set by the admin.
          </Text>

          {questions.map((q, i) => (
            <View key={i} style={[styles.questionCard, { backgroundColor: FacultyTheme.cardBg, shadowColor: FacultyTheme.shadowColor }]}>
              <Text style={[styles.questionLabel, { color: FacultyTheme.accent }]}>Question {i + 1}</Text>
              <TextInput
                style={[styles.input, { color: FacultyTheme.textPrimary }]}
                placeholder="e.g. Was the pace of the class appropriate?"
                placeholderTextColor={FacultyTheme.textSecondary}
                value={q}
                onChangeText={(text) => updateQuestion(i, text)}
                multiline
              />
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
  saveButton: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
});

export default FeedbackQuestionsScreen;