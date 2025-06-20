// components/CourseDescription.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import RichTextEditor from './RichTextEditor';

interface CourseDescriptionProps {
  description: string;
  setDescription: (description: string) => void;
}

const CourseDescription: React.FC<CourseDescriptionProps> = ({
  description,
  setDescription,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Course Description</Text>
      <View style={styles.editorContainer}>
        <RichTextEditor
          initialContent={description}
          onContentChange={setDescription}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  editorContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
});

export default CourseDescription;