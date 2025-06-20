import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import { EnrollmentStats as EnrollmentStatsType } from '../../types/enrollment';
import Colors from '../../constant/Colors';

interface EnrollmentStatsProps {
  stats: EnrollmentStatsType;
  onViewAnalytics: () => void;
}

const EnrollmentStats: React.FC<EnrollmentStatsProps> = ({ stats, onViewAnalytics }) => {
  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.headerRow}>
          <Title style={styles.title}>Enrollment Statistics</Title>
          <TouchableOpacity onPress={onViewAnalytics} style={styles.analyticsButton}>
            <Text style={styles.analyticsButtonText}>View Analytics</Text>
            <MaterialIcons name="arrow-forward" size={16} color={Colors.PRIMARY} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalEnrollments}</Text>
            <Text style={styles.statLabel}>Total Enrollments</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.activeStudents}</Text>
            <Text style={styles.statLabel}>Active Students</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.completedStudents}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.droppedStudents}</Text>
            <Text style={styles.statLabel}>Dropped</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Average Progress</Text>
            <Text style={styles.progressValue}>{Math.round(stats.averageProgress)}%</Text>
          </View>
          <Progress.Bar
            progress={stats.averageProgress / 100}
            width={null}
            color={Colors.PRIMARY}
            unfilledColor="#e0e0e0"
            borderWidth={0}
            height={8}
            style={styles.progressBar}
          />
        </View>

        <View style={styles.statusBreakdown}>
          <Text style={styles.breakdownTitle}>Status Breakdown</Text>
          <View style={styles.statusBarContainer}>
            {stats.totalEnrollments > 0 ? (
              <View style={styles.statusBar}>
                <View
                  style={[
                    styles.statusSegment,
                    {
                      backgroundColor: Colors.PRIMARY,
                      flex: stats.activeStudents / stats.totalEnrollments,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.statusSegment,
                    {
                      backgroundColor: Colors.SUCCESS,
                      flex: stats.completedStudents / stats.totalEnrollments,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.statusSegment,
                    {
                      backgroundColor: Colors.ERROR,
                      flex: stats.droppedStudents / stats.totalEnrollments,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.statusSegment,
                    {
                      backgroundColor: Colors.GRAY,
                      flex:
                        (stats.totalEnrollments -
                          stats.activeStudents -
                          stats.completedStudents -
                          stats.droppedStudents) /
                        stats.totalEnrollments,
                    },
                  ]}
                />
              </View>
            ) : (
              <View style={styles.emptyStatusBar} />
            )}
          </View>

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: Colors.PRIMARY }]} />
              <Text style={styles.legendText}>Active</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: Colors.SUCCESS }]} />
              <Text style={styles.legendText}>Completed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: Colors.ERROR }]} />
              <Text style={styles.legendText}>Dropped</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: Colors.GRAY }]} />
              <Text style={styles.legendText}>Inactive</Text>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    elevation: 2,
    backgroundColor: 'white',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    color: Colors.PRIMARY,
  },
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyticsButtonText: {
    color: Colors.PRIMARY,
    marginRight: 5,
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  statItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.GRAY,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.GRAY,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
  },
  progressBar: {
    width: '100%',
  },
  statusBreakdown: {
    marginTop: 10,
  },
  breakdownTitle: {
    fontSize: 14,
    color: Colors.GRAY,
    marginBottom: 10,
  },
  statusBarContainer: {
    marginBottom: 10,
  },
  statusBar: {
    height: 15,
    flexDirection: 'row',
    borderRadius: 7.5,
    overflow: 'hidden',
  },
  emptyStatusBar: {
    height: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 7.5,
  },
  statusSegment: {
    height: '100%',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: Colors.GRAY,
  },
});

export default EnrollmentStats;