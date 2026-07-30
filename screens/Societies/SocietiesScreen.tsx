import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
  Easing,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Icon from '@expo/vector-icons/Ionicons';
import { Platform } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useHomeTheme } from '../../constants/homeThemes';

const { width, height } = Dimensions.get('window');

interface Society {
  id: number;
  name: string;
  description: string;
  logo: any;
}

const societies: Society[] = [
  { 
    id: 1, 
    name: 'ACM', 
    description: 'Thapar ACM Student Chapter is a technical society under the guidance of one of the most premier organizations in the computing world.',
    logo: require('../../assets/societies/ACM.png')
  },
  { 
    id: 25, 
    name: 'Adventure Club', 
    description: 'Explore, adventure, and discover the thrill of the outdoors.',
    logo: require('../../assets/societies/Adventure.jpg')
  },
  { 
    id: 2, 
    name: 'AIESEC', 
    description: 'Global platform for young people to explore and develop their leadership potential.',
    logo: require('../../assets/societies/AIESEC.png')
  },
  { 
    id: 3, 
    name: 'AICHE', 
    description: 'AICHE is the worlds leading organization for chemical engineering professionals, with more than 50,000 members from over 100 countries.',
    logo: require('../../assets/societies/AICHE.png')
  },
  { 
    id: 4, 
    name: 'BIS', 
    description: 'Bureau of Indian Standards – promoting quality and standardization.',
    logo: require('../../assets/societies/BIS.png')
  },
  { 
    id: 5, 
    name: 'CCS', 
    description: 'Creative Computing Society strives to help the students to develop problem-solving skills in tech through various workshops and competitions.',
    logo: require('../../assets/societies/ccs.png')
  },
  { 
    id: 6, 
    name: 'Chemist Association', 
    description: 'Association for Research and Education in Chemistry.',
    logo: require('../../assets/societies/Chemist.jpg')
  },
  { 
    id: 7, 
    name: 'DSC', 
    description: 'Developer Student Clubs – building with Google technologies.',
    logo: require('../../assets/societies/DSC.png')
  },
  { 
    id: 26, 
    name: 'EBSB', 
    description: 'Ek Bharat Shreshtha Bharat – celebrating cultural unity and diversity.',
    logo: require('../../assets/societies/EBSB.png')
  },
  { 
    id: 8, 
    name: 'ECC', 
    description: 'Electronics and Communication Club – exploring communication technologies.',
    logo: require('../../assets/societies/ECC.png')
  },
  { 
    id: 27, 
    name: 'Echoes', 
    description: 'Thapar Institute official student media and publication club.',
    logo: require('../../assets/societies/Echoes.png')
  },
  { 
    id: 44, 
    name: 'Econ', 
    description: 'Provides a platform for students interested in economics,finance,business and public policy.',
    logo: require('../../assets/societies/econ.png')
  },
  { 
    id: 45, 
    name: 'EDC', 
    description: 'Entrepreneurship Development Cell – nurturing business and innovation.',
    logo: require('../../assets/societies/EDC.png')
  },
  { 
    id: 28, 
    name: 'Electoral Club', 
    description: 'Promoting democratic values and electoral awareness.',
    logo: require('../../assets/societies/electoral_club.png')
  },
  { 
    id: 29, 
    name: 'ENACTUS', 
    description: 'Social entrepreneurship – creating positive change through business.',
    logo: require('../../assets/societies/ENACTUS.jpg')
  },
  { 
    id: 30, 
    name: 'FAPS', 
    description: 'Capture moments, tell stories through the lens.',
    logo: require('../../assets/societies/FAPS.jpg')
  },
  { 
    id: 9, 
    name: 'GCC', 
    description: 'Google Cloud Community – cloud computing and innovation.',
    logo: require('../../assets/societies/GCC.png')
  },
  { 
    id: 10, 
    name: 'GENE', 
    description: 'GENE Society promotes scientific curiosity, research and professional development in biotechnology and life sciences.',
    logo: require('../../assets/societies/genesoc.png')
  },
  { 
    id: 11, 
    name: 'GIRLUPTIET', 
    description: 'Empowering students to champion gender equality, leadership and social change through advocacy, awareness and community initiatives.',
    logo: require('../../assets/societies/GIRLUPTIET.png')
  },
  { 
    id: 12, 
    name: 'IEI', 
    description: 'Institution of Engineers, India (IEI) organizes workshops, technical exams and lecture series featuring successful professionals.',
    logo: require('../../assets/societies/IEI.png')
  },
  { 
    id: 13, 
    name: 'IETE', 
    description: 'The main objective of IETE society is to organise technical events which involves electronics, telecommunication, and IT as a core area',
    logo: require('../../assets/societies/IETE.jpg')
  },
  { 
    id: 14, 
    name: 'IIC', 
    description: 'Institution Innovation Council – fostering innovation and entrepreneurship.',
    logo: require('../../assets/societies/IIC.jpg')
  },
  { 
    id: 15, 
    name: 'IICHE', 
    description: 'The IICHE is a student chapter of Indian Institute of Chemical Engineers at TIET campus.Promotes chemical engineering knowledge and innovation',
    logo: require('../../assets/societies/IICHE.png')
  },
  { 
    id: 16, 
    name: 'ISTE', 
    description: 'Providing guidance and training to students to develop better technical, learning skills and personality',
    logo: require('../../assets/societies/ISTE.png')
  },
  { 
    id: 17, 
    name: 'LEAD', 
    description: 'LEAD society provides platform to students of all disciplines to organize industiral visits, skill building opportunities and workshops.',
    logo: require('../../assets/societies/LEAD.png')
  },
  { 
    id: 32, 
    name: 'LitSoc', 
    description: 'Inspires creativity and critical thinking through debates, creative writing and literary events.',
    logo: require('../../assets/societies/LitSoc.png')
  },
  { 
    id: 46, 
    name: 'MAPS', 
    description: 'Promotes scientific curiosity and analytical thinking throiugh workshops, quizzes and competitions ',
    logo: require('../../assets/societies/MAPS.jpg')
  },
  { 
    id: 18, 
    name: 'MARS', 
    description: 'Mechatronics and Robotics Society (MARS) provides an ideal platform for students of Mechanical, Mechatronics, Elecronics, Computers and Electrical Engineering background to hone their skills and showcase their talent in many interdisciplinary activities',
    logo: require('../../assets/societies/Mechatronics.png')
  },
  { 
    id: 19, 
    name: 'MLSC', 
    description: 'Microsoft Learning Student Chapter in collaboration with Microsoft aims to provide guidance, technical training, project guidance that improves students knowledge and learning skills.',
    logo: require('../../assets/societies/MSC.png')
  },
  { 
    id: 33, 
    name: 'MUDRA', 
    description: 'Showcases talent in music,dance and drama through cultural performances and events.',
    logo: require('../../assets/societies/MUDRA.jpg')
  },
  { 
    id: 47, 
    name: 'NCC', 
    description: 'National Cadet Corps – develops discipline, leadership, patriotism and teamwork through training, camps and community service.',
    logo: require('../../assets/societies/Emblem.png')
  },
  { 
    id: 34, 
    name: 'NOX', 
    description: 'Promotes dance and craetivity through performances, workshops, competitions and cultural events',
    logo: require('../../assets/societies/NOX.jpg')
  },
  { 
    id: 35, 
    name: 'NSS', 
    description: 'National Service Scheme – encourages social service and community development through outreach programs.',
    logo: require('../../assets/societies/NSS.png')
  },
  { 
    id: 20, 
    name: 'OWASP', 
    description: 'OWASP Student Chapter aims to provide excellence in the field of network and security and encourage members to be more digitally secure',
    logo: require('../../assets/societies/OWASP.png')
  },
  { 
    id: 36, 
    name: 'Pratigya', 
    description: 'Promotes social welfare and community service through volunteer initiatives, awareness drives and outreach programs',
    logo: require('../../assets/societies/Pratigya.png')
  },
  { 
    id: 37, 
    name: 'PWS', 
    description: 'Promotes environmental sustainability and social responsibility through awareness drives, plantation campaigns and eco-friendly initiatives',
    logo: require('../../assets/societies/PWS.png')
  },
  { 
    id: 48, 
    name: 'Rotaract', 
    description: 'Fosters leadership, community service and professional development through social initiatives.',
    logo: require('../../assets/societies/rot.jpg')
  },
  { 
    id: 21, 
    name: 'SAE', 
    description: 'Society of Automotive Engineers – promotes automotive engineering and innovation through technical projects, competitions, workshops and industry interactions.',
    logo: require('../../assets/societies/SAELogo.png')
  },
  { 
    id: 22, 
    name: 'SAIC', 
    description: 'Strengthens student-alumni connections through networking events, mentorship and career guidance initiatives.',
    logo: require('../../assets/societies/SAIC.png')
  },
  { 
    id: 38, 
    name: 'SpicMacay', 
    description: 'Promotes rich cultural heritage through classical music, dance,art and heritage based events.',
    logo: require('../../assets/societies/SpicMacay.png')
  },
  { 
    id: 39, 
    name: 'SSA', 
    description: 'Promotes sportsmanship, fitness and teamwork through sports events, tournaments and recreational activities.',
    logo: require('../../assets/societies/SSA.jpg')
  },
  { 
    id: 49, 
    name: 'TAAS', 
    description: 'Promotes astronomy and space science through stargazing sessions, workshops,talks and observational activities.',
    logo: require('../../assets/societies/TAAS.png')
  },
  { 
    id: 50, 
    name: 'TEDx', 
    description: 'TEDx TIET aims to inspire ideas worth spreading through talks, discussions and events',
    logo: require('../../assets/societies/Tedx.png')
  },
  { 
    id: 40, 
    name: 'TFC', 
    description: 'Thapar Film Club – celebrates cinema and storytelling through film screenings, discussions, reviews and craetive filmamaking activities.',
    logo: require('../../assets/societies/TFC.png')
  },
  { 
    id: 51, 
    name: 'TMC', 
    description: 'Thapar Movie Club- Brings together movie enthusiastis through film screenings, discussions, reviews and cinema- based events.',
    logo: require('../../assets/societies/TMC.jpg')
  },
  { 
    id: 23, 
    name: 'TMS', 
    description: 'Thapar Methematical Society promote mathematics and its application among the young people and in society by providing them a platform for interaction through expert talks, events, activities and workshops.',
    logo: require('../../assets/societies/TMS.png')
  },
  { 
    id: 52, 
    name: 'TNT', 
    description: 'Thapar Nautanki Team- promotes theatre and performing arts through plays and dramatic competitions',
    logo: require('../../assets/societies/TMC.jpg')
  },
  { 
    id: 41, 
    name: 'Toastmasters', 
    description: 'Enhances public speaking, communication and leadership skills through speeches, evaluations and interactive sessions.',
    logo: require('../../assets/societies/Toastmasters.png')
  },
  { 
    id: 24, 
    name: 'TSCE', 
    description: 'Thapar Society of Civil Engineers- promotes civil engineering knowledge and innovation through technical workshops.',
    logo: require('../../assets/societies/TSCE.png')
  },
  { 
    id: 42, 
    name: 'TUMUN', 
    description: 'This Society is for all those who want to master the art of negotiation. Thapar Institute of Engineering and Technology, Model United Nations brings you the best platform for debate and negotiations and to get a rich experience in these activities',
    logo: require('../../assets/societies/TUMUN.png')
  },
  { 
    id: 43, 
    name: 'YU', 
    description: 'Youth United – empowers students to drive social impact and community development through volunteering, awareness campaigns and outreach initiatives.',
    logo: require('../../assets/societies/YU.png')
  },
].sort((a, b) => a.name.localeCompare(b.name));

