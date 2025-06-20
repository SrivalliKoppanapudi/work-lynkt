// components/PrerequisiteInput.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { CheckSquare } from 'lucide-react-native';

interface PrerequisiteInputProps {
  prerequisites: string;
  setPrerequisites: (prerequisites: string) => void;
}

const PrerequisiteInput = ({ prerequisites, setPrerequisites }: PrerequisiteInputProps) => {
  return (
    <View style={styles.inputGroup}>
      <View style={styles.inputHeader}>
        <CheckSquare size={20} color="#4b5563" />
        <Text style={styles.label}>Prerequisites</Text>
      </View>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={prerequisites}
        onChangeText={setPrerequisites}
        placeholder="Enter course prerequisites"
        placeholderTextColor="#9ca3af"
        multiline
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
  textArea: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
});

export default PrerequisiteInput;