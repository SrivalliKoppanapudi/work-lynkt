import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  BookOpen,
  Award,
  ChartBar as BarChart2,
  FileText,
  Users,
  Calendar,
  Newspaper,
  MessageCircle,
} from "lucide-react-native";
import Colors from "../../constant/Colors";

export default function QuickAccessLinks() {
  const router = useRouter();

  const links = [
    {
      id: "feed",
      title: "Feed",
      icon: Newspaper,
      route: "/(screens)/SocialMediaDashboard",
    },
    {
      id: "messages",
      title: "Messages",
      icon: MessageCircle,
      route: "/dashboard/assessments",
    },
    {
      id: "communities",
      title: "Communities",
      icon: Award,
      route: "/dashboard/achievements",
    },
    {
      id: "events",
      title: "Events",
      icon: BarChart2,
      route: "/(screens)/OverallCourseAnalytics",
    },
    {
      id: "knowledgebites",
      title: "Knowledge Bites",
      icon: Users,
      route: "/dashboard/community",
    },
    {
      id: "saved",
      title: "Saved",
      icon: Calendar,
      route: "/dashboard/calendar",
    },
    {
      id: "settings",
      title: "Settings",
      icon: Calendar,
      route: "/dashboard/calendar",
    },
  ];

  const handleNavigation = (route: string) => {
    // console.log('Navigating to:', route);
    try {
      router.push(route as any);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Navigate</Text>
      <ScrollView
        horizontal
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {links.map((link) => (
          <TouchableOpacity
            key={link.id}
            style={styles.linkItem}
            onPress={() => handleNavigation(link.route)}
          >
            <Text style={styles.linkText}>{link.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.PRIMARY,
    marginBottom: 16,
  },
  scrollContent: {
    paddingRight: 16,
  },
  linkItem: {
    alignItems: "center",
    marginRight: 16,
    width: 80,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  linkText: {
    fontSize: 12,
    color: "#000000",
    textAlign: "center",
    backgroundColor:"lightgrey",
    padding: 6,
    borderRadius: 8,
    width: 89,
  },
});
