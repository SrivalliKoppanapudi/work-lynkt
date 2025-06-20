import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Check } from "lucide-react-native";
import { Notification } from "./../types/notification";

type NotificationItemProps = {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
};

export default function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {
  const handleMarkAsRead = () => {
    onMarkAsRead(notification.id);
  };

  return (
    <View
      style={[
        styles.container,
        notification.read ? styles.readContainer : styles.unreadContainer,
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.time}>{notification.time}</Text>
      </View>
      {!notification.read && (
        <TouchableOpacity
          style={styles.markAsReadButton}
          onPress={handleMarkAsRead}
        >
          <Check size={16} color="#007AFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  unreadContainer: {
    backgroundColor: "#E5F2FF",
  },
  readContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    color: "#8E8E93",
  },
  markAsReadButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
});
