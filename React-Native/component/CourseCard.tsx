import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Dimensions } from "react-native";
import { Course, CourseSettings } from "../types/courses";
import { Ionicons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { router } from "expo-router";
import { supabase } from "../lib/Superbase";
import ButtonComponent from "./ButtonComponent";
import Colors from "../constant/Colors";

interface CourseCardProps {
  course: Course;
  onPress?: () => void;
  onDelete?: (id: string) => void;
}

// Function to get the correct Supabase image URL
const getImageUrl = (imagePath: string | null) => {
  if (!imagePath) return "https://via.placeholder.com/150";
  
  // If it's already a full URL, return it
  if (imagePath.startsWith("http")) return imagePath;
  
  // If it's just a filename, construct the full URL
  const fullUrl = `https://dxhsmurbnfhkohqmmwuo.supabase.co/storage/v1/object/public/course-images/course-thumbnails/${imagePath}`;
  console.log("Using constructed URL:", fullUrl);
  return fullUrl;
};
const screenWidth = Dimensions.get('window').width;

export default function CourseCard({
  course,
  onPress,
  onDelete,
}: CourseCardProps) {
  const [courseSettings, setCourseSettings] = useState<CourseSettings | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [localEnrollmentCount, setLocalEnrollmentCount] = useState(0);

  const description = course.description || "No description available.";
  const moduleCount = course.modules ? course.modules.length : 0;
  const enrollmentCount = localEnrollmentCount || course.enrollmentcount || 0;
  const completionRate = course.completionRate || 0;

  // Fetch course settings and enrollment status
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // Fetch course settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('course_settings')
          .select('*')
          .eq('course_id', course.id)
          .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
          throw settingsError;
        }

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        if (user) {
          // Check if user is enrolled
          const { data: enrollment, error: enrollmentError } = await supabase
            .from('course_enrollments')
            .select('*')
            .eq('course_id', course.id)
            .eq('user_id', user.id)
            .single();

          if (enrollmentError && enrollmentError.code !== 'PGRST116') {
            throw enrollmentError;
          }

          setIsEnrolled(!!enrollment);
        }
        
        // Set the initial enrollment count
        setLocalEnrollmentCount(course.enrollmentcount || 0);

        setCourseSettings(settingsData || {
          visibility: 'public',
          is_paid: false,
          price: 0,
          currency: 'INR',
          subscription_type: 'one-time',
          subscription_price: 0,
          scheduled_release: false,
          release_date: null,
          module_release_schedule: [],
          access_restrictions: 'all',
          allowed_roles: [],
          allowed_users: [],
          notify_on_enrollment: true,
          notify_on_completion: true,
          notify_on_assessment_submission: true,
          is_archived: false
        });
      } catch (error) {
        console.error('Error fetching course data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [course.id]);

  const handleEnroll = async () => {
    try {
      if (!courseSettings) return;

      // Check if course is archived
      if (courseSettings.is_archived) {
        Alert.alert('Course Archived', 'This course is no longer available for enrollment.');
        return;
      }

      // Check if course is scheduled for future release
      if (courseSettings.release_date && new Date(courseSettings.release_date) > new Date()) {
        Alert.alert(
          'Course Not Available',
          `This course will be available from ${new Date(courseSettings.release_date).toLocaleDateString()}`
        );
        return;
      }

      // Check visibility settings
      if (courseSettings.visibility === 'private') {
        Alert.alert('Private Course', 'This course is private and requires an invitation.');
        return;
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Authentication Required', 'Please sign in to enroll in courses.');
        return;
      }

      if (isEnrolled) {
        Alert.alert('Already Enrolled', 'You are already enrolled in this course.');
        return;
      }

      // Handle enrollment based on course settings
      if (courseSettings.is_paid) {
        // Navigate to payment screen
        router.push({
          pathname: "/(screens)/Checkout" as any,
          params: { 
            courseId: course.id,
            amount: courseSettings.price,
            currency: courseSettings.currency,
            courseTitle: course.title
          }
        });
      } else {
        // Begin a transaction for consistent enrollment
        const { error: enrollError } = await supabase
          .from('course_enrollments')
          .insert({
            course_id: course.id,
            user_id: user.id,
            enrolled_at: new Date().toISOString(),
            status: 'active'
          });

        if (enrollError) {
          console.error('Error creating course enrollment:', enrollError);
          throw enrollError;
        }
        
        // Update enrollment count in the database
        const newEnrollmentCount = (course.enrollmentcount || 0) + 1;
        const { error: updateError } = await supabase
          .from('courses')
          .update({ enrollmentcount: newEnrollmentCount })
          .eq('id', course.id);
          
        if (updateError) {
          console.error('Error updating enrollment count:', updateError);
          // Rollback the enrollment if count update fails
          await supabase
            .from('course_enrollments')
            .delete()
            .eq('course_id', course.id)
            .eq('user_id', user.id);
          throw updateError;
        }

        // Update local state with new enrollment count
        setLocalEnrollmentCount(newEnrollmentCount);
        
        try {
          // Create enrollment record in the enrollments table
          const { error: enrollmentError } = await supabase
            .from('enrollments')
            .insert({
              course_id: course.id,
              student_id: user.id,
              status: 'active',
              enrollment_date: new Date().toISOString(),
              progress: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (enrollmentError) {
            console.error('Error creating enrollment record:', enrollmentError);
            // Don't throw here as the main enrollment is already successful
          }
          
          // Update enrollment stats
          const { data: statsData, error: statsError } = await supabase
            .from('enrollment_stats')
            .select('*')
            .eq('course_id', course.id)
            .single();
          
          if (statsError && statsError.code !== 'PGRST116') {
            console.error('Error fetching enrollment stats:', statsError);
          } else {
            if (statsData) {
              // Update existing stats
              const { error: updateStatsError } = await supabase
                .from('enrollment_stats')
                .update({
                  total_enrollments: statsData.total_enrollments + 1,
                  active_students: statsData.active_students + 1,
                  updated_at: new Date().toISOString()
                })
                .eq('course_id', course.id);
                
              if (updateStatsError) {
                console.error('Error updating enrollment stats:', updateStatsError);
              }
            } else {
              // Create new stats record
              const { error: insertStatsError } = await supabase
                .from('enrollment_stats')
                .insert({
                  course_id: course.id,
                  total_enrollments: 1,
                  active_students: 1,
                  completed_students: 0,
                  dropped_students: 0,
                  average_progress: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
                
              if (insertStatsError) {
                console.error('Error creating enrollment stats:', insertStatsError);
              }
            }
          }
        } catch (statsUpdateError) {
          console.error('Error managing enrollment stats:', statsUpdateError);
          // Don't throw here as the main enrollment is already successful
        }

        setIsEnrolled(true);
        Alert.alert('Success', 'You have been enrolled in this course!');
        router.push({
          pathname: "/(screens)/CourseDetails",
          params: { course: JSON.stringify({...course, enrollmentcount: newEnrollmentCount}) }
        });
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      Alert.alert('Error', 'Failed to enroll in the course. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Image Section */}
      <TouchableOpacity
        onPress={() => {
          const courseParam = JSON.stringify(course);
          router.push({
            pathname: "/(screens)/CourseDetails",
            params: { course: courseParam },
          });
        }}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getImageUrl(course.image) }}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay} />
          {courseSettings?.is_archived && (
            <TouchableOpacity 
              style={styles.archivedBadge}
              onPress={() => {
                router.push({
                  pathname: "/(screens)/CourseArchiveAndDeletion",
                  params: { course: JSON.stringify(course) }
                });
              }}
            >
              <Text style={styles.archivedText}>Archived</Text>
            </TouchableOpacity>
          )}
          {/* Price Badge */}
          <View style={[styles.priceBadge, courseSettings?.is_paid ? null : styles.freeBadge]}>
            <Text style={styles.priceBadgeText}>
              {courseSettings?.is_paid ? `${courseSettings.currency} ${courseSettings.price}` : "Free Course"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Content Section */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {course.title}
          </Text>
        </View>

        <Text 
          style={styles.description} 
          numberOfLines={2} 
          ellipsizeMode="tail"
        >
          {description.trim()}
        </Text>

        {/* Course Settings Info */}
        <View style={styles.settingsInfo}>
          {courseSettings?.release_date && new Date(courseSettings.release_date) > new Date() && (
            <View style={styles.releaseDateContainer}>
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              <Text style={styles.releaseDateText}>
                Available from {new Date(courseSettings.release_date).toLocaleDateString()}
              </Text>
            </View>
          )}

          {courseSettings?.visibility !== 'public' && (
            <View style={styles.visibilityContainer}>
              <Ionicons 
                name={courseSettings.visibility === 'private' ? 'lock-closed-outline' : 'mail-outline'} 
                size={14} 
                color="#6b7280" 
              />
              <Text style={styles.visibilityText}>
                {courseSettings.visibility === 'private' ? 'Private Course' : 'Invitation Only'}
              </Text>
            </View>
          )}
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <Progress.Bar
            progress={completionRate / 100}
            width={null}
            height={4}
            borderRadius={2}
            borderColor="#e9ecef"
            color="#28a745"
          />
          <Text style={styles.completionRate}>{completionRate}% Complete</Text>
        </View>

        {/* Footer Section */}
        <View style={styles.footer}>
          <View style={styles.categorySection}>
            <Text style={styles.category}>
              {course.categories && course.categories.length > 0
                ? course.categories.join(", ")
                : "No category selected"}
            </Text>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.moduleInfo}>
              <Ionicons name="layers-outline" size={16} color="black" />
              <Text style={styles.moduleCount}>
                {moduleCount} {moduleCount === 1 ? "Module" : "Modules"}
              </Text>
            </View>

            <View style={styles.enrollmentInfo}>
              <Ionicons name="people-outline" size={16} color="black" />
              <Text style={styles.enrollmentCount}>
                {enrollmentCount} Enrolled
              </Text>
            </View>
            {onDelete && (
              <View style={styles.deleteButton}>
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color="red"
                  onPress={() => onDelete(course.id.toString())}
                />
              </View>
            )}
          </View>
        </View>

        {/* Enroll Button */}
        {!courseSettings?.is_archived && (
          <ButtonComponent
            title={isEnrolled ? "Continue Learning" : (courseSettings?.is_paid ? "Enroll Now" : "Start Learning")}
            onPress={handleEnroll}
            style={styles.enrollButton}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    margin: 8,
    width: screenWidth > 390 ? (screenWidth / 2) - 24 : screenWidth - 70,
    minHeight:200,
    alignSelf: "stretch",
  },
  imageContainer: {
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 12,
  },
  archivedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  archivedText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  content: {
    padding: 16,
    flexGrow:1
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  description: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 8,
  flexWrap: "wrap",
  },
  settingsInfo: {
    marginBottom: 8,
  },
  releaseDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  releaseDateText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
  },
  visibilityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  visibilityText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
  },
  progressSection: {
    marginBottom: 8,
  },
  completionRate: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categorySection: {
    flex: 1,
    marginRight: 8,
  },
  category: {
    fontSize: 12,
    color: "#3b82f6",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  infoSection: {
    flex: 1,
    marginTop: 8,
    flexDirection: "column", // Changed to column for better spacing
    alignItems: "flex-start"
  },
  moduleInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4, // Added margin for spacing
  },
  moduleCount: {
    fontSize: 12,
    color: "#4b5563",
    marginLeft: 4,
  },
  enrollmentInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4, // Added margin for spacing
  },
  enrollmentCount: {
    fontSize: 12,
    color: "#4b5563",
    marginLeft: 4,
  },
  previewButton: {
    marginLeft: 8,
  },
  deleteButton: {
    padding: 4,
  },
  enrollButton: {
    marginTop: 12,
    backgroundColor: Colors.PRIMARY,
  },
  priceBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#059669",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  freeBadge: {
    backgroundColor: "#3b82f6", // Blue color for free courses
  },
  priceBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingCard: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
});
