import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  FlatList,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const H_PADDING = 12;
const GRID_GAP = 8;
const CARD_SIZE = Math.floor((width - H_PADDING * 2 - GRID_GAP) / 2);

const memberImg = require('../../assets/uiux/person.jpg');

type Theme = {
  bgGradient: [string, string, ...string[]];
  textPrimary: string;
  textSecondary: string;
  cardBg: string;
  accent: string;
  lineColor: string;
};

const fallbackTheme: Theme = {
  bgGradient: ['#020B18', '#061528', '#041220'],
  textPrimary: '#FFFFFF',
  textSecondary: '#D5DDF0',
  cardBg: '#0A1A2E',
  accent: '#2F80FF',
  lineColor: 'rgba(255,255,255,0.1)',
};

type FacultyMember = { id: number; name: string; designation: string };
type BranchMember = { id: number; name: string; branch: string };
type MentorMember = { id: number; name: string };

// ---------- DATA ----------
const facultyData: FacultyMember[] = [
  { id: 1, name: 'Dr. MD Singh', designation: 'President' },
  { id: 2, name: 'Dr. Hemdutt Joshi', designation: 'Vice President' },
  { id: 3, name: 'Dr. Vishal Gupta', designation: 'Vice President' },
  { id: 4, name: 'Dr. Avinash Chandra', designation: 'Vice President' },
  { id: 5, name: 'Dr. Devendar Kumar', designation: 'Vice President' },
  { id: 6, name: 'Dr. Tarunpreet Bhatia', designation: 'Vice President' },
];

const oscData: BranchMember[] = [
  { id: 1, name: 'Nandini', branch: 'ENC' },
  { id: 2, name: 'Snehil Jhanwar', branch: 'COPC' },
  { id: 3, name: 'Vanshaj Kaushik', branch: 'ENC' },
];

const coreData: BranchMember[] = [
  { id: 1, name: 'Aarush Sahu', branch: 'MEC' },
  { id: 2, name: 'Agamjot Kaur', branch: 'EEC' },
  { id: 3, name: 'Akshat Walia', branch: 'ENC' },
  { id: 4, name: 'Arpit Kumar', branch: 'ENC' },
  { id: 5, name: 'Dhruv Gupta', branch: 'AIML' },
  { id: 6, name: 'Gyanvi Narayan', branch: 'ECE' },
  { id: 7, name: 'Jatin Garg', branch: 'COE' },
  { id: 8, name: 'Karanbir Singh', branch: 'MEC' },
  { id: 9, name: 'Keshav Gupta', branch: 'ECE' },
  { id: 10, name: 'Lakshya Kaushik', branch: 'ECE' },
  { id: 11, name: 'Prabal Gupta', branch: 'EEC' },
  { id: 12, name: 'Ritagya Chitkara', branch: 'ELE' },
  { id: 13, name: 'Sabhya Mahajan', branch: 'ECE' },
  { id: 14, name: 'Utkarshini Mishra', branch: 'CCA' },
  { id: 15, name: 'Vignesh Jain', branch: 'COE' },
];

const mentorData: MentorMember[] = Array.from({ length: 94 }, (_, i) => ({
  id: i + 1,
  name: `Mentor ${i + 1}`,
}));

type TabKey = 'faculty' | 'osc' | 'core' | 'mentor';
const TABS: TabKey[] = ['faculty', 'osc', 'core', 'mentor'];

// ---------- COMPONENT ----------
export default function OurTeamScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const t: Theme = route.params?.theme || fallbackTheme;
  const isDarkTheme = t.textPrimary?.toUpperCase() === '#FFFFFF';
  const [activeTab, setActiveTab] = useState<TabKey>('faculty');

  const renderFacultyItem = ({ item }: { item: FacultyMember }) => (
    <View style={styles.gridItem}>
      <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.lineColor }]}>
        <Image source={memberImg} style={styles.cardImage} />
      </View>
      <Text style={[styles.cardName, { color: t.textPrimary }]}>{item.name}</Text>
      <Text style={[styles.cardDesignation, { color: t.textSecondary }]}>{item.designation}</Text>
    </View>
  );

  const renderMentorItem = ({ item }: { item: MentorMember }) => (
    <View style={styles.gridItem}>
      <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.lineColor }]}>
        <Image source={memberImg} style={styles.cardImage} />
      </View>
      <Text style={[styles.cardName, { color: t.textPrimary }]}>{item.name}</Text>
    </View>
  );

  const renderBranchItem = ({ item, index }: { item: BranchMember; index: number }) => {
    const isLeft = index % 2 === 0;
    return (
      <View style={[styles.alternatingRow, { flexDirection: isLeft ? 'row' : 'row-reverse' }]}>
        <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.lineColor }]}>
          <Image source={memberImg} style={styles.cardImage} />
        </View>
        <View style={[styles.textContainer, { alignItems: isLeft ? 'flex-start' : 'flex-end' }]}>
          <Text style={[styles.rowName, { color: t.textPrimary, textAlign: isLeft ? 'left' : 'right' }]}>
            {item.name}
          </Text>
          <Text
            style={[styles.rowDesignation, { color: t.textSecondary, textAlign: isLeft ? 'left' : 'right' }]}
          >
            {item.branch}
          </Text>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'faculty':
        return (
          <FlatList
            key="faculty-cols-2"
            data={facultyData}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.listContainer}
            renderItem={renderFacultyItem}
          />
        );
      case 'osc':
        return (
          <FlatList
            key="osc-cols-1"
            data={oscData}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            renderItem={renderBranchItem}
          />
        );
      case 'core':
        return (
          <FlatList
            key="core-cols-1"
            data={coreData}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            renderItem={renderBranchItem}
          />
        );
      case 'mentor':
        return (
          <FlatList
            key="mentor-cols-2"
            data={mentorData}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.listContainer}
            renderItem={renderMentorItem}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkTheme ? 'light-content' : 'dark-content'}
      />
      <LinearGradient colors={t.bgGradient} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color={t.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: t.textPrimary }]}>OUR TEAM</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={[styles.tabContainer, { borderBottomColor: t.lineColor }]}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  activeTab === tab && { borderBottomWidth: 3, borderBottomColor: t.accent },
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: activeTab === tab ? t.textPrimary : t.textSecondary,
                      fontWeight: activeTab === tab ? '700' : '500',
                    },
                  ]}
                >
                  {tab.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flex: 1 }}>{renderContent()}</View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 50,
    paddingVertical: 8,
  },
  backBtn: { padding: 4 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tabText: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  listContainer: {
    paddingHorizontal: H_PADDING,
    paddingBottom: 30,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  card: {
    marginTop: 10,
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridItem: {
    width: CARD_SIZE,
    marginBottom: 10,
    alignItems: 'center',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
  },
  cardDesignation: {
    fontSize: 14,
    marginTop: 2,
  },
  alternatingRow: {
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: H_PADDING,
  },
  textContainer: {
    flex: 1,
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  rowName: {
    fontSize: 26,
    fontWeight: '800',
  },
  rowDesignation: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
});