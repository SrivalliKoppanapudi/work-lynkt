import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, Bell } from "lucide-react-native";
import { Notification } from "../../types/notification"; // Import the Notification type
import NotificationItem from "./../../notification/NotificationItem"; // Import the NotificationItem component

type NotificationCenterProps = {
  notifications: Notification[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void; // Add this prop
};

export default function NotificationCenter({
  notifications,
  isLoading,
  onMarkAsRead,
}: NotificationCenterProps) {
  const router = useRouter();

  const handleViewAll = () => {
    router.push("/DashBoard");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <Text style={styles.viewAllText}>View All</Text>
          <ChevronRight size={16} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading notifications...</Text>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bell size={32} color="#8E8E93" />
            <Text style={styles.emptyText}>No new notifications</Text>
          </View>
        ) : (
          <FlatList
            data={notifications.slice(0, 3)} // Show only the first 3 notifications
            renderItem={({ item }) => (
              <NotificationItem
                notification={item}
                onMarkAsRead={onMarkAsRead} // Pass the onMarkAsRead function
              />
            )}
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
