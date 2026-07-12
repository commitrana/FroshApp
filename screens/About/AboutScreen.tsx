import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet } from "react-native";

import Theme from "../../theme/theme";
import { APP_INFO } from "../../constants/app";
import AppLogo from "../../Components/Logo/AppLogo";

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <View style={styles.logoContainer}>
          <AppLogo size={120} />
        </View>

        <Text style={styles.title}>
          {APP_INFO.name}
        </Text>

        <Text style={styles.version}>
          Version {APP_INFO.version}
        </Text>

        <Text style={styles.description}>
          {APP_INFO.about}
        </Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },

  content: {
    flex: 1,
    alignItems: "center",
    padding: 24,
  },

  logoContainer: {
    marginTop: 40,
    marginBottom: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "white",
  },

  version: {
    color: "#9CA3AF",
    marginTop: 6,
    marginBottom: 28,
    fontSize: 15,
  },

  description: {
    color: "#D1D5DB",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 26,
  },
});