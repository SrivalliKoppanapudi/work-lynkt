import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable, Image, TouchableOpacity, ActivityIndicator, TextInput, Alert, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Course, Module as CourseModule, Lesson, Resource as ResourceType } from '../../types/courses';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from "react-native-progress";
import Colors from '../../constant/Colors';
import { supabase } from '../../lib/Superbase';
import ResourceViewer from '../../component/courses/ResourceViewer';
import * as WebBrowser from 'expo-web-browser';
import { getResourcePublicUrl, getResourceSignedUrl } from '../../utils/resourceUtils';

// Icons
import { BookOpen, CheckCircle, Download, MessageSquare, FileText, Video, Link, ArrowDown } from 'lucide-react-native';

interface StudentCourseContentProps {
  navigation?: any;
}

export default function StudentCourseContent({ navigation }: StudentCourseContentProps) {
  const params = useLocalSearchParams<{ course: string, courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Content navigation state
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  
  // Progress tracking state
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [courseProgress, setCourseProgress] = useState(0);
  
  // Discussion state
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [discussionText, setDiscussionText] = useState('');
  const [discussions, setDiscussions] = useState<{id: string, text: string, author: string, timestamp: Date}[]>([]);

  // Resource viewer state
  const [selectedResource, setSelectedResource] = useState<ResourceType | null>(null);
  const [resourceViewerVisible, setResourceViewerVisible] = useState(false);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        let courseData;
        
        // If course is passed via params, use that
        if (params.course) {
          courseData = JSON.parse(params.course as string);
        } 
        // Otherwise fetch from database using courseId
        else if (params.courseId) {
          const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('id', params.courseId)
            .single();
            
          if (error) throw error;
          courseData = data;
        } else {
          throw new Error('No course data provided');
        }
        
        setCourse(courseData);
        
        // Initialize expanded modules state
        if (courseData.modules && courseData.modules.length > 0) {
          const initialExpandedState: Record<string, boolean> = {};
          courseData.modules.forEach((module: CourseModule) => {
            initialExpandedState[module.id] = false;
          });
          // Expand the first module by default
          if (courseData.modules[0]) {
            initialExpandedState[courseData.modules[0].id] = true;
          }
          setExpandedModules(initialExpandedState);
        }
        
        // Load completed lessons from storage or API
        // This would typically come from an API call to get the user's progress
        // For now, we'll simulate with empty state
        setCompletedLessons({});
        
      } catch (error) {
        console.error('Error loading course:', error);
        setError('Failed to load course data');
      } finally {
        setLoading(false);
      }
    };
    
    loadCourse();
  }, [params.course, params.courseId]);

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Select a lesson to view
  const selectLesson = (moduleIndex: number, lessonIndex: number) => {
    setSelectedModuleIndex(moduleIndex);
    setSelectedLessonIndex(lessonIndex);
    setShowDiscussion(false); // Hide discussion when changing lessons
  };

  // Mark lesson as completed
  const markLessonAsCompleted = (lessonId: number) => {
    // In a real app, you would call an API to update the user's progress
    setCompletedLessons(prev => ({
      ...prev,
      [lessonId]: true
    }));
    
    // Update overall course progress
    updateCourseProgress();
  };

  // Calculate and update course progress
  const updateCourseProgress = () => {
    if (!course || !course.modules) return;
    
    let totalLessons = 0;
    let completedCount = 0;
    
    course.modules.forEach(module => {
      if (module.lessons) {
        totalLessons += module.lessons.length;
        module.lessons.forEach(lesson => {
          if (completedLessons[lesson.id]) {
            completedCount++;
          }
        });
      }
    });
    
    const progress = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;
    setCourseProgress(progress);
  };

  // Toggle discussion section
  const toggleDiscussion = () => {
    setShowDiscussion(prev => !prev);
  };

  // Submit a discussion comment
  const submitDiscussion = () => {
    if (!discussionText.trim()) return;
    
    // In a real app, you would call an API to save the comment
    const newComment = {
      id: Date.now().toString(),
      text: discussionText,
      author: 'Current User', // This would come from auth context
      timestamp: new Date()
    };
    
    setDiscussions(prev => [...prev, newComment]);
    setDiscussionText('');
  };

  // Validate resource URL before opening
  const validateResourceURL = (resource: ResourceType): boolean => {
    // Check if the resource has a valid URL
    if (!resource.url) {
      Alert.alert(
        'Invalid Resource',
        'This resource does not have a valid URL. Please contact your instructor.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    // Check for file type and resource type mismatch
    const fileExtension = resource.url.split('.').pop()?.toLowerCase();
    if (fileExtension) {
      const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
      const pdfExtensions = ['pdf'];
      
      // Alert if there's a mismatch between resource type and URL extension
      if (resource.type === 'video' && pdfExtensions.includes(fileExtension)) {
        Alert.alert(
          'Resource Type Mismatch',
          `Error: The resource titled "${resource.title}" is marked as a video but links to a PDF file. Please contact your instructor to fix this.`,
          [{ text: 'OK' }]
        );
        return false;
      } else if (resource.type === 'pdf' && videoExtensions.includes(fileExtension)) {
        Alert.alert(
          'Resource Type Mismatch',
          `Error: The resource titled "${resource.title}" is marked as a PDF but links to a video file. Please contact your instructor to fix this.`,
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    
    // Check for example.com URLs
    if (resource.url.includes('example.com')) {
      Alert.alert(
        'Placeholder URL',
        'This resource uses a placeholder URL (example.com). Please contact your instructor to update with a real resource.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  };

  // Handle resource selection for viewing/playing
  const handleResourceSelect = async (resource: ResourceType) => {
    console.log('Selecting resource:', resource);
    
    // Get the current module and lesson
    const currentModule = course?.modules?.[selectedModuleIndex];
    const currentLesson = currentModule?.lessons?.[selectedLessonIndex];
    
    // Validate the resource URL
    if (!validateResourceURL(resource)) {
      return;
    }
    
    // Process URLs that might need special handling
    let processedUrl = resource.url;
    
    // Check if the URL is an example placeholder or we have a resource_id
    if (processedUrl.includes('example.com') || resource.resource_id) {
      try {
        console.log('Fetching actual resource URL from course-resources bucket...');
        setLoading(true);
        
        // Check if we have the resource_id field to fetch from storage
        if (resource.resource_id) {
          // First try getting a public URL
          const publicUrl = getResourcePublicUrl(resource.resource_id);
          
          if (publicUrl) {
            console.log('Retrieved public URL:', publicUrl);
            processedUrl = publicUrl;
          } else {
            // Fallback to signed URL if public URL doesn't work
            console.log('Public URL not available, trying signed URL...');
            const signedUrl = await getResourceSignedUrl(resource.resource_id, 3600); // 1 hour expiry
            
            if (signedUrl) {
              console.log('Retrieved signed URL:', signedUrl);
              processedUrl = signedUrl;
            } else {
              // If no URL found, show error
              Alert.alert(
                'Resource Not Found', 
                'The resource file could not be found. Please contact your instructor.',
                [{ text: 'OK' }]
              );
              setLoading(false);
              return;
            }
          }
        } else {
          // If no resource_id, show error
          Alert.alert(
            'Missing Resource ID',
            'This resource does not have a valid resource ID. Please contact your instructor.',
            [{ text: 'OK' }]
          );
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error processing resource:', error);
        Alert.alert(
          'Resource Error',
          'An error occurred while processing the resource. Please try again later.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }
    
    // Handle file:// URLs which may need different handling on different platforms
    if (processedUrl.startsWith('file://')) {
      console.log('Processing file URL:', processedUrl);
    }
    
    // For videos or YouTube links, use the VideoScreen
    if (resource.type === 'video' || 
        ((processedUrl.includes('youtube.com') || processedUrl.includes('youtu.be')) && 
         resource.type !== 'link')) {
      console.log('Opening video in VideoScreen:', processedUrl);
      
      // For video resources, navigate to the dedicated video screen
      router.push({
        pathname: '/(screens)/VideoScreen',
        params: { 
          videoUrl: processedUrl,
          videoTitle: resource.title,
          courseId: course?.id,
          lessonId: currentLesson?.id,
          resourceId: resource.resource_id || ''
        }
      });
      return;
    }
    
    // For PDFs, use ResourceViewer
    if (resource.type === 'pdf') {
      console.log('Opening PDF in ResourceViewer:', processedUrl);
      setSelectedResource({
        ...resource,
        url: processedUrl
      });
      setResourceViewerVisible(true);
      return;
    }
    
    // For regular links, handle based on platform
    if (resource.type === 'link') {
      console.log('Opening link:', processedUrl);
      
      if (Platform.OS === 'web') {
        // On web, open in a new tab
        window.open(processedUrl, '_blank');
        return;
      } else {
        // On mobile, open with WebBrowser
        WebBrowser.openBrowserAsync(processedUrl)
          .then(() => console.log('Opened link in browser'))
          .catch(err => {
            console.error('Failed to open link:', err);
            // Fallback to ResourceViewer if WebBrowser fails
            setSelectedResource({
              ...resource,
              url: processedUrl
            });
            setResourceViewerVisible(true);
          });
        return;
      }
    }
    
    // Fallback for any other type
    console.log('Opening resource in viewer (fallback):', { 
      id: resource.id, 
      type: resource.type, 
      url: processedUrl 
    });
    
    setSelectedResource({
      ...resource,
      url: processedUrl
    });
    setResourceViewerVisible(true);
  };

  // Update the handleResourceDownload function
  const handleResourceDownload = (resource: ResourceType) => {
    handleResourceSelect(resource);
  };

  // Render the current lesson content
  const renderLessonContent = () => {
    if (!course || !course.modules || course.modules.length === 0) {
      return <Text style={styles.emptyText}>No content available</Text>;
    }
    
    const currentModule = course.modules[selectedModuleIndex];
    if (!currentModule || !currentModule.lessons || currentModule.lessons.length === 0) {
      return <Text style={styles.emptyText}>No lessons available in this module</Text>;
    }
    
    const currentLesson = currentModule.lessons[selectedLessonIndex];
    if (!currentLesson) {
      return <Text style={styles.emptyText}>Lesson not found</Text>;
    }
    
    return (
      <View style={styles.lessonContentContainer}>
        {/* Module title and resources */}
        <View style={styles.moduleInfoContainer}>
          <Text style={styles.moduleInfoTitle}>{currentModule.title}</Text>
          
          {/* Module resources */}
          {currentModule.resources && currentModule.resources.length > 0 && (
            <View style={styles.moduleResourcesSection}>
              <Text style={styles.moduleResourcesTitle}>Module Resources</Text>
              {currentModule.resources.map((resource) => (
                <TouchableOpacity 
                  key={resource.id} 
                  style={styles.resourceItem}
                  onPress={() => handleResourceSelect(resource)}
                >
                  {resource.type === 'pdf' && <FileText size={20} color={Colors.PRIMARY} />}
                  {resource.type === 'video' && <Video size={20} color={Colors.PRIMARY} />}
                  {resource.type === 'link' && <Link size={20} color={Colors.PRIMARY} />}
                  <Text style={styles.resourceTitle}>{resource.title}</Text>
                  
                  {/* Action Button - with specific actions per resource type */}
                  <TouchableOpacity 
                    style={[styles.playButton, {
                      backgroundColor: resource.type === 'pdf' ? '#ef4444' : 
                                       resource.type === 'video' ? '#3b82f6' : '#10b981'
                    }]}
                    onPress={() => handleResourceSelect(resource)}
                  >
                    <Text style={styles.playButtonText}>
                      {resource.type === 'pdf' ? 'View' : 
                       resource.type === 'video' ? 'Play' : 'Open'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        <Text style={styles.lessonTitle}>{currentLesson.title}</Text>
        
        {/* Lesson content */}
        <View style={styles.contentSection}>
          <Text style={styles.contentText}>{currentLesson.content}</Text>
        </View>
        
        {/* Resources section */}
        {currentLesson.resources && currentLesson.resources.length > 0 && (
          <View style={styles.resourcesSection}>
            <Text style={styles.resourcesTitle}>Lesson Resources</Text>
            {currentLesson.resources.map((resource) => (
              <TouchableOpacity 
                key={resource.id} 
                style={styles.resourceItem}
                onPress={() => handleResourceSelect(resource)}
              >
                {resource.type === 'pdf' && <FileText size={20} color={Colors.PRIMARY} />}
                {resource.type === 'video' && <Video size={20} color={Colors.PRIMARY} />}
                {resource.type === 'link' && <Link size={20} color={Colors.PRIMARY} />}
                <Text style={styles.resourceTitle}>{resource.title}</Text>
                
                {/* Action Button - with specific actions per resource type */}
                <TouchableOpacity 
                  style={[styles.playButton, {
                    backgroundColor: resource.type === 'pdf' ? '#ef4444' : 
                                    resource.type === 'video' ? '#3b82f6' : '#10b981'
                  }]}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevent parent touchable from firing
                    handleResourceSelect(resource);
                  }}
                >
                  <Text style={styles.playButtonText}>
                    {resource.type === 'pdf' ? 'View' : 
                     resource.type === 'video' ? 'Play' : 'Open'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Discussion toggle button */}
        {currentLesson.discussionEnabled && (
          <TouchableOpacity 
            style={styles.discussionToggle}
            onPress={toggleDiscussion}
          >
            <MessageSquare size={20} color={Colors.PRIMARY} />
            <Text style={styles.discussionToggleText}>
              {showDiscussion ? 'Hide Discussion' : 'Show Discussion'}
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Discussion section */}
        {showDiscussion && currentLesson.discussionEnabled && (
          <View style={styles.discussionSection}>
            <Text style={styles.discussionTitle}>Discussion</Text>
            
            {/* Discussion comments */}
            <View style={styles.commentsContainer}>
              {discussions.length > 0 ? (
                discussions.map(comment => (
                  <View key={comment.id} style={styles.commentItem}>
                    <Text style={styles.commentAuthor}>{comment.author}</Text>
                    <Text style={styles.commentText}>{comment.text}</Text>
                    <Text style={styles.commentTimestamp}>
                      {comment.timestamp.toLocaleString()}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
              )}
            </View>
            
            {/* Comment input */}
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add to the discussion..."
                value={discussionText}
                onChangeText={setDiscussionText}
                multiline
              />
              <TouchableOpacity 
                style={styles.commentSubmitButton}
                onPress={submitDiscussion}
              >
                <Text style={styles.commentSubmitText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Mark as completed button */}
        <TouchableOpacity 
          style={[styles.completionButton, completedLessons[currentLesson.id] && styles.completedButton]}
          onPress={() => markLessonAsCompleted(currentLesson.id)}
          disabled={completedLessons[currentLesson.id]}
        >
          <CheckCircle size={20} color={completedLessons[currentLesson.id] ? '#fff' : Colors.PRIMARY} />
          <Text style={[styles.completionButtonText, completedLessons[currentLesson.id] && styles.completedButtonText]}>
            {completedLessons[currentLesson.id] ? 'Completed' : 'Mark as Completed'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Loading course content...</Text>
      </View>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Course not found'}</Text>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Course Content</Text>
      </View>
      
      {/* Course Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>{Math.round(courseProgress)}% Complete</Text>
        <Progress.Bar 
          progress={courseProgress / 100} 
          width={null} 
          height={8}
          color={Colors.PRIMARY}
          unfilledColor="#e0e0e0"
          borderWidth={0}
          borderRadius={4}
          style={styles.progressBar}
        />
      </View>
      
      <View style={styles.contentContainer}>
        {/* Module and Topic List */}
        <View style={styles.sidebarContainer}>
          <ScrollView style={styles.sidebar}>
            <Text style={styles.sidebarTitle}>Course Modules</Text>
            
            {course.modules && course.modules.map((module, moduleIndex) => (
              <View key={module.id} style={styles.moduleContainer}>
                <TouchableOpacity 
                  style={styles.moduleHeader}
                  onPress={() => toggleModule(module.id)}
                >
                  <View style={styles.moduleHeaderContent}>
                    <BookOpen size={18} color={Colors.PRIMARY} />
                    <Text style={styles.moduleHeaderText}>{module.title}</Text>
                  </View>
                  <ArrowDown 
                    size={18} 
                    color={Colors.PRIMARY} 
                    style={{
                      transform: [{ rotate: expandedModules[module.id] ? '180deg' : '0deg' }]
                    }}
                  />
                </TouchableOpacity>
                
                {expandedModules[module.id] && module.lessons && (
                  <View style={styles.lessonsList}>
                    {module.lessons.map((lesson, lessonIndex) => (
                      <TouchableOpacity 
                        key={lesson.id}
                        style={[
                          styles.lessonItem,
                          selectedModuleIndex === moduleIndex && selectedLessonIndex === lessonIndex && styles.selectedLesson,
                          completedLessons[lesson.id] && styles.completedLesson
                        ]}
                        onPress={() => selectLesson(moduleIndex, lessonIndex)}
                      >
                        {completedLessons[lesson.id] ? (
                          <CheckCircle size={16} color={Colors.SUCCESS} />
                        ) : (
                          <View style={styles.lessonBullet} />
                        )}
                        <Text style={[
                          styles.lessonItemText,
                          selectedModuleIndex === moduleIndex && selectedLessonIndex === lessonIndex && styles.selectedLessonText,
                          completedLessons[lesson.id] && styles.completedLessonText
                        ]}>
                          {lesson.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
        
        {/* Content Viewer */}
        <ScrollView style={styles.contentViewer}>
          {renderLessonContent()}
        </ScrollView>
      </View>
      
      {/* Resource Viewer */}
      {selectedResource && (
        <ResourceViewer
          resourceUrl={selectedResource.url}
          resourceType={selectedResource.type}
          resourceTitle={selectedResource.title}
          isVisible={resourceViewerVisible}
          onClose={() => setResourceViewerVisible(false)}
          courseId={course?.id}
          lessonId={course?.modules?.[selectedModuleIndex]?.lessons?.[selectedLessonIndex]?.id?.toString()}
          resourceId={selectedResource.resource_id}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.PRIMARY,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 18,
    color: Colors.DANGER,
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: 5,
    fontSize: 16,
    color: Colors.PRIMARY,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: 30, // To offset the back button and center the title
  },
  progressContainer: {
    padding: 15,
    backgroundColor: '#f9f9f9',
  },
  progressText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#555',
  },
  progressBar: {
    width: '100%',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarContainer: {
    width: '30%',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  sidebar: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f0f0f0',
  },
  moduleContainer: {
    marginBottom: 5,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  moduleHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moduleHeaderText: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  lessonsList: {
    backgroundColor: '#f9f9f9',
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedLesson: {
    backgroundColor: '#e6f7ff',
    borderLeftWidth: 3,
    borderLeftColor: Colors.PRIMARY,
  },
  completedLesson: {
    backgroundColor: '#f0f9f0',
  },
  lessonBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#aaa',
    marginRight: 8,
  },
  lessonItemText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  selectedLessonText: {
    fontWeight: '500',
    color: Colors.PRIMARY,
  },
  completedLessonText: {
    color: Colors.SUCCESS,
  },
  contentViewer: {
    flex: 1,
    padding: 15,
  },
  lessonContentContainer: {
    padding: 10,
  },
  lessonTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  contentSection: {
    marginBottom: 20,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  resourcesSection: {
    marginTop: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  resourcesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resourceTitle: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
    color: '#333',
  },
  discussionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginVertical: 15,
  },
  discussionToggleText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.PRIMARY,
  },
  discussionSection: {
    marginTop: 10,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  discussionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  commentsContainer: {
    marginBottom: 15,
  },
  commentItem: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  commentText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  commentTimestamp: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#fff',
    minHeight: 40,
  },
  commentSubmitButton: {
    marginLeft: 10,
    backgroundColor: Colors.PRIMARY,
    padding: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSubmitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  completionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    borderRadius: 6,
    padding: 12,
    marginTop: 20,
  },
  completedButton: {
    backgroundColor: Colors.SUCCESS,
    borderColor: Colors.SUCCESS,
  },
  completionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.PRIMARY,
  },
  completedButtonText: {
    color: '#fff',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginVertical: 20,
  },
  moduleInfoContainer: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.PRIMARY,
  },
  moduleInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  moduleResourcesSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f4f8',
    borderRadius: 6,
  },
  moduleResourcesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  playButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  playButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
});