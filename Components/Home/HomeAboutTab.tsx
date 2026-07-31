import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../../types/navigation";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

type HomeTheme = {
  cardBg: string;
  shadowColor: string;
  textPrimary: string;
  textSecondary: string;
  borderColor?: string;
  primary?: string;
};

export default function HomeAboutTab({ theme }: { theme: HomeTheme }) {
  const navigation = useNavigation<NavProp>();

  const sections = [
    {
      id: "team",
      title: "OUR TEAM",
      subtitle: "Meet the minds behind Frosh",
      icon: "people-outline",
      onPress: () => navigation.navigate("OurTeam"),
    },
    {
      id: "hostels",
      title: "HOSTELS",
      subtitle: "Your home away from home",
      icon: "home-outline",
      onPress: () => navigation.navigate("Hostels"),
    },
    {
      id: "societies",
      title: "SOCIETIES",
      subtitle: "Where passions find a platform",
      icon: "bulb-outline",
      onPress: () => navigation.navigate("Societies"),
    },
    {
      id: "life",
      title: "LIFE AT THAPAR",
      subtitle: "A World of experiences",
      icon: "school-outline",
      onPress: () => navigation.navigate("LifeAtThapar"),
    },
    {
      id: "map",
      title: "MAP",
      subtitle: "Find your way around campus",
      icon: "map-outline",
      onPress: () => navigation.navigate("CampusMap"),
    },
    {
      id: "magazine",
      title: "MAGAZINE",
      subtitle: "Read our latest issues",
      icon: "book-outline",
      onPress: () => navigation.navigate("Magazine"),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Main Card containing everything */}
      <View 
        style={[
          styles.mainCard, 
          { 
            backgroundColor: theme.cardBg, 
            shadowColor: theme.shadowColor,
            borderColor: theme.borderColor || 'transparent',
          }
        ]}
      >
        {/* "About Us" header styled like "Live Event" */}
        <Text style={[styles.aboutLabel, { color: theme.primary || '#00D4FF' }]}>
          ABOUT US
        </Text>
        
        <Text style={[styles.aboutTitle, { color: theme.textPrimary }]}>
          Explore Frosh
        </Text>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.borderColor || 'rgba(255,255,255,0.1)' }]} />

        {/* Navigation Cards */}
        {sections.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.card,
              { 
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor || 'rgba(255,255,255,0.05)',
              }
            ]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconContainer, { backgroundColor: (theme.primary || '#00D4FF') + '15' }]}>
                  <Ionicons name={item.icon as any} size={22} color={theme.primary || '#00D4FF'} />
                </View>
                <View>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                    {item.subtitle}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={22} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 20, 
    paddingTop: 20 
  },
  mainCard: {
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderWidth: 1,
  },
  // "About Us" text styled like "Live Event"
  aboutLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  cardContent: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: "700", 
    letterSpacing: 0.5, 
    marginBottom: 2 
  },
  cardSubtitle: { 
    fontSize: 13, 
    fontWeight: "400" 
  },
});