export default function SocietiesScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useAppTheme();
  const theme = useHomeTheme();

  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);

  // --- Entry & Exit animations (slide from bottom / slide to bottom) ---
  const slideY = useRef(new Animated.Value(height)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const isNavigating = useRef(false);

  // Disable the navigator's own push/pop transition & gesture for this screen.
  useEffect(() => {
    navigation.setOptions({
      animation: 'none',
      gestureEnabled: false,
    });
  }, [navigation]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // --- Back navigation with exit animation (flash-free) ---
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (isNavigating.current) {
        return;
      }
      e.preventDefault();
      isNavigating.current = true;

      Animated.parallel([
        Animated.timing(slideY, {
          toValue: height,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          navigation.dispatch(e.data.action);
        }
      });
    });

    return unsubscribe;
  }, [navigation]);

  const handleBack = () => {
    if (isNavigating.current) return;
    navigation.goBack();
  };

  const openPopup = (society: Society) => setSelectedSociety(society);
  const closePopup = () => setSelectedSociety(null);

  const renderItem = ({ item }: { item: Society }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.lineColor,
        },
      ]}
      onPress={() => openPopup(item)}
      activeOpacity={0.8}
    >
      <Image source={item.logo} style={styles.cardImage} />
      <Text style={[styles.cardName, { color: theme.textPrimary }]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgGradient[0] }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <Animated.View
        style={{
          flex: 1,
          opacity: opacityAnim,
          transform: [{ translateY: slideY }],
        }}
      >
      <LinearGradient
        colors={theme.bgGradient as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Icon name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.textPrimary }]}>SOCIETIES</Text>
            <View style={{ width: 40 }} />
          </View>

          <FlatList
            data={societies}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.columnWrapper}
          />
        </SafeAreaView>
      </LinearGradient>
      </Animated.View>

      <Modal visible={selectedSociety !== null} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={closePopup}>
          <BlurView
            intensity={80}
            style={styles.blurContainer}
            tint={isDarkMode ? 'dark' : 'light'}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={[
                  styles.popupCard,
                  {
                    backgroundColor: theme.cardBg,
                    shadowColor: theme.shadowColor,
                  },
                ]}
              >
                <View style={styles.popupHeader}>
                  <Image source={selectedSociety?.logo} style={styles.popupLogo} />
                  <Text style={[styles.popupName, { color: theme.textPrimary }]}>
                    {selectedSociety?.name}
                  </Text>
                </View>
                <Text style={[styles.popupDescription, { color: theme.textSecondary }]}>
                  {selectedSociety?.description}
                </Text>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: theme.accent }]}
                  onPress={closePopup}
                >
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </BlurView>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 22 : 10,
    paddingVertical: 8,
  },
  backBtn: { padding: 4 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 120,
  },
  cardImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupCard: {
    width: width * 0.85,
    borderRadius: 28,
    padding: 24,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  popupLogo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginRight: 16,
  },
  popupName: {
    fontSize: 22,
    fontWeight: '700',
  },
  popupDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});