import React, { useState } from "react";
import { View, Image, ActivityIndicator, StyleSheet, ImageSourcePropType, StyleProp, ViewStyle } from "react-native";

type Props = {
  source: ImageSourcePropType;
  style: StyleProp<ViewStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "center" | "repeat";
  color?: string;
  onError?: () => void;
};

export default function ImageWithLoader({ source, style, resizeMode = "cover", color = "#3B82F6", onError }: Props) {
  const [loading, setLoading] = useState(true);

  return (
    <View style={style}>
      <Image
        source={source}
        style={StyleSheet.absoluteFill}
        resizeMode={resizeMode}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={onError}
      />
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.overlay]}>
          <ActivityIndicator size="small" color={color} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.08)",
  },
});