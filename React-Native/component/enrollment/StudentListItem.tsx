import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Student, EnrollmentStatus } from '../../types/enrollment';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import Colors from '../../constant/Colors';
import { format } from 'date-fns';

interface StudentListItemProps {
  student: Student;
  onStatusChange: (studentId: string, status: EnrollmentStatus) => void;
  onViewDetails: (student: Student) => void;
  onSendMessage: (student: Student) => void;
}

const StatusColors = {
  active: Colors.PRIMARY,
  inactive: Colors.GRAY,
  completed: Colors.SUCCESS,
  dropped: Colors.ERROR,
};

const StatusLabels = {
  active: 'Active',
  inactive: 'Inactive',
  completed: 'Completed',
  dropped: 'Dropped',
};

const StudentListItem: React.FC<StudentListItemProps> = ({
  student,
  onStatusChange,
  onViewDetails,
  onSendMessage,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Image
          source={
            student.profilePicture
              ? { uri: student.profilePicture }
              : require('../../assets/images/default.png')
          }
          style={styles.avatar}
        />
        <View style={styles.studentInfo}>
          <Text style={styles.name}>{student.name}</Text>
          <Text style={styles.email}>{student.email}</Text>
          <Text style={styles.enrollmentDate}>
            Enrolled: {format(student.enrollmentDate, 'MMM d, yyyy')}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            {student.progress}% Complete
            {student.completedModules && student.totalModules
              ? ` (${student.completedModules}/${student.totalModules})`
              : ''}
          </Text>
          <Progress.Bar
            progress={student.progress / 100}
            width={120}
            color={StatusColors[student.status]}
            unfilledColor="#e0e0e0"
            borderWidth={0}
            height={6}
          />
        </View>

        <View style={styles.statusSection}>
          <View
            style={[styles.statusBadge, { backgroundColor: StatusColors[student.status] }]}
          >
            <Text style={styles.statusText}>{StatusLabels[student.status]}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onViewDetails(student)}
          >
            <Ionicons name="eye-outline" size={20} color={Colors.PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onSendMessage(student)}
          >
            <Ionicons name="mail-outline" size={20} color={Colors.PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Show status change options
              onViewDetails(student);
            }}
          >
            <MaterialIcons name="more-vert" size={20} color={Colors.PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: Colors.WHITE,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  studentInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
  },
  email: {
    fontSize: 14,
    color: Colors.GRAY,
    marginTop: 2,
  },
  enrollmentDate: {
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  progressSection: {
    alignItems: 'flex-end',
    marginBottom: 5,
  },
  progressText: {
    fontSize: 12,
    color: Colors.GRAY,
    marginBottom: 5,
  },
  statusSection: {
    marginBottom: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: Colors.WHITE,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 5,
    marginLeft: 5,
  },
});

export default StudentListItem;