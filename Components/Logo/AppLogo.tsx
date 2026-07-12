import React from "react";
import { Image, StyleSheet } from "react-native";

interface AppLogoProps {
  size?: number;
}

export default function AppLogo({
  size = 220,
}: AppLogoProps) {
  return (
    <Image
      source={require("../../assets/logos/frosh_logo.png")}
      style={[
        styles.logo,
        {
          width: size,
          height: size,
        },
      ]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {},
});