// components/Loader.tsx
import { ActivityIndicator, View, StyleSheet } from "react-native";

export default function Loader({ color = "#3B82F6", size = "large" }: { color?: string; size?: "small" | "large" }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});