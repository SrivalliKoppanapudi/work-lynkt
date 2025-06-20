import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import CourseSearchBar from "../Courses-dashboard/CourseSearchBar";
import RecentActivities from "../Courses-dashboard/RecentActivities";
import OverallCourseAnalytics from "../../app/(screens)/OverallCourseAnalytics"; // Import the OverallCourseAnalytics component
import { supabase } from "../../lib/Superbase";
import Colors from "../../constant/Colors";
import { Users, BookOpen, Award, ChevronRight } from "lucide-react-native";
import { router } from "expo-router"; // Import expo-router for navigation

export default function Header() {
  const [searchResults, setSearchResults] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [showFilterSort, setShowFilterSort] = useState(false);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("status", "published"); // Only fetch published courses

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for search results
  const handleSearch = async (results) => {
    setSearchResults(results || []);
  };

  // Calculate analytics
  const calculateAnalytics = () => {
    if (!courses.length)
      return {
        totalEnrollments: 0,
        averageCompletionRate: 0,
        averageScore: 0,
        totalCourses: 0,
      };

    const totalEnrollments = courses.reduce(
      (sum, course) => sum + (course.enrollment_count || 0),
      0
    );
    const averageCompletionRate = Math.round(
      courses.reduce((sum, course) => sum + (course.completion_rate || 0), 0) /
        courses.length
    );
    const averageScore = Math.round(
      courses.reduce((sum, course) => sum + (course.average_score || 0), 0) /
        courses.length
    );

    return {
      totalEnrollments,
      averageCompletionRate,
      averageScore,
      totalCourses: courses.length,
    };
  };

  // Render a single course item
  const renderCourseItem = ({ item }) => (
    <View style={styles.courseItem}>
      <Text style={styles.courseTitle}>{item.title}</Text>
      <Text style={styles.courseStatus}>Status: {item.status}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <CourseSearchBar
          onSearch={handleSearch}
          onFilterSortToggle={setShowFilterSort}
        />
      </View>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          {searchResults.map((item) => renderCourseItem({ item }))}
        </View>
      )}

      {/* Analytics Section */}
      {!isLoading && (
        <View>
          <View style={{flexDirection:'row',justifyContent:'space-between'}}>
          <Text style={styles.sectionTitle}>Course Analytics</Text>
          <ChevronRight size={20} color={Colors.PRIMARY} style={{marginLeft:130}} />

          <TouchableOpacity
            onPress={() => router.push("/(screens)/OverallCourseAnalytics")}
          >
            <Text style={styles.reportText}>See Report</Text>
          </TouchableOpacity></View>
          <View style={styles.analyticsContainer}>
            <View style={styles.analyticItem}>
              <Users size={20} color={Colors.PRIMARY} />
              <View style={styles.analyticTextContainer}>
                <Text style={styles.analyticValue}>
                  {calculateAnalytics().totalEnrollments}
                </Text>
                <Text style={styles.analyticLabel}>Enrollments</Text>
              </View>
            </View>

            <View style={styles.analyticDivider} />

            <View style={styles.analyticItem}>
              <BookOpen size={20} color={Colors.PRIMARY} />
              <View style={styles.analyticTextContainer}>
                <Text style={styles.analyticValue}>
                  {calculateAnalytics().averageCompletionRate}%
                </Text>
                <Text style={styles.analyticLabel}>Completion</Text>
              </View>
            </View>

            <View style={styles.analyticDivider} />

            <View style={styles.analyticItem}>
              <Award size={20} color={Colors.PRIMARY} />
              <View style={styles.analyticTextContainer}>
                <Text style={styles.analyticValue}>
                  {calculateAnalytics().averageScore}
                </Text>
                <Text style={styles.analyticLabel}>Avg. Score</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* See Report Button */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  coursesListContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitles: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.PRIMARY,
  },
  searchBarContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  resultsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.PRIMARY,
  },
  courseItem: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e1e1e1",
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  courseStatus: {
    fontSize: 14,
    color: "#666",
  },
  recentActivitiesContainer: {
    padding: 8,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.WHITE,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  reportText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.PRIMARY,
    marginRight: 8,
  },
  analyticsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.WHITE,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  analyticItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  analyticTextContainer: {
    marginLeft: 8,
  },
  analyticValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.PRIMARY,
  },
  analyticLabel: {
    fontSize: 12,
    color: "#666",
  },
  analyticDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e1e1e1",
    marginHorizontal: 10,
  },
  cTitle: {
    fontSize: 15,
    flexDirection: "row",
    color: Colors.PRIMARY,
  },
});
