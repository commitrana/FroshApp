import React from "react";
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { Event } from "../../constants/events";
import { useHomeTheme } from "../../constants/homeThemes";

type Props = {
  event: Event;
  hasTicket?: boolean;
  registering?: boolean;
  hideRegister?: boolean;
  onRegisterPress?: () => void;
};

export default function EventCard({
  event,
  hasTicket = false,
  registering = false,
  hideRegister = false,
  onRegisterPress,
}: Props) {
  const theme = useHomeTheme();

  const showButton =
    !hideRegister && (event.status === "live" || hasTicket) && !!onRegisterPress;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.cardBg, borderColor: theme.lineColor },
      ]}
    >
      <Text style={[styles.title, { color: theme.textPrimary }]}>{event.title}</Text>
      <Text style={[styles.society, { color: theme.accent }]}>{event.society}</Text>
      <Text style={[styles.info, { color: theme.textSecondary }]}>📍 {event.venue}</Text>
      <Text style={[styles.info, { color: theme.textSecondary }]}>
        🕒 {event.date} • {event.time}
      </Text>

      {showButton && (
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.accent },
            hasTicket && [
              styles.buttonSecondary,
              { borderColor: theme.accent },
            ],
          ]}
          activeOpacity={0.85}
          onPress={onRegisterPress}
          disabled={registering}
        >
          {registering ? (
            <ActivityIndicator
              color={hasTicket ? theme.accent : theme.buttonTextOn}
              size="small"
            />
          ) : (
            <Text
              style={[
                styles.buttonText,
                { color: theme.buttonTextOn },
                hasTicket && { color: theme.accent },
              ]}
            >
              {hasTicket ? "View Ticket" : "Register"}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1 },
  title: { fontSize: 18, fontWeight: "700" },
  society: { marginTop: 5, fontWeight: "600" },
  info: { marginTop: 8 },
  button: { paddingVertical: 12, borderRadius: 12, alignItems: "center", marginTop: 14 },
  buttonSecondary: { backgroundColor: "transparent", borderWidth: 1.5 },
  buttonText: { fontWeight: "700", fontSize: 14 },
});