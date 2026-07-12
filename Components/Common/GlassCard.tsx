import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

type GlassCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  radius?: number;
  padding?: number;
};


export default function GlassCard({
  children,
  style,
  intensity = 60,
  radius = 20,
  padding = 20,
}: GlassCardProps) {
  return (
    <BlurView
      intensity={intensity}
      tint="dark"
      style={[
        styles.glass,
        {
          borderRadius: radius,
          padding,
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  glass: {
    overflow: "hidden",

    backgroundColor: "rgba(255,255,255,0.08)",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,

    elevation: 8,
  },
});