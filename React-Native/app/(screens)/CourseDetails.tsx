import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Image,
  Alert,
  Platform,
  TouchableOpacity,
  Linking,
  Dimensions,
  StatusBar,
  FlatList,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  Course,
  Module as CourseModule,
  Resource as ResourceType,
} from "../../types/courses";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { Button } from "react-native-paper";
import Colors from "../../constant/Colors";
import CourseEditor from "./CourseEditor";
import { supabase } from "../../lib/Superbase";
import ResourceViewer from '../../component/courses/ResourceViewer';
import { FileText, Play, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react-native';
import CourseFeedback from '../../component/courses/CourseFeedback';
import * as ScreenOrientation from 'expo-screen-orientation';

interface CourseFeedbackProps {
  courseId: string;
  publisherId: string;
  isEnrolled: boolean;
}

export default function CourseDetails() {
  const params = useLocalSearchParams<{ course: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isPublisher, setIsPublisher] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [parseError, setParseError] = useState<Error | null>(null);
  const [selectedResource, setSelectedResource] = useState<ResourceType | null>(null);
  const [resourceViewerVisible, setResourceViewerVisible] = useState(false);
  const [resources, setResources] = useState<ResourceType[]>([]);
  
  // Parse course data from params
  useEffect(() => {
    try {
      if (params.course) {
        const parsedCourse = JSON.parse(params.course as string);
        // console.log('Course data:', parsedCourse);
        // console.log('Course publisher_id:', parsedCourse.user_id);
        setCourse(parsedCourse);
      }
    } catch (error) {
      console.error("Error parsing course data:", error);
      setParseError(error as Error);
    }
  }, [params.course]);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting user:', error);
        return;
      }
      
      if (user) {
        console.log('Current user ID:', user.id);
        setCurrentUserId(user.id);
      }
    };
    
    getCurrentUser();
  }, []);

  // Check if current user is the publisher of the course
  useEffect(() => {
    if (currentUserId && course?.user_id) {
      console.log('Checking publisher status - currentUserId:', currentUserId, 'publisher_id:', course.user_id);
      const isUserPublisher = currentUserId === course.user_id;
      console.log('Is user the publisher?', isUserPublisher);
      setIsPublisher(isUserPublisher);
    } else {
      console.log('Missing data for publisher check - currentUserId:', currentUserId, 'publisher_id:', course?.user_id);
    }
  }, [currentUserId, course?.user_id]);

  // Check if current user is enrolled in the course
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!currentUserId || !course?.id) return;

      try {
        const { data: enrollment, error } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('course_id', course.id)
          .eq('user_id', currentUserId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking enrollment:', error);
          return;
        }

        setIsEnrolled(!!enrollment);
      } catch (error) {
        console.error('Error checking enrollment:', error);
      }
    };

    checkEnrollment();
  }, [currentUserId, course?.id]);

  // Fetch course resources
  useEffect(() => {
    if (course?.id) {
      fetchCourseResources();
    }
  }, [course?.id]);

  const fetchCourseResources = async () => {
    try {
      console.log('Fetching resources for course:', course?.id);
      
      const { data, error } = await supabase
        .from('course_resources')
        .select('*')
        .eq('course_id', course?.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching resources:', error);
        return;
      }
      
      console.log('Fetched resources:', data);

      
      if (data && data.length > 0) {
        // Convert the data to Resource objects
        const formattedResources = data.map(item => ({
          id: item.id,
          title: item.title,
          type: item.type,
          url: item.url,
          resource_id: item.resource_id
        }));
        
        setResources(formattedResources);
      } else {
        setResources([]);
      }
    } catch (err) {
      console.error('Error fetching resources:', err);
    }
  };

  // Handle parse error
  if (parseError) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading course details</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Wait for course data to be parsed
  if (!course) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#3b82f6" />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading course details...</Text>
        </View>
      </SafeAreaView>
    );
  }
    
  // Fallback values
  const description = course.description || "No description available.";
  const moduleCount = course.modules ? course.modules.length : 0;
  const enrollmentCount = course.enrollmentcount || 0;
  const completionRate = course.completionRate || 0;

  const renderModules = () => {
    if (!course.modules || course.modules.length === 0) {
      return <Text style={styles.emptyText}>No modules available</Text>;
    }

    return course.modules.map((module: CourseModule, index: number) => (
      <View key={module.id} style={styles.moduleItem}>
        <Text style={styles.moduleTitle} numberOfLines={2}>{module.title}</Text>
        {module.description && (
          <Text style={styles.moduleDescription}>{module.description}</Text>
        )}
        
        {/* Module Resources Section */}
        {module.resources && module.resources.length > 0 && (
          <View style={styles.moduleResourcesContainer}>
            <Text style={styles.moduleResourcesTitle}>Module Resources:</Text>
            {module.resources.map((resource) => (
              <TouchableOpacity 
                key={resource.id} 
                style={styles.resourceItem} 
                onPress={() => handleResourceSelect(resource)}
              >
                <View style={styles.resourceInfo}>
                  {resource.type === 'pdf' && <FileText size={18} color="#ef4444" />}
                  {resource.type === 'video' && <Play size={18} color="#3b82f6" />}
                  {resource.type === 'link' && <ExternalLink size={18} color="#10b981" />}
                  <Text style={styles.resourceTitle}>{resource.title}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.resourceButton, {
                    backgroundColor: resource.type === 'pdf' ? '#ef4444' : 
                                    resource.type === 'video' ? '#3b82f6' : '#10b981'
                  }]}
                  onPress={() => handleResourceSelect(resource)}
                >
                  <Text style={styles.resourceButtonText}>
                    {resource.type === 'pdf' ? 'View' : 
                    resource.type === 'video' ? 'Play' : 'Open'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {module.lessons && module.lessons.length > 0 && (
          <View style={styles.lessonsContainer}>
            <Text style={styles.lessonsTitle}>Lessons:</Text>
            {module.lessons.map((lesson, lessonIndex) => (
              <View key={lessonIndex} style={styles.lessonWrapper}>
                <Text style={styles.lessonItem}>• {lesson.title}</Text>
                
                {/* Lesson Resources */}
                {lesson.resources && lesson.resources.length > 0 && (
                  <View style={styles.lessonResourcesContainer}>
                    <Text style={styles.lessonResourcesTitle}>Lesson Resources:</Text>
                    {lesson.resources.map((resource) => (
                      <TouchableOpacity 
                        key={resource.id} 
                        style={styles.resourceItem} 
                        onPress={() => handleResourceSelect(resource)}
                      >
                        <View style={styles.resourceInfo}>
                          {resource.type === 'pdf' && <FileText size={16} color="#ef4444" />}
                          {resource.type === 'video' && <Play size={16} color="#3b82f6" />}
                          {resource.type === 'link' && <ExternalLink size={16} color="#10b981" />}
                          <Text style={styles.resourceTitle}>{resource.title}</Text>
                        </View>
                        <TouchableOpacity 
                          style={[styles.resourceButton, {
                            backgroundColor: resource.type === 'pdf' ? '#ef4444' : 
                                            resource.type === 'video' ? '#3b82f6' : '#10b981'
                          }]}
                          onPress={() => handleResourceSelect(resource)}
                        >
                          <Text style={styles.resourceButtonText}>
                            {resource.type === 'pdf' ? 'View' : 
                            resource.type === 'video' ? 'Play' : 'Open'}
                          </Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    ));
  };

  // Handle resource selection
  const handleResourceSelect = async (resource: ResourceType) => {
    console.log('Selecting resource:', resource);
    
    // Process URLs that might need special handling
    let processedUrl = resource.url;
    
    // Check if the URL is an example placeholder
    if (processedUrl.includes('example.com')) {
      try {
        console.log('Fetching actual resource URL from Supabase...');
        
        // Check if we have the resource_id field to fetch from storage
        if (resource.resource_id) {
          // Fetch the actual file URL from Supabase storage
          const { data, error } = await supabase
            .storage
            .from('course-resources')
            .createSignedUrl(`resources/${resource.resource_id}`, 3600); // 1 hour expiry
            
          if (error) {
            console.error('Error fetching resource URL:', error);
            Alert.alert(
              'Resource Error',
              'Could not retrieve the actual resource URL. Please try again later.',
              [{ text: 'OK' }]
            );
            return;
          }
          
          if (data && data.signedUrl) {
            console.log('Retrieved signed URL:', data.signedUrl);
            processedUrl = data.signedUrl;
          } else {
            // If no URL found, show error
            Alert.alert(
              'Resource Not Found', 
              'The resource file could not be found. Please contact your instructor.',
              [{ text: 'OK' }]
            );
            return;
          }
        } else {
          // If no resource_id, show error
          Alert.alert(
            'Missing Resource ID',
            'This resource does not have a valid resource ID. Please contact your instructor.',
            [{ text: 'OK' }]
          );
          return;
        }
      } catch (error) {
        console.error('Error processing resource:', error);
        Alert.alert(
          'Resource Error',
          'An error occurred while processing the resource. Please try again later.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    
    // For development testing, if it's a file:// URL, we'll need special handling
    if (processedUrl.startsWith('file://')) {
      // On iOS, replace file:// with app:// for local files
      if (Platform.OS === 'ios') {
        processedUrl = processedUrl.replace('file://', 'app://');
      }
      // On Android, no change needed
      // console.log('File URL processed:', processedUrl);
    }
    
    // console.log(`Opening resource: ${resource.title} (${resource.type}) - URL: ${processedUrl}`);
    
    // Handle different resource types
    if (resource.type === 'video') {
      // For video resources, navigate to VideoScreen
      // Include important details like courseId for navigation back
      router.push({
        pathname: "/(screens)/VideoScreen",
        params: { 
          videoUrl: processedUrl,
          videoTitle: resource.title,
          courseId: course?.id || '',
          lessonId: '', // No specific lesson ID from course details
          resourceId: resource.resource_id || ''
        }
      });
    } else if (resource.type === 'pdf') {
      // Open PDF in the ResourceViewer
      setSelectedResource({
        ...resource,
        url: processedUrl
      });
      setResourceViewerVisible(true);
    } else if (resource.type === 'link') {
      // For links, try to open in browser
      try {
        if (Platform.OS === 'web') {
          // On web, open in a new tab
          window.open(processedUrl, '_blank');
        } else {
          // On mobile, use Linking
          Linking.openURL(processedUrl);
        }
      } catch (error) {
        console.error('Error opening link:', error);
        // Fallback to ResourceViewer if there's an error
        setSelectedResource({
          ...resource,
          url: processedUrl
        });
        setResourceViewerVisible(true);
      }
    } else {
      // Default fallback for any other resource types
      setSelectedResource({
        ...resource,
        url: processedUrl
      });
      setResourceViewerVisible(true);
    }
  };

  // Update the renderResources function to only show course-level resources
  const renderResources = () => {
    if (!resources || resources.length === 0) {
      return <Text style={styles.emptyText}>No course resources available</Text>;
    }

    // Only show course-level resources, not module or lesson resources
    return resources.map((resource: ResourceType) => (
      <TouchableOpacity 
        key={resource.id} 
        style={styles.resourceItem} 
        onPress={() => handleResourceSelect(resource)}
      >
        <View style={styles.resourceInfo}>
          {resource.type === 'pdf' && <FileText size={18} color="#ef4444" />}
          {resource.type === 'video' && <Play size={18} color="#3b82f6" />}
          {resource.type === 'link' && <ExternalLink size={18} color="#10b981" />}
          <Text style={styles.resourceTitle}>{resource.title}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.resourceButton, {
            backgroundColor: resource.type === 'pdf' ? '#ef4444' : 
                            resource.type === 'video' ? '#3b82f6' : '#10b981'
          }]}
          onPress={() => handleResourceSelect(resource)}
        >
          <Text style={styles.resourceButtonText}>
            {resource.type === 'pdf' ? 'View' : 
             resource.type === 'video' ? 'Play' : 'Open'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    ));
  };

  const renderFeedbackForm = () => {
    if (!isEnrolled) return null;
    // ... rest of the form
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* back button */}
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#3b82f6" />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        {/* Enrollment Management Button - Only visible to publisher */}
        {isPublisher && (
          <Pressable
            style={styles.enrollmentButton}
            onPress={() => {
              const courseParam = JSON.stringify(course);
              router.push({
                pathname: "/(screens)/EnrollmentManagement",
                params: { courseId: course.id, courseTitle: course.title },
              });
            }}
          >
            <MaterialIcons
              name="manage-accounts"
              size={20}
              color={Colors.PRIMARY}
            />
            <Text style={styles.settingsButtonText}>Manage Enrollment</Text>
          </Pressable>
        )}
        {/* settings button - Only visible to publisher */}
        {isPublisher && (
          <Pressable
            style={styles.settingsButton}
            onPress={() => {
              const courseParam = JSON.stringify(course);
              router.push({
                pathname: "/(screens)/CourseSettings",
                params: { course: courseParam },
              });
            }}
          >
            <Ionicons name="settings-outline" size={20} color="#3b82f6" />
            <Text style={styles.settingsButtonText}>Settings</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.content} showsHorizontalScrollIndicator={false}>
        {/* Image Section */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: course.image || "https://via.placeholder.com/150" }}
            style={styles.image}
            resizeMode="cover"
          />
          {/* Gradient overlay for better text visibility */}
          <View style={styles.imageOverlay} />
        </View>

        {/* Title Section */}
        <View
          style={[
            styles.section,
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            },
          ]}
        >
          <Text style={[styles.title, { flex: 1, marginRight: 12 }]} numberOfLines={2} ellipsizeMode="tail">
            {course.title}
          </Text>
          {isPublisher && (
            <View style={{ flexShrink: 0 }}>
              <Pressable
                style={styles.editButton}
                onPress={() => {
                  const courseParam = JSON.stringify(course);
                  router.push({
                    pathname: "/(screens)/CourseEditor",
                    params: {
                      courseId: course.id,
                      courseTitle: course.title,
                      course: courseParam,
                    },
                  });
                }}
              >
                <MaterialIcons name="edit" size={20} color={Colors.PRIMARY}/>
                <Text style={styles.editButtonText}>Edit Course</Text>
              </Pressable>
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

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesContainer}>
            {course.categories && course.categories.length > 0 ? (
              course.categories.map((category: string, index: number) => (
                <Text key={index} style={styles.categoryBadge}>
                  {category}
                </Text>
              ))
            ) : (
              <Text style={styles.emptyText}>No categories</Text>
            )}
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{description}</Text>
        </View>

        {/* Prerequisites Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prerequisites</Text>
          <Text style={styles.descriptionText}>
            {course.prerequisites || "None"}
          </Text>
        </View>

        {/* Learning Objectives Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Objectives</Text>
          {course.objectives && course.objectives.length > 0 ? (
            course.objectives.map((objective: string, index: number) => (
              <Text key={index} style={styles.objectiveItem}>
                • {objective}
              </Text>
            ))
          ) : (
            <Text style={styles.emptyText}>No learning objectives</Text>
          )}
        </View>

        {/* Modules Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modules</Text>
          {renderModules()}
        </View>

        {/* Resources Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          {renderResources()}
        </View>
        

        {/* Course Feedback Section */}
        <View style={styles.section}>
          <CourseFeedback 
            courseId={course.id}
            publisherId={course.user_id}
            isEnrolled={isEnrolled}
          />
        </View>

        {/* Enrollment Info */}
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
        </View>
      </ScrollView>

      {/* Resource Viewer Modal */}
      {selectedResource && (
        <ResourceViewer
          resourceUrl={selectedResource.url}
          resourceType={selectedResource.type}
          resourceTitle={selectedResource.title}
          isVisible={resourceViewerVisible}
          onClose={() => setResourceViewerVisible(false)}
          courseId={course?.id}
          resourceId={selectedResource.resource_id}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#ef4444",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexWrap:'wrap'
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    marginLeft: 4,
    color: "#3b82f6",
    fontSize: 16,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsButtonText: {
    marginLeft: 4,
    color: "#3b82f6",
    fontSize: 14,
  },
  content: {
    flex: 1,
    borderRadius: 18,
  },
  imageContainer: {
    height: 200,
    width: "100%",
    position: "relative",
    overflow: "hidden",
    borderRadius: 18,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: "#4b5563",
    lineHeight: 24,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 14,
    color: "#4b5563",
  },
  objectiveItem: {
    fontSize: 16,
    color: "#4b5563",
    marginBottom: 8,
    paddingLeft: 8,
  },
  moduleItem: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
    flexWrap: "wrap",
    width: "100%",
  },
  moduleDescription: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 8,
  },
  lessonsContainer: {
    marginTop: 8,
  },
  lessonsTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4b5563",
    marginBottom: 4,
  },
  lessonItem: {
    fontSize: 14,
    color: "#4b5563",
    marginLeft: 8,
    marginBottom: 4,
  },
  resourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.7,  // Add this to control width proportion
    paddingRight: 8,  // Add some padding
  },
  resourceTitle: {
    fontSize: 12,  // Increased from 8.7
    color: '#1f2937',
    marginLeft: 8,  // Increased from 1
    flexShrink: 1,  // Allow text to shrink
  },
  resourceButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 60,  // Add fixed minimum width
    alignItems: 'center',  // Center text
    justifyContent: 'center',  // Center vertically
  },
  resourceButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
    textAlign: 'center',  // Center text
  },
  emptyText: {
    fontSize: 16,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  progressSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  completionRate: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  moduleInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  moduleCount: {
    fontSize: 14,
    color: "#4b5563",
    marginLeft: 4,
  },
  enrollmentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  enrollmentCount: {
    fontSize: 14,
    color: "#4b5563",
    marginLeft: 4,
  },
  enrollmentButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 1,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
    flexShrink: 1,
  },
  editButtonText: {
    marginLeft: 6,
    color: Colors.PRIMARY,
    fontSize: 16,
    fontWeight: "500",
  },
  moduleResourcesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  moduleResourcesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  lessonWrapper: {
    marginBottom: 8,
  },
  lessonResourcesContainer: {
    marginLeft: 16,
    marginTop: 4,
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  lessonResourcesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
});
