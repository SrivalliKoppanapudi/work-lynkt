import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import InputComponent from '../../component/InputComponent';
import ButtonComponent from '../../component/ButtonComponent';
import { GoalFormProps } from '../../types/goalsTypes';


const GoalForm: React.FC<GoalFormProps> = ({
  goal,
  setGoal,
  handleSaveGoal,
  newStep,
  setNewStep,
  handleAddStep,
  handleRemoveStep,
  isSaving
}) => {
  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = React.useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = React.useState(false);

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      const formattedDate = new Date(selectedDate).toISOString().split('T')[0];
      setGoal(prev => ({ ...prev, startDate: formattedDate }));
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      const formattedDate = new Date(selectedDate).toISOString().split('T')[0];
      setGoal(prev => ({ ...prev, endDate: formattedDate }));
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Add New Goal</Text>
      <InputComponent
        label="Goal Title"
        value={goal.title}
        onChangeText={(text) => setGoal(prev => ({ ...prev, title: text }))}
        placeholder="Enter your goal title"
      />
      
      <InputComponent
        label="Description"
        value={goal.description}
        onChangeText={(text) => setGoal(prev => ({ ...prev, description: text }))}
        placeholder="Describe your goal"
        multiline
        numberOfLines={4}
      />

      {/* Date Input Fields with DateTimePicker */}
      <View style={styles.dateInputContainer}>
        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity 
          style={styles.dateInput}
          onPress={() => setShowStartDatePicker(true)}
        >
          <Text style={goal.startDate ? styles.dateInputText : styles.dateInputPlaceholder}>
            {goal.startDate || 'Select start date'}
          </Text>
        </TouchableOpacity>
        {showStartDatePicker && (
          <DateTimePicker
            value={goal.startDate ? new Date(goal.startDate) : new Date()}
            mode="date"
            display="default"
            onChange={handleStartDateChange}
          />
        )}
      </View>

      <View style={styles.dateInputContainer}>
        <Text style={styles.label}>End Date</Text>
        <TouchableOpacity 
          style={styles.dateInput}
          onPress={() => setShowEndDatePicker(true)}
        >
          <Text style={goal.endDate ? styles.dateInputText : styles.dateInputPlaceholder}>
            {goal.endDate || 'Select end date'}
          </Text>
        </TouchableOpacity>
        {showEndDatePicker && (
          <DateTimePicker
            value={goal.endDate ? new Date(goal.endDate) : new Date()}
            mode="date"
            display="default"
            onChange={handleEndDateChange}
          />
        )}
      </View>

      <Text style={styles.sectionSubtitle}>Action Plans</Text>
      {goal.planSteps.map((step) => (
        <View key={step.id} style={styles.stepInputContainer}>
          <Text style={styles.stepText}>{step.description}</Text>
          <TouchableOpacity
            onPress={() => handleRemoveStep(step.id)}
            style={styles.removeStepButton}
          >
            <Ionicons name="close-circle" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      ))}
      
      <View style={styles.addStepContainer}>
        <TextInput
          style={styles.stepInput}
          value={newStep}
          onChangeText={setNewStep}
          placeholder="Add a new step..."
          onSubmitEditing={handleAddStep}
        />
        <TouchableOpacity
          style={styles.addStepButton}
          onPress={handleAddStep}
        >
          <Ionicons name="add-circle" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ButtonComponent
        title="Save Goal"
        onPress={handleSaveGoal}
        style={styles.button}
        disabled={isSaving}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  dateInputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  dateInputText: {
    fontSize: 14,
    color: '#333',
  },
  dateInputPlaceholder: {
    fontSize: 14,
    color: '#999',
  },
  stepInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  removeStepButton: {
    padding: 4,
  },
  addStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  stepInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  addStepButton: {
    padding: 4,
  },
  button: {
    marginTop: 20,
  },
});

export default GoalForm;