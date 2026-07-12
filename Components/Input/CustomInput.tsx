import React from "react";
import { TextInput, StyleSheet, View } from "react-native";
import GlassCard from "../Common/GlassCard";
import Colors from "../../constants/colors";

interface Props {
  placeholder: string;
  secureTextEntry?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences";
}

export default function CustomInput({
  placeholder, secureTextEntry = false, value, onChangeText,
  keyboardType = "default", autoCapitalize = "sentences",
}: Props) {
  return (
    <GlassCard style={styles.container} radius={14} padding={0} intensity={30}>
      <View style={styles.content}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={secureTextEntry}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={styles.input}
        />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 18,
    height: 55,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  input: {
    color: Colors.textPrimary,
    fontSize: 16,
  },
});