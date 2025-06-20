import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GoalStatus, StatusSelectorProps } from '../../types/goalsTypes';


const StatusSelector: React.FC<StatusSelectorProps> = ({ currentStatus, onStatusChange }) => {
  const getStatusColor = (status: GoalStatus) => {
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Update Status</Text>
      <View style={styles.statusButtons}>
        {['not_started', 'in_progress', 'completed', 'cancelled'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusButton,
              currentStatus === status && styles.statusButtonActive,
              { backgroundColor: getStatusColor(status as GoalStatus) }
            ]}
            onPress={() => onStatusChange(status as GoalStatus)}
          >
            <Text style={styles.statusButtonText}>
              {status.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusButtonActive: {
    opacity: 1,
  },
  statusButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});

export default StatusSelector;