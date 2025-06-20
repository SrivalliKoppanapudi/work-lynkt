import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Activity,
  MessageSquare,
  FileText,
  ArrowDown,
} from "lucide-react-native";
import { ProgressBar } from "react-native-paper";
import Colors from "../../constant/Colors";
import DiagnosticTool from "./DiagnosticTool";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Interface for analytics data
interface OverallCourseAnalyticsProps {
  navigation: any;
  totalEnrollments: number;
  activeStudents: number;
  droppedStudents: number;
  averageCompletionRate: number;
  moduleCompletionRates: { module: string; completion: number }[];
  averageScore: number;
  assessmentScores: { assessment: string; avgScore: number; avgTime: number }[];
  averageTimeSpent: number;
  discussionParticipation: number;
  resourceDownloads: number;
  engagementTrend: { month: string; engagement: number }[];
  averageFeedbackRating: number;
  feedbackCategories: { category: string; count: number }[];
  totalCourses: number;
  enrollmentTrend: { month: string; enrollments: number }[];
  performanceTrend: { week: string; score: number }[];
}

const OverallCourseAnalytics = ({
  navigation,
  totalEnrollments = 0,
  activeStudents = 0,
  droppedStudents = 0,
  averageCompletionRate = 0,
  moduleCompletionRates = [],
  averageScore = 0,
  assessmentScores = [],
  averageTimeSpent = 0,
  discussionParticipation = 0,
  resourceDownloads = 0,
  engagementTrend = [],
  averageFeedbackRating = 0,
  feedbackCategories = [],
  totalCourses = 0,
  enrollmentTrend = [],
  performanceTrend = [],
}: OverallCourseAnalyticsProps) => {
  // Debugging logs
  // console.log('moduleCompletionRates:', moduleCompletionRates);
  // console.log('assessmentScores:', assessmentScores);
  // console.log('engagementTrend:', engagementTrend);
  // console.log('feedbackCategories:', feedbackCategories);
  // console.log('enrollmentTrend:', enrollmentTrend);
  // console.log('performanceTrend:', performanceTrend);

  const [expandedSections, setExpandedSections] = useState({
    enrollment: false,
    completion: false,
    assessment: false,
    engagement: false,
    feedback: false,
    reports: false,
    trends: false,
    diagnostic: false, // Add this new section
  });

  const router = useRouter();

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={{flexDirection:'row', alignItems:'baseline', marginBottom:10}}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
          </Pressable>
          <Text style={styles.title}>Overall Course Analytics</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Users size={20} color={Colors.PRIMARY} />
              <Text style={styles.metricTitle}>Total Enrollments</Text>
            </View>
            <Text style={styles.metricValue}>{totalEnrollments}</Text>
            <Text style={styles.metricSubtitle}>Across all courses</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <BookOpen size={20} color={Colors.PRIMARY} />
              <Text style={styles.metricTitle}>Avg. Completion</Text>
            </View>
            <Text style={styles.metricValue}>{averageCompletionRate}%</Text>
            <Text style={styles.metricSubtitle}>Of enrolled students</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Award size={20} color={Colors.PRIMARY} />
              <Text style={styles.metricTitle}>Avg. Score</Text>
            </View>
            <Text style={styles.metricValue}>{averageScore}</Text>
            <Text style={styles.metricSubtitle}>Across all courses</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <TrendingUp size={20} color={Colors.PRIMARY} />
              <Text style={styles.metricTitle}>Total Courses</Text>
            </View>
            <Text style={styles.metricValue}>{totalCourses}</Text>
            <Text style={styles.metricSubtitle}>Active courses</Text>
          </View>
        </View>

        {/* 1. Enrollment Metrics */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("enrollment")}
          >
            <View style={styles.sectionTitleContainer}>
              <Users size={20} color={Colors.PRIMARY} />
              <Text style={styles.sectionTitle}>Enrollment Metrics</Text>
            </View>
            <ArrowDown
              size={20}
              color={Colors.PRIMARY}
              style={{
                transform: [
                  { rotate: expandedSections.enrollment ? "180deg" : "0deg" },
                ],
              }}
            />
          </TouchableOpacity>

          {expandedSections.enrollment && (
            <View style={styles.sectionContent}>
              <View style={styles.enrollmentStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Active Students</Text>
                  <Text style={styles.statValue}>{activeStudents}</Text>
                  <ProgressBar
                    progress={
                      totalEnrollments > 0
                        ? activeStudents / totalEnrollments
                        : 0
                    }
                    color={Colors.SUCCESS}
                    style={styles.progressBar}
                  />
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Dropped Students</Text>
                  <Text style={styles.statValue}>{droppedStudents}</Text>
                  <ProgressBar
                    progress={
                      totalEnrollments > 0
                        ? droppedStudents / totalEnrollments
                        : 0
                    }
                    color={Colors.DANGER}
                    style={styles.progressBar}
                  />
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Retention Rate</Text>
                  <Text style={styles.statValue}>
                    {totalEnrollments > 0
                      ? Math.round((activeStudents / totalEnrollments) * 100)
                      : 0}
                    %
                  </Text>
                  <ProgressBar
                    progress={
                      totalEnrollments > 0
                        ? activeStudents / totalEnrollments
                        : 0
                    }
                    color={Colors.PRIMARY}
                    style={styles.progressBar}
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 2. Completion Rates */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("completion")}
          >
            <View style={styles.sectionTitleContainer}>
              <BookOpen size={20} color={Colors.PRIMARY} />
              <Text style={styles.sectionTitle}>Completion Rates</Text>
            </View>
            <ArrowDown
              size={20}
              color={Colors.PRIMARY}
              style={{
                transform: [
                  { rotate: expandedSections.completion ? "180deg" : "0deg" },
                ],
              }}
            />
          </TouchableOpacity>

          {expandedSections.completion && (
            <View style={styles.sectionContent}>
              <View style={styles.overallCompletion}>
                <Text style={styles.statLabel}>Overall Course Completion</Text>
                <Text style={styles.largeStatValue}>
                  {averageCompletionRate}%
                </Text>
                <ProgressBar
                  progress={averageCompletionRate / 100}
                  color={Colors.PRIMARY}
                  style={styles.progressBar}
                />
              </View>

              <Text style={styles.subSectionTitle}>Module Completion</Text>
              {moduleCompletionRates.map((module, index) => (
                <View key={index} style={styles.moduleItem}>
                  <View style={styles.moduleHeader}>
                    <Text style={styles.moduleTitle}>{module.module}</Text>
                    <Text style={styles.moduleValue}>{module.completion}%</Text>
                  </View>
                  <ProgressBar
                    progress={module.completion / 100}
                    color={Colors.PRIMARY}
                    style={styles.progressBar}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 3. Assessment Performance */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("assessment")}
          >
            <View style={styles.sectionTitleContainer}>
              <Award size={20} color={Colors.PRIMARY} />
              <Text style={styles.sectionTitle}>Assessment Performance</Text>
            </View>
            <ArrowDown
              size={20}
              color={Colors.PRIMARY}
              style={{
                transform: [
                  { rotate: expandedSections.assessment ? "180deg" : "0deg" },
                ],
              }}
            />
          </TouchableOpacity>

          {expandedSections.assessment && (
            <View style={styles.sectionContent}>
              <Text style={styles.subSectionTitle}>
                Time Spent on Assessments
              </Text>
              {assessmentScores.map((assessment, index) => (
                <View key={index} style={styles.assessmentItem}>
                  <View style={styles.assessmentHeader}>
                    <Text style={styles.assessmentTitle}>
                      {assessment.assessment}
                    </Text>
                    <Text style={styles.assessmentValue}>
                      {assessment.avgTime} min
                    </Text>
                  </View>
                  <ProgressBar
                    progress={
                      assessment.avgTime /
                      Math.max(...assessmentScores.map((a) => a.avgTime))
                    }
                    color="#ff9800"
                    style={styles.progressBar}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 4. Engagement Metrics */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("engagement")}
          >
            <View style={styles.sectionTitleContainer}>
              <Activity size={20} color={Colors.PRIMARY} />
              <Text style={styles.sectionTitle}>Engagement Metrics</Text>
            </View>
            <ArrowDown
              size={20}
              color={Colors.PRIMARY}
              style={{
                transform: [
                  { rotate: expandedSections.engagement ? "180deg" : "0deg" },
                ],
              }}
            />
          </TouchableOpacity>

          {expandedSections.engagement && (
            <View style={styles.sectionContent}>
              <View style={styles.engagementStatsContainer}>
                <View style={styles.engagementStat}>
                  <Text style={styles.engagementValue}>{averageTimeSpent}</Text>
                  <Text style={styles.engagementLabel}>
                    Avg. Minutes/Session
                  </Text>
                </View>
                <View style={styles.engagementStat}>
                  <Text style={styles.engagementValue}>
                    {discussionParticipation}
                  </Text>
                  <Text style={styles.engagementLabel}>Discussion Posts</Text>
                </View>
                <View style={styles.engagementStat}>
                  <Text style={styles.engagementValue}>
                    {resourceDownloads}
                  </Text>
                  <Text style={styles.engagementLabel}>Resource Downloads</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 5. Feedback Analysis */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("feedback")}
          >
            <View style={styles.sectionTitleContainer}>
              <MessageSquare size={20} color={Colors.PRIMARY} />
              <Text style={styles.sectionTitle}>Feedback Analysis</Text>
            </View>
            <ArrowDown
              size={20}
              color={Colors.PRIMARY}
              style={{
                transform: [
                  { rotate: expandedSections.feedback ? "180deg" : "0deg" },
                ],
              }}
            />
          </TouchableOpacity>

          {expandedSections.feedback && (
            <View style={styles.sectionContent}>
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingValue}>
                  {averageFeedbackRating.toFixed(1)}
                </Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Text
                      key={star}
                      style={{
                        fontSize: 20,
                        color:
                          star <= Math.round(averageFeedbackRating)
                            ? "#ffc107"
                            : "#e0e0e0",
                      }}
                    >
                      ★
                    </Text>
                  ))}
                </View>
                <Text style={styles.ratingLabel}>Average Rating</Text>
              </View>
            </View>
          )}
        </View>

        {/* Diagnostic Tool Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("diagnostic")}
          >
            <View style={styles.sectionTitleContainer}>
              <Activity size={20} color={Colors.PRIMARY} />
              <Text style={styles.sectionTitle}>Teaching Diagnostic</Text>
            </View>
            <ArrowDown
              size={20}
              color={Colors.PRIMARY}
              style={{
                transform: [
                  { rotate: expandedSections.diagnostic ? "180deg" : "0deg" },
                ],
              }}
            />
          </TouchableOpacity>

          {expandedSections.diagnostic && (
            <View style={styles.sectionContent}>
              <DiagnosticTool />
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WHITE,
    padding: 10,
    borderRadius: 12,
    marginHorizontal: 1,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#e1e1e1",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.PRIMARY,
    marginBottom: 16,
    marginLeft:6,
  },
  metricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#f5f7fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.PRIMARY,
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: "#999",
  },
  section: {
    marginTop: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f0f0f0",
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.PRIMARY,
    marginLeft: 8,
  },
  sectionContent: {
    padding: 10,
  },
  enrollmentStats: {
    marginVertical: 8,
  },
  statItem: {
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  overallCompletion: {
    marginBottom: 16,
  },
  largeStatValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.PRIMARY,
    marginVertical: 4,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
    marginTop: 8,
    marginBottom: 12,
  },
  moduleItem: {
    marginBottom: 10,
  },
  moduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  moduleTitle: {
    fontSize: 14,
    color: "#555",
  },
  moduleValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.PRIMARY,
  },
  assessmentItem: {
    marginBottom: 10,
  },
  assessmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  assessmentTitle: {
    fontSize: 14,
    color: "#555",
  },
  assessmentValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ff9800",
  },
  engagementStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  engagementStat: {
    alignItems: "center",
    width: "30%",
  },
  engagementValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.SUCCESS,
    marginBottom: 4,
  },
  engagementLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  ratingContainer: {
    alignItems: "center",
    marginVertical: 12,
  },
  ratingValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffc107",
  },
  starsContainer: {
    flexDirection: "row",
    marginVertical: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default OverallCourseAnalytics;
