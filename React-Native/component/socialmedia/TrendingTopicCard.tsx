import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ClipboardList } from "lucide-react-native"; // Lucide icon
import { LinearGradient } from "expo-linear-gradient";


type TrendingTopicProps = {
  header: string;
  subHeader: string;
  description: string;
  buttonText: string;
  onPress: () => void;
};

const TrendingTopicCard: React.FC<TrendingTopicProps> = ({
  header,
  subHeader,
  description,
  buttonText,
  onPress,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <ClipboardList size={18} color="#000" />
        <Text style={styles.header}>{header}</Text>
      </View>
      <Text style={styles.subHeader}>{subHeader}</Text>
      <Text style={styles.description}>{description}</Text>

      {/* <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>{buttonText}</Text>
      </TouchableOpacity> */}
      
<TouchableOpacity onPress={onPress}>
  <LinearGradient
    colors={["#00B4DB", "#0083B0"]}
    style={styles.button}
  >
    <Text style={styles.buttonText}>{buttonText}</Text>
  </LinearGradient>
</TouchableOpacity>
    </View>
  );
};

export default TrendingTopicCard;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#f5faff",
    padding: 16,
    borderRadius: 12,
    borderColor: "#d1d5db",
    borderWidth: 1,
    margin: 8,
    width: 300,
    height: 200,
    shadowColor: "#000",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  header: {
    marginLeft: 6,
    fontWeight: "600",
    fontSize: 14,
  },
  subHeader: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: "#333",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "linear-gradient(90deg, #00B4DB, #0083B0)", // fallback if needed
    //backgroundColor: "#0083B0", // fallback static color
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
