// components/CourseTitleInput.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { BookOpen } from 'lucide-react-native';

interface CourseTitleInputProps {
  title: string;
  setTitle: (title: string) => void;
}

const CourseTitleInput = ({ title, setTitle }: CourseTitleInputProps) => {
  return (
    <View style={styles.inputGroup}>
      <View style={styles.inputHeader}>
        <BookOpen size={20} color="#4b5563" />
        <Text style={styles.label}>Course Title</Text>
      </View>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter course title"
        placeholderTextColor="#9ca3af"
      />
    </View>
  );
};

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
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
});

export default CourseTitleInput;