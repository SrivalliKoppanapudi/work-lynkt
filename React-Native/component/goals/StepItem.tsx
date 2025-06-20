import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StepItemProps } from '../../types/goalsTypes';


const StepItem: React.FC<StepItemProps> = ({ step, onToggleComplete }) => {
  return (
    <View style={styles.stepItem}>
      <TouchableOpacity
        style={[styles.checkbox, step.completed && { backgroundColor: '#007AFF' }]}
        onPress={onToggleComplete}
      >
        {step.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
      </TouchableOpacity>
      <Text style={[styles.stepText, step.completed && styles.completedStep]}>
        {step.description}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  completedStep: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
});

export default StepItem;