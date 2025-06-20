import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  FlatList,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/Superbase";
import Colors from "../../constant/Colors";
import { useRouter } from "expo-router";
import {
  Search,
  BookOpen,
  Star,
  Clock,
  Upload,
  Filter,
} from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";

// Define types for our knowledge base resources
interface KnowledgeResource {
  id: string;
  title: string;
  description: string;
  type: "article" | "video" | "research" | "document";
  url: string;
  categories: string[];
  created_at: string;
  author_id: string;
  author_name?: string;
  views: number;
  favorites: number;
  is_featured: boolean;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
}

// Resource Card Component
const ResourceCard = ({
  resource,
  onPress,
}: {
  resource: KnowledgeResource;
  onPress: () => void;
}) => {
  const getIconByType = (type: string) => {
    switch (type) {
      case "article":
        return <BookOpen size={20} color={Colors.PRIMARY} />;
      case "video":
        return <BookOpen size={20} color={Colors.PRIMARY} />;
      case "research":
        return <BookOpen size={20} color={Colors.PRIMARY} />;
      case "document":
        return <BookOpen size={20} color={Colors.PRIMARY} />;
      default:
        return <BookOpen size={20} color={Colors.PRIMARY} />;
    }
  };

  return (
    <TouchableOpacity style={styles.resourceCard} onPress={onPress}>
      <View style={styles.resourceIconContainer}>
        {getIconByType(resource.type)}
      </View>
      <View style={styles.resourceContent}>
        <Text style={styles.resourceTitle}>{resource.title}</Text>
        <Text style={styles.resourceDescription} numberOfLines={2}>
          {resource.description}
        </Text>
        <View style={styles.resourceMeta}>
          <Text style={styles.resourceType}>{resource.type}</Text>
          <Text style={styles.resourceDate}>
            {new Date(resource.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Category Item Component
const CategoryItem = ({
  category,
  isSelected,
  onPress,
}: {
  category: Category;
  isSelected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
    onPress={onPress}
  >
    <Text
      style={[styles.categoryText, isSelected && styles.categoryTextSelected]}
    >
      {category.name}
    </Text>
  </TouchableOpacity>
);

export default function KnowledgeBaseDashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [resources, setResources] = useState<KnowledgeResource[]>([]);
  const [featuredResources, setFeaturedResources] = useState<
    KnowledgeResource[]
  >([]);
  const [recentResources, setRecentResources] = useState<KnowledgeResource[]>(
    []
  );
  const [favoriteResources, setFavoriteResources] = useState<
    KnowledgeResource[]
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch user role
  const fetchUserRole = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;

      if (user) {
        const role = user.user_metadata?.role || null;
        setUserRole(role);
      }
    } catch (err: any) {
      console.error("Error fetching user role:", err);
    }
  };

  // Fetch resources
  const fetchResources = async () => {
    try {
      // For demo purposes, we're creating mock data
      // In a real app, you would fetch from Supabase
      const mockCategories: Category[] = [
        { id: "1", name: "Subject Areas" },
        { id: "2", name: "Teaching Strategies" },
        { id: "3", name: "Professional Development" },
        { id: "4", name: "Research Papers" },
        { id: "5", name: "Video Tutorials" },
      ];

      const mockResources: KnowledgeResource[] = [
        {
          id: "1",
          title: "Introduction to React Native",
          description:
            "A comprehensive guide to getting started with React Native development.",
          type: "article",
          url: "https://grok.com/chat/c7253102-3e7b-433b-af89-5000cbf280c9?referrer=website",
          categories: ["1", "5"],
          created_at: "2023-06-15T10:00:00Z",
          author_id: "user1",
          author_name: "John Doe",
          views: 1250,
          favorites: 85,
          is_featured: true,
        },
        {
          id: "2",
          title: "Effective Teaching Methods",
          description:
            "Research-based strategies for effective classroom teaching.",
          type: "research",
          url: "https://example.com/teaching-methods",
          categories: ["2", "3"],
          created_at: "2023-07-20T14:30:00Z",
          author_id: "user2",
          author_name: "Jane Smith",
          views: 980,
          favorites: 120,
          is_featured: true,
        },
        {
          id: "3",
          title: "Advanced Mathematics Curriculum",
          description: "Curriculum guide for advanced mathematics courses.",
          type: "document",
          url: "https://example.com/math-curriculum",
          categories: ["1"],
          created_at: "2023-08-05T09:15:00Z",
          author_id: "user3",
          author_name: "Robert Johnson",
          views: 750,
          favorites: 65,
          is_featured: false,
        },
        {
          id: "4",
          title: "Video Tutorial: Classroom Management",
          description:
            "Video series on effective classroom management techniques.",
          type: "video",
          url: "https://example.com/classroom-management",
          categories: ["2", "5"],
          created_at: "2023-08-10T11:45:00Z",
          author_id: "user4",
          author_name: "Sarah Williams",
          views: 1500,
          favorites: 210,
          is_featured: true,
        },
        {
          id: "5",
          title: "Professional Development Workshop Materials",
          description:
            "Materials from the recent professional development workshop.",
          type: "document",
          url: "https://example.com/workshop-materials",
          categories: ["3"],
          created_at: "2023-08-15T13:20:00Z",
          author_id: "user5",
          author_name: "Michael Brown",
          views: 620,
          favorites: 45,
          is_featured: false,
        },
      ];

      setCategories(mockCategories);
      setResources(mockResources);

      // Set featured resources
      setFeaturedResources(
        mockResources.filter((resource) => resource.is_featured)
      );

      // Set recent resources (sort by date)
      setRecentResources(
        [...mockResources]
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          .slice(0, 3)
      );

      // Set favorite resources (sort by favorites count)
      setFavoriteResources(
        [...mockResources].sort((a, b) => b.favorites - a.favorites).slice(0, 3)
      );
    } catch (err: any) {
      setError(err.message ?? "Failed to load resources");
      console.error("Error loading knowledge base data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([fetchUserRole(), fetchResources()]);
    } catch (err: any) {
      setError(err.message ?? "Failed to load data");
      console.error("Error loading knowledge base data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      // If search is empty, reset to show all resources
      loadAllData();
      return;
    }

    // Filter resources based on search query
    const filteredResources = resources.filter(
      (resource) =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setResources(filteredResources);
    setFeaturedResources(
      filteredResources.filter((resource) => resource.is_featured)
    );
    setRecentResources(
      [...filteredResources]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 3)
    );
    setFavoriteResources(
      [...filteredResources]
        .sort((a, b) => b.favorites - a.favorites)
        .slice(0, 3)
    );
  };

  const handleCategorySelect = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      // If the same category is selected, deselect it
      setSelectedCategory(null);
      loadAllData(); // Reset to show all resources
    } else {
      setSelectedCategory(categoryId);

      // Filter resources by selected category
      const filteredResources = resources.filter((resource) =>
        resource.categories.includes(categoryId)
      );

      setResources(filteredResources);
      setFeaturedResources(
        filteredResources.filter((resource) => resource.is_featured)
      );
      setRecentResources(
        [...filteredResources]
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          .slice(0, 3)
      );
      setFavoriteResources(
        [...filteredResources]
          .sort((a, b) => b.favorites - a.favorites)
          .slice(0, 3)
      );
    }
  };

  const handleResourcePress = (resource: KnowledgeResource) => {
    // Navigate to resource details
    router.push({
      pathname: "/ResourceDetail",
      params: { id: resource.id },
    });
  };

  const handleUploadResource = () => {
    // Navigate to resource upload screen
    router.push("/ResourceUpload");
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Loading Knowledge Base...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Pressable
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
              </Pressable>
              <Text style={styles.headerText}>Knowledge Base</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search resources..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearch}
              >
                <Search size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Category Navigation */}
            <View style={styles.categoryContainer}>
              <View style={styles.categoryHeader}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <Filter size={18} color={Colors.PRIMARY} />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
              >
                {categories.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    isSelected={selectedCategory === category.id}
                    onPress={() => handleCategorySelect(category.id)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Featured Resources */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured Resources</Text>
                <Star size={18} color={Colors.PRIMARY} />
              </View>
              {featuredResources.length > 0 ? (
                featuredResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onPress={() => handleResourcePress(resource)}
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>
                  No featured resources available
                </Text>
              )}
            </View>

            {/* Recent Additions */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Additions</Text>
                <Clock size={18} color={Colors.PRIMARY} />
              </View>
              {recentResources.length > 0 ? (
                recentResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onPress={() => handleResourcePress(resource)}
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>
                  No recent resources available
                </Text>
              )}
            </View>

            {/* Favorite Resources */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Popular Resources</Text>
                <Star size={18} color={Colors.PRIMARY} />
              </View>
              {favoriteResources.length > 0 ? (
                favoriteResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onPress={() => handleResourcePress(resource)}
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>
                  No popular resources available
                </Text>
              )}
            </View>

            {/* Upload Button (Admin/Teacher Only) */}
            {(userRole === "admin" || userRole === "teacher") && (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUploadResource}
              >
                <Upload size={20} color="#fff" />

                <Text style={styles.uploadButtonText}>Upload New Resource</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    color: Colors.PRIMARY,
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.PRIMARY,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: "#ffeeee",
    borderRadius: 8,
    marginVertical: 10,
  },
  errorText: {
    color: Colors.ERROR,
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 20,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f5f5f5",
  },
  searchButton: {
    backgroundColor: Colors.PRIMARY,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryList: {
    paddingVertical: 8,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    marginRight: 10,
  },
  categoryItemSelected: {
    backgroundColor: Colors.PRIMARY,
  },
  categoryText: {
    fontSize: 14,
    color: "#333",
  },
  categoryTextSelected: {
    color: "#fff",
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  resourceCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    elevation: 2,
  },
  resourceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  resourceDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  resourceMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  resourceType: {
    fontSize: 12,
    color: Colors.PRIMARY,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  resourceDate: {
    fontSize: 12,
    color: "#999",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
  uploadButton: {
    flexDirection: "row",
    backgroundColor: Colors.PRIMARY,
    borderRadius: 8,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
});
