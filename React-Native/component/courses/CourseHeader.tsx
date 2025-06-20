// components/CourseHeader.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Eye, Save } from 'lucide-react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface CourseHeaderProps {
  error: string | null;
  successMessage: string | null;
  loading: boolean;
  onPreview: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}

const CourseHeader = ({ error, successMessage, loading, onPreview, onSaveDraft, onPublish }: CourseHeaderProps) => {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.headingContainer}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#3b82f6" />
        </Pressable>
        <Text style={styles.heading}>Create New Course</Text>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {successMessage && <Text style={styles.successText}>{successMessage}</Text>}
      <View style={styles.headerButtons}>
        <Pressable onPress={onPreview} style={styles.previewButton} disabled={loading}>
          <Eye size={18} color="#4b5563" />
          <Text style={styles.previewButtonText}>Preview</Text>
        </Pressable>
        <Pressable onPress={onSaveDraft} style={[styles.draftButton, loading && styles.disabledButton]} disabled={loading}>
          
          {loading ? (
            <Text style={styles.draftButtonText}>Saving...</Text>
          ) : (
            <>
              <Save size={18} color="#4b5563" />
              <Text style={styles.draftButtonText}>Save Draft</Text>
            </>
          )}
        </Pressable>
        <Pressable onPress={onPublish} style={[styles.publishButton, loading && styles.disabledButton]} disabled={loading}>
          <Eye size={18} color="#ffffff" />
          <Text style={styles.publishButtonText}>Publish</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderRadius: 8,
    gap: 8,
  },
  previewButtonText: {
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '500',
  },
  draftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderRadius: 8,
    gap: 8,
  },
  draftButtonText: {
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '500',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
    gap: 8,
  },
  publishButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  successText: {
    color: '#10b981',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  },
  headingContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 10,
  },
  backButton: {
    marginRight: 10,
  },
});
export default CourseHeader;