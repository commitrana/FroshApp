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
import Theme from "../../theme/theme";

// Local splash animation (played once, then we move to Login)
const splashVideoSource = require("../../assets/videos/froshlogo_anim.mp4");

// Safety-net duration in case the video's playToEnd event doesn't fire
// (e.g. slow devices/emulators). Matches the animation's real length + a small buffer.
const FALLBACK_DURATION_MS = 6500;

const SplashScreen = () => {
  type SplashScreenNavigationProp =
    NativeStackNavigationProp<RootStackParamList, "Splash">;

  const navigation = useNavigation<SplashScreenNavigationProp>();
  const hasNavigated = useRef(false);

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

    // role ke hisaab se seedha uski screen par bhejo
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
        navigation.replace("FacultyDashboard");
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

  // Move on as soon as the animation finishes playing
  useEventListener(player, "playToEnd", () => {
    goNext();
  });

  // Fallback timer in case playToEnd never fires
  useEffect(() => {
    const timer = setTimeout(goNext, FALLBACK_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Theme.colors.background}
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
    backgroundColor: Theme.colors.background,
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