import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Plus, FileText, Calendar } from 'lucide-react-native';
import { Assessment } from '../../types/courses';
import Colors from '../../constant/Colors';

interface AssessmentSectionProps {
  assessments: Assessment[];
  onAddAssessment: () => void;
  onEditAssessment: (assessment: Assessment) => void;
}

const AssessmentSection = ({ assessments, onAddAssessment, onEditAssessment }: AssessmentSectionProps) => {
  const renderAssessmentItem = ({ item }: { item: Assessment }) => (
    <TouchableOpacity 
      style={styles.assessmentItem} 
      onPress={() => onEditAssessment(item)}
    >
      <View style={styles.assessmentIcon}>
        <FileText size={24} color={Colors.PRIMARY} />
      </View>
      <View style={styles.assessmentContent}>
        <Text style={styles.assessmentTitle}>{item.title}</Text>
        <Text style={styles.assessmentType}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</Text>
        {item.dueDate && (
          <View style={styles.dueDateContainer}>
            <Calendar size={14} color="#6b7280" />
            <Text style={styles.dueDate}>
              Due: {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.pointsText}>{item.totalPoints} pts</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Assessments</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={onAddAssessment}
        >
          <Plus size={18} color="#ffffff" />
          <Text style={styles.addButtonText}>Add Assessment</Text>
        </TouchableOpacity>
      </View>

      {assessments.length > 0 ? (
        <FlatList
          data={assessments}
          renderItem={renderAssessmentItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.assessmentList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No assessments added yet</Text>
          <Text style={styles.emptyStateSubText}>Add an assessment to evaluate student learning</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 14,
  },
  assessmentList: {
    maxHeight: 300,
  },
  assessmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  assessmentIcon: {
    marginRight: 12,
  },
  assessmentContent: {
    flex: 1,
  },
  assessmentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  assessmentType: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.PRIMARY,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 4,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default AssessmentSection;