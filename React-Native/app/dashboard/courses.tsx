import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "../../constant/Colors";

export default function CoursesScreen() {
  // Make sure it's a default export
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Courses</Text>
      <Text>List of registered courses will appear here.</Text>
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
