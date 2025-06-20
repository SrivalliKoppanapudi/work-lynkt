import React from 'react';
import { View, StyleSheet } from 'react-native';
import StepItem from './StepItem';
import { StepListProps } from '../../types/goalsTypes';


const StepList: React.FC<StepListProps> = ({ steps, onToggleComplete }) => {
  return (
    <View style={styles.container}>
      {steps.map((step) => (
        <StepItem
          key={step.id}
          step={step}
          onToggleComplete={() => onToggleComplete(step.id)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
});

export default StepList;