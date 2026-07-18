import { View, Text, StyleSheet } from "react-native";

type ProfileHeaderProps = {
  name: string;
  email: string;
  theme?: any; // ← Added optional theme prop
};

export default function ProfileHeader({
  name,
  email,
  theme,
}: ProfileHeaderProps) {
  // If theme is not provided, use default colors (fallback)
  const colors = theme || {
    textPrimary: "#FFFFFF",
    textSecondary: "#A1A1AA",
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.name, { color: colors.textPrimary }]}>
        {name}
      </Text>
      <Text style={[styles.email, { color: colors.textSecondary }]}>
        {email}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  name: {
    fontSize: 26,
    fontWeight: "700",
  },
  email: {
    marginTop: 5,
    fontSize: 15,
  },
});