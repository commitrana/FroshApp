import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { useTheme } from '../../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Section = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
};

const AboutScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDarkMode } = useTheme();

  // Animation for fade-in
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  // Theme object matching SocietiesScreen pattern
  const t = {
    bgGradient: isDarkMode
      ? ['#020B18', '#061528', '#041220'] as [string, string, string]
      : ['#F5F9FF', '#E8F0FE', '#D6E4F5'] as [string, string, string],
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    cardBg: colors.card,
    accent: colors.primary,
    shadowColor: colors.primary,
    borderColor: colors.border,
  };

  const sections: Section[] = [
    {
      id: 'team',
      title: 'OUR TEAM',
      subtitle: 'Meet the minds behind Frosh',
      icon: 'people-outline',
      onPress: () => navigation.navigate('OurTeam'),
    },
    {
      id: 'hostels',
      title: 'HOSTELS',
      subtitle: 'Your home away from home',
      icon: 'home-outline',
      onPress: () => navigation.navigate('Hostels'),
    },
    {
      id: 'societies',
      title: 'SOCIETIES',
      subtitle: 'Where passions find a platform',
      icon: 'bulb-outline',
      onPress: () => navigation.navigate('Societies'),
    },
    {
      id: 'life',
      title: 'LIFE AT THAPAR',
      subtitle: 'Beyond classrooms, a world of experiences',
      icon: 'school-outline',
      onPress: () => navigation.navigate('LifeAtThapar'),
    },
  ];

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <LinearGradient colors={t.bgGradient} style={styles.container}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={t.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: t.textPrimary }]}>
              About
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Main About Card */}
          <View
            style={[
              styles.bigCard,
              {
                backgroundColor: t.cardBg,
                shadowColor: t.shadowColor,
                borderColor: t.borderColor,
              },
            ]}
          >
            <View style={styles.aboutHeader}>
              <Text style={[styles.bigCardTitle, { color: t.textPrimary }]}>
                About Us
              </Text>
              <View style={[styles.divider, { backgroundColor: t.borderColor }]} />
            </View>

            {/* Sections as cards - matching HomeAboutTab layout */}
            {sections.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: t.cardBg,
                    shadowColor: t.shadowColor,
                    borderColor: t.borderColor,
                  },
                ]}
                onPress={item.onPress}
                activeOpacity={0.8}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: t.accent + '15' }]}>
                      <Ionicons name={item.icon as any} size={24} color={t.accent} />
                    </View>
                    <View style={styles.cardTextContainer}>
                      <Text style={[styles.cardTitle, { color: t.textPrimary }]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.cardSubtitle, { color: t.textSecondary }]}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={24} 
                    color={t.textSecondary} 
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer spacer */}
          <View style={{ height: 20 }} />
        </ScrollView>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 50,
    paddingVertical: 8,
    marginBottom: 8,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },
  bigCard: {
    marginHorizontal: 16,
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderWidth: 1,
  },
  aboutHeader: {
    marginBottom: 8,
  },
  bigCardTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
});

export default AboutScreen;