// Save as: src/screens/Faculty/FeedbackQuestionsScreen.tsx
// LOGIC ZONE copied unchanged: setSessionFeedbackQuestions save + 5-question
// validation. Only JSX/styles were restyled.

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
import FacultyTheme from '../../constants/facultyTheme';

type RouteProps = RouteProp<RootStackParamList, 'FeedbackQuestions'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FeedbackQuestions'>;

const QUESTION_COUNT = 5;

// ============ LOGIC ZONE (unchanged) ============
const FeedbackQuestionsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { sessionId, subject } = route.params;

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
  // ============ END LOGIC ZONE ============

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={FacultyTheme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Feedback Questions</Text>
          <Text style={styles.headerSubtitle}>{subject}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.hint}>
            Add exactly 5 questions for this session. Students will rate each 1–5 with an
            optional comment, along with the 5 fixed questions set by the admin.
          </Text>

          {questions.map((q, i) => (
            <View key={i} style={styles.questionCard}>
              <Text style={styles.questionLabel}>Question {i + 1}</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Was the pace of the class appropriate?"
                placeholderTextColor={FacultyTheme.textSecondary}
                value={q}
                onChangeText={(text) => updateQuestion(i, text)}
                multiline
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
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
  container: { flex: 1, backgroundColor: FacultyTheme.pageBg },
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
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  hint: {
    color: FacultyTheme.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  questionCard: {
    backgroundColor: FacultyTheme.cardBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: FacultyTheme.shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  questionLabel: {
    color: FacultyTheme.accent,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    color: FacultyTheme.textPrimary,
    fontSize: 15,
    minHeight: 44,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: FacultyTheme.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
});

export default FeedbackQuestionsScreen;