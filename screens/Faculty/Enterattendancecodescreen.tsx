import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { RootStackParamList } from '../../types/navigation';
import { useTheme } from '../../theme/theme';
import { markAttendance, MarkAttendanceResult } from '../../services/attendance';

// Codes are generated server-side from this same alphabet (no 0/O, 1/I/L),
// but we don't hard-restrict typing to it — just uppercase + trim before
// submitting, and let the server be the source of truth on validity.
const CODE_LENGTH = 6;

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EnterAttendanceCode'>;

const EnterAttendanceCodeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<MarkAttendanceResult | null>(null);

  const handleSubmit = async () => {
    const trimmed = code.trim();
    if (trimmed.length < CODE_LENGTH) {
      Alert.alert('Enter the full code', `The attendance code is ${CODE_LENGTH} characters.`);
      return;
    }
    if (processing) return;
    setProcessing(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission required', 'Location access is needed to mark attendance.');
        setProcessing(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const data = await markAttendance({
        code: trimmed,
        studentGPS: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        studentAccuracy: position.coords.accuracy ?? 20,
      });

      setResult(data);
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Could not mark attendance. Please try again.';
      Alert.alert('Could not mark attendance', message);
    } finally {
      setProcessing(false);
    }
  };

  const handleTryAgain = () => {
    setResult(null);
    setCode('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  if (result) {
    const isPresent = result.status === 'present';
    const isFlagged = result.status === 'flagged';

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.resultBox}>
          <Text style={styles.resultIcon}>{isPresent ? '✅' : isFlagged ? '⚠️' : '❌'}</Text>
          <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>
            {isPresent ? 'Marked Present' : isFlagged ? 'Pending Review' : 'Not Verified'}
          </Text>
          <Text style={[styles.resultMessage, { color: colors.textSecondary }]}>{result.message}</Text>

          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
          {!isPresent && (
            <TouchableOpacity style={styles.scanAgainBtn} onPress={handleTryAgain}>
              <Text style={[styles.scanAgainBtnText, { color: colors.textSecondary }]}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={[styles.closeBtnText, { color: colors.textPrimary }]}>✕</Text>
        </TouchableOpacity>

        <View style={styles.formBox}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Enter Attendance Code</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Ask your professor for today's code
          </Text>

          <TextInput
            ref={inputRef}
            style={[
              styles.codeInput,
              { color: colors.textPrimary, borderColor: colors.primary, backgroundColor: colors.background },
            ]}
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase().replace(/\s/g, '').slice(0, CODE_LENGTH))}
            placeholder="------"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={CODE_LENGTH}
            autoFocus
            editable={!processing}
            onSubmitEditing={handleSubmit}
          />

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: colors.primary },
              (processing || code.length < CODE_LENGTH) && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={processing || code.length < CODE_LENGTH}
          >
            {processing ? (
              <View style={styles.processingRow}>
                <ActivityIndicator color="white" />
                <Text style={styles.submitBtnText}>Verifying location…</Text>
              </View>
            ) : (
              <Text style={styles.submitBtnText}>Mark Attendance</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeBtn: {
    marginTop: 12,
    marginLeft: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 18,
  },
  formBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
  },
  codeInput: {
    width: '100%',
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 18,
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 12,
    marginBottom: 24,
  },
  submitBtn: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  resultIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  resultMessage: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  doneBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  doneBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  scanAgainBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  scanAgainBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
});

export default EnterAttendanceCodeScreen;