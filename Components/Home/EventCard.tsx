import { Text, StyleSheet } from "react-native";
import GlassCard from "../Common/GlassCard";
import Colors from "../../constants/colors";

type EventCardProps = {
  title: string;
  date: string;
};

export default function EventCard({ title, date }: EventCardProps) {
  return (
    <GlassCard style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.date}>{date}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 15,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  date: {
    color: Colors.textSecondary,
    marginTop: 5,
  },
});