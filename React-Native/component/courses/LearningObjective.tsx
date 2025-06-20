// components/LearningObjectives.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, TextInput } from 'react-native';
import { CheckSquare } from 'lucide-react-native';

interface LearningObjectivesProps {
  objectives: string[];
  setobjectives: (objectives: string[]) => void;
  newObjective: string;
  setNewObjective: (objective: string) => void;
  handleAddObjective: () => void;
}

const LearningObjectives = ({ objectives, setobjectives, newObjective, setNewObjective }: LearningObjectivesProps) => {
  const handleAddObjective = () => {
    if (newObjective.trim()) {
      const newObjectives = newObjective.split(',').map(obj => obj.trim()).filter(obj => obj);
      setobjectives([...objectives, ...newObjectives]);
      setNewObjective('');
    }
  };

  const handleRemoveObjective = (index: number) => {
    const newObjectives = [...objectives];
    newObjectives.splice(index, 1);
    setobjectives(newObjectives);
  };

  return (
    <View style={styles.inputGroup}>
      <View style={styles.inputHeader}>
        <CheckSquare size={20} color="#4b5563" />
        <Text style={styles.label}>Learning Objectives(comma separated)</Text>
      </View>
      <View style={styles.objectivesContainer}>
        <FlatList
          data={objectives}
          scrollEnabled={false}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item: objective, index }) => (
            <View style={styles.objectiveItem}>
              <Text style={styles.objectiveText}>• {objective}</Text>
              <Pressable
                onPress={() => handleRemoveObjective(index)}
                style={styles.removeObjectiveButton}
              >
                <Text style={styles.removeObjectiveText}>Remove</Text>
              </Pressable>
            </View>
          )}
          ListFooterComponent={
            <View style={styles.addObjectiveContainer}>
              <TextInput
                style={styles.objectiveInput}
                value={newObjective}
                onChangeText={setNewObjective}
                placeholder="Add new objectives (comma-separated)"
                placeholderTextColor="#9ca3af"
                onSubmitEditing={handleAddObjective}
              />
              <Pressable
                onPress={handleAddObjective}
                style={styles.addObjectiveButton}
              >
                <Text style={styles.addObjectiveButtonText}>Add</Text>
              </Pressable>
            </View>
          }
        />
      </View>
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
  objectivesContainer: {
    gap: 8,
  },
  objectiveItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  objectiveText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  removeObjectiveButton: {
    padding: 4,
  },
  removeObjectiveText: {
    color: '#ef4444',
    fontSize: 14,
  },
  addObjectiveContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  objectiveInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  addObjectiveButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addObjectiveButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
});

export default LearningObjectives;
