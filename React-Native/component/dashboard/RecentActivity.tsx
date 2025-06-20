import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { ChevronRight, Clock } from "lucide-react-native";
import { Activity } from "./../../types/activity";

type RecentActivityProps = {
  activities: Activity[];
  isLoading: boolean;
};

export default function RecentActivity({
  activities,
  isLoading,
}: RecentActivityProps) {
  const renderActivityItem = ({ item }: { item: Activity }) => (
    <View style={styles.activityItem}>
      <View
        style={[
          styles.activityIcon,
          { backgroundColor: getActivityColor(item.type) },
        ]}
      >
        <Clock size={16} color="#FFFFFF" />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityDescription}>{item.description}</Text>
        <Text style={styles.activityTime}>{item.time}</Text>
      </View>
    </View>
  );

  const getActivityColor = (type: string) => {
    switch (type) {
      case "course":
        return "#007AFF";
      case "assessment":
        return "#FF9500";
      case "achievement":
        return "#34C759";
      default:
        return "#8E8E93";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activity</Text>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <ChevronRight size={16} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading activities...</Text>
        ) : activities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Clock size={32} color="#8E8E93" />
            <Text style={styles.emptyText}>No recent activities</Text>
          </View>
        ) : (
          <FlatList
            data={activities.slice(0, 5)}
            renderItem={renderActivityItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    color: "#007AFF",
    marginRight: 4,
  },
  content: {
    padding: 16,
  },
  activityItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  activityItem_last: {
    borderBottomWidth: 0,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
  },
  activityDescription: {
    fontSize: 14,
    color: "#000000",
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 4,
  },
  loadingText: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 8,
  },
});
