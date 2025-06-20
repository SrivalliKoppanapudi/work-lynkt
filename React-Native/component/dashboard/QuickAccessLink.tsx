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
} from "lucide-react-native";
import Colors from "../../constant/Colors";

export default function QuickAccessLinks() {
  const router = useRouter();

  const links = [
    {
      id: "courses",
      title: "Courses",
      icon: BookOpen,
      route: "/(screens)/courses",
    },
    {
      id: "assessments",
      title: "Assessments",
      icon: FileText,
      route: "/dashboard/assessments",
    },
    {
      id: "achievements",
      title: "Achievements",
      icon: Award,
      route: "/dashboard/achievements",
    },
    {
      id: "analytics",
      title: "Analytics",
      icon: BarChart2,
      route: "/(screens)/OverallCourseAnalytics",
    },
    {
      id: "community",
      title: "Community",
      icon: Users,
      route: "/dashboard/community",
    },
    {
      id: "calendar",
      title: "Calender",
      icon: Calendar,
      route: "/dashboard/calendar",
    },
    {
      id: "knowledgeBase",
      title: "Knowledge Base",
      icon: BookOpen,
      route: "/(screens)/KnowledgeBaseDashboard",
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
      <Text style={styles.title}>Quick Access</Text>
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
            <View style={styles.iconContainer}>
              <link.icon size={24} color="#FFFFFF" />
            </View>
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
  },
});
