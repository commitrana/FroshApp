import { TextInput, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlassCard from "../Common/GlassCard";
import Colors from "../../constants/colors";


export default function SearchBar() {
  return (
    <GlassCard
      style={styles.container}
      
      radius={16}
      padding={0}
    >
        <View style={styles.content}>
      <Ionicons name="search" size={22} color={Colors.textMuted} style={styles.icon} />
      <TextInput
        placeholder="Search Events"
        placeholderTextColor={Colors.textMuted}
        style={styles.input}
      />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    height: 55,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 16,
  },
});