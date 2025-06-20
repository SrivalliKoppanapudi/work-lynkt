import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert, Platform, Modal, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../lib/Superbase';
import { Settings, DollarSign, Users, Calendar, Bell, Archive, Lock, Eye, EyeOff, ArrowDown } from 'lucide-react-native';
import { Course } from '../../types/courses';
import Colors from '../../constant/Colors';
import ButtonComponent from '../../component/ButtonComponent';
import InputComponent from '../../component/InputComponent';
import BetterPicker from '../../component/courses/BetterPicker';
import { Ionicons } from '@expo/vector-icons';

interface CourseSettingsProps {
  navigation: any;
  courseId?: number;
}

const CourseSettings = ({ navigation, courseId }: CourseSettingsProps) => {
  const params = useLocalSearchParams<{ course: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('date');
  const [currentDateField, setCurrentDateField] = useState('');
  const [tempDate, setTempDate] = useState(new Date());
  
  // Course settings state
  const [settings, setSettings] = useState({
    // Visibility settings
    visibility: 'public', // public, private, invitation
    
    // Pricing settings
    isPaid: false,
    price: '0',
    currency: 'INR',
    
    // Subscription settings
    subscriptionType: 'one-time', // one-time, monthly, yearly
    subscriptionPrice: '0',
    
    // Schedule settings
    scheduledRelease: false,
    releaseDate: new Date(),
    moduleReleaseSchedule: [] as {moduleId: string, releaseDate: Date}[],
    
    // Access permissions
    accessRestrictions: 'all', // all, specific-roles, specific-users
    allowedRoles: [] as string[],
    allowedUsers: [] as string[],
    
    // Notification settings
    notifyOnEnrollment: true,
    notifyOnCompletion: true,
    notifyOnAssessmentSubmission: true,
    
    // Archive settings
    isArchived: false
  });
  
  const [expandedSections, setExpandedSections] = useState({
    visibility: false,
    pricing: false,
    subscription: false,
    schedule: false,
    access: false,
    notifications: false,
    archive: false
  });

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
        else if (courseId) {
          const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();
            
          if (error) throw error;
          courseData = data;
        } else {
          throw new Error('No course data provided');
        }
        
        setCourse(courseData);
        
        // Load settings if they exist
        if (courseData.course_settings) {
          try {
            const parsedSettings = JSON.parse(courseData.course_settings);
            setSettings(parsedSettings);
          } catch (parseError) {
            console.error('Error parsing course settings:', parseError);
          }
        }
      } catch (error) {
        console.error('Error loading course:', error);
        setError('Failed to load course data');
      } finally {
        setLoading(false);
      }
    };
    
    loadCourse();
  }, [params.course, courseId]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSaveSettings = async () => {
    if (!course) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      // First, check if settings exist for this course
      const { data: existingSettings, error: fetchError } = await supabase
        .from('course_settings')
        .select('*')
        .eq('course_id', course.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw fetchError;
      }

      const settingsData = {
        course_id: course.id,
        visibility: settings.visibility,
        is_paid: settings.isPaid,
        price: parseFloat(settings.price) || 0,
        currency: settings.currency,
        subscription_type: settings.subscriptionType,
        subscription_price: parseFloat(settings.subscriptionPrice) || 0,
        scheduled_release: settings.scheduledRelease,
        release_date: settings.releaseDate,
        module_release_schedule: settings.moduleReleaseSchedule,
        access_restrictions: settings.accessRestrictions,
        allowed_roles: settings.allowedRoles,
        allowed_users: settings.allowedUsers,
        notify_on_enrollment: settings.notifyOnEnrollment,
        notify_on_completion: settings.notifyOnCompletion,
        notify_on_assessment_submission: settings.notifyOnAssessmentSubmission,
        is_archived: settings.isArchived
      };

      let result;
      if (existingSettings) {
        // Update existing settings - make sure not to try updating the id
        result = await supabase
          .from('course_settings')
          .update(settingsData)
          .eq('course_id', course.id);
      } else {
        // Insert new settings
        result = await supabase
          .from('course_settings')
          .insert(settingsData);
      }

      if (result.error) {
        console.error('Error saving settings:', result.error);
        throw result.error;
      }
      
      setSuccessMessage('Course settings saved successfully');
      
      // Update course data with latest settings
      const { data: updatedSettings, error: updateFetchError } = await supabase
        .from('course_settings')
        .select('*')
        .eq('course_id', course.id)
        .single();
        
      if (!updateFetchError && updatedSettings) {
        // console.log('Updated settings fetched:', updatedSettings);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(`Failed to save course settings: ${error.message || 'Unknown error'}`);
      Alert.alert('Error', `Failed to save settings: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading course settings...</Text>
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

  // Handle date change
  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      // Ensure selected date is not before current date
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      // If selected date is before current date, use current date instead
      if (datePickerMode === 'date' && selectedDate < currentDate) {
        selectedDate = new Date();
      }
      
      setTempDate(selectedDate);
      
      if (datePickerMode === 'date') {
        // For both iOS and Android, switch to time picker after date is selected
        if (Platform.OS === 'ios') {
          setDatePickerMode('time');
          return;
        } else if (Platform.OS === 'android') {
          // For Android, we need to show the time picker after a short delay
          setTimeout(() => {
            setDatePickerMode('time');
            setShowDatePicker(true);
          }, 100);
          return;
        }
      }
      
      // Update the appropriate date field
      if (currentDateField === 'releaseDate') {
        setSettings({...settings, releaseDate: selectedDate});
      } else if (currentDateField.startsWith('module-')) {
        const moduleId = currentDateField.replace('module-', '');
        const updatedSchedule = [...settings.moduleReleaseSchedule];
        const existingIndex = updatedSchedule.findIndex(item => item.moduleId === moduleId);
        
        if (existingIndex >= 0) {
          updatedSchedule[existingIndex].releaseDate = selectedDate;
        } else {
          updatedSchedule.push({ moduleId, releaseDate: selectedDate });
        }
        
        setSettings({...settings, moduleReleaseSchedule: updatedSchedule});
      }
      
      if (datePickerMode === 'time') {
        setShowDatePicker(false);
      }
    } else {
      setShowDatePicker(false);
    }
  };
  
  return (
    <ScrollView>
      <View style={styles.container}>
        {/* Date Picker Modal for Android */}
        {Platform.OS === 'android' && showDatePicker && (
          <DateTimePicker
            value={tempDate}
            mode={datePickerMode as any}
            is24Hour={true}
            display="default"
            onChange={handleDateChange}
            minimumDate={datePickerMode === 'date' ? new Date() : undefined}
          />
        )}
        
        {/* Date Picker Modal for iOS */}
        {Platform.OS === 'ios' && showDatePicker && (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showDatePicker}
          >
            <View style={styles.datePickerModalContainer}>
              <View style={styles.datePickerModalContent}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.datePickerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>
                    {datePickerMode === 'date' ? 'Select Date' : 'Select Time'}
                  </Text>
                  <TouchableOpacity onPress={() => handleDateChange(null, tempDate)}>
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempDate}
                  mode={datePickerMode as any}
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={datePickerMode === 'date' ? new Date() : undefined}
                  style={styles.datePickerIOS}
                />
              </View>
            </View>
          </Modal>
        )}
        <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#3b82f6" />
          </Pressable>
          <Text style={styles.title}>Course Settings</Text>
        </View>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        {successMessage && <Text style={styles.successText}>{successMessage}</Text>}
        
        {/* 1. Course Visibility */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('visibility')}
          >
            <View style={styles.sectionTitleContainer}>
              <Eye size={20} color={Colors.PRIMARY} />
              <Text style={styles.sectionTitle}>Course Visibility</Text>
            </View>
            <ArrowDown 
              size={20} 
              color={Colors.PRIMARY} 
              style={{ transform: [{ rotate: expandedSections.visibility ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>
          
          {expandedSections.visibility && (
            <View style={styles.sectionContent}>
              <Text style={styles.sectionDescription}>
                Control who can see and access your course
              </Text>
              
              <View style={styles.optionContainer}>
                <TouchableOpacity 
                  style={[styles.optionButton, settings.visibility === 'public' && styles.optionSelected]}
                  onPress={() => setSettings({...settings, visibility: 'public'})}
                >
                  <Eye size={18} color={settings.visibility === 'public' ? Colors.WHITE : Colors.PRIMARY} />
                  <Text style={[styles.optionText, settings.visibility === 'public' && styles.optionTextSelected]}>Public</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.optionButton, settings.visibility === 'private' && styles.optionSelected]}
                  onPress={() => setSettings({...settings, visibility: 'private'})}
                >
                  <EyeOff size={18} color={settings.visibility === 'private' ? Colors.WHITE : Colors.PRIMARY} />
                  <Text style={[styles.optionText, settings.visibility === 'private' && styles.optionTextSelected]}>Private</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.optionButton, settings.visibility === 'invitation' && styles.optionSelected]}
                  onPress={() => setSettings({...settings, visibility: 'invitation'})}
                >
                  <Lock size={18} color={settings.visibility === 'invitation' ? Colors.WHITE : Colors.PRIMARY} />
                  <Text style={[styles.optionText, settings.visibility === 'invitation' && styles.optionTextSelected]}>Invitation Only</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.helperText}>
                {settings.visibility === 'public' && 'Anyone can find and enroll in this course'}
                {settings.visibility === 'private' && 'Only you and enrolled students can access this course'}
                {settings.visibility === 'invitation' && 'Only people with a direct invitation link can access this course'}
              </Text>
            </View>
          )}
        </View>
        
        {/* 2. Course Pricing */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('pricing')}
          >
            <View style={styles.sectionTitleContainer}>
              <DollarSign size={20} color={Colors.PRIMARY} />
              <Text style={styles.sectionTitle}>Course Pricing</Text>
            </View>
            <ArrowDown 
              size={20} 
              color={Colors.PRIMARY} 
              style={{ transform: [{ rotate: expandedSections.pricing ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>
          
          {expandedSections.pricing && (
            <View style={styles.sectionContent}>
              <Text style={styles.sectionDescription}>
                Set pricing options for your course
              </Text>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>This is a paid course</Text>
                <Switch
                  value={settings.isPaid}
                  onValueChange={(value) => setSettings({...settings, isPaid: value})}
                  trackColor={{ false: '#d1d5db', true: Colors.PRIMARY }}
                />
              </View>
              
              {settings.isPaid && (
                <View style={styles.priceContainer}>
                  <Text style={styles.inputLabel}>Price</Text>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={settings.price}
                      onChangeText={(text) => setSettings({...settings, price: text})}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                  </View>
                  
                  <View style={styles.pickerContainer}>
                    <Text style={styles.inputLabel}>Currency</Text>
                    <BetterPicker
                      value={settings.currency}
                      onValueChange={(value) => setSettings({...settings, currency: value})}
                      items={[
                        { label: 'INR (₹)', value: 'INR' }
                      ]}
                    />
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
        
        {/* 3. Subscription Management */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('subscription')}
          >
            <View style={styles.sectionTitleContainer}>
              <DollarSign size={20} color={Colors.PRIMARY} />
              <Text style={styles.sectionTitle}>Subscription Management</Text>
            </View>
            <ArrowDown 
              size={20} 
              color={Colors.PRIMARY} 
              style={{ transform: [{ rotate: expandedSections.subscription ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>
          
          {expandedSections.subscription && (
            <View style={styles.sectionContent}>
              <Text style={styles.sectionDescription}>
                Set up subscription models for your course
              </Text>
              
              <View style={styles.pickerContainer}>
                <Text style={styles.inputLabel}>Payment Type</Text>
                <BetterPicker
                  value={settings.subscriptionType}
                  onValueChange={(value) => setSettings({...settings, subscriptionType: value})}
                  items={[
                    { label: 'One-time Payment', value: 'one-time' },
                    { label: 'Monthly Subscription', value: 'monthly' },
                    { label: 'Yearly Subscription', value: 'yearly' },
                  ]}
                />
              </View>
              
              {settings.subscriptionType !== 'one-time' && (
                <View style={styles.priceContainer}>
                  <Text style={styles.inputLabel}>
                    {settings.subscriptionType === 'monthly' ? 'Monthly Price' : 'Yearly Price'}
                  </Text>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={settings.subscriptionPrice}
                      onChangeText={(text) => setSettings({...settings, subscriptionPrice: text})}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
        
        {/* 4. Schedule Release Dates */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('schedule')}
          >
            <View style={styles.sectionTitleContainer}>
              <Calendar size={20} color={Colors.PRIMARY} />
              <Text style={styles.sectionTitle}>Schedule Release Dates</Text>
            </View>
            <ArrowDown 
              size={20} 
              color={Colors.PRIMARY} 
              style={{ transform: [{ rotate: expandedSections.schedule ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>
          
          {expandedSections.schedule && (
            <View style={styles.sectionContent}>
              <Text style={styles.sectionDescription}>
                Schedule when your course or modules become available
              </Text>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Schedule course release</Text>
                <Switch
                  value={settings.scheduledRelease}
                  onValueChange={(value) => setSettings({...settings, scheduledRelease: value})}
                  trackColor={{ false: '#d1d5db', true: Colors.PRIMARY }}
                />
              </View>
              
              {settings.scheduledRelease && (
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => {
                    setTempDate(settings.releaseDate);
                    setCurrentDateField('releaseDate');
                    setDatePickerMode('date');
                    setShowDatePicker(true);
                  }}
                >
                  <Calendar size={18} color={Colors.PRIMARY} />
                  <Text style={styles.datePickerText}>
                    {settings.releaseDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              )}
              
              <Text style={styles.subSectionTitle}>Module Release Schedule</Text>
              <Text style={styles.helperText}>
                You can set individual release dates for each module
              </Text>
              
              {course.modules && course.modules.length > 0 ? (
                course.modules.map((module, index) => (
                  <View key={module.id} style={styles.moduleScheduleItem}>
                    <Text style={styles.moduleTitle}>{module.title}</Text>
                    <TouchableOpacity 
                      style={styles.datePickerButton}
                      onPress={() => {
                        // Find existing module release date or use current date
                        const existingSchedule = settings.moduleReleaseSchedule.find(item => item.moduleId === module.id);
                        setTempDate(existingSchedule ? existingSchedule.releaseDate : new Date());
                        setCurrentDateField(`module-${module.id}`);
                        setDatePickerMode('date');
                        setShowDatePicker(true);
                      }}
                    >
                      <Calendar size={16} color={Colors.PRIMARY} />
                      <Text style={styles.datePickerText}>
                        {settings.moduleReleaseSchedule.find(item => item.moduleId === module.id) 
                          ? settings.moduleReleaseSchedule.find(item => item.moduleId === module.id).releaseDate.toLocaleDateString()
                          : 'Set Release Date'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No modules available</Text>
              )}
            </View>
          )}
        </View>
        
        {/* 5. Access Permissions */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('access')}
          >
            <View style={styles.sectionTitleContainer}>
              <Users size={20} color={Colors.PRIMARY} />
              <Text style={styles.sectionTitle}>Access Permissions</Text>
            </View>
            <ArrowDown 
              size={20} 
              color={Colors.PRIMARY} 
              style={{ transform: [{ rotate: expandedSections.access ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>
          
          {expandedSections.access && (
            <View style={styles.sectionContent}>
              <Text style={styles.sectionDescription}>
                Control who can access your course
              </Text>
              
              <View style={styles.pickerContainer}>
                <Text style={styles.inputLabel}>Access Restrictions</Text>
                <BetterPicker
                  value={settings.accessRestrictions}
                  onValueChange={(value) => setSettings({...settings, accessRestrictions: value})}
                  items={[
                    { label: 'Anyone can enroll', value: 'all' },
                    { label: 'Specific roles only', value: 'specific-roles' },
                    { label: 'Specific users only', value: 'specific-users' },
                  ]}
                />
              </View>
              
              {settings.accessRestrictions === 'specific-roles' && (
                <View style={styles.rolesContainer}>
                  <Text style={styles.inputLabel}>Select Allowed Roles</Text>
                  <View style={styles.optionContainer}>
                    <TouchableOpacity 
                      style={[styles.roleChip, settings.allowedRoles.includes('student') && styles.roleChipSelected]}
                      onPress={() => {
                        const newRoles = settings.allowedRoles.includes('student')
                          ? settings.allowedRoles.filter(r => r !== 'student')
                          : [...settings.allowedRoles, 'student'];
                        setSettings({...settings, allowedRoles: newRoles});
                      }}
                    >
                      <Text style={[styles.roleChipText, settings.allowedRoles.includes('student') && styles.roleChipTextSelected]}>Students</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.roleChip, settings.allowedRoles.includes('teacher') && styles.roleChipSelected]}
                      onPress={() => {
                        const newRoles = settings.allowedRoles.includes('teacher')
                          ? settings.allowedRoles.filter(r => r !== 'teacher')
                          : [...settings.allowedRoles, 'teacher'];
                        setSettings({...settings, allowedRoles: newRoles});
                      }}
                    >
                      <Text style={[styles.roleChipText, settings.allowedRoles.includes('teacher') && styles.roleChipTextSelected]}>Teachers</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.roleChip, settings.allowedRoles.includes('admin') && styles.roleChipSelected]}
                      onPress={() => {
                        const newRoles = settings.allowedRoles.includes('admin')
                          ? settings.allowedRoles.filter(r => r !== 'admin')
                          : [...settings.allowedRoles, 'admin'];
                        setSettings({...settings, allowedRoles: newRoles});
                      }}
                    >
                      <Text style={[styles.roleChipText, settings.allowedRoles.includes('admin') && styles.roleChipTextSelected]}>Admins</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              {settings.accessRestrictions === 'specific-users' && (
                <View style={styles.usersContainer}>
                  <Text style={styles.inputLabel}>Manage User Access</Text>
                  <ButtonComponent 
                    title="Add Users" 
                    onPress={() => {
                      // Simulate user selection with a list of sample users
                      const sampleUsers = [
                        { id: '1', name: 'John Doe', email: 'john@example.com' },
                        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
                        { id: '3', name: 'Robert Johnson', email: 'robert@example.com' },
                        { id: '4', name: 'Emily Davis', email: 'emily@example.com' },
                      ];
                      
                      // Create alert with user selection options
                      Alert.alert(
                        'Select Users',
                        'Choose users to add to this course',
                        [
                          ...sampleUsers.map(user => ({
                            text: `${user.name} (${user.email})`,
                            onPress: () => {
                              // Add user to allowed users if not already added
                              if (!settings.allowedUsers.includes(user.id)) {
                                setSettings({
                                  ...settings,
                                  allowedUsers: [...settings.allowedUsers, user.id]
                                });
                              }
                            }
                          })),
                          { text: 'Cancel', style: 'cancel' }
                        ]
                      );
                    }}
                  />
                  
                  {settings.allowedUsers.length > 0 ? (
                    <View style={styles.usersList}>
                      {/* Display selected users */}
                      {settings.allowedUsers.map(userId => {
                        // Get user details based on ID (in a real app, this would come from your user database)
                        const userMap = {
                          '1': { name: 'John Doe', email: 'john@example.com' },
                          '2': { name: 'Jane Smith', email: 'jane@example.com' },
                          '3': { name: 'Robert Johnson', email: 'robert@example.com' },
                          '4': { name: 'Emily Davis', email: 'emily@example.com' },
                        };
                        const user = userMap[userId] || { name: `User ${userId}`, email: '' };
                        
                        return (
                          <View key={userId} style={styles.userItem}>
                            <View style={styles.userInfo}>
                              <Text style={styles.userName}>{user.name}</Text>
                              {user.email && <Text style={styles.userEmail}>{user.email}</Text>}
                            </View>
                            <TouchableOpacity 
                              onPress={() => {
                                // Remove user from allowed users
                                setSettings({
                                  ...settings,
                                  allowedUsers: settings.allowedUsers.filter(id => id !== userId)
                                });
                              }}
                            >
                              <Text style={styles.removeUserText}>Remove</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>No users added yet</Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
        
        {/* 6. Notification Settings */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('notifications')}
          >
            <View style={styles.sectionTitleContainer}>
              <Bell size={20} color={Colors.PRIMARY} />
              <Text style={styles.sectionTitle}>Notification Settings</Text>
            </View>
            <ArrowDown 
              size={20} 
              color={Colors.PRIMARY} 
              style={{ transform: [{ rotate: expandedSections.notifications ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>
          
          {expandedSections.notifications && (
            <View style={styles.sectionContent}>
              <Text style={styles.sectionDescription}>
                Manage notifications for this course
              </Text>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Notify when students enroll</Text>
                <Switch
                  value={settings.notifyOnEnrollment}
                  onValueChange={(value) => setSettings({...settings, notifyOnEnrollment: value})}
                  trackColor={{ false: '#d1d5db', true: Colors.PRIMARY }}
                />
              </View>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Notify when students complete the course</Text>
                <Switch
                  value={settings.notifyOnCompletion}
                  onValueChange={(value) => setSettings({...settings, notifyOnCompletion: value})}
                  trackColor={{ false: '#d1d5db', true: Colors.PRIMARY }}
                />
              </View>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Notify on assessment submissions</Text>
                <Switch
                  value={settings.notifyOnAssessmentSubmission}
                  onValueChange={(value) => setSettings({...settings, notifyOnAssessmentSubmission: value})}
                  trackColor={{ false: '#d1d5db', true: Colors.PRIMARY }}
                />
              </View>
            </View>
          )}
        </View>
        
        {/* 7. Course Archive Option */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('archive')}
          >
            <View style={styles.sectionTitleContainer}>
              <Archive size={20} color={Colors.PRIMARY} />
              <Text style={styles.sectionTitle}>Archive Course</Text>
            </View>
            <ArrowDown 
              size={20} 
              color={Colors.PRIMARY} 
              style={{ transform: [{ rotate: expandedSections.archive ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>
          
          {expandedSections.archive && (
            <View style={styles.sectionContent}>
              <Text style={styles.sectionDescription}>
                Archiving a course makes it inactive but retains all data
              </Text>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Archive this course</Text>
                <Switch
                  value={settings.isArchived}
                  onValueChange={(value) => {
                    if (value) {
                      // Confirm before archiving
                      Alert.alert(
                        'Archive Course',
                        'Archiving will make this course inactive. Students will no longer be able to access it. Continue?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Archive', style: 'destructive', onPress: () => setSettings({...settings, isArchived: true}) }
                        ]
                      );
                    } else {
                      setSettings({...settings, isArchived: false});
                    }
                  }}
                  trackColor={{ false: '#d1d5db', true: '#ef4444' }}
                />
              </View>
              
              {settings.isArchived && (
                <Text style={styles.warningText}>
                  This course is currently archived and not visible to students
                </Text>
              )}
            </View>
          )}
        </View>
        
        {/* Save Button */}
        <ButtonComponent 
          title={saving ? 'Saving...' : 'Save Settings'}
          onPress={handleSaveSettings}
          disabled={saving}
          style={styles.saveButton}
        />
        
        {/* Archive & Delete Options Button */}
        {course && (
          <ButtonComponent 
            title="Archive & Delete Options"
            onPress={() => {
              router.push({
                pathname: "/(screens)/CourseArchiveAndDeletion",
                params: { course: JSON.stringify(course) }
              });
            }}
            style={styles.archiveDeleteButton}
            icon={<Archive size={18} color="#fff" />}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({  
  datePickerModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  datePickerCancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  datePickerDoneText: {
    fontSize: 16,
    color: Colors.PRIMARY,
    fontWeight: '600',
  },
  datePickerIOS: {
    height: 200,
    width: '100%',
  },
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
    marginLeft: 10,
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
  section: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.PRIMARY,
    marginLeft: 8,
  },
  sectionContent: {
    padding: 16,
    backgroundColor: Colors.WHITE,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  optionContainer: {
    flexDirection: 'column',
    marginBottom: 16,
    width: '100%',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    marginBottom: 12,
    width: '100%',
    minHeight: 48,
  },
  optionSelected: {
    backgroundColor: Colors.PRIMARY,
  },
  optionText: {
    fontSize: 14,
    color: Colors.PRIMARY,
    marginLeft: 4,
  },
  optionTextSelected: {
    color: Colors.WHITE,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  priceContainer: {
    marginBottom: 16,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    paddingHorizontal: 8,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#374151',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#374151',
  },
  pickerContainer: {
    marginTop: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginBottom: 16,
  },
  datePickerText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  moduleScheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  moduleTitle: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginVertical: 8,
  },
  roleChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
    marginBottom: 8,
  },
  roleChipSelected: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  roleChipText: {
    fontSize: 14,
    color: '#374151',
  },
  roleChipTextSelected: {
    color: Colors.WHITE,
  },
  usersContainer: {
    marginTop: 16,
  },
  usersList: {
    marginTop: 16,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  userEmail: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  removeUserText: {
    fontSize: 14,
    color: Colors.DANGER,
    fontWeight: '500',
  },
  warningText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 8,
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 32,
  },
  archiveDeleteButton: {
    backgroundColor: '#6b7280',
    marginBottom: 24,
  },
  rolesContainer: { 
    marginTop: 10,
    width: '100%'
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
});

export default CourseSettings;