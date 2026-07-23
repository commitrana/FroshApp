import { View, Text, StyleSheet } from "react-native";
import { useHomeTheme } from "../../constants/homeThemes";

type ProfileHeaderProps = {
  name: string;
  email: string;
};

export default function ProfileHeader({
  name,
  email,
}: ProfileHeaderProps) {
  const theme = useHomeTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.name, { color: theme.textPrimary }]}>
        {name}
      </Text>
      <Text style={[styles.email, { color: theme.textSecondary }]}>
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