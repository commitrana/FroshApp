import { View, Text, StyleSheet } from "react-native";

type ProfileHeaderProps = {
  name: string;
  email: string;
};

export default function ProfileHeader({
  name,
  email,
}: ProfileHeaderProps) {
  return (
    <View style={styles.container}>

      <Text style={styles.name}>
        {name}
      </Text>

      <Text style={styles.email}>
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
    color: "white",
    fontSize: 26,
    fontWeight: "700",
  },

  email: {
    color: "#A1A1AA",
    marginTop: 5,
    fontSize: 15,
  },
});