import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { KnowledgeResource } from "../../types/knowledgeBase";
import Colors from "../../constant/Colors";
import { ArrowLeft, BookOpen, Star, ExternalLink, Clock, Eye } from "lucide-react-native";
import { useRouter } from "expo-router";

interface ResourceDetailViewProps {
  resource: KnowledgeResource;
  onBack?: () => void;
}

const ResourceDetailView = ({ resource, onBack }: ResourceDetailViewProps) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleOpenResource = async () => {
    try {
      const supported = await Linking.canOpenURL(resource.url);
      if (supported) {
        await Linking.openURL(resource.url);
      } else {
        console.error("Cannot open URL:", resource.url);
      }
    } catch (error) {
      console.error("Error opening URL:", error);
    }
  };

  const getIconByType = (type: string) => {
    switch (type) {
      case 'article':
        return <BookOpen size={20} color={Colors.PRIMARY} />;
      case 'video':
        return <BookOpen size={20} color={Colors.PRIMARY} />;
      case 'research':
        return <BookOpen size={20} color={Colors.PRIMARY} />;
      case 'document':
        return <BookOpen size={20} color={Colors.PRIMARY} />;
      default:
        return <BookOpen size={20} color={Colors.PRIMARY} />;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resource Details</Text>
      </View>

      <View style={styles.resourceHeader}>
        <View style={styles.resourceIconContainer}>
          {getIconByType(resource.type)}
        </View>
        <Text style={styles.resourceTitle}>{resource.title}</Text>
      </View>

      <View style={styles.metadataContainer}>
        <View style={styles.metadataItem}>
          <Clock size={16} color={Colors.GRAY} />
          <Text style={styles.metadataText}>
            {new Date(resource.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.metadataItem}>
          <Eye size={16} color={Colors.GRAY} />
          <Text style={styles.metadataText}>{resource.views} views</Text>
        </View>
        <View style={styles.metadataItem}>
          <Star size={16} color={Colors.GRAY} />
          <Text style={styles.metadataText}>{resource.favorites} favorites</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.descriptionText}>{resource.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resource Type</Text>
        <View style={styles.typeContainer}>
          <Text style={styles.typeText}>{resource.type}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoriesContainer}>
          {resource.categories.map((categoryId) => (
            <View key={categoryId} style={styles.categoryTag}>
              <Text style={styles.categoryText}>Category {categoryId}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Author</Text>
        <Text style={styles.authorText}>{resource.author_name || "Unknown"}</Text>
      </View>

      <TouchableOpacity style={styles.openButton} onPress={handleOpenResource}>
        <ExternalLink size={20} color="#fff" />
        <Text style={styles.openButtonText}>Open Resource</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.favoriteButton}>
        <Star size={20} color="#fff" />
        <Text style={styles.favoriteButtonText}>Add to Favorites</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.PRIMARY,
  },
  resourceHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  resourceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  resourceTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  metadataContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 16,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metadataText: {
    marginLeft: 8,
    color: Colors.GRAY,
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#555",
  },
  typeContainer: {
    backgroundColor: Colors.PRIMARY,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryTag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    color: "#555",
  },
  authorText: {
    fontSize: 16,
    color: "#555",
  },
  openButton: {
    flexDirection: "row",
    backgroundColor: Colors.PRIMARY,
    borderRadius: 8,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  openButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  favoriteButton: {
    flexDirection: "row",
    backgroundColor: "#f0ad4e",
    borderRadius: 8,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  favoriteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default ResourceDetailView;