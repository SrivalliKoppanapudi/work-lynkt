import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Users, BookOpen, Award } from 'lucide-react-native';
import Colors from '../../constant/Colors';

interface CourseAnalyticsSummaryProps {
  enrollmentCount: number;
  completionRate: number;
  averageScore: number;
  iconSize?: number;
  iconColor?: string;
  valueColor?: string;
  labelColor?: string;
}

const CourseAnalyticsSummary = ({
  enrollmentCount,
  completionRate,
  averageScore,
  iconSize = 16,
  iconColor = Colors.PRIMARY,
  valueColor = Colors.PRIMARY,
  labelColor = '#666',
}: CourseAnalyticsSummaryProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.metricContainer}>
        <View style={styles.metric}>
          <Users size={iconSize} color={iconColor} />
          <Text style={[styles.metricValue, { color: valueColor }]}>
            {enrollmentCount}
          </Text>
          <Text style={[styles.metricLabel, { color: labelColor }]}>
            Enrolled
          </Text>
        </View>

        <View style={styles.metric}>
          <BookOpen size={iconSize} color={iconColor} />
          <Text style={[styles.metricValue, { color: valueColor }]}>
            {completionRate}%
          </Text>
          <Text style={[styles.metricLabel, { color: labelColor }]}>
            Completion
          </Text>
        </View>

        <View style={styles.metric}>
          <Award size={iconSize} color={iconColor} />
          <Text style={[styles.metricValue, { color: valueColor }]}>
            {averageScore}
          </Text>
          <Text style={[styles.metricLabel, { color: labelColor }]}>
            Avg. Score
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  metricContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    padding: 10,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default CourseAnalyticsSummary;
