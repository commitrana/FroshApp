import { ActivityIndicator, Image, Text, StyleSheet, TouchableOpacity, View } from "react-native";
import Colors from "../../constants/colors";
import { Event } from "../../services/events";

const DEFAULT_IMAGE = require('../../assets/images/featured-placeholder.jpg');

type FeaturedEventCardProps = {
  event: Event;
  hasTicket?: boolean;
  registering?: boolean;
  onPress?: () => void;
};

export default function FeaturedEventCard({
  event,
  hasTicket = false,
  registering = false,
  onPress,
}: FeaturedEventCardProps) {
  return (
    <View style={styles.card}>
      <Image
        source={
          event.imageUrl
            ? { uri: event.imageUrl }
            : DEFAULT_IMAGE
        }
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.overlay}>
        <Text style={styles.liveText}>Live Event</Text>
        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.infoContainer}>
          <Text style={styles.info}>Date: {event.date}</Text>
          <Text style={styles.info}>Time: {event.time}</Text>
          <Text style={styles.info}>Venue: {event.venue}</Text>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 260,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  liveText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginVertical: 8,
  },
  infoContainer: {
    marginBottom: 12,
  },
  info: {
    color: "#CCCCCC",
    marginBottom: 4,
    fontSize: 14,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#04222B",
    fontWeight: "700",
    fontSize: 15,
  },
});