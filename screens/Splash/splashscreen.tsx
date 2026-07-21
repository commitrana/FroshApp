import React from "react";
import { useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import {
  View,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { isLoggedIn, getCurrentUser, getUserRole } from "../../services/auth";
import { useTheme } from "../../theme/theme"; // ← Changed

const splashVideoSource = require("../../assets/videos/froshlogo_anim.mp4");
const FALLBACK_DURATION_MS = 6500;

const SplashScreen = () => {
  type SplashScreenNavigationProp =
    NativeStackNavigationProp<RootStackParamList, "Splash">;

  const navigation = useNavigation<SplashScreenNavigationProp>();
  const hasNavigated = useRef(false);
  const { colors, isDarkMode } = useTheme(); // ← Added

  const goNext = async () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    const loggedIn = await isLoggedIn();
    console.log("LOGGED IN CHECK:", loggedIn);

    if (!loggedIn) {
      navigation.replace("Login");
      return;
    }

    const user = await getCurrentUser();
    console.log("CURRENT USER:", user);

    const role = await getUserRole();
    console.log("ROLE:", role);

    switch (role) {
      case "student":
        navigation.replace("MainTabs");
        break;
      case "society":
        navigation.replace("SocietyAdmin");
        break;
      case "member":
        navigation.replace("MemberDashboard");
        break;
      case "faculty":
        navigation.replace("FacultyTabs");
        break;
      default:
        navigation.replace("Login");
        break;
    }
  };

  const player = useVideoPlayer(splashVideoSource, (player) => {
    player.loop = false;
    player.muted = true;
    player.play();
  });

  useEventListener(player, "playToEnd", () => {
    goNext();
  });

  useEffect(() => {
    const timer = setTimeout(goNext, FALLBACK_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.background}
        translucent
      />

      <View style={styles.container}>
        <VideoView
          style={styles.video}
          player={player}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
        />
      </View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
});