import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { supabase } from "../../lib/Superbase";
import Colors from "../../constant/Colors";
import { Ionicons } from "@expo/vector-icons";

interface CourseImageUploadProps {
  image: string;
  setImage: (image: string) => void;
  setError: (error: string | null) => void;
}

const CourseImageUpload: React.FC<CourseImageUploadProps> = ({
  image,
  setImage,
  setError,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");

  // Get the full image URL for display
  const getFullImageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `https://dxhsmurbnfhkohqmmwuo.supabase.co/storage/v1/object/public/course-images/course-thumbnails/${path}`;
  };

  // Request permissions for image picker
  const requestPermissions = async () => {
    const { status: mediaStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (mediaStatus !== "granted") {
      Alert.alert(
        "Permission Required",
        "Media library permission is required to select images."
      );
      return false;
    }
    return true;
  };

  // Use a direct upload approach
  const uploadImageDirectly = async (uri: string) => {
    try {
      // Get file details
      setProgressMessage("Preparing image...");
      const fileExt = uri.split(".").pop().toLowerCase() || "jpg";
      const fileName = `course_${Date.now()}.${fileExt}`;
      
      // For Android, convert to base64 (just like iOS) for consistency
      setProgressMessage("Reading file data...");
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      setProgressMessage("Starting upload...");
      
      // Try direct upload with base64 data
      const { data, error } = await supabase.storage
        .from("course-images")
        .upload(`course-thumbnails/${fileName}`, decode(base64), {
          contentType: `image/${fileExt}`,
          upsert: true,
        });
      
      if (error) {
        console.error("Direct upload error:", error);
        throw error;
      }
      
      const { data: urlData } = supabase.storage
        .from("course-images")
        .getPublicUrl(`course-thumbnails/${fileName}`);
      
      console.log("Upload success! URL:", urlData.publicUrl);
      return { fileName, publicUrl: urlData.publicUrl };
    } catch (error) {
      console.error("Direct upload approach failed:", error);
      throw error;
    }
  };

  // Function to convert base64 to Uint8Array
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Main function to handle image picking and upload
  const pickImage = async () => {
    setError(null);
    
    try {
      // Check permissions
      setProgressMessage("Checking permissions...");
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

      // Launch image picker with reduced quality
      setProgressMessage("Opening image picker...");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.5, // Reduced quality to create smaller file
      });
      
      if (result.canceled) {
        setProgressMessage("");
        return;
      }
      
        setUploading(true);

      // Check authentication
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData?.session) {
            setError("You must be logged in to upload images");
            setUploading(false);
        setProgressMessage("");
            return;
          }

      // Get image info
          const uri = result.assets[0].uri;
      console.log("Selected image:", uri);
      
      try {
        // Try direct upload approach
        const uploadResult = await uploadImageDirectly(uri);
        
        if (uploadResult) {
          // Success! Save the full public URL instead of just the filename
          setImage(uploadResult.publicUrl);
          console.log("Image public URL saved:", uploadResult.publicUrl);
          } else {
          throw new Error("Upload failed to return a result");
        }
      } catch (uploadError) {
        console.error("All upload attempts failed:", uploadError);
        setError("Failed to upload image. Please check your connection and try again with a smaller image.");
      }
    } catch (error) {
      console.error("Error in image upload process:", error);
      setError(`Image upload failed: ${error.message || "Unknown error"}`);
    } finally {
      setUploading(false);
      setProgressMessage("");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Course Thumbnail</Text>
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={pickImage}
        disabled={uploading}
      >
        {image ? (
          <Image source={{ uri: getFullImageUrl(image) }} style={styles.image} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="image-outline" size={50} color={Colors.PRIMARY} />
            <Text style={styles.placeholderText}>
              {uploading ? "Uploading..." : "Tap to add course thumbnail"}
            </Text>
            {progressMessage ? (
              <Text style={styles.progressText}>{progressMessage}</Text>
            ) : null}
          </View>
        )}
      </TouchableOpacity>

      {uploading && <ActivityIndicator size="large" color={Colors.PRIMARY} />}

      {image && (
        <TouchableOpacity
          style={styles.changeButton}
          onPress={pickImage}
          disabled={uploading}
        >
          <Text style={styles.changeButtonText}>
            {uploading ? "Uploading..." : "Change Image"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#4b5563",
  },
  imageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "lightgray",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "black",
    marginBottom: 10,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  placeholderText: {
    marginTop: 10,
    color: "black",
    textAlign: "center",
  },
  progressText: {
    marginTop: 5,
    color: Colors.PRIMARY,
    fontSize: 12,
    textAlign: "center",
  },
  changeButton: {
    backgroundColor: Colors.PRIMARY,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  changeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default CourseImageUpload;
