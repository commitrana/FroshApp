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
import Theme from "../../theme/theme";
import { EXPLORE_ITEMS } from "../../constants/explore";
import ExploreCard from "../../Components/Explore/ExploreCard";

export default function ExploreScreen() {
  type NavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

const navigation =
  useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={EXPLORE_ITEMS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <Text style={styles.heading}>
              Explore
            </Text>

            <Text style={styles.subHeading}>
              Discover everything you need as a fresher.
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <ExploreCard
            item={item}
            onPress={() => {
              // item.screen is a dynamic string from EXPLORE_ITEMS, so TS can't
              // statically verify whether the target route needs params (e.g.
              // ClassDetails does). Bypassing the typed overload here is safe
              // since none of the Explore items point to a params-required screen.
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
    backgroundColor: Theme.colors.background,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  heading: {
    fontSize: 32,
    fontWeight: "700",
    color: "white",
    marginBottom: 6,
  },

  subHeading: {
    color: "#9CA3AF",
    fontSize: 15,
    marginBottom: 30,
  },
});