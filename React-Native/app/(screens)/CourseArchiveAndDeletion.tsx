import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../lib/Superbase';
import { Archive, Trash2, RefreshCw, Download, AlertTriangle } from 'lucide-react-native';
import { Course } from '../../types/courses';
import Colors from '../../constant/Colors';
import ButtonComponent from '../../component/ButtonComponent';
import { Ionicons } from '@expo/vector-icons';

interface CourseArchiveAndDeletionProps {
  navigation?: any;
  courseId?: string;
}

const CourseArchiveAndDeletion = ({ navigation, courseId }: CourseArchiveAndDeletionProps) => {
  const params = useLocalSearchParams<{ course: string, courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  
  // Load course data
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
        else if (courseId || params.courseId) {
          const id = courseId || params.courseId;
          const { data, error } = await supabase
            .from('courses')
            .select('*, course_settings(*)')
            .eq('id', id)
            .single();
            
          if (error) throw error;
          courseData = data;
        } else {
          throw new Error('No course data provided');
        }
        
        setCourse(courseData);
      } catch (error) {
        console.error('Error loading course:', error);
        setError('Failed to load course data');
      } finally {
        setLoading(false);
      }
    };
    
    loadCourse();
  }, [params.course, courseId, params.courseId]);

  const handleArchiveCourse = async () => {
    if (!course) return;
    
    try {
      setProcessing(true);
      setError(null);
      setSuccessMessage(null);
      
      // Check if course settings exist
      const { data: existingSettings, error: fetchError } = await supabase
        .from('course_settings')
        .select('*')
        .eq('course_id', course.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw fetchError;
      }

      // Prepare settings data with archived flag
      const settingsData = {
        course_id: course.id,
        is_archived: true,
        // Preserve other settings if they exist
        ...(existingSettings || {
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
          notify_on_assessment_submission: true
        })
      };

      let result;
      if (existingSettings) {
        // Update existing settings
        result = await supabase
          .from('course_settings')
          .update({ is_archived: true })
          .eq('course_id', course.id);
      } else {
        // Insert new settings
        result = await supabase
          .from('course_settings')
          .insert(settingsData);
      }

      if (result.error) {
        throw result.error;
      }
      
      setSuccessMessage('Course archived successfully');
      
      // Update local course data
      setCourse(prev => {
        if (!prev) return null;
        return {
          ...prev,
          course_settings: {
            ...prev.course_settings,
            is_archived: true
          }
        };
      });
    } catch (error) {
      console.error('Error archiving course:', error);
      setError(`Failed to archive course: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleRestoreCourse = async () => {
    if (!course) return;
    
    try {
      setProcessing(true);
      setError(null);
      setSuccessMessage(null);
      
      // Check if course settings exist
      const { data: existingSettings, error: fetchError } = await supabase
        .from('course_settings')
        .select('*')
        .eq('course_id', course.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') { // No settings found
          setError('No archived course found to restore');
          return;
        }
        throw fetchError;
      }

      // Update settings to unarchive
      const { error } = await supabase
        .from('course_settings')
        .update({ is_archived: false })
        .eq('course_id', course.id);

      if (error) throw error;
      
      setSuccessMessage('Course restored successfully');
      
      // Update local course data
      setCourse(prev => {
        if (!prev) return null;
        return {
          ...prev,
          course_settings: {
            ...prev.course_settings,
            is_archived: false
          }
        };
      });
    } catch (error) {
      console.error('Error restoring course:', error);
      setError(`Failed to restore course: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleExportCourseData = async () => {
    if (!course) return;
    
    try {
      setProcessing(true);
      setError(null);
      setSuccessMessage(null);
      
      // Fetch all course data including enrollments, progress, etc.
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          course_settings(*),
          course_enrollments(*, user:user_id(email, name)),
          modules(*)
        `)
        .eq('id', course.id)
        .single();

      if (courseError) throw courseError;
      
      // Format data based on selected export format
      let exportData;
      if (exportFormat === 'json') {
        exportData = JSON.stringify(courseData, null, 2);
      } else if (exportFormat === 'csv') {
        // Simple CSV conversion for demonstration
        // In a real app, you would use a proper CSV library
        const headers = ['id', 'title', 'description', 'status', 'enrollmentcount'];
        const values = [courseData.id, courseData.title, courseData.description, courseData.status, courseData.enrollmentcount];
        exportData = headers.join(',') + '\n' + values.join(',');
      }
      
      // In a real app, you would save this to a file or allow download
      // For this demo, we'll just show a success message
      setSuccessMessage('Course data exported successfully');
      setShowExportModal(false);
      
      // Alert with sample of the data
      Alert.alert(
        'Export Successful',
        'Course data has been exported. In a production app, this would download a file.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error exporting course data:', error);
      setError(`Failed to export course data: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!course) return;
    
    // Verify confirmation text matches course title
    if (confirmText !== course.title) {
      setError('Confirmation text does not match course title');
      return;
    }
    
    try {
      setProcessing(true);
      setError(null);
      setSuccessMessage(null);
      
      // Delete the course
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id);

      if (error) throw error;
      
      setSuccessMessage('Course deleted successfully');
      setShowDeleteModal(false);
      
      // Navigate back after a short delay
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Error deleting course:', error);
      setError(`Failed to delete course: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading course data...</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Course not found</Text>
        <ButtonComponent title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const isArchived = course.course_settings?.is_archived || false;
  
  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#3b82f6" />
          </Pressable>
          <Text style={styles.title}>Course Archive & Deletion</Text>
        </View>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        {successMessage && <Text style={styles.successText}>{successMessage}</Text>}
        
        <View style={styles.courseInfoCard}>
          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.courseStatus}>
            Status: {isArchived ? 'Archived' : course.status === 'published' ? 'Published' : 'Draft'}
          </Text>
          {isArchived && (
            <View style={styles.archivedBadge}>
              <Archive size={16} color="#fff" />
              <Text style={styles.archivedBadgeText}>Archived</Text>
            </View>
          )}
        </View>
        
        {/* Archive/Restore Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isArchived ? 'Restore Course' : 'Archive Course'}
          </Text>
          <Text style={styles.sectionDescription}>
            {isArchived 
              ? 'Restore this course to make it active again. Students will regain access based on enrollment status.'
              : 'Archiving makes the course inactive but retains all data for future reference. Students will no longer have access.'}
          </Text>
          
          <ButtonComponent 
            title={isArchived ? 'Restore Course' : 'Archive Course'}
            onPress={isArchived ? handleRestoreCourse : handleArchiveCourse}
            disabled={processing}
            style={isArchived ? styles.restoreButton : styles.archiveButton}
            icon={isArchived ? <RefreshCw size={18} color="#fff" /> : <Archive size={18} color="#fff" />}
          />
        </View>
        
        {/* Export Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Course Data</Text>
          <Text style={styles.sectionDescription}>
            Export all course data, including student progress, before deletion. This creates a backup you can reference later.
          </Text>
          
          <ButtonComponent 
            title="Export Course Data"
            onPress={() => setShowExportModal(true)}
            disabled={processing}
            style={styles.exportButton}
            icon={<Download size={18} color="#fff" />}
          />
        </View>
        
        {/* Delete Course Section */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={styles.dangerSectionTitle}>Delete Course</Text>
          <Text style={styles.dangerSectionDescription}>
            Permanently delete this course and all associated data. This action cannot be undone.
          </Text>
          
          <View style={styles.warningBox}>
            <AlertTriangle size={20} color={Colors.DANGER} />
            <Text style={styles.warningText}>
              Warning: Deleting a course will permanently remove all course content, student enrollments, progress data, and analytics. This action cannot be reversed.
            </Text>
          </View>
          
          <ButtonComponent 
            title="Delete Course"
            onPress={() => setShowDeleteModal(true)}
            disabled={processing}
            style={styles.deleteButton}
            icon={<Trash2 size={18} color="#fff" />}
          />
        </View>
        
        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Confirm Course Deletion</Text>
              
              <View style={styles.warningBox}>
                <AlertTriangle size={20} color={Colors.DANGER} />
                <Text style={styles.warningText}>
                  This action is permanent and cannot be undone. All course data will be permanently deleted.
                </Text>
              </View>
              
              <Text style={styles.confirmInstructions}>
                Type <Text style={styles.confirmHighlight}>{course.title}</Text> to confirm deletion:
              </Text>
              
              <TextInput
                style={styles.confirmInput}
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder="Type course title here"
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowDeleteModal(false);
                    setConfirmText('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.confirmDeleteButton, confirmText !== course.title && styles.confirmDeleteButtonDisabled]}
                  onPress={handleDeleteCourse}
                  disabled={confirmText !== course.title || processing}
                >
                  <Text style={styles.confirmDeleteButtonText}>
                    {processing ? 'Deleting...' : 'Delete Course'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        
        {/* Export Format Modal */}
        <Modal
          visible={showExportModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowExportModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Export Course Data</Text>
              
              <Text style={styles.modalSubtitle}>Select export format:</Text>
              
              <View style={styles.exportFormatOptions}>
                <TouchableOpacity 
                  style={[styles.formatOption, exportFormat === 'json' && styles.formatOptionSelected]}
                  onPress={() => setExportFormat('json')}
                >
                  <Text style={[styles.formatOptionText, exportFormat === 'json' && styles.formatOptionTextSelected]}>JSON</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.formatOption, exportFormat === 'csv' && styles.formatOptionSelected]}
                  onPress={() => setExportFormat('csv')}
                >
                  <Text style={[styles.formatOptionText, exportFormat === 'csv' && styles.formatOptionTextSelected]}>CSV</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowExportModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.confirmExportButton}
                  onPress={handleExportCourseData}
                  disabled={processing}
                >
                  <Text style={styles.confirmExportButtonText}>
                    {processing ? 'Exporting...' : 'Export'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginLeft: 8,
  },
  errorText: {
    color: Colors.DANGER,
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 4,
  },
  successText: {
    color: Colors.SUCCESS,
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#dcfce7',
    borderRadius: 4,
  },
  courseInfoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  courseStatus: {
    fontSize: 14,
    color: '#4b5563',
  },
  archivedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#6b7280',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  archivedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.PRIMARY,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 16,
    lineHeight: 20,
  },
  dangerSection: {
    borderColor: '#fee2e2',
    backgroundColor: '#fff5f5',
  },
  dangerSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.DANGER,
    marginBottom: 8,
  },
  dangerSectionDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 16,
    lineHeight: 20,
  },
  warningBox: {
    backgroundColor: '#fff8f1',
    borderWidth: 1,
    borderColor: '#ffedd5',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningText: {
    fontSize: 14,
    color: '#b45309',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  archiveButton: {
    backgroundColor: '#6b7280',
  },
  restoreButton: {
    backgroundColor: '#047857',
  },
  exportButton: {
    backgroundColor: '#3b82f6',
  },
  deleteButton: {
    backgroundColor: Colors.DANGER,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 12,
  },
  confirmInstructions: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
  },
  confirmHighlight: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  confirmInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: Colors.WHITE,
  },
  cancelButtonText: {
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmDeleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    backgroundColor: Colors.DANGER,
  },
  confirmDeleteButtonDisabled: {
    backgroundColor: '#f87171',
    opacity: 0.6,
  },
  confirmDeleteButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: '500',
  },
  confirmExportButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  confirmExportButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: '500',
  },
  exportFormatOptions: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  formatOption: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 4,
  },
  formatOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  formatOptionText: {
    color: '#4b5563',
    fontWeight: '500',
  },
  formatOptionTextSelected: {
    color: '#3b82f6',
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default CourseArchiveAndDeletion;