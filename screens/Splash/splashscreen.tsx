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
import { SafeAreaView } from "react-native-safe-area-context";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";

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

  const goToLogin = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    navigation.navigate("Login");
  };

  const player = useVideoPlayer(splashVideoSource, (player) => {
    player.loop = false;
    player.muted = true;
    player.play();
  });

  // Move on as soon as the animation finishes playing
  useEventListener(player, "playToEnd", () => {
    goToLogin();
  });

  // Fallback timer in case playToEnd never fires
  useEffect(() => {
    const timer = setTimeout(goToLogin, FALLBACK_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Theme.colors.background}
      />

      <View style={styles.container}>
        <VideoView
          style={styles.video}
          player={player}
          contentFit="contain"
          nativeControls={false}
          allowsPictureInPicture={false}
        />
      </View>
    </SafeAreaView>
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