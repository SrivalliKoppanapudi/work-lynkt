// components/PreviewModal.tsx
import React, { useState } from 'react';
import { View, Text, FlatList, Modal, SafeAreaView, StyleSheet, Pressable, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Eye, ExternalLink, FileText, Play, Download } from 'lucide-react-native';
import { Module as CourseModule, Resource as ResourceType } from '../../types/courses';
import * as WebBrowser from 'expo-web-browser';
import ResourceViewer from './ResourceViewer';
import Colors from '../../constant/Colors';

interface PreviewModalProps {
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  previewData: any[];
}

const PreviewModal = ({ showPreview, setShowPreview, previewData }: PreviewModalProps) => {
  const [selectedResource, setSelectedResource] = useState<ResourceType | null>(null);
  const [resourceViewerVisible, setResourceViewerVisible] = useState(false);

  // Validate resource URL before opening
  const validateResourceURL = (resource: ResourceType): boolean => {
    // If the resource has a resource_id, it's valid (will be fetched from Supabase)
    if (resource.resource_id) {
      return true;
    }
    
    // Check if the resource has a valid URL
    if (!resource.url) {
      Alert.alert(
        "Resource Error", 
        "This resource does not have a valid URL.", 
        [{ text: "OK" }]
      );
      return false;
    }
    
    // Check for file type and resource type mismatch
    const fileExtension = resource.url.split('.').pop()?.toLowerCase();
    if (fileExtension) {
      const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
      const pdfExtensions = ['pdf'];
      
      // For example.com URLs, we'll be more lenient with mismatches
      if (resource.url.includes('example.com')) {
        // For example URLs, we'll just warn but still allow opening
        if (resource.type === 'video' && pdfExtensions.includes(fileExtension)) {
          console.log(`Warning: Resource ${resource.title} is marked as video but has PDF extension`);
          // We'll continue and let ResourceViewer handle it
        } else if (resource.type === 'pdf' && videoExtensions.includes(fileExtension)) {
          console.log(`Warning: Resource ${resource.title} is marked as PDF but has video extension`);
          // We'll continue and let ResourceViewer handle it
        }
      } else {
        // For non-example URLs, show error on mismatch
        if (resource.type === 'video' && pdfExtensions.includes(fileExtension)) {
          Alert.alert(
            'Resource Type Mismatch',
            `Error: The resource titled "${resource.title}" is marked as a video but links to a PDF file. Please contact the course creator to fix this.`,
            [{ text: 'OK' }]
          );
          return false;
        } else if (resource.type === 'pdf' && videoExtensions.includes(fileExtension)) {
          Alert.alert(
            'Resource Type Mismatch',
            `Error: The resource titled "${resource.title}" is marked as a PDF but links to a video file. Please contact the course creator to fix this.`,
            [{ text: 'OK' }]
          );
          return false;
        }
      }
    }
    
    // Check for example.com URLs without resource_id
    if (resource.url.includes('example.com') && !resource.resource_id) {
      Alert.alert(
        'Placeholder URL',
        'This resource uses a placeholder URL (example.com). This appears to be a demo resource that has not been properly set up.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  };

  const handleOpenResource = async (resource: ResourceType) => {
    try {
      // Check for resources with resource_id
      if (resource.resource_id) {
        console.log(`Resource has a storage ID: ${resource.resource_id}`);
        // This is a Supabase-stored resource, set the selectedResource with the resource_id
        setSelectedResource(resource);
        setResourceViewerVisible(true);
        return;
      }
      
      // For older resources without resource_id, validate URL
      if (!validateResourceURL(resource)) {
        return;
      }

      // Process URL if needed
      let processedUrl = resource.url;
      
      // For development testing, if it's a file:// URL, we'll need special handling
      if (processedUrl.startsWith('file://')) {
        console.log('File URL detected:', processedUrl);
        // File URLs are handled in the ResourceViewer component
      }
      
      // For YouTube links, process in ResourceViewer
      if (processedUrl.includes('youtube.com') || processedUrl.includes('youtu.be')) {
        console.log('YouTube URL detected:', processedUrl);
      }
      
      // For regular links, handle based on type
      if (resource.type === 'link') {
        if (Platform.OS === 'web') {
          window.open(processedUrl, '_blank');
          return;
        } else {
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
      
      console.log(`Opening resource: ${resource.title} (${resource.type}) - URL: ${processedUrl}`);
      
      setSelectedResource({
        ...resource,
        url: processedUrl
      });
      setResourceViewerVisible(true);
    } catch (error) {
      console.error('Error handling resource:', error);
      Alert.alert(
        'Error Opening Resource',
        'An error occurred while trying to open this resource. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderResourceItem = (resource: ResourceType) => {
    const getResourceIcon = () => {
      switch (resource.type) {
        case 'pdf': return <FileText size={20} color="#ef4444" />;
        case 'video': return <Play size={20} color="#3b82f6" />;
        case 'link': return <ExternalLink size={20} color="#10b981" />;
        default: return <Download size={20} color="#6b7280" />;
      }
    };

    return (
      <TouchableOpacity 
        key={resource.id} 
        style={styles.resourceItem}
        onPress={() => handleOpenResource(resource)}
      >
        <View style={styles.resourceInfo}>
          {getResourceIcon()}
          <Text style={styles.resourceTitle}>{resource.title}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.resourcePlayButton, {
            backgroundColor: resource.type === 'pdf' ? '#ef4444' : 
                           resource.type === 'video' ? '#3b82f6' : 
                           resource.type === 'link' ? '#10b981' : Colors.PRIMARY
          }]}
          onPress={() => handleOpenResource(resource)}
        >
          <Text style={styles.resourcePlayText}>
            {resource.type === 'pdf' ? 'View' : 
             resource.type === 'video' ? 'Play' : 
             'Open'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderPreviewItem = ({ item }: { item: any }) => {
    switch (item.type) {
      case 'title':
        return (
          <View style={styles.previewSection}>
            <Text style={styles.previewSectionTitle}>Title</Text>
            <Text style={styles.previewTitle}>{item.content}</Text>
          </View>
        );
      case 'description':
        return (
          <View style={styles.previewSection}>
            <Text style={styles.previewSectionTitle}>Description</Text>
            <Text style={styles.previewText}>{item.content}</Text>
          </View>
        );
      case 'categories':
        return (
          <View style={styles.previewSection}>
            <Text style={styles.previewSectionTitle}>Categories</Text>
            <View style={styles.categoriesContainer}>
              {item.content.map((category: string, index: number) => (
                <Text key={index} style={styles.categoryBadge}>{category}</Text>
              ))}
            </View>
          </View>
        );
      case 'prerequisites':
        return (
          <View style={styles.previewSection}>
            <Text style={styles.previewSectionTitle}>Prerequisites</Text>
            <Text style={styles.previewText}>{item.content}</Text>
          </View>
        );
      case 'objectives':
        return (
          <View style={styles.previewSection}>
            <Text style={styles.previewSectionTitle}>Learning Objectives</Text>
            {item.content.map((objective: string, index: number) => (
              <Text key={index} style={styles.objectiveItem}>• {objective}</Text>
            ))}
          </View>
        );
      case 'modules':
        return (
          <View style={styles.previewSection}>
            <Text style={styles.previewSectionTitle}>Modules</Text>
            {item.content.map((module: CourseModule, index: number) => (
              <View key={module.id} style={styles.moduleItem}>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                {module.description && <Text style={styles.moduleDescription}>{module.description}</Text>}
                
                {/* Module Resources Section - More prominent */}
                {module.resources && module.resources.length > 0 && (
                  <View style={styles.moduleResourcesContainer}>
                    <Text style={styles.moduleResourcesTitle}>Module Resources:</Text>
                    {module.resources.map((resource) => renderResourceItem(resource))}
                  </View>
                )}
                
                {module.lessons && module.lessons.length > 0 && (
                  <View style={styles.lessonsContainer}>
                    <Text style={styles.lessonsTitle}>Lessons:</Text>
                    {module.lessons.map((lesson, lessonIndex) => (
                      <View key={lessonIndex} style={styles.lessonWrapper}>
                        <Text style={styles.lessonItem}>• {lesson.title}</Text>
                        
                        {/* Lesson Resources Section */}
                        {lesson.resources && lesson.resources.length > 0 && (
                          <View style={styles.lessonResourcesContainer}>
                            <Text style={styles.lessonResourcesTitle}>Lesson Resources:</Text>
                            {lesson.resources.map((resource) => renderResourceItem(resource))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        );
      case 'resources':
        return (
          <View style={styles.previewSection}>
            <Text style={styles.previewSectionTitle}>Course Resources</Text>
            {item.content && item.content.length > 0 ? (
              item.content.map((resource: ResourceType) => renderResourceItem(resource))
            ) : (
              <Text style={styles.emptyText}>No course resources available</Text>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={showPreview}
      animationType="slide"
      onRequestClose={() => setShowPreview(false)}
    >
      <SafeAreaView style={styles.previewContainer}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewHeaderTitle}>Course Preview</Text>
          <Pressable
            onPress={() => setShowPreview(false)}
            style={styles.closePreviewButton}
          >
            <Text style={styles.closePreviewText}>Close</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.previewContent}>
          {previewData.map((item, index) => (
            <View key={index}>
              {renderPreviewItem({ item })}
            </View>
          ))}
        </ScrollView>
        
        {selectedResource && (
          <ResourceViewer
            resourceUrl={selectedResource.url}
            resourceType={selectedResource.type} 
            isVisible={resourceViewerVisible}
            onClose={() => setResourceViewerVisible(false)}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  previewHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closePreviewButton: {
    padding: 8,
  },
  closePreviewText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '500',
  },
  previewContent: {
    padding: 16,
  },
  previewSection: {
    marginBottom: 24,
  },
  previewSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  previewText: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 14,
    color: '#4b5563',
  },
  objectiveItem: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 8,
    paddingLeft: 8,
  },
  moduleItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  lessonsContainer: {
    marginTop: 8,
  },
  lessonsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 4,
  },
  lessonItem: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
    marginBottom: 4,
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
  moduleResourcesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#edf2f7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  moduleResourcesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 8,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.7,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
    flexShrink: 1,
  },
  resourceType: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  resourcePlayButton: {
    minWidth: 75,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourcePlayText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

export default PreviewModal;