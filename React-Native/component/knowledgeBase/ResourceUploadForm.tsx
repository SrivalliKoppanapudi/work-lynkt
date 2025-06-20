import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../../lib/Superbase";
import Colors from "../../constant/Colors";
import { ResourceUpload } from "../../types/knowledgeBase";
import { useRouter } from "expo-router";
import { X, Upload, Check } from "lucide-react-native";

interface ResourceUploadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ResourceUploadForm = ({ onSuccess, onCancel }: ResourceUploadFormProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState<ResourceUpload>({
    title: "",
    description: "",
    type: "article",
    url: "",
    categories: [],
  });
  const [availableCategories, setAvailableCategories] = useState<{id: string, name: string}[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // In a real app, fetch categories from the database
    setAvailableCategories([
      { id: "1", name: "Subject Areas" },
      { id: "2", name: "Teaching Strategies" },
      { id: "3", name: "Professional Development" },
      { id: "4", name: "Research Papers" },
      { id: "5", name: "Video Tutorials" },
    ]);
  }, []);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    
    if (!formData.type) {
      newErrors.type = "Resource type is required";
    }
    
    if (!formData.url.trim()) {
      newErrors.url = "URL is required";
    } else if (!isValidUrl(formData.url)) {
      newErrors.url = "Please enter a valid URL";
    }
    
    if (selectedCategories.length === 0) {
      newErrors.categories = "At least one category is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!user) {
        Alert.alert("Error", "You must be logged in to upload resources");
        return;
      }
      
      // In a real app, you would upload the resource to Supabase
      // For demo purposes, we'll just simulate a successful upload
      
      // Example of how you would upload to Supabase:
      /*
      const { data, error } = await supabase
        .from('knowledge_resources')
        .insert({
          title: formData.title,
          description: formData.description,
          type: formData.type,
          url: formData.url,
          categories: selectedCategories,
          author_id: user.id,
          created_at: new Date().toISOString(),
          views: 0,
          favorites: 0,
          is_featured: false
        });
      
      if (error) throw error;
      */
      
      // Simulate a delay for the demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        "Success", 
        "Resource uploaded successfully",
        [{ text: "OK", onPress: () => {
          if (onSuccess) onSuccess();
          // Navigate back to the Knowledge Base Dashboard
          router.push("/KnowledgeBaseDashboard");
        }}]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to upload resource");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Upload New Resource</Text>
        {onCancel && (
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <X size={24} color={Colors.PRIMARY} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={[styles.input, errors.title ? styles.inputError : null]}
          value={formData.title}
          onChangeText={(text) => setFormData({...formData, title: text})}
          placeholder="Enter resource title"
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.textArea, errors.description ? styles.inputError : null]}
          value={formData.description}
          onChangeText={(text) => setFormData({...formData, description: text})}
          placeholder="Enter resource description"
          multiline
          numberOfLines={4}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Resource Type</Text>
        <View style={styles.typeContainer}>
          {['article', 'video', 'research', 'document'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                formData.type === type && styles.typeButtonSelected
              ]}
              onPress={() => setFormData({...formData, type: type as any})}
            >
              <Text 
                style={[
                  styles.typeButtonText,
                  formData.type === type && styles.typeButtonTextSelected
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Resource URL</Text>
        <TextInput
          style={[styles.input, errors.url ? styles.inputError : null]}
          value={formData.url}
          onChangeText={(text) => setFormData({...formData, url: text})}
          placeholder="Enter resource URL"
          keyboardType="url"
        />
        {errors.url && <Text style={styles.errorText}>{errors.url}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Categories</Text>
        <View style={styles.categoriesContainer}>
          {availableCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategories.includes(category.id) && styles.categoryButtonSelected
              ]}
              onPress={() => handleCategoryToggle(category.id)}
            >
              <Text 
                style={[
                  styles.categoryButtonText,
                  selectedCategories.includes(category.id) && styles.categoryButtonTextSelected
                ]}
              >
                {category.name}
              </Text>
              {selectedCategories.includes(category.id) && (
                <Check size={16} color="#fff" style={styles.checkIcon} />
              )}
            </TouchableOpacity>
          ))}
        </View>
        {errors.categories && <Text style={styles.errorText}>{errors.categories}</Text>}
      </View>
      
      <TouchableOpacity 
        style={styles.submitButton} 
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Upload size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Upload Resource</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.WHITE,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.PRIMARY,
  },
  closeButton: {
    padding: 8,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    minHeight: 100,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: Colors.ERROR,
  },
  errorText: {
    color: Colors.ERROR,
    fontSize: 14,
    marginTop: 4,
  },
  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
    marginBottom: 8,
  },
  typeButtonSelected: {
    backgroundColor: Colors.PRIMARY,
  },
  typeButtonText: {
    fontSize: 14,
    color: "#333",
  },
  typeButtonTextSelected: {
    color: "#fff",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonSelected: {
    backgroundColor: Colors.PRIMARY,
  },
  categoryButtonText: {
    fontSize: 14,
    color: "#333",
  },
  categoryButtonTextSelected: {
    color: "#fff",
  },
  checkIcon: {
    marginLeft: 4,
  },
  submitButton: {
    flexDirection: "row",
    backgroundColor: Colors.PRIMARY,
    borderRadius: 8,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default ResourceUploadForm;