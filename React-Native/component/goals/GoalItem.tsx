import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StepList from './StepList';
import StatusSelector from './StatusSelector';
import { GoalItemProps } from '../../types/goalsTypes';


const GoalItem: React.FC<GoalItemProps> = ({
  goal,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return '#FF9500';
      case 'in_progress':
        return '#007AFF';
      case 'completed':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const handleToggleStep = (stepId: string) => {
    onUpdate({
      planSteps: goal.planSteps.map(s =>
        s.id === stepId ? { ...s, completed: !s.completed } : s
      )
    });
  };

  const handleStatusChange = (status: string) => {
    onUpdate({ status: status as "not_started" | "in_progress" | "completed" | "cancelled" });
  };
  return (
    <View style={styles.goalCard}>
      <TouchableOpacity
        style={styles.goalHeader}
        onPress={onToggleExpand}
      >
        <View style={styles.goalTitleContainer}>
          <Text style={styles.goalTitle}>{goal.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(goal.status) }]}>
            <Text style={styles.statusText}>{goal.status ? goal.status.replace('_', ' ') : ''}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          </TouchableOpacity>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#666"
          />
        </View>
      </TouchableOpacity>

      <Text style={styles.goalDescription}>{goal.description}</Text>
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>Start: {goal.startDate}</Text>
        <Text style={styles.dateText}>End: {goal.endDate}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${goal.progress}%` }]} />
      </View>
      <Text style={styles.progressText}>{goal.progress}% Complete</Text>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.expandedTitle}>Action Plans</Text>
          <StepList 
            steps={goal.planSteps} 
            onToggleComplete={handleToggleStep} 
          />

          <StatusSelector 
            currentStatus={goal.status} 
            onStatusChange={handleStatusChange} 
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  expandedTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
});

export default GoalItem;