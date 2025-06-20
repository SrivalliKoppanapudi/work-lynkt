import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "../../constant/Colors";

export default function AssessmentsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assessments</Text>
      <Text>List of assessments will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.WHITE,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.PRIMARY,
    marginBottom: 16,
  },
});
