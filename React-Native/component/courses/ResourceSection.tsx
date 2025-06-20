// components/ResourceSection.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { Upload } from 'lucide-react-native';
import { Resource as ResourceType } from '../../types/courses';
import * as DocumentPicker from 'expo-document-picker';

interface ResourceSectionProps {
  resources: ResourceType[];
  setResources: (resources: ResourceType[]) => void;
  handleUploadResource: (file: DocumentPicker.DocumentPickerResult) => Promise<void>;
}

const ResourceSection = ({ resources, setResources, handleUploadResource }: ResourceSectionProps) => {
  const selectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*', 'application/pdf'],
        copyToCacheDirectory: true, // Recommended for Expo
      });

      if (!result.canceled) {
        await handleUploadResource(result);
      } else {
        console.log('User cancelled file picker');
      }
    } catch (err) {
      console.error('Error picking file:', err);
    }
  };

  return (
    <View style={styles.inputGroup}>
      <View style={styles.inputHeader}>
        <Upload size={20} color="#4b5563" />
        <Text style={styles.label}>Course Resources</Text>
      </View>
      <Pressable
        onPress={selectFile}
        style={styles.uploadButton}
      >
        <Upload size={20} color="#ffffff" />
        <Text style={styles.uploadButtonText}>Upload Resource</Text>
      </Pressable>
      <FlatList
        data={resources}
        scrollEnabled={false}
        keyExtractor={(resource) => resource.id.toString()}
        renderItem={({ item: resource }) => (
          <View style={styles.resourceItem}>
            <Text style={styles.resourceName}>{resource.title}</Text>
            <Text style={styles.resourceType}>{resource.type}</Text>
          </View>
        )}
      />
    </View>
  );
};

// Keep your existing styles
  


 const styles = StyleSheet.create({
  inputGroup: {
    gap: 8,
    marginBottom: 24,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4b5563',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  resourceName: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  resourceType: {
    fontSize: 14,
    color: '#6b7280',
  },
});
  export default ResourceSection;
