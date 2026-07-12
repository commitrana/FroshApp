import { View, Text, StyleSheet } from "react-native";

type InfoCardProps = {
  label: string;
  value: string;
};

export default function InfoCard({
  label,
  value,
}: InfoCardProps) {
  return (
    <View style={styles.card}>

      <Text style={styles.label}>
        {label}
      </Text>

      <Text style={styles.value}>
        {value}
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({

  card:{
    backgroundColor:"#1F2937",
    padding:16,
    borderRadius:16,
    marginBottom:15,
  },

  label:{
    color:"#9CA3AF",
    fontSize:13,
  },

  value:{
    color:"white",
    marginTop:6,
    fontSize:17,
    fontWeight:"600",
  },

});