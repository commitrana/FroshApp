import { ActivityIndicator, Text, StyleSheet, TouchableOpacity, View } from "react-native";
import GlassCard from "../Common/GlassCard";
import Colors from "../../constants/colors";

type FeaturedEventCardProps = {
  title: string;
  date: string;
  time: string;
  location: string;
  hasTicket?: boolean;
  registering?: boolean;
  onPress?: () => void;
};

export default function FeaturedEventCard({
  title,
  date,
  time,
  location,
  hasTicket = false,
  registering = false,
  onPress,
}: FeaturedEventCardProps) {
  return (
    <GlassCard style={styles.card} intensity={55}>
      <Text style={styles.liveText}>Live Event</Text>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.info}>Date: {date}</Text>
        <Text style={styles.info}>Time: {time}</Text>
        <Text style={styles.info}>Venue: {location}</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={onPress}
        disabled={registering}
      >
        {registering ? (
          <ActivityIndicator color="#04222B" />
        ) : (
          <Text style={styles.buttonText}>
            {hasTicket ? "View Ticket" : "Register"}
          </Text>
        )}
      </TouchableOpacity>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 30,
  },
  liveText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 30,
    fontWeight: "800",
    marginVertical: 12,
  },
  infoContainer: {
    marginBottom: 18,
  },
  info: {
    color: Colors.textSecondary,
    marginBottom: 6,
    fontSize: 15,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#04222B",
    fontWeight: "700",
    fontSize: 16,
  },
});