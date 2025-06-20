import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, SafeAreaView, Switch } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';
import { Course, Module, Lesson, CourseSettings } from '../../types/courses';
import { supabase } from '../../lib/Superbase';
import Colors from '../../constant/Colors';
import CourseImageUpload from '../../component/courses/CourseImageUpload';
import CategorySelector from '../../component/courses/CategorySelector';
import BetterPicker from '../../component/courses/BetterPicker';
import ModuleSection from '../../component/courses/ModuleSection';
import type { Resource } from '../../types/courses';
import ModuleResourceManager from '../../component/courses/ModuleResourceManager';

export default function CourseEditor() {
  const params = useLocalSearchParams<{ course: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Course data state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  
  // Additional course properties
  const [image, setImage] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [prerequisites, setPrerequisites] = useState('');
  const [objectives, setObjectives] = useState<string[]>([]);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  
  // Course settings
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('0');
  const [currency, setCurrency] = useState('INR');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'invitation'>('public');
  const [difficultyLevel, setDifficultyLevel] = useState('beginner');
  
  // Resource management
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [resourceManagerVisible, setResourceManagerVisible] = useState(false);
  const moduleSectionRef = useRef<any>(null);

  useEffect(() => {
    // Parse course data from params
    if (params.course) {
      try {
        const parsedCourse = JSON.parse(params.course as string);
        setCourse(parsedCourse);
        
        // Set basic course info
        setTitle(parsedCourse.title || '');
        setDescription(parsedCourse.description || '');
        setModules(parsedCourse.modules || []);
        
        // Set additional course properties
        setImage(parsedCourse.image || '');
        setCategories(parsedCourse.categories || []);
        setPrerequisites(parsedCourse.prerequisites || '');
        setObjectives(parsedCourse.objectives || []);
        setStatus(parsedCourse.status || 'draft');
        
        // Set course settings if available
        if (parsedCourse.course_settings) {
          setIsPaid(parsedCourse.course_settings.is_paid || false);
          setPrice(parsedCourse.course_settings.price?.toString() || '0');
          setCurrency(parsedCourse.course_settings.currency || 'INR');
          setVisibility(parsedCourse.course_settings.visibility || 'public');
          setDifficultyLevel(parsedCourse.difficulty_level || 'beginner');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error parsing course data:', error);
        setError('Failed to parse course data');
        setLoading(false);
      }
    } else {
      setError('No course data provided');
      setLoading(false);
    }
  }, [params.course]);

  const handleSaveCourse = async () => {
    if (!course) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Update course basic info and additional properties
      const { error: updateError } = await supabase
        .from('courses')
        .update({
          title,
          description,
          image,
          categories,
          prerequisites,
          objectives,
          status,
          modules,
          updated_at: new Date().toISOString()
        })
        .eq('id', course.id);

      if (updateError) throw updateError;

      setSuccessMessage('Course updated successfully');
      
      // Update local course object
      setCourse({
        ...course,
        title,
        description,
        image,
        categories,
        prerequisites,
        objectives,
        status,
        modules
      });
    } catch (error: any) {
      console.error('Error saving course:', error);
      setError(error.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleAddModule = () => {
    const newModule: Module = {
      id: `temp-${Date.now()}`, // Temporary ID until saved to database
      title: 'New Module',
      description: '',
      order: modules.length,
      lessons: [],
      resources: []
    };

    setModules([...modules, newModule]);
  };

  const updateModule = (index: number, updatedModule: Partial<Module>) => {
    const updatedModules = [...modules];
    updatedModules[index] = { ...updatedModules[index], ...updatedModule };
    setModules(updatedModules);
  };

  const deleteModule = (index: number) => {
    Alert.alert(
      'Delete Module',
      'Are you sure you want to delete this module? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            const updatedModules = [...modules];
            updatedModules.splice(index, 1);
            setModules(updatedModules);
          }
        }
      ]
    );
  };

  const addLesson = (moduleIndex: number) => {
    const newLesson: Lesson = {
      id: Date.now(), // Temporary ID until saved to database
      title: 'New Lesson',
      content: '',
      type: 'text',
      duration: 0,
      order: modules[moduleIndex].lessons?.length || 0,
      resources: [],
      discussionEnabled: false
    };

    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons = [
      ...(updatedModules[moduleIndex].lessons || []),
      newLesson
    ];
    setModules(updatedModules);
  };

  const updateLesson = (moduleIndex: number, lessonIndex: number, updatedLesson: Partial<Lesson>) => {
    const updatedModules = [...modules];
    const lessons = [...(updatedModules[moduleIndex].lessons || [])];
    lessons[lessonIndex] = { ...lessons[lessonIndex], ...updatedLesson };
    updatedModules[moduleIndex].lessons = lessons;
    setModules(updatedModules);
  };

  const deleteLesson = (moduleIndex: number, lessonIndex: number) => {
    Alert.alert(
      'Delete Lesson',
      'Are you sure you want to delete this lesson? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            const updatedModules = [...modules];
            const lessons = [...(updatedModules[moduleIndex].lessons || [])];
            lessons.splice(lessonIndex, 1);
            updatedModules[moduleIndex].lessons = lessons;
            setModules(updatedModules);
          }
        }
      ]
    );
  };

  const handleOpenResourceManager = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setResourceManagerVisible(true);
  };

  const handleResourcesChange = async (resources: Resource[]) => {
    if (!selectedModuleId) return;
    
    try {
      console.log('Saving resources to course_resources table:', resources);
      
      // First, delete existing resources for this module
      const { error: deleteError } = await supabase
        .from('course_resources')
        .delete()
        .eq('course_id', course?.id)
        .eq('module_id', selectedModuleId);
        
      if (deleteError) {
        console.error('Error deleting existing resources:', deleteError);
        Alert.alert('Error', 'Failed to update resources');
        return;
      }
      
      // Then insert the new resources
      if (resources.length > 0) {
        // Filter out resources with temporary IDs and prepare them for insertion
        const resourcesToInsert = resources
          .filter(resource => {
            // Keep resources that either:
            // 1. Have a valid UUID (not starting with 'temp-')
            // 2. Have a resource_id that exists in storage
            return !resource.id.startsWith('temp-') || resource.resource_id;
          })
          .map(resource => ({
            course_id: course?.id,
            module_id: selectedModuleId,
            title: resource.title,
            type: resource.type,
            url: resource.url,
            resource_id: resource.resource_id
          }));
        
        if (resourcesToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('course_resources')
            .insert(resourcesToInsert);
            
          if (insertError) {
            console.error('Error inserting resources:', insertError);
            Alert.alert('Error', 'Failed to save resources');
            return;
          }
        }
      }
      
      // Update the local state with all resources, including temporary ones
      setModules(prevModules => 
        prevModules.map(module => 
          module.id === selectedModuleId 
            ? { ...module, resources } 
            : module
        )
      );
      
      console.log('Resources saved successfully');
    } catch (error) {
      console.error('Error saving resources:', error);
      Alert.alert('Error', 'Failed to save resources');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading course editor...</Text>
      </View>
    );
  }

  if (error && !course) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#3b82f6" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Course</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Course Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Course Information</Text>
          
          {/* Course Image */}
          <CourseImageUpload 
            image={image} 
            setImage={setImage} 
            setError={setError} 
          />
          
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Course Title"
          />
          
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Course Description"
            multiline
            numberOfLines={4}
          />
          
          {/* Categories */}
          <View style={styles.inputGroup}>
            <CategorySelector
              selectedCategories={categories}
              setSelectedCategories={setCategories}
              categories={[
                'Lesson Planning & Curriculum',
                'Classroom Management',
                'Student Engagement',
                'Assessment & Grading',
                'Educational Technology',
                'Professional Development',
                'Special Education & Inclusion',
                'Communication & Collaboration',
                'Subject-Specific Resources',
                'Other'
              ]}
            />
          </View>
          
          {/* Prerequisites */}
          <Text style={styles.label}>Prerequisites</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={prerequisites}
            onChangeText={setPrerequisites}
            placeholder="Course Prerequisites"
            multiline
            numberOfLines={3}
          />
          
          {/* Learning Objectives */}
          <Text style={styles.label}>Learning Objectives (comma separated)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={objectives.join(', ')}
            onChangeText={(text) => setObjectives(text.split(',').map(item => item.trim()).filter(item => item !== ''))}
            placeholder="What students will learn"
            multiline
            numberOfLines={3}
          />
          
          {/* Difficulty Level */}
          <Text style={styles.label}>Difficulty Level</Text>
          <BetterPicker
            value={difficultyLevel}
            onValueChange={setDifficultyLevel}
            items={[
              { label: 'Beginner', value: 'beginner' },
              { label: 'Intermediate', value: 'intermediate' },
              { label: 'Advanced', value: 'advanced' }
            ]}
          />
          
          {/* Course Status */}
          <View style={styles.statusContainer}>
            <Text style={styles.label}>Course Status</Text>
            <View style={styles.statusOptions}>
              <TouchableOpacity 
                style={[styles.statusOption, status === 'draft' && styles.statusOptionSelected]}
                onPress={() => setStatus('draft')}
              >
                <Text style={[styles.statusText, status === 'draft' && styles.statusTextSelected]}>Draft</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.statusOption, status === 'published' && styles.statusOptionSelected]}
                onPress={() => setStatus('published')}
              >
                <Text style={[styles.statusText, status === 'published' && styles.statusTextSelected]}>Published</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Course Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Course Settings</Text>
          
          {/* Visibility */}
          <Text style={styles.label}>Visibility</Text>
          <BetterPicker
            value={visibility}
            onValueChange={(value) => setVisibility(value as 'public' | 'private' | 'invitation')}
            items={[
              { label: 'Public', value: 'public' },
              { label: 'Private', value: 'private' },
              { label: 'Invitation Only', value: 'invitation' }
            ]}
          />
          
          {/* Pricing */}
          <View style={styles.pricingContainer}>
            <Text style={styles.label}>Pricing</Text>
            <View style={styles.pricingRow}>
              <Text>Is this a paid course?</Text>
              <Switch
                value={isPaid}
                onValueChange={setIsPaid}
                trackColor={{ false: '#d1d5db', true: Colors.PRIMARY }}
              />
            </View>
            
            {isPaid && (
              <View style={styles.priceInputContainer}>
                <View style={styles.currencyContainer}>
                  <Text style={styles.label}>Currency</Text>
                  <BetterPicker
                    value={currency}
                    onValueChange={setCurrency}
                    items={[
                      { label: 'INR (₹)', value: 'INR' },
                      { label: 'USD ($)', value: 'USD' },
                      { label: 'EUR (€)', value: 'EUR' },
                      { label: 'GBP (£)', value: 'GBP' }
                    ]}
                  />
                </View>
                
                <View style={styles.priceContainer}>
                  <Text style={styles.label}>Price</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0.00"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Modules Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Modules</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddModule}>
              <Ionicons name="add-circle" size={24} color={Colors.PRIMARY} />
              <Text style={styles.addButtonText}>Add Module</Text>
            </TouchableOpacity>
          </View>

          {modules.map((module, moduleIndex) => (
            <View key={module.id} style={styles.moduleCard}>
              <View style={styles.moduleHeader}>
                <TextInput
                  style={styles.moduleTitle}
                  value={module.title}
                  onChangeText={(text) => updateModule(moduleIndex, { title: text })}
                  placeholder="Module Title"
                />
                <TouchableOpacity onPress={() => deleteModule(moduleIndex)}>
                  <Ionicons name="trash-outline" size={24} color="#dc2626" />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={[styles.input, styles.moduleDescription]}
                value={module.description}
                onChangeText={(text) => updateModule(moduleIndex, { description: text })}
                placeholder="Module Description"
                multiline
              />
              
              {/* Module Resources */}
              <View style={styles.resourcesContainer}>
                <View style={styles.resourceHeader}>
                  <Text style={styles.resourceTitle}>Module Resources</Text>
                  <TouchableOpacity 
                    style={styles.addResourceButton}
                    onPress={() => handleOpenResourceManager(module.id)}
                  >
                    <Ionicons name="add" size={20} color={Colors.PRIMARY} />
                    <Text style={styles.addResourceText}>Add Resource</Text>
                  </TouchableOpacity>
                </View>
                
                {module.resources?.length > 0 ? (
                  <View style={styles.resourceList}>
                    {module.resources.map((resource, index) => (
                      <View key={index} style={styles.resourceItem}>
                        <Text style={styles.resourceName}>{resource.title}</Text>
                        <Text style={styles.resourceType}>{resource.type}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No resources added yet</Text>
                )}
              </View>
              
              {/* Lessons */}
              <View style={styles.lessonsContainer}>
                <View style={styles.lessonHeader}>
                  <Text style={styles.lessonSectionTitle}>Lessons</Text>
                  <TouchableOpacity 
                    style={styles.addLessonButton} 
                    onPress={() => addLesson(moduleIndex)}
                  >
                    <Ionicons name="add" size={20} color={Colors.PRIMARY} />
                    <Text style={styles.addLessonText}>Add Lesson</Text>
                  </TouchableOpacity>
                </View>
                
                {module.lessons?.map((lesson, lessonIndex) => (
                  <View key={lesson.id} style={styles.lessonCard}>
                    <View style={styles.lessonCardHeader}>
                      <TextInput
                        style={styles.lessonTitle}
                        value={lesson.title}
                        onChangeText={(text) => 
                          updateLesson(moduleIndex, lessonIndex, { title: text })
                        }
                        placeholder="Lesson Title"
                      />
                      <TouchableOpacity onPress={() => deleteLesson(moduleIndex, lessonIndex)}>
                        <Ionicons name="close-circle" size={20} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                    
                    <TextInput
                      style={[styles.input, styles.lessonContent]}
                      value={lesson.content}
                      onChangeText={(text) => 
                        updateLesson(moduleIndex, lessonIndex, { content: text })
                      }
                      placeholder="Lesson Content"
                      multiline
                    />
                    
                    {/* Lesson Resources */}
                    {lesson.resources?.length > 0 && (
                      <View style={styles.lessonResources}>
                        <Text style={styles.resourceTitle}>Lesson Resources:</Text>
                        {lesson.resources.map((resource, index) => (
                          <View key={index} style={styles.resourceItem}>
                            <Text style={styles.resourceName}>{resource.title}</Text>
                            <Text style={styles.resourceType}>{resource.type}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
                
                {(!module.lessons || module.lessons.length === 0) && (
                  <Text style={styles.emptyText}>No lessons added yet</Text>
                )}
              </View>
            </View>
          ))}
          
          {modules.length === 0 && (
            <Text style={styles.emptyText}>No modules added yet</Text>
          )}
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          {error && <Text style={styles.errorText}>{error}</Text>}
          {successMessage && <Text style={styles.successText}>{successMessage}</Text>}
          <Button 
            mode="contained" 
            onPress={handleSaveCourse}
            loading={saving}
            disabled={saving}
            style={[styles.saveButton,{ backgroundColor:Colors.PRIMARY}]}
          >
            Save Course
          </Button>
        </View>
      </ScrollView>

      {/* Resource Manager Modal */}
      {selectedModuleId && resourceManagerVisible && (
        <ModuleResourceManager
          courseId={course?.id || ''}
          moduleId={selectedModuleId}
          resources={modules.find(m => m.id === selectedModuleId)?.resources || []}
          onResourcesChange={handleResourcesChange}
          // visible={resourceManagerVisible}
          // onDismiss={() => setResourceManagerVisible(false)}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: 4,
    color: '#3b82f6',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.PRIMARY,
    marginLeft: 4,
    fontSize: 16,
  },
  moduleCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
  },
  moduleDescription: {
    minHeight: 60,
  },
  resourcesContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  addResourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addResourceText: {
    color: Colors.PRIMARY,
    marginLeft: 4,
    fontSize: 14,
  },
  resourceList: {
    marginTop: 8,
  },
  resourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resourceName: {
    fontSize: 14,
    color: '#1f2937',
  },
  resourceType: {
    fontSize: 12,
    color: '#6b7280',
  },
  lessonsContainer: {
    marginTop: 16,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lessonSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addLessonButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addLessonText: {
    color: Colors.PRIMARY,
    marginLeft: 4,
  },
  lessonCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
  },
  lessonCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lessonTitle: {
    flex: 1,
    fontSize: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
  },
  lessonContent: {
    minHeight: 60,
  },
  lessonResources: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#6b7280',
    textAlign: 'center',
    padding: 16,
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  saveButton: {
    padding: 8,
  },
  errorText: {
    color: '#dc2626',
    marginBottom: 8,
  },
  successText: {
    color: '#16a34a',
    marginBottom: 8,
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
  statusContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  statusOptions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 8,
  },
  statusOptionSelected: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  statusText: {
    fontSize: 16,
    color: '#4b5563',
  },
  statusTextSelected: {
    color: '#ffffff',
  },
  pricingContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceInputContainer: {
    marginTop: 8,
  },
  currencyContainer: {
    marginBottom: 16,
  },
  priceContainer: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
});