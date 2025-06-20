import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileSummary from "../../component/dashboard/ProfileSummary";
import QuickAccessLink from "../../component/dashboard/QuickAccessLink";
import NotificationCenter from "../../component/dashboard/NotificationCenter";
import RecentActivity from "../../component/dashboard/RecentActivity";
import Colors from "../../constant/Colors";
import { supabase } from "../../lib/Superbase";

// RoleDisplay Component
const RoleDisplay = ({ role }: { role: string | null }) => (
  <Text style={styles.roleText}>Role: {role ?? "Unknown"}</Text>
);

export default function Dashboard() {
  const [userDetails, setUserDetails] = useState<{
    name?: string;
    goals?: string;
    objectives?: string;
  } | null>(null);
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserDetails = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;

      if (user) {
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;
        setUserDetails(data);
      }
    } catch (err: any) {
      setError(err.message ?? "Unknown error occurred");
    }
  };

  const fetchNotifications = async () => {
    setNotifications([
      {
        id: "1",
        title: "New Course",
        message: "React Native course is available.",
        time: "2 hours ago",
        read: false,
        type: "course",
      },
      {
        id: "2",
        title: "Reminder",
        message: "Complete your TypeScript assessment.",
        time: "5 hours ago",
        read: false,
        type: "reminder",
      },
    ]);
  };

  const fetchActivities = async () => {
    setActivities([
      {
        id: "1",
        title: "Started Course",
        description: "React Native Fundamentals",
        time: "2 hours ago",
        type: "course",
      },
      {
        id: "2",
        title: "Completed Quiz",
        description: "JavaScript Basics",
        time: "1 day ago",
        type: "quiz",
      },
    ]);
  };

  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchUserDetails(),
        fetchNotifications(),
        fetchActivities(),
      ]);
    } catch (err: any) {
      setError(err.message ?? "Failed to load data");
      console.error("Error loading dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.welcomeText}>
              Welcome, {userDetails?.name || "User"}
            </Text>

            <ProfileSummary
              isLoading={isLoading}
              name={userDetails?.name || ""}
              goals={userDetails?.goals || ""}
              objectives={userDetails?.objectives || ""}
            />

            <QuickAccessLink />

            <NotificationCenter 
              notifications={notifications} 
              isLoading={isLoading}
              onMarkAsRead={(id) => {
                // Handle marking notification as read
                setNotifications(notifications.map(notification => 
                  notification.id === id 
                    ? { ...notification, read: true }
                    : notification
                ));
              }} 
            />

            <RecentActivity activities={activities} isLoading={isLoading} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  scrollView: {
    flex: 1,
    margin:5
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 2,
    color: Colors.PRIMARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.PRIMARY,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: "#ffebee",
    borderRadius: 8,
    marginVertical: 16,
  },
  errorText: {
    color: Colors.ERROR,
    fontSize: 16,
  },
  roleText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
});