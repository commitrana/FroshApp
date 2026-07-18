import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import { useTheme } from "../../theme/theme"; // ← Changed
import { EXPLORE_ITEMS } from "../../constants/explore";
import ExploreCard from "../../Components/Explore/ExploreCard";

export default function ExploreScreen() {
  type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDarkMode } = useTheme(); // ← Added

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <FlatList
        data={EXPLORE_ITEMS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <Text style={[styles.heading, { color: colors.textPrimary }]}>
              Explore
            </Text>

            <Text style={[styles.subHeading, { color: colors.textSecondary }]}>
              Discover everything you need as a fresher.
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <ExploreCard
            item={item}
            onPress={() => {
              (navigation as any).navigate(item.screen);
            }}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 6,
  },
  subHeading: {
    fontSize: 15,
    marginBottom: 30,
  },
});