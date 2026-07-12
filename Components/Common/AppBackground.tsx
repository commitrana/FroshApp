import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import Colors from "../../constants/colors";

type Props = {
  children: React.ReactNode;
};

function GlowOrb({
  size,
  color,
  style,
}: {
  size: number;
  color: string;
  style: any;
}) {
  const rings = [1, 0.75, 0.52, 0.3];
  return (
    <View style={[{ width: size, height: size }, style]} pointerEvents="none">
      {rings.map((scale, i) => {
        const s = size * scale;
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              width: s,
              height: s,
              borderRadius: s / 2,
              top: (size - s) / 2,
              left: (size - s) / 2,
              backgroundColor: color,
              opacity: 0.16,
            }}
          />
        );
      })}
    </View>
  );
}

export default function AppBackground({ children }: Props) {
  const { width, height } = useWindowDimensions();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[Colors.gradientTop, Colors.gradientMid, Colors.gradientBottom]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <GlowOrb
        size={width * 1.1}
        color={Colors.glowCyan}
        style={{ position: "absolute", top: -width * 0.5, right: -width * 0.5 }}
      />

      <GlowOrb
        size={width * 0.95}
        color={Colors.glowBlue}
        style={{ position: "absolute", bottom: -width * 0.4, left: -width * 0.4 }}
      />

      <View style={[styles.content, { minHeight: height }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    overflow: "hidden",
  },
  content: {
    flex: 1,
  },
});