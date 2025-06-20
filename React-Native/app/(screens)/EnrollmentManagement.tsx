import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, FAB, Dialog, Portal, Paragraph } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import {
  fetchEnrollments,
  updateEnrollmentStatus,
  inviteStudents,
  setCourseId,
  setFilters,
  clearFilters,
  resetInviteStatus,
} from '../../store/slices/enrollmentSlice';
import { Student, EnrollmentStatus } from '../../types/enrollment';
import StudentListItem from '../../component/enrollment/StudentListItem';
import EnrollmentFilters from '../../component/enrollment/EnrollmentFilters';
import EnrollmentStats from '../../component/enrollment/EnrollmentStats';
import InviteStudentsModal from '../../component/enrollment/InviteStudentsModal';
import Colors from '../../constant/Colors';
import { supabase } from '../../lib/Superbase'; // Adjust the import path as necessary

interface StudentDetailsModalProps {
  visible: boolean;
  student: Student | null;
  onDismiss: () => void;
  onStatusChange: (status: EnrollmentStatus) => void;
  onSendMessage: () => void;
}



const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  visible,
  student,
  onDismiss,
  onStatusChange,
  onSendMessage,
}) => {
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);

  if (!student) return null;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.detailsDialog}>
        <Dialog.Title style={styles.dialogTitle}>{student.name}</Dialog.Title>
        <Dialog.Content>
          <View style={styles.studentDetailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{student.email}</Text>
          </View>
          <View style={styles.studentDetailRow}>
            <Text style={styles.detailLabel}>Enrollment Date:</Text>
            <Text style={styles.detailValue}>
              {student.enrollmentDate.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.studentDetailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <TouchableOpacity
              onPress={() => setStatusDialogVisible(true)}
              style={[styles.statusBadge, { backgroundColor: getStatusColor(student.status) }]}
            >
              <Text style={styles.statusText}>{getStatusLabel(student.status)}</Text>
              <MaterialIcons name="arrow-drop-down" size={16} color={Colors.WHITE} />
            </TouchableOpacity>
          </View>
          <View style={styles.studentDetailRow}>
            <Text style={styles.detailLabel}>Progress:</Text>
            <Text style={styles.detailValue}>{student.progress}%</Text>
          </View>
          {student.lastActive && (
            <View style={styles.studentDetailRow}>
              <Text style={styles.detailLabel}>Last Active:</Text>
              <Text style={styles.detailValue}>
                {student.lastActive.toLocaleDateString()}
              </Text>
            </View>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onSendMessage} mode="outlined" style={styles.dialogButton}>
            Send Message
          </Button>
          <Button onPress={onDismiss} mode="contained" style={styles.dialogButton}>
            Close
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog visible={statusDialogVisible} onDismiss={() => setStatusDialogVisible(false)}>
        <Dialog.Title>Change Status</Dialog.Title>
        <Dialog.Content>
          {(['active', 'inactive', 'completed', 'dropped'] as EnrollmentStatus[]).map(
            (status) => (
              <TouchableOpacity
                key={status}
                style={styles.statusOption}
                onPress={() => {
                  onStatusChange(status);
                  setStatusDialogVisible(false);
                }}
              >
                <View
                  style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]}
                />
                <Text style={styles.statusOptionText}>{getStatusLabel(status)}</Text>
              </TouchableOpacity>
            )
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setStatusDialogVisible(false)}>Cancel</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const getStatusColor = (status: EnrollmentStatus) => {
  switch (status) {
    case 'active':
      return Colors.PRIMARY;
    case 'inactive':
      return 'gray';
    case 'completed':
      return Colors.SUCCESS;
    case 'dropped':
      return Colors.ERROR;
    default:
      return 'gray';
  }
};

const getStatusLabel = (status: EnrollmentStatus) => {
  switch (status) {
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    case 'completed':
      return 'Completed';
    case 'dropped':
      return 'Dropped';
    default:
      return status;
  }
};

export default function EnrollmentManagementScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId: string; courseTitle: string }>();
  const courseId = params.courseId || null;
  const courseTitle = params.courseTitle || 'Course';
  
  console.log('EnrollmentManagement - Received courseId:', courseId);

  const dispatch = useDispatch<AppDispatch>();
  const { 
    students, 
    filteredStudents, 
    stats, 
    filters, 
    loading, 
    error,
    inviteStatus,
    inviteError 
  } = useSelector((state: RootState) => state.enrollment);

  const [refreshing, setRefreshing] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [confirmExportVisible, setConfirmExportVisible] = useState(false);

  useEffect(() => {
    if (courseId) {
      dispatch(setCourseId(courseId));
      loadEnrollments();
    }
  }, [courseId]);

  useEffect(() => {
    if (inviteStatus === 'success') {
      setInviteModalVisible(false);
      Alert.alert('Success', 'Invitations sent successfully');
      dispatch(resetInviteStatus());
      loadEnrollments();
    } else if (inviteStatus === 'failed') {
      Alert.alert('Error', inviteError || 'Failed to send invitations');
      dispatch(resetInviteStatus());
    }
  }, [inviteStatus]);

  const loadEnrollments = () => {
    if (courseId) {
      dispatch(fetchEnrollments(courseId));
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadEnrollments();
    setRefreshing(false);
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    dispatch(setFilters(newFilters));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  const handleStatusChange = (studentId: string, status: EnrollmentStatus) => {
    if (courseId) {
      dispatch(updateEnrollmentStatus({ studentId, courseId, status }));
    }
  };

  const handleInviteStudents = (emails: string[], message: string) => {
    if (courseId) {
      dispatch(inviteStudents({ courseId, emails, message }));
    }
  };

  const handleExportData = () => {
    setConfirmExportVisible(false);
    Alert.alert('Export Started', 'Your data export has been initiated. You will be notified when it is ready for download.');
    // In a real implementation, this would call an API to generate and download the export
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="people-outline" size={64} color={Colors.GRAY} />
      <Text style={styles.emptyTitle}>No Students Found</Text>
      <Text style={styles.emptySubtitle}>
        {loading
          ? 'Loading enrollment data...'
          : filters.searchQuery || filters.status !== 'all'
          ? 'Try changing your filters'
          : 'Invite students to enroll in this course'}
      </Text>
      {!loading && !filters.searchQuery && filters.status === 'all' && (
        <Button
          mode="contained"
          onPress={() => setInviteModalVisible(true)}
          style={styles.inviteButton}
        >
          Invite Students
        </Button>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{courseTitle} - Enrollments</Text>
        <TouchableOpacity 
          onPress={() => setConfirmExportVisible(true)}
          style={styles.exportButton}
        >
          <MaterialIcons name="file-download" size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={loadEnrollments} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      ) : (
        <>
          <EnrollmentStats 
            stats={stats} 
            onViewAnalytics={() => router.push(`/(screens)/OverallCourseAnalytics?courseId=${courseId}`)}
          />

          <EnrollmentFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />

          {loading && filteredStudents.length === 0 ? (
            <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.loader} />
          ) : (
            <FlatList
              data={filteredStudents}
              renderItem={({ item }) => (
                <StudentListItem
                  student={item}
                  onStatusChange={(status: EnrollmentStatus) => handleStatusChange(item.id, status)}
                  onViewDetails={(student) => {
                    setSelectedStudent(student);
                    setDetailsModalVisible(true);
                  }}
                  onSendMessage={(student) => {
                    setSelectedStudent(student);
                    // In a real implementation, this would open a messaging interface
                    Alert.alert('Message', `Send message to ${student.name}`);
                  }}
                />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmptyList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
            />
          )}

          <FAB
            style={styles.fab}
            icon="plus"
            onPress={() => setInviteModalVisible(true)}
            color={Colors.WHITE}
          />

          <InviteStudentsModal
            visible={inviteModalVisible}
            onDismiss={() => setInviteModalVisible(false)}
            onInvite={handleInviteStudents}
            loading={inviteStatus === 'loading'}
          />

          <StudentDetailsModal
            visible={detailsModalVisible}
            student={selectedStudent}
            onDismiss={() => setDetailsModalVisible(false)}
            onStatusChange={(status) => {
              if (selectedStudent && courseId) {
                handleStatusChange(selectedStudent.id, status);
              }
            }}
            onSendMessage={() => {
              if (selectedStudent) {
                Alert.alert('Message', `Send message to ${selectedStudent.name}`);
              }
            }}
          />

          <Portal>
            <Dialog
              visible={confirmExportVisible}
              onDismiss={() => setConfirmExportVisible(false)}
            >
              <Dialog.Title>Export Enrollment Data</Dialog.Title>
              <Dialog.Content>
                <Paragraph>
                  This will export all enrollment data for this course, including student information,
                  progress, and status. The data will be exported as a CSV file.
                </Paragraph>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setConfirmExportVisible(false)}>Cancel</Button>
                <Button onPress={handleExportData}>Export</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    flex: 1,
    textAlign: 'center',
  },
  exportButton: {
    padding: 5,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 80, // Space for FAB
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.GRAY,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  inviteButton: {
    backgroundColor: Colors.PRIMARY,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.PRIMARY,
  },
  loader: {
    marginTop: 50,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.ERROR,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.PRIMARY,
  },
  detailsDialog: {
    borderRadius: 10,
    backgroundColor: Colors.WHITE,
  },
  dialogTitle: {
    color: Colors.PRIMARY,
    fontWeight: 'bold',
  },
  studentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.GRAY,
    fontWeight: 'bold',
  },
  detailValue: {
    fontSize: 14,
    color: Colors.PRIMARY,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: Colors.WHITE,
    fontWeight: 'bold',
  },
  dialogButton: {
    marginHorizontal: 5,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusOptionText: {
    fontSize: 16,
    color: Colors.PRIMARY,
  },
});