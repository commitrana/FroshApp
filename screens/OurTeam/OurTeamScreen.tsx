import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  ImageSourcePropType,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ElectricBorder from "../../Components/Common/ElectricBorder";

const logoImg = require("../../assets/uiux/logo.png");
const bgImg = require("../../assets/uiux/bg.jpeg");
const personImg = require("../../assets/uiux/person.jpg");

type TeamMember = { id: number; name: string; designation: string; image: ImageSourcePropType };

// TODO: replace with a real /team endpoint from the backend once one exists.
const teamData: Record<string, TeamMember[]> = {
  Faculty: [
    { id: 1, name: "Dr. XYZ", designation: "Faculty Advisor", image: personImg },
    { id: 2, name: "Dr. ABC", designation: "Faculty Advisor", image: personImg },
    { id: 3, name: "Dr. PQR", designation: "Faculty Advisor", image: personImg },
    { id: 4, name: "Dr. LMN", designation: "Faculty Advisor", image: personImg },
  ],
  OSC: [
    { id: 1, name: "Aman", designation: "President", image: personImg },
    { id: 2, name: "Priya", designation: "Vice President", image: personImg },
  ],
  Core: [
    { id: 1, name: "Riya", designation: "Technical", image: personImg },
    { id: 2, name: "Harsh", designation: "Design", image: personImg },
  ],
  Mentor: [
    { id: 1, name: "Ankit", designation: "Mentor", image: personImg },
    { id: 2, name: "Sneha", designation: "Mentor", image: personImg },
    { id: 3, name: "Ayush", designation: "Mentor", image: personImg },
    { id: 4, name: "Shreya", designation: "Mentor", image: personImg },
  ],
};

const StarBorder = ({
  children,
  active,
  onPress,
}: {
  children: React.ReactNode;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.starBorderContainer, active && styles.starBorderActive]}
    activeOpacity={0.8}
  >
    <LinearGradient
      colors={active ? ["#3EE7FF", "#3EE7FF", "transparent"] : ["#3EE7FF", "transparent"]}
      style={styles.starGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
    <View style={styles.starInnerContent}>
      <Text style={[styles.starText, active && styles.starTextActive]}>{children}</Text>
    </View>
  </TouchableOpacity>
);

const MemberCard = ({ image, name, designation }: Omit<TeamMember, "id">) => (
  <View style={styles.memberCard}>
    <Image source={image} style={styles.memberImage} resizeMode="cover" />
    <View style={styles.memberInfo}>
      <Text style={styles.memberName}>{name}</Text>
      <Text style={styles.memberDesignation}>{designation}</Text>
    </View>
  </View>
);

export default function OurTeamScreen() {
  const [activeTab, setActiveTab] = useState("Faculty");
  const tabs = ["Faculty", "OSC", "Core", "Mentor"];

  const renderMember = ({ item }: { item: TeamMember }) => (
    <ElectricBorder
      color="#7df9ff"
      speed={5}
      chaos={0.3}
      thickness={2}
      borderRadius={22}
      style={{ marginBottom: 10 }}
    >
      <MemberCard image={item.image} name={item.name} designation={item.designation} />
    </ElectricBorder>
  );

  return (
    <ImageBackground source={bgImg} style={styles.background} resizeMode="cover">
      <View style={styles.overlay}>
        <Image source={logoImg} style={styles.logo} resizeMode="contain" />

        <View style={styles.tabsRow}>
          {tabs.map((tab) => (
            <StarBorder key={tab} active={activeTab === tab} onPress={() => setActiveTab(tab)}>
              {tab}
            </StarBorder>
          ))}
        </View>

        <FlatList
          data={teamData[activeTab]}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMember}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: "center",
  },
  logo: { width: 130, height: undefined, aspectRatio: 1, marginBottom: 4 },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "nowrap",
    gap: 4,
    marginTop: 6,
    marginBottom: 14,
    width: "100%",
  },
  starBorderContainer: {
    flex: 1,
    position: "relative",
    padding: 1.5,
    borderRadius: 999,
    overflow: "hidden",
    marginHorizontal: 2,
  },
  starBorderActive: {},
  starGradient: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 999 },
  starInnerContent: {
    backgroundColor: "rgba(18,22,30,0.95)",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  starText: { color: "#fff", fontSize: 12, fontWeight: "500" },
  starTextActive: { color: "#3EE7FF", fontWeight: "700" },
  gridContainer: { paddingBottom: 40, alignItems: "center" },
  columnWrapper: { justifyContent: "center", gap: 16, marginBottom: 16 },
  memberCard: {
    width: 140,
    height: 215,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  memberImage: { width: "100%", height: 165 },
  memberInfo: {
    height: 50,
    backgroundColor: "rgba(10,25,55,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  memberName: { color: "#fff", fontSize: 14, fontWeight: "600", textAlign: "center" },
  memberDesignation: { color: "#C8D6E5", fontSize: 11, textAlign: "center" },
});
