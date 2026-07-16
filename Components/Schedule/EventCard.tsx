import React from "react";
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { Event } from "../../constants/events";

type Props = {
  event: Event;
  hasTicket?: boolean;
  registering?: boolean;
  onRegisterPress?: () => void;
};

export default function EventCard({
  event,
  hasTicket = false,
  registering = false,
  onRegisterPress,
}: Props) {
  // Registration should only be possible while an event is actually live —
  // the backend already enforces this (tickets.js rejects non-live
  // registrations), but the button was showing for "upcoming" events too,
  // letting students tap Register and hit a confusing rejection error.
  // Still show "View Ticket" for anyone who already has one, even if the
  // event's status later changes (e.g. moves to "past").
  const showButton = (event.status === "live" || hasTicket) && !!onRegisterPress;

  return (
    <View style={styles.card}>

      <Text style={styles.title}>
        {event.title}
      </Text>

      <Text style={styles.society}>
        {event.society}
      </Text>

      <Text style={styles.info}>
        📍 {event.venue}
      </Text>

      <Text style={styles.info}>
        🕒 {event.date} • {event.time}
      </Text>

      {showButton && (
        <TouchableOpacity
          style={[styles.button, hasTicket && styles.buttonSecondary]}
          activeOpacity={0.85}
          onPress={onRegisterPress}
          disabled={registering}
        >
          {registering ? (
            <ActivityIndicator color={hasTicket ? "#22D3EE" : "#04222B"} size="small" />
          ) : (
            <Text style={[styles.buttonText, hasTicket && styles.buttonTextSecondary]}>
              {hasTicket ? "View Ticket" : "Register"}
            </Text>
          )}
        </TouchableOpacity>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },

  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },

  society: {
    color: "#A78BFA",
    marginTop: 5,
    fontWeight: "600",
  },

  info: {
    color: "#D1D5DB",
    marginTop: 8,
  },

  button: {
    backgroundColor: "#22D3EE",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 14,
  },

  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#22D3EE",
  },

  buttonText: {
    color: "#04222B",
    fontWeight: "700",
    fontSize: 14,
  },

  buttonTextSecondary: {
    color: "#22D3EE",
  },
}); 