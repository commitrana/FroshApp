import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { useTheme } from '../../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
// Reusing the exact same component Home renders inline for its About tab,
// so this screen (reached via navigation.navigate('About')) and Home's
// inline tab always show identical content — single source of truth.
import HomeAboutTab from '../../Components/Home/HomeAboutTab';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AboutScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDarkMode } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const bgGradient: [string, string, string] = isDarkMode
    ? ['#020B18', '#061528', '#041220']
    : ['#F5F9FF', '#E8F0FE', '#D6E4F5'];

  // Same translucent "glass" background/border used by the Live Event
  // card on the Home screen, so the About Us card matches it exactly.
  const glassBg = isDarkMode
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(255, 255, 255, 0.35)';
  const glassBorder = isDarkMode
    ? 'rgba(255, 255, 255, 0.2)'
    : 'rgba(255, 255, 255, 0.7)';

  // HomeAboutTab expects this exact theme shape (cardBg, shadowColor, etc.)
  const homeAboutTabTheme = {
    cardBg: glassBg,
    shadowColor: colors.primary,
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    borderColor: glassBorder,
    primary: colors.primary,
  };

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <LinearGradient colors={bgGradient} style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header — kept here since HomeAboutTab has no back button of its own */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>About</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Same component Home uses inline */}
          <HomeAboutTab theme={homeAboutTabTheme} />
        </ScrollView>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 75 : 50, // extra top padding on iOS only — StatusBar's `translucent` prop has no effect on iOS, so this screen needs its own notch/Dynamic Island clearance; Android's 50 is untouched
    paddingVertical: 8,
    marginBottom: 8,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: 2 },
});

export default AboutScreen;