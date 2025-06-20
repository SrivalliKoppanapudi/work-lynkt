import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { FileText, Play, ExternalLink, Upload, Trash2 } from 'lucide-react-native';
import { Resource } from '../../types/courses';
import { uploadResource, getResourcePublicUrl } from '../../utils/resourceUtils';
import { router } from 'expo-router';
import Colors from '../../constant/Colors';
import ResourceViewer from './ResourceViewer';
import { WebView } from 'react-native-webview';
import { Video } from 'expo-av';
import { supabase } from '../../lib/Superbase';

interface ModuleResourceManagerProps {
  courseId: string;
  moduleId: string;
  resources: Resource[];
  onResourcesChange: (resources: Resource[]) => void;
}

const ModuleResourceManager: React.FC<ModuleResourceManagerProps> = ({
  courseId,
  moduleId,
  resources: initialResources,
  onResourcesChange
}) => {
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [resourceViewerVisible, setResourceViewerVisible] = useState(false);
  
  // Fetch resources from the course_resources table
  
  useEffect(() => {
    fetchResources();
  }, [courseId, moduleId]);
  
  const fetchResources = async () => {
    try {
      setLoading(true);
      console.log('Fetching resources for module:', moduleId);
      
      // If courseId is a temporary ID, just use the initial resources
      if (courseId.startsWith('temp_')) {
        console.log('Using initial resources for temporary course');
        setResources(initialResources);
        onResourcesChange(initialResources);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('course_resources')
        .select('*')
        .eq('course_id', courseId)
        .eq('module_id', moduleId)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('Error fetching resources:', error);
        Alert.alert('Error', 'Failed to fetch resources');
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
        onResourcesChange(formattedResources);
      } else {
        // If no resources found in database but we have initial resources,
        // use those instead (they might be temporary)
        if (initialResources && initialResources.length > 0) {
          console.log('Using initial resources as no database resources found');
          setResources(initialResources);
          onResourcesChange(initialResources);
        } else {
          setResources([]);
          onResourcesChange([]);
        }
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      Alert.alert('Error', 'Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddResource = async () => {
    try {
      setLoading(true);
      
      // Use our utility to upload the resource
      const newResource = await uploadResource(courseId, moduleId);
      
      if (newResource) {
        // Add the resource to the list
        const updatedResources = [...resources, newResource];
        setResources(updatedResources);
        onResourcesChange(updatedResources);
        Alert.alert('Success', 'Resource uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading resource:', error);
      Alert.alert('Error', 'Failed to upload resource');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteResource = async (resourceId: string) => {
    Alert.alert(
      'Delete Resource',
      'Are you sure you want to delete this resource?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Delete from the database
              const { error } = await supabase
                .from('course_resources')
                .delete()
                .eq('id', resourceId);
                
              if (error) {
                console.error('Error deleting resource:', error);
                Alert.alert('Error', 'Failed to delete resource');
                return;
              }
              
              // Update the local state
              const updatedResources = resources.filter(r => r.id !== resourceId);
              setResources(updatedResources);
              onResourcesChange(updatedResources);
              
              Alert.alert('Success', 'Resource deleted successfully');
            } catch (error) {
              console.error('Error deleting resource:', error);
              Alert.alert('Error', 'Failed to delete resource');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  const handleResourceSelect = (resource: Resource) => {
    if (resource.type === 'video') {
      // For videos, navigate to the VideoScreen
      router.push({
        pathname: "/(screens)/VideoScreen",
        params: { 
          videoUrl: resource.url,
          videoTitle: resource.title,
          courseId: courseId,
          resourceId: resource.resource_id
        }
      });
    } else {
      // For PDFs and other resources, use the ResourceViewer
      setSelectedResource(resource);
      setResourceViewerVisible(true);
    }
  };
  
  const renderResourcePreview = (resource: Resource) => {
    // Get the public URL for the resource
    const publicUrl = resource.url.includes('example.com') && resource.resource_id
      ? getResourcePublicUrl(resource.resource_id)
      : resource.url;
      
    if (resource.type === 'pdf') {
      return (
        <View style={styles.previewContainer}>
          <FileText size={40} color="#ef4444" />
          <Text style={styles.previewText}>PDF Document</Text>
        </View>
      );
    } else if (resource.type === 'video') {
      return (
        <View style={styles.previewContainer}>
          <Play size={40} color="#3b82f6" />
          <Text style={styles.previewText}>Video</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.previewContainer}>
          <ExternalLink size={40} color="#10b981" />
          <Text style={styles.previewText}>Link</Text>
        </View>
      );
    }
  };
  
  const renderResourceItem = ({ item }: { item: Resource }) => {
    return (
      <View style={styles.resourceItem}>
        <TouchableOpacity 
          style={styles.resourceContent}
          onPress={() => handleResourceSelect(item)}
        >
          {renderResourcePreview(item)}
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>{item.title}</Text>
            <Text style={styles.resourceType}>{item.type.toUpperCase()}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteResource(item.id)}
        >
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Module Resources</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={handleAddResource}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Upload size={16} color="#fff" />
              <Text style={styles.addButtonText}>Add Resource</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {resources.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No resources added yet</Text>
          <Text style={styles.emptySubtext}>Tap 'Add Resource' to upload a PDF or video file</Text>
        </View>
      ) : (
        <FlatList
          data={resources}
          renderItem={renderResourceItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.resourcesList}
        />
      )}
      
      {/* Resource Viewer */}
      {selectedResource && (
        <ResourceViewer
          resourceUrl={selectedResource.url}
          resourceType={selectedResource.type}
          resourceTitle={selectedResource.title}
          resourceId={selectedResource.resource_id}
          isVisible={resourceViewerVisible}
          onClose={() => setResourceViewerVisible(false)}
          courseId={courseId}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  resourcesList: {
    padding: 16,
  },
  resourceItem: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resourceContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
  },
  previewContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  previewText: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  resourceInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  resourceType: {
    fontSize: 12,
    color: '#6b7280',
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fee2e2',
  },
});

export default ModuleResourceManager; 