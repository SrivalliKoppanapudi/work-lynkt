import React from 'react';
import { StyleSheet } from 'react-native';
import { Archive, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import ButtonComponent from '../ButtonComponent';
import Colors from '../../constant/Colors';

interface CourseArchiveDeleteButtonProps {
  courseId: string;
  courseTitle: string;
  course?: any; // Full course object if available
}

const CourseArchiveDeleteButton: React.FC<CourseArchiveDeleteButtonProps> = ({ 
  courseId, 
  courseTitle,
  course 
}) => {
  const handlePress = () => {
    // Navigate to the Course Archive and Deletion page
    if (course) {
      router.push({
        pathname: "/(screens)/CourseArchiveAndDeletion",
        params: { course: JSON.stringify(course) }
      });
    } else {
      router.push({
        pathname: "/(screens)/CourseArchiveAndDeletion",
        params: { courseId, courseTitle }
      });
    }
  };

  return (
    <ButtonComponent
      title="Archive & Delete Options"
      onPress={handlePress}
      style={styles.button}
      icon={<Archive size={18} color="#fff" />}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#6b7280',
    marginTop: 16,
  },
});

export default CourseArchiveDeleteButton;