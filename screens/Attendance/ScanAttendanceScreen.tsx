import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Location from 'expo-location';
import { RootStackParamList } from '../../types/navigation';
import Theme from '../../theme/theme';
import { markAttendance, MarkAttendanceResult } from '../../services/attendance';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ScanAttendance'>;

const ScanAttendanceScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<MarkAttendanceResult | null>(null);
  const hasScannedRef = useRef(false);

  const handleBarcodeScanned = async (scan: BarcodeScanningResult) => {
    if (hasScannedRef.current || processing) return;
    hasScannedRef.current = true;
    setProcessing(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission required', 'Location access is needed to mark attendance.');
        hasScannedRef.current = false;
        setProcessing(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const data = await markAttendance({
        qrToken: scan.data,
        studentGPS: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        studentAccuracy: position.coords.accuracy ?? 20,
      });

      setResult(data);
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Could not mark attendance. Please try again.';
      Alert.alert('Scan failed', message);
      hasScannedRef.current = false;
    } finally {
      setProcessing(false);
    }
  };

  const handleScanAgain = () => {
    setResult(null);
    hasScannedRef.current = false;
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Theme.colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionText}>We need camera access to scan the attendance QR code.</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (result) {
    const isPresent = result.status === 'present';
    const isFlagged = result.status === 'flagged';

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultBox}>
          <Text style={styles.resultIcon}>{isPresent ? '✅' : isFlagged ? '⚠️' : '❌'}</Text>
          <Text style={styles.resultTitle}>
            {isPresent ? 'Marked Present' : isFlagged ? 'Pending Review' : 'Not Verified'}
          </Text>
          <Text style={styles.resultMessage}>{result.message}</Text>

          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
          {!isPresent && (
            <TouchableOpacity style={styles.scanAgainBtn} onPress={handleScanAgain}>
              <Text style={styles.scanAgainBtnText}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcodeScanned}
      />
      <SafeAreaView style={styles.overlay}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.scanFrame} />
        <Text style={styles.scanHint}>Point your camera at the attendance QR code</Text>
        {processing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator color="white" size="large" />
            <Text style={styles.processingText}>Verifying location…</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
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
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  permissionBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: 'white',
    fontSize: 18,
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: Theme.colors.primary,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scanHint: {
    color: 'white',
    fontSize: 14,
    marginTop: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    color: 'white',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
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
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  resultMessage: {
    color: '#9CA3AF',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  doneBtn: {
    backgroundColor: Theme.colors.primary,
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
    color: '#9CA3AF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ScanAttendanceScreen;
