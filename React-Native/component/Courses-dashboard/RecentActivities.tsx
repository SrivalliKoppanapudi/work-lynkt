import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions } from 'react-native';
import { Clock, BookOpen, User, Award, Eye } from 'lucide-react-native';
import { supabase } from '../../lib/Superbase';
import Colors from '../../constant/Colors';

// Define the activity type
interface Activity {
  id: string;
  type: 'enrollment' | 'completion' | 'feedback' | 'view' | 'certificate';
  description: string;
  course_id: string;
  course_title: string;
  created_at: string;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7; // 70% of screen width

const RecentActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch recent activities from Supabase
  useEffect(() => {
   fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5); // Fetch the 5 most recent activities

      if (error) {
        throw error;
      }

      setActivities(data || []);
    } catch (error) {
      // console.error('Error fetching recent activities:', error);
      // Fallback to sample data for development
      const sampleActivities: Activity[] = [
        {
          id: '1',
          type: 'enrollment',
          description: 'New student enrolled in "Introduction to React Native"',
          course_id: '1',
          course_title: 'Introduction to React Native',
          created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        },
        {
          id: '2',
          type: 'completion',
          description: 'A student completed "Introduction to React Native"',
          course_id: '1',
          course_title: 'Introduction to React Native',
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        },
        {
          id: '3',
          type: 'feedback',
          description: 'New feedback received for "Advanced JavaScript Concepts"',
          course_id: '2',
          course_title: 'Advanced JavaScript Concepts',
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        },
      ];
      setActivities(sampleActivities);
    } finally {
      setIsLoading(false);
    }
  };

  // Get the appropriate icon for the activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrollment':
        return <User size={24} color={Colors.PRIMARY} />;
      case 'completion':
        return <Award size={24} color={Colors.PRIMARY} />;
      case 'view':
        return <Eye size={24} color={Colors.PRIMARY} />;
      case 'certificate':
        return <Award size={24} color={Colors.PRIMARY} />;
      case 'feedback':
        return <BookOpen size={24} color={Colors.PRIMARY} />;
      default:
        return <Clock size={24} color={Colors.PRIMARY} />;
    }
  };

  // Format the timestamp to a more friendly format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} min ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffDay < 7) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderActivityCard = ({ item }: { item: Activity }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          {getActivityIcon(item.type)}
        </View>
        <Text style={styles.timestamp}>{formatTimestamp(item.created_at)}</Text>
      </View>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.courseTitle}>{item.course_title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activities</Text>
      </View>
      {isLoading ? (
        <Text style={styles.loadingText}>Loading activities...</Text>
      ) : activities.length > 0 ? (
        <FlatList
          data={activities}
          renderItem={renderActivityCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          snapToInterval={CARD_WIDTH + 16}
          decelerationRate="fast"
        />
      ) : (
        <Text style={styles.noActivitiesText}>No recent activities to display.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WHITE,
    padding: 16,
    flexDirection:'column',
  },
  header: {
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
  
  },
  listContent: {
    paddingRight: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#f5f7fa',
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 12,
    color: Colors.PRIMARY,
    fontWeight: '500',
  },
  loadingText: {
    textAlign: 'center',
    padding: 16,
    fontSize: 14,
    color: '#666',
  },
  noActivitiesText: {
    textAlign: 'center',
    padding: 16,
    fontSize: 14,
    color: '#666',
  },
});

export default RecentActivities;