import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Star, Send, MessageSquare, BarChart2, User } from 'lucide-react-native';
import { supabase } from '../../lib/Superbase';
import { useAuth } from '../../Context/auth';

interface CourseFeedbackProps {
  courseId: string;
  publisherId: string;
  isEnrolled: boolean;
}

interface FeedbackData {
  id: string;
  rating: number;
  content_feedback: string;
  teaching_feedback: string;
  overall_feedback: string;
  is_anonymous: boolean;
  created_at: string;
  teacher_response?: string;
  teacher_response_at?: string;
  user: {
    email: string;
    user_metadata: {
      full_name?: string;
    };
  };
}

interface AnalyticsData {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  commonThemes: string[];
}
const CourseFeedback = ({ courseId, publisherId, isEnrolled }: CourseFeedbackProps) => {
  const { user } = useAuth() as unknown as { user: { id: string; email: string; user_metadata: { full_name?: string } } };
  const [feedback, setFeedback] = useState<FeedbackData[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [contentFeedback, setContentFeedback] = useState('');
  const [teachingFeedback, setTeachingFeedback] = useState('');
  const [overallFeedback, setOverallFeedback] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [teacherResponse, setTeacherResponse] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);

  const isPublisher = user?.id === publisherId;

  useEffect(() => {
    fetchFeedback();
  }, [courseId]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      // First, fetch the feedback items without the join
      const { data, error } = await supabase
        .from('course_feedback')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If we have feedback items, fetch user data separately for non-anonymous ones
      if (data && data.length > 0) {
        const userIds = data
          .filter(item => !item.is_anonymous)
          .map(item => item.user_id);
        
        // Only fetch user data if we have non-anonymous feedback
        if (userIds.length > 0) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, email, user_metadata')
            .in('id', userIds);
          
          if (userError) {
            console.error('Error fetching user data:', userError);
          } else {
            // Create a map of user data by ID for quick lookup
            const userMap = {};
            userData?.forEach(user => {
              userMap[user.id] = user;
            });
            
            // Add user data to feedback items
            data.forEach(item => {
              if (!item.is_anonymous && userMap[item.user_id]) {
                item.user = userMap[item.user_id];
              } else {
                item.user = { email: 'Anonymous', user_metadata: {} };
              }
            });
          }
        } else {
          // Set placeholder user data for all anonymous feedback
          data.forEach(item => {
            item.user = { email: 'Anonymous', user_metadata: {} };
          });
        }
      }

      setFeedback(data || []);
      calculateAnalytics(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      Alert.alert('Error', 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (feedbackData: FeedbackData[]) => {
    const totalReviews = feedbackData.length;
    const ratingSum = feedbackData.reduce((sum, f) => sum + f.rating, 0);
    const averageRating = totalReviews > 0 ? ratingSum / totalReviews : 0;

    const ratingDistribution: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    feedbackData.forEach(f => {
      ratingDistribution[f.rating]++;
    });

    // Extract common themes from feedback
    const allFeedback = feedbackData.map(f => 
      `${f.content_feedback} ${f.teaching_feedback} ${f.overall_feedback}`
    ).join(' ');
    
    const words = allFeedback.toLowerCase().split(/\s+/);
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      if (word.length > 3) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });

    const commonThemes = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    setAnalytics({
      averageRating,
      totalReviews,
      ratingDistribution,
      commonThemes
    });
  };

  const handleSubmitFeedback = async () => {
    if (!user || !isEnrolled) {
      Alert.alert('Error', 'You must be enrolled in this course to submit feedback');
      return;
    }

    if (rating === 0) {
      Alert.alert('Error', 'Please provide a rating');
      return;
    }

    // At least one feedback field should be filled
    if (!contentFeedback.trim() && !teachingFeedback.trim() && !overallFeedback.trim()) {
      Alert.alert('Error', 'Please provide feedback in at least one category');
      return;
    }

    try {
      setSubmitting(true);
      
      console.log('Submitting feedback:', {
        course_id: courseId,
        user_id: user.id,
        rating,
        content_feedback: contentFeedback,
        teaching_feedback: teachingFeedback,
        overall_feedback: overallFeedback,
        is_anonymous: isAnonymous
      });
      
      const { data, error } = await supabase
        .from('course_feedback')
        .upsert({
          course_id: courseId,
          user_id: user.id,
          rating,
          content_feedback: contentFeedback,
          teaching_feedback: teachingFeedback,
          overall_feedback: overallFeedback,
          is_anonymous: isAnonymous,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'course_id,user_id' });

      if (error) {
        console.error('Submission error details:', error);
        throw error;
      }

      Alert.alert('Success', 'Feedback submitted successfully');
      setRating(0);
      setContentFeedback('');
      setTeachingFeedback('');
      setOverallFeedback('');
      setIsAnonymous(false);
      fetchFeedback();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitResponse = async (feedbackId: string) => {
    if (!teacherResponse.trim()) {
      Alert.alert('Error', 'Please enter a response');
      return;
    }

    try {
      setSubmitting(true);
      console.log('Submitting response:', {
        id: feedbackId,
        teacher_response: teacherResponse,
        teacher_response_at: new Date().toISOString()
      });
      
      const { data, error } = await supabase
        .from('course_feedback')
        .update({
          teacher_response: teacherResponse,
          teacher_response_at: new Date().toISOString()
        })
        .eq('id', feedbackId);

      if (error) {
        console.error('Response submission error details:', error);
        throw error;
      }

      Alert.alert('Success', 'Response submitted successfully');
      setTeacherResponse('');
      setIsResponding(false);
      setSelectedFeedbackId(null);
      fetchFeedback();
    } catch (error) {
      console.error('Error submitting response:', error);
      Alert.alert('Error', 'Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRatingStars = (value: number, onPress?: (rating: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => onPress?.(star)}
            disabled={!onPress}
          >
            <Star
              size={24}
              color={star <= value ? '#fbbf24' : '#d1d5db'}
              fill={star <= value ? '#fbbf24' : 'none'}
            />
          </Pressable>
        ))}
      </View>
    );
  };

  const renderFeedbackForm = () => {
    if (!isEnrolled) return null;

    return (
      <View style={styles.feedbackForm}>
        <Text style={styles.sectionTitle}>Leave Your Feedback</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.label}>Rating</Text>
          {renderRatingStars(rating, setRating)}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Content Feedback</Text>
          <TextInput
            style={styles.textArea}
            value={contentFeedback}
            onChangeText={setContentFeedback}
            placeholder="How was the course content?"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Teaching Style</Text>
          <TextInput
            style={styles.textArea}
            value={teachingFeedback}
            onChangeText={setTeachingFeedback}
            placeholder="How was the teaching style?"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Overall Experience</Text>
          <TextInput
            style={styles.textArea}
            value={overallFeedback}
            onChangeText={setOverallFeedback}
            placeholder="Share your overall experience"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.anonymousContainer}>
          <Pressable
            style={styles.checkbox}
            onPress={() => setIsAnonymous(!isAnonymous)}
          >
            <View style={[styles.checkboxInner, isAnonymous && styles.checkboxChecked]} />
            <Text style={styles.checkboxLabel}>Submit anonymously</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmitFeedback}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Send size={20} color="#ffffff" />
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            </>
          )}
        </Pressable>
      </View>
    );
  };

  const renderAnalytics = () => {
    if (!isPublisher || !analytics) return null;

    return (
      <View style={styles.analyticsContainer}>
        <Text style={styles.sectionTitle}>Feedback Analytics</Text>
        
        <View style={styles.analyticsCard}>
          <View style={styles.analyticsHeader}>
            <BarChart2 size={24} color="#3b82f6" />
            <Text style={styles.analyticsTitle}>Overview</Text>
          </View>
          
          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>Average Rating</Text>
            <View style={styles.ratingContainer}>
              {renderRatingStars(Math.round(analytics.averageRating))}
            </View>
            <Text style={styles.analyticsValue}>{analytics.averageRating.toFixed(1)}</Text>
          </View>

          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>Total Reviews</Text>
            <Text style={styles.analyticsValue}>{analytics.totalReviews}</Text>
          </View>

          <View style={styles.ratingDistribution}>
            {Object.entries(analytics.ratingDistribution).map(([rating, count]) => (
              <View key={rating} style={styles.distributionRow}>
                <Text style={styles.distributionLabel}>{rating} stars</Text>
                <View style={styles.distributionBarContainer}>
                  <View 
                    style={[
                      styles.distributionBar,
                      { 
                        width: `${(count / analytics.totalReviews) * 100}%`,
                        backgroundColor: '#3b82f6'
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.distributionValue}>{count}</Text>
              </View>
            ))}
          </View>

          <View style={styles.themesContainer}>
            <Text style={styles.themesTitle}>Common Themes</Text>
            <View style={styles.themesList}>
              {analytics.commonThemes.map((theme, index) => (
                <View key={index} style={styles.themeTag}>
                  <Text style={styles.themeText}>{theme}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderFeedbackList = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      );
    }

    if (feedback.length === 0) {
      return (
        <View style={styles.emptyFeedbackContainer}>
          <Text style={styles.emptyFeedbackText}>No feedback yet. Be the first to leave a review!</Text>
        </View>
      );
    }

    return (
      <View style={styles.feedbackList}>
        <Text style={styles.sectionTitle}>Course Reviews</Text>
        {feedback.map((item) => (
          <View key={item.id} style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <View style={styles.feedbackUser}>
                {item.is_anonymous ? (
                  <View style={styles.anonymousUserContainer}>
                    <User size={20} color="#6b7280" />
                    <Text style={styles.anonymousUserText}>Anonymous</Text>
                  </View>
                ) : (
                  <Text style={styles.userName}>
                    {item.user?.user_metadata?.full_name || item.user?.email || 'User'}
                  </Text>
                )}
                <Text style={styles.feedbackDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
              {renderRatingStars(item.rating)}
            </View>

            {item.content_feedback && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackLabel}>Content</Text>
                <Text style={styles.feedbackText}>{item.content_feedback}</Text>
              </View>
            )}

            {item.teaching_feedback && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackLabel}>Teaching Style</Text>
                <Text style={styles.feedbackText}>{item.teaching_feedback}</Text>
              </View>
            )}

            {item.overall_feedback && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackLabel}>Overall Experience</Text>
                <Text style={styles.feedbackText}>{item.overall_feedback}</Text>
              </View>
            )}

            {item.teacher_response && (
              <View style={styles.teacherResponse}>
                <Text style={styles.teacherResponseLabel}>Teacher's Response</Text>
                <Text style={styles.teacherResponseText}>{item.teacher_response}</Text>
                <Text style={styles.teacherResponseDate}>
                  {item.teacher_response_at ? new Date(item.teacher_response_at).toLocaleDateString() : ''}
                </Text>
              </View>
            )}

            {isPublisher && !item.teacher_response && (
              <Pressable
                style={styles.respondButton}
                onPress={() => {
                  setSelectedFeedbackId(item.id);
                  setIsResponding(true);
                }}
              >
                <MessageSquare size={16} color="#3b82f6" />
                <Text style={styles.respondButtonText}>Respond</Text>
              </Pressable>
            )}
          </View>
        ))}

        {isResponding && selectedFeedbackId && (
          <View style={styles.responseForm}>
            <TextInput
              style={styles.responseInput}
              value={teacherResponse}
              onChangeText={setTeacherResponse}
              placeholder="Write your response..."
              multiline
              numberOfLines={4}
            />
            <View style={styles.responseActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setIsResponding(false);
                  setSelectedFeedbackId(null);
                  setTeacherResponse('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={() => handleSubmitResponse(selectedFeedbackId)}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Send size={20} color="#ffffff" />
                    <Text style={styles.submitButtonText}>Send Response</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {renderAnalytics()}
      {renderFeedbackForm()}
      {renderFeedbackList()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  feedbackForm: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  anonymousContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 4,
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 6,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  analyticsContainer: {
    padding: 16,
  },
  analyticsCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  analyticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  analyticsLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  ratingDistribution: {
    marginTop: 16,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distributionLabel: {
    width: 60,
    fontSize: 14,
    color: '#4b5563',
  },
  distributionBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  distributionBar: {
    height: '100%',
    borderRadius: 4,
  },
  distributionValue: {
    width: 30,
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'right',
  },
  themesContainer: {
    marginTop: 16,
  },
  themesTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  themesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeTag: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  themeText: {
    fontSize: 14,
    color: '#4b5563',
  },
  feedbackList: {
    padding: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  feedbackCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  feedbackUser: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  feedbackDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  feedbackSection: {
    marginBottom: 12,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  teacherResponse: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  teacherResponseLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  teacherResponseText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  teacherResponseDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  respondButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  respondButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  responseForm: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  responseInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  responseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelButton: {
    padding: 12,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyFeedbackContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFeedbackText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  anonymousUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  anonymousUserText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
});

export default CourseFeedback; 