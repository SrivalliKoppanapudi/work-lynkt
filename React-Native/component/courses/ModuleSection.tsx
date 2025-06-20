import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  TextInput, 
  Alert, 
  KeyboardAvoidingView, 
  TouchableWithoutFeedback, 
  Keyboard, 
  Platform, 
  Modal, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit2, 
  Link, 
  FileText, 
  MessageSquare, 
  Upload, 
  X, 
  Paperclip, 
  Play 
} from 'lucide-react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Module as CourseModule, Lesson, Resource as ResourceType } from '../../types/courses';
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import ResourceViewer from './ResourceViewer';
import { uploadResource } from '../../utils/resourceUtils';
import Colors from '../../constant/Colors';

interface ModuleSectionProps {
  modules: CourseModule[];
  setModules: React.Dispatch<React.SetStateAction<CourseModule[]>>;
  handleAddModule: () => void;
  onAddCourseResource?: (resource: ResourceType) => void;
  course?: { id?: string; resources?: ResourceType[] };
}

interface DiscussionComment {
  id: number;
  text: string;
  author: string;
  timestamp: Date;
  replies?: DiscussionComment[];
}

// Using ResourceType imported from types/courses.ts instead of local interface

const ModuleSection = forwardRef(({ modules, setModules, handleAddModule, onAddCourseResource, course }: ModuleSectionProps, ref) => {
  // Module and Lesson states
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  
  // Resource upload states
  const [resourceModalVisible, setResourceModalVisible] = useState(false);
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
  const [isModuleResource, setIsModuleResource] = useState(false);
  const [isCourseResource, setIsCourseResource] = useState(false);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceType, setResourceType] = useState<'pdf' | 'video' | 'link' | 'presentation'>('link');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Discussion states
  const [discussionModalVisible, setDiscussionModalVisible] = useState(false);
  const [discussionComment, setDiscussionComment] = useState('');
  const [discussionComments, setDiscussionComments] = useState<Record<string, DiscussionComment[]>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  // Resource viewer states
  const [selectedResource, setSelectedResource] = useState<ResourceType | null>(null);
  const [resourceViewerVisible, setResourceViewerVisible] = useState(false);

  // Helper function to get MIME type
  const getMimeType = (uri: string) => {
    const extension = uri.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'application/pdf';
      case 'mp4': return 'video/mp4';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      default: return 'application/octet-stream';
    }
  };

  const pickFile = async (type: 'pdf' | 'video') => {
    try {
      if (Platform.OS === 'ios') {
        // For iOS, show an action sheet to choose between documents and photos
        Alert.alert(
          'Select File',
          'Choose a file source',
          [
            {
              text: 'Documents',
              onPress: async () => {
                const result = await DocumentPicker.getDocumentAsync({
                  type: type === 'pdf' 
                    ? ['application/pdf'] 
                    : ['video/*'],
                  copyToCacheDirectory: true,
                });

                if (!result.canceled) {
                  setSelectedFile(result);
                  if (result.assets && result.assets.length > 0) {
                    const fileUri = result.assets[0].uri;
                    setResourceUrl(fileUri);
                    const fileName = fileUri.split('/').pop() || fileUri.split('\\').pop();
                    setResourceTitle(fileName || 'Untitled ' + type.charAt(0).toUpperCase() + type.slice(1));
                  }
                  setResourceType(type);
                }
              }
            },
            {
              text: 'Photos',
              onPress: async () => {
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: type === 'pdf' 
                    ? ImagePicker.MediaTypeOptions.Images 
                    : ImagePicker.MediaTypeOptions.Videos,
                  allowsEditing: true,
                  quality: 1,
                });

                if (!result.canceled) {
                  const asset = result.assets[0];
                  setSelectedFile({
                    assets: [{
                      uri: asset.uri,
                      name: asset.uri.split('/').pop() || 'untitled',
                      mimeType: type === 'pdf' ? 'image/jpeg' : 'video/mp4'
                    }]
                  });
                  setResourceUrl(asset.uri);
                  const fileName = asset.uri.split('/').pop() || 'untitled';
                  setResourceTitle(fileName);
                  setResourceType(type);
                }
              }
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      } else {
        // For Android, use document picker directly
        const result = await DocumentPicker.getDocumentAsync({
          type: type === 'pdf' 
            ? ['application/pdf'] 
            : ['video/*'],
          copyToCacheDirectory: true,
        });

        if (!result.canceled) {
          setSelectedFile(result);
          if (result.assets && result.assets.length > 0) {
            const fileUri = result.assets[0].uri;
            setResourceUrl(fileUri);
            const fileName = fileUri.split('/').pop() || fileUri.split('\\').pop();
            setResourceTitle(fileName || 'Untitled ' + type.charAt(0).toUpperCase() + type.slice(1));
          }
          setResourceType(type);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick file');
      console.error('File picker error:', err);
    }
  };

  // Resource modal handlers
  const openResourceModal = (moduleId: string, lessonId: number | null = null) => {
    setCurrentModuleId(moduleId);
    setCurrentLessonId(lessonId);
    setIsModuleResource(lessonId === null);
    setIsCourseResource(false);
    setResourceModalVisible(true);
    setResourceTitle('');
    setResourceUrl('');
    setResourceType('link');
    setSelectedFile(null);
    setUploading(false);
    setUploadProgress(0);
  };

  const openCourseResourceModal = () => {
    setCurrentModuleId(null);
    setCurrentLessonId(null);
    setIsModuleResource(false);
    setIsCourseResource(true);
    setResourceModalVisible(true);
    setResourceTitle('');
    setResourceUrl('');
    setResourceType('link');
    setSelectedFile(null);
    setUploading(false);
    setUploadProgress(0);
  };

  const closeResourceModal = () => {
    setResourceModalVisible(false);
    setCurrentLessonId(null);
    setCurrentModuleId(null);
    setIsModuleResource(false);
    setIsCourseResource(false);
  };

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
 


  // Simulate file upload (replace with actual API call)
  const uploadFile = async () => {
    return new Promise<{url: string, id: string}>((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          // Use the actual file URI instead of a hardcoded URL
          resolve({
            url: selectedFile?.assets?.[0]?.uri || '',
            id: Date.now().toString()
          });
        }
      }, 300);
    });
  };

  const handleAddResource = async () => {
    if (!resourceTitle.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      let resourceUrl = '';
      let resourceId = '';

      if (selectedFile) {
        // Use the uploadResource function to handle file upload
        // Use course id if available, otherwise use a temporary id
        const courseId = course?.id || 'temp_course';
        const moduleId = currentModuleId || 'course_level';
        
        // Pass the selected file to uploadResource
        const newResource = await uploadResource(courseId, moduleId, selectedFile);
        if (!newResource) {
          throw new Error('Failed to upload resource');
        }
        
        resourceUrl = newResource.url;
        resourceId = newResource.resource_id;
      } else if (resourceUrl.trim()) {
        if (!validateUrl(resourceUrl)) {
          Alert.alert('Error', 'Please enter a valid URL');
          return;
        }
      } else {
        Alert.alert('Error', 'Please either upload a file or enter a URL');
        return;
      }

      const newResource: ResourceType = {
        id: Date.now().toString(),
        title: resourceTitle,
        type: resourceType,
        url: resourceUrl,
        resource_id: resourceId || undefined
      };

      if (isCourseResource && onAddCourseResource) {
        onAddCourseResource(newResource);
      } else if (currentModuleId) {
        setModules(prevModules => 
          prevModules.map(module => {
            if (module.id === currentModuleId) {
              const updatedResources = [...(module.resources || []), newResource];
              return { ...module, resources: updatedResources };
            }
            return module;
          })
        );
      }

      closeResourceModal();
      setUploading(false);
      setUploadProgress(0);
    } catch (error) {
      console.error('Error adding resource:', error);
      Alert.alert('Error', 'Failed to add resource. Please try again.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteResource = (moduleId: string, lessonId: number | null, resourceId: string) => {
    Alert.alert(
      "Delete Resource",
      "Are you sure you want to delete this resource?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            if (lessonId === null) {
              // Delete from module resources
              setModules(prevModules => 
                prevModules.map(mod => 
                  mod.id === moduleId 
                    ? { 
                        ...mod, 
                        resources: mod.resources ? mod.resources.filter(res => res.id !== resourceId) : []
                      }
                    : mod
                )
              );
            } else {
              // Delete from lesson resources
              setModules(prevModules => 
                prevModules.map(mod => 
                  mod.id === moduleId 
                    ? { 
                        ...mod, 
                        lessons: mod.lessons.map(les => 
                          les.id === lessonId 
                            ? { 
                                ...les, 
                                resources: les.resources.filter(res => res.id !== resourceId) 
                              }
                            : les
                        )
                      }
                    : mod
                )
              );
            }
          } 
        }
      ]
    );
  };

  // Discussion handlers
  const openDiscussionModal = (moduleId: string, lessonId: number) => {
    const discussionKey = `${moduleId}-${lessonId}`;
    if (!discussionComments[discussionKey]) {
      setDiscussionComments(prev => ({
        ...prev,
        [discussionKey]: []
      }));
    }
    setCurrentModuleId(moduleId);
    setCurrentLessonId(lessonId);
    setDiscussionModalVisible(true);
  };

  const closeDiscussionModal = () => {
    setDiscussionModalVisible(false);
    setCurrentLessonId(null);
    setCurrentModuleId(null);
    setDiscussionComment('');
    setReplyingTo(null);
  };

  const handleAddComment = () => {
    if (!discussionComment.trim() || !currentModuleId || !currentLessonId) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    const discussionKey = `${currentModuleId}-${currentLessonId}`;
    const newComment: DiscussionComment = {
      id: Date.now(),
      text: discussionComment.trim(),
      author: 'Current User',
      timestamp: new Date(),
      replies: []
    };

    if (replyingTo) {
      setDiscussionComments(prev => ({
        ...prev,
        [discussionKey]: prev[discussionKey].map(comment => 
          comment.id === replyingTo
            ? { 
                ...comment, 
                replies: [...(comment.replies || []), {
                  id: Date.now(),
                  text: discussionComment.trim(),
                  author: 'Current User',
                  timestamp: new Date()
                }]
              }
            : comment
        )
      }));
      setReplyingTo(null);
    } else {
      setDiscussionComments(prev => ({
        ...prev,
        [discussionKey]: [...(prev[discussionKey] || []), newComment]
      }));
    }

    setDiscussionComment('');
  };

  // Module and Lesson handlers
  const handleAddLesson = (moduleId: string) => {
    const newLesson: Lesson = {
      id: Date.now(),
      title: `New Lesson`,
      content: '',
      type: 'text',
      duration: 0,
      order: 0,
      resources: [],
      discussionEnabled: true
    };

    setModules(prevModules => 
      prevModules.map(mod => 
        mod.id === moduleId 
          ? { ...mod, lessons: [...mod.lessons, newLesson] }
          : mod
      )
    );

    setEditingLessonId(newLesson.id);
    setLessonTitle(newLesson.title);
  };

  const handleDeleteModule = (moduleId: string) => {
    Alert.alert(
      "Delete Module",
      "Are you sure you want to delete this module?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            setModules(prevModules => prevModules.filter(mod => mod.id !== moduleId));
          }
        }
      ]
    );
  };

  const handleDeleteLesson = (moduleId: string, lessonId: number) => {
    Alert.alert(
      "Delete Lesson",
      "Are you sure you want to delete this lesson?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            setModules(prevModules => 
              prevModules.map(mod => 
                mod.id === moduleId 
                  ? { ...mod, lessons: mod.lessons.filter(lesson => lesson.id !== lessonId) }
                  : mod
              )
            );
          }
        }
      ]
    );
  };

  const handleEditModuleTitle = (moduleId: string) => {
    const module = modules.find(mod => mod.id === moduleId);
    if (module) {
      setEditingModuleId(moduleId);
      setModuleTitle(module.title);
    }
  };

  const saveModuleTitle = (moduleId: string) => {
    if (moduleTitle.trim()) {
      setModules(prevModules => 
        prevModules.map(mod => 
          mod.id === moduleId 
            ? { ...mod, title: moduleTitle.trim() }
            : mod
        )
      );
    }
    setEditingModuleId(null);
  };

  const handleEditLessonTitle = (moduleId: string, lessonId: number) => {
    const module = modules.find(mod => mod.id === moduleId);
    const lesson = module?.lessons.find(les => les.id === lessonId);
    if (lesson) {
      setEditingLessonId(lessonId);
      setLessonTitle(lesson.title);
    }
  };

  const saveLessonTitle = (moduleId: string, lessonId: number) => {
    if (lessonTitle.trim()) {
      setModules(prevModules => 
        prevModules.map(mod => 
          mod.id === moduleId 
            ? { 
                ...mod, 
                lessons: mod.lessons.map(les => 
                  les.id === lessonId 
                    ? { ...les, title: lessonTitle.trim() }
                    : les
                )
              }
            : mod
        )
      );
    }
    setEditingLessonId(null);
  };

  // Handle resource preview
  const handlePreviewResource = (resource: ResourceType) => {
    // Ensure the resource has a valid URL before trying to view it
    if (!resource.url) {
      Alert.alert(
        "Resource Error", 
        "This resource does not have a valid URL.", 
        [{ text: "OK" }]
      );
      return;
    }

    // Process URL if needed
    let processedUrl = resource.url;
    
    // For development testing, if it's a file:// URL, we'll need special handling
    if (processedUrl.startsWith('file://') && Platform.OS !== 'web') {
      // console.log('File URL detected, opening with special handler:', processedUrl);
    }
    
    // console.log(`Opening resource: ${resource.title} (${resource.type}) - URL: ${processedUrl}`);
    
    setSelectedResource({
      ...resource,
      url: processedUrl
    });
    setResourceViewerVisible(true);
  };

  // Render functions
  const renderResource = (moduleId: string, lessonId: number | null, resource: ResourceType) => {
    const getResourceIcon = () => {
      switch (resource.type) {
        case 'pdf': return <FileText size={14} color="#ef4444" />;
        case 'video': return <Play size={14} color="#3b82f6" />;
        case 'link': return <Link size={14} color="#10b981" />;
        default: return <Paperclip size={14} color="#6b7280" />;
      }
    };

    return (
      <View key={resource.id} style={styles.resourceItem}>
        <TouchableOpacity 
          style={styles.resourceContent}
          onPress={() => handlePreviewResource(resource)}
        >
          {getResourceIcon()}
          <Text style={styles.resourceTitle} numberOfLines={1} ellipsizeMode="tail">
            {resource.title}
          </Text>
        </TouchableOpacity>
        <View style={styles.resourceActions}>
          <TouchableOpacity 
            style={[styles.resourceButton, {
              backgroundColor: resource.type === 'pdf' ? '#ef4444' : 
                             resource.type === 'video' ? '#3b82f6' : '#10b981'
            }]}
            onPress={() => handlePreviewResource(resource)}
          >
            <Text style={styles.resourceButtonText}>
              {resource.type === 'pdf' ? 'View' : 
               resource.type === 'video' ? 'Play' : 'Open'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => handleDeleteResource(moduleId, lessonId, resource.id)}
          >
            <Trash2 size={14} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderLesson = (moduleId: string, lesson: Lesson) => {
    return (
      <View key={lesson.id} style={styles.lessonItem}>
        {editingLessonId === lesson.id ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={lessonTitle}
              onChangeText={setLessonTitle}
              autoFocus
              onSubmitEditing={() => saveLessonTitle(moduleId, lesson.id)}
              blurOnSubmit={true}
            />
            <Pressable 
              style={styles.saveButton}
              onPress={() => {
                Keyboard.dismiss();
                saveLessonTitle(moduleId, lesson.id);
              }}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <View style={styles.lessonContent}>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <View style={styles.lessonActions}>
                <Pressable 
                  style={styles.iconButton}
                  onPress={() => openResourceModal(moduleId, lesson.id)}
                >
                  <Upload size={16} color="#3b82f6" />
                </Pressable>
                <Pressable 
                  style={styles.iconButton}
                  onPress={() => openDiscussionModal(moduleId, lesson.id)}
                >
                  <MessageSquare size={16} color="#3b82f6" />
                </Pressable>
                <Pressable 
                  style={styles.iconButton}
                  onPress={() => handleEditLessonTitle(moduleId, lesson.id)}
                >
                  <Edit2 size={16} color="#3b82f6" />
                </Pressable>
                <Pressable 
                  style={styles.iconButton}
                  onPress={() => handleDeleteLesson(moduleId, lesson.id)}
                >
                  <Trash2 size={16} color="#ef4444" />
                </Pressable>
              </View>
            </View>
            
            {lesson.resources && lesson.resources.length > 0 && (
              <View style={styles.resourcesList}>
                <Text style={styles.resourcesHeader}>Resources:</Text>
                {lesson.resources.map(resource => 
                  renderResource(moduleId, lesson.id, resource)
                )}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderModuleResources = (moduleId: string, resources: ResourceType[] = []) => {
    if (!resources || resources.length === 0) {
      return null;
    }

    return (
      <View style={styles.resourcesSection}>
        <Text style={styles.resourcesSectionTitle}>Module Resources</Text>
        {resources.map(resource => renderResource(moduleId, null, resource))}
      </View>
    );
  };

  const renderModule = ({ item: module, drag, isActive }: RenderItemParams<CourseModule>) => {
    return (
      <View style={[styles.moduleContainer, isActive && styles.draggingModule]}>
        <View style={styles.moduleHeader}>
          <TouchableOpacity style={styles.dragHandle} onPressIn={drag}>
            <BookOpen size={20} color="#3b82f6" />
          </TouchableOpacity>
          
          {editingModuleId === module.id ? (
            <TextInput
              style={styles.moduleEditInput}
              value={moduleTitle}
              onChangeText={setModuleTitle}
              placeholder="Module title"
              autoFocus
              onBlur={() => saveModuleTitle(module.id)}
              returnKeyType="done"
              onSubmitEditing={() => saveModuleTitle(module.id)}
            />
          ) : (
            <Text style={styles.moduleTitle}>{module.title}</Text>
          )}
          
          <View style={styles.moduleActions}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => handleEditModuleTitle(module.id)}
            >
              <Edit2 size={16} color="#3b82f6" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => handleDeleteModule(module.id)}
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
        
        {renderModuleResources(module.id, module.resources)}

        <View style={styles.moduleActionButtons}>
          <TouchableOpacity 
            style={styles.addResourceButton}
            onPress={() => openResourceModal(module.id)}
          >
            <Upload size={14} color="#3b82f6" />
            <Text style={styles.addResourceButtonText}>Add Module Resource</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.addLessonButton}
            onPress={() => handleAddLesson(module.id)}
          >
            <Plus size={14} color="#3b82f6" />
            <Text style={styles.addLessonButtonText}>Add Lesson</Text>
          </TouchableOpacity>
        </View>
        
        {module.lessons.map(lesson => renderLesson(module.id, lesson))}
      </View>
    );
  };

  const renderResourceModal = () => (
    <Modal
      visible={resourceModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeResourceModal}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isCourseResource ? 'Add Course Resource' : 
                 isModuleResource ? 'Add Module Resource' : 'Add Lesson Resource'}
              </Text>
              <TouchableOpacity onPress={closeResourceModal}>
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title</Text>
              <TextInput
                style={styles.formInput}
                value={resourceTitle}
                onChangeText={setResourceTitle}
                placeholder="Resource title"
                editable={!uploading}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Type</Text>
              <View style={styles.resourceTypeContainer}>
                <Pressable 
                  style={[styles.resourceTypeButton, resourceType === 'pdf' && styles.resourceTypeButtonActive]}
                  onPress={() => pickFile('pdf')}
                  disabled={uploading}
                >
                  <FileText size={16} color={resourceType === 'pdf' ? "#ffffff" : "#3b82f6"} />
                  <Text style={[styles.resourceTypeText, resourceType === 'pdf' && styles.resourceTypeTextActive]}>PDF</Text>
                </Pressable>
                <Pressable 
                  style={[styles.resourceTypeButton, resourceType === 'video' && styles.resourceTypeButtonActive]}
                  onPress={() => pickFile('video')}
                  disabled={uploading}
                >
                  <BookOpen size={16} color={resourceType === 'video' ? "#ffffff" : "#3b82f6"} />
                  <Text style={[styles.resourceTypeText, resourceType === 'video' && styles.resourceTypeTextActive]}>Video</Text>
                </Pressable>
                <Pressable 
                  style={[styles.resourceTypeButton, resourceType === 'link' && styles.resourceTypeButtonActive]}
                  onPress={() => setResourceType('link')}
                  disabled={uploading}
                >
                  <Link size={16} color={resourceType === 'link' ? "#ffffff" : "#3b82f6"} />
                  <Text style={[styles.resourceTypeText, resourceType === 'link' && styles.resourceTypeTextActive]}>Link</Text>
                </Pressable>
              </View>
            </View>
            
            {resourceType === 'link' ? (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>URL</Text>
                <TextInput
                  style={styles.formInput}
                  value={resourceUrl}
                  onChangeText={setResourceUrl}
                  placeholder="https://example.com"
                  editable={!uploading}
                  keyboardType="url"
                />
              </View>
            ) : (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Selected File</Text>
                {selectedFile ? (
                  <View style={styles.selectedFileContainer}>
                    <Text style={styles.selectedFileName} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <Pressable 
                      onPress={() => setSelectedFile(null)}
                      disabled={uploading}
                    >
                      <X size={16} color="#ef4444" />
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.noFileSelected}>No file selected</Text>
                )}
              </View>
            )}
            
            {uploading && (
              <View style={styles.uploadProgressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${uploadProgress}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{uploadProgress}%</Text>
              </View>
            )}
            
            <Pressable 
              style={[
                styles.submitButton,
                uploading && styles.submitButtonDisabled
              ]} 
              onPress={handleAddResource}
              disabled={uploading}
            >
              <Text style={styles.submitButtonText}>
                {uploading ? 'Uploading...' : 'Add Resource'}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderDiscussionModal = () => (
    <Modal
      visible={discussionModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={closeDiscussionModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Discussion</Text>
            <Pressable onPress={closeDiscussionModal} style={styles.closeButton}>
              <X size={20} color="#4b5563" />
            </Pressable>
          </View>
          
          <ScrollView style={styles.discussionList}>
            {currentModuleId && currentLessonId && discussionComments[`${currentModuleId}-${currentLessonId}`]?.map(comment => (
              <View key={comment.id} style={styles.commentContainer}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{comment.author}</Text>
                  <Text style={styles.commentTime}>
                    {new Date(comment.timestamp).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>
                
                <Pressable 
                  style={styles.replyButton}
                  onPress={() => setReplyingTo(comment.id)}
                >
                  <Text style={styles.replyButtonText}>Reply</Text>
                </Pressable>
                
                {comment.replies && comment.replies.length > 0 && (
                  <View style={styles.repliesList}>
                    {comment.replies.map(reply => (
                      <View key={reply.id} style={styles.replyContainer}>
                        <View style={styles.commentHeader}>
                          <Text style={styles.commentAuthor}>{reply.author}</Text>
                          <Text style={styles.commentTime}>
                            {new Date(reply.timestamp).toLocaleString()}
                          </Text>
                        </View>
                        <Text style={styles.commentText}>{reply.text}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.commentInputContainer}>
            {replyingTo && (
              <View style={styles.replyingToContainer}>
                <Text style={styles.replyingToText}>Replying to comment</Text>
                <Pressable onPress={() => setReplyingTo(null)}>
                  <X size={16} color="#4b5563" />
                </Pressable>
              </View>
            )}
            <TextInput
              style={styles.commentInput}
              value={discussionComment}
              onChangeText={setDiscussionComment}
              placeholder="Add a comment..."
              multiline
            />
            <Pressable style={styles.submitButton} onPress={handleAddComment}>
              <Text style={styles.submitButtonText}>Post</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Expose functions through ref
  useImperativeHandle(ref, () => ({
    openCourseResourceModal
  }));

  return (
    <KeyboardAvoidingView 
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={{ flex: 1 }}
    keyboardVerticalOffset={100}
  >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <BookOpen size={20} color="#4b5563" />
          <Text style={styles.headerText}>Course Modules</Text>
          <Pressable
          onPress={handleAddModule}
          style={styles.addModuleButton}
        >
          <Plus size={20} color="#ffffff" />
          <Text style={styles.addModuleButtonText}>Add Module</Text>
        </Pressable>
        </View>
  

        
        {/* Add constrained height container for iOS */}
        <View style={styles.modulesContainer}>
          <DraggableFlatList
            data={modules}
            onDragEnd={({ data }) => setModules(data)}
            keyExtractor={(item) => item.id}
            renderItem={renderModule}
            contentContainerStyle={styles.modulesList}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
    

      {renderResourceModal()}
      {renderDiscussionModal()}

      {/* Resource Viewer */}
      {selectedResource && (
        <ResourceViewer
          resourceUrl={selectedResource.url}
          resourceType={selectedResource.type}
          isVisible={resourceViewerVisible}
          onClose={() => setResourceViewerVisible(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  moduleContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    paddingRight:15,
    flex: 1,
  },
  addModuleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginVertical: 6,
    alignSelf: 'flex-start',
  },
  addModuleButtonText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 4,  
    fontWeight: '500',
  },
  moduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  moduleCardActive: {
    transform: [{ scale: 1.02 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modulesList: {
    paddingBottom: 16,
  },
  dragHandle: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
  },
  moduleActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  modulesContainer: {
    flex: Platform.OS === 'ios' ? 0 : 1, // Fixed height for iOS, flexible for others
    maxHeight: Platform.OS === 'ios' ? 400 : undefined, // Constraint for iOS
    marginBottom: Platform.OS === 'ios' ? 20 : 0, // Space for other sections
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 4,
    marginLeft: 4,
  },
  addLessonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 4,
  },
  addLessonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  lessonsList: {
    marginTop: 8,
    marginLeft: 16,
  },
  lessonItem: {
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  lessonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonTitle: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  lessonActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  editContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    padding: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  resourcesList: {
    marginTop: 8,
    paddingLeft: 8,
  },
  resourcesHeader: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 4,
  },
  resourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resourceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.7,
    paddingRight: 8,
  },
  resourceTitle: {
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 8,
    flexShrink: 1,
  },
  resourceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 0.3,
  },
  resourceButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  resourceButtonText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '500',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
  },
  resourceTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  resourceTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 6,
    padding: 8,
    flex: 1,
    justifyContent: 'center',
  },
  resourceTypeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  resourceTypeText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  resourceTypeTextActive: {
    color: '#ffffff',
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  selectedFileName: {
    flex: 1,
    marginRight: 8,
    color: '#4b5563',
  },
  noFileSelected: {
    color: '#9ca3af',
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
  uploadProgressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  progressText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  discussionList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  commentContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    fontWeight: '600',
    color: '#1f2937',
  },
  commentTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  commentText: {
    color: '#4b5563',
    marginBottom: 8,
  },
  replyButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  replyButtonText: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  repliesList: {
    marginLeft: 16,
  },
  replyContainer: {
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  commentInputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: '#4b5563',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  resourcesSection: {
    marginVertical: 8,
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  resourcesSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
  },
  moduleActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  addResourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 70,
    justifyContent: 'center',
    marginRight: 8,
  },
  addResourceButtonText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
    marginLeft: 4,
  },
  moduleEditInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
  },
  draggingModule: {
    transform: [{ scale: 1.02 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addLessonButtonText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default ModuleSection;