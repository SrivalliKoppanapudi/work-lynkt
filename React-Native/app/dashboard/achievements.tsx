import React from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import Colors from "../../constant/Colors";
import { ProgressBar } from "react-native-paper"; // For progress bars

// Mock data for achievements
const achievements = [
  {
    id: 1,
    title: "First Steps",
    description: "Complete your first task.",
    progress: 1.0, // 100% completed
    badge: require("../../assets/images/Lynkt.png"), // Add badge images
  },
  {
    id: 2,
    title: "Task Master",
    description: "Complete 10 tasks.",
    progress: 0.6, // 60% completed
    badge: require("../../assets/images/Lynkt.png"),
  },
  {
    id: 3,
    title: "Social Butterfly",
    description: "Connect with 5 friends.",
    progress: 0.3, // 30% completed
    badge: require("../../assets/images/Lynkt.png"),
  },
  {
    id: 4,
    title: "Early Bird",
    description: "Complete a task before 8 AM.",
    progress: 0.0, // 0% completed
    badge: require("../../assets/images/Lynkt.png"),
  },
];

export default function AchievementsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Achievements</Text>

      {/* Achievement Cards */}
      {achievements.map((achievement) => (
        <View key={achievement.id} style={styles.card}>
          {/* Badge */}
          <Image source={achievement.badge} style={styles.badge} />

          {/* Achievement Details */}
          <View style={styles.details}>
            <Text style={styles.cardTitle}>{achievement.title}</Text>
            <Text style={styles.cardDescription}>{achievement.description}</Text>

            {/* Progress Bar */}
            <ProgressBar
              progress={achievement.progress}
              color={Colors.PRIMARY}
              style={styles.progressBar}
            />

            {/* Progress Text */}
            <Text style={styles.progressText}>
              {Math.round(achievement.progress * 100)}% Completed
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: Colors.WHITE,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.PRIMARY,
    marginBottom: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'lightgray',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  badge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  details: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: 'black',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'lightgray',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: 'lightgray',
  },
});