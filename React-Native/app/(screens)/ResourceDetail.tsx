import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import ResourceDetailView from "../../component/knowledgeBase/ResourceDetailView";
import Colors from "../../constant/Colors";
import { KnowledgeResource } from "../../types/knowledgeBase";
import { supabase } from "../../lib/Superbase";

export default function ResourceDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [resource, setResource] = useState<KnowledgeResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResource = async () => {
      setLoading(true);
      try {
        // In a real app, you would fetch from Supabase
        // For demo purposes, we're creating mock data
        const mockResources: KnowledgeResource[] = [
          {
            id: '1',
            title: 'Introduction to React Native',
            description: 'A comprehensive guide to getting started with React Native development. This guide covers the basics of React Native, including components, styling, navigation, and state management. It also includes examples and best practices for building mobile applications with React Native.',
            type: 'article',
            url: 'https://example.com/react-native-intro',
            categories: ['1', '5'],
            created_at: '2023-06-15T10:00:00Z',
            author_id: 'user1',
            author_name: 'John Doe',
            views: 1250,
            favorites: 85,
            is_featured: true
          },
          {
            id: '2',
            title: 'Effective Teaching Methods',
            description: 'Research-based strategies for effective classroom teaching. This resource explores various teaching methodologies and their effectiveness in different learning environments. It includes case studies, research findings, and practical tips for educators looking to improve their teaching practices.',
            type: 'research',
            url: 'https://example.com/teaching-methods',
            categories: ['2', '3'],
            created_at: '2023-07-20T14:30:00Z',
            author_id: 'user2',
            author_name: 'Jane Smith',
            views: 980,
            favorites: 120,
            is_featured: true
          },
          {
            id: '3',
            title: 'Advanced Mathematics Curriculum',
            description: 'Curriculum guide for advanced mathematics courses. This comprehensive curriculum covers advanced topics in algebra, calculus, geometry, and statistics. It includes lesson plans, assessment strategies, and supplementary materials for teachers of advanced mathematics.',
            type: 'document',
            url: 'https://example.com/math-curriculum',
            categories: ['1'],
            created_at: '2023-08-05T09:15:00Z',
            author_id: 'user3',
            author_name: 'Robert Johnson',
            views: 750,
            favorites: 65,
            is_featured: false
          },
          {
            id: '4',
            title: 'Video Tutorial: Classroom Management',
            description: 'Video series on effective classroom management techniques. This series covers various aspects of classroom management, including behavior management, creating a positive learning environment, and strategies for engaging students. Each video includes practical demonstrations and expert advice.',
            type: 'video',
            url: 'https://example.com/classroom-management',
            categories: ['2', '5'],
            created_at: '2023-08-10T11:45:00Z',
            author_id: 'user4',
            author_name: 'Sarah Williams',
            views: 1500,
            favorites: 210,
            is_featured: true
          },
          {
            id: '5',
            title: 'Professional Development Workshop Materials',
            description: 'Materials from the recent professional development workshop. These materials include presentation slides, handouts, and additional resources from the workshop on innovative teaching practices. They are designed to help educators implement new strategies in their classrooms.',
            type: 'document',
            url: 'https://example.com/workshop-materials',
            categories: ['3'],
            created_at: '2023-08-15T13:20:00Z',
            author_id: 'user5',
            author_name: 'Michael Brown',
            views: 620,
            favorites: 45,
            is_featured: false
          },
        ];

        const foundResource = mockResources.find(r => r.id === id);
        if (foundResource) {
          setResource(foundResource);
        } else {
          setError("Resource not found");
        }
      } catch (err: any) {
        setError(err.message ?? "Failed to load resource");
        console.error("Error loading resource data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchResource();
    } else {
      setError("Resource ID is required");
      setLoading(false);
    }
  }, [id]);

  const handleBack = () => {
    router.push("/KnowledgeBaseDashboard");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      </View>
    );
  }

  if (error || !resource) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color={Colors.ERROR} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ResourceDetailView resource={resource} onBack={handleBack} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
  },
});