import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ProgressBar } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constant/Colors";
import { useRouter } from "expo-router";

interface ProfileHeaderProps {
  profilePicture: string | null;
  progress: number;
  onImagePick: (uri: string) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profilePicture,
  progress,
  onImagePick,
}) => {
  const router = useRouter();
  const handleImagePicker = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      onImagePick(result.assets[0].uri);
    }
  };

  const getProgressColor = () => {
    if (progress >= 100) return "#4CAF50";
    if (progress >= 75) return "#8BC34A";
    if (progress >= 50) return "#FFC107";
    if (progress >= 30) return "#FF9800";
    return Colors.PRIMARY;
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
      </Pressable>
      <Text style={styles.progressText}>{Math.round(progress)}% Complete</Text>
      <ProgressBar
        progress={progress / 100}
        color={getProgressColor()}
        style={styles.progressBar}
      />

      <Text style={styles.sectionTitle}>Profile Picture</Text>
      <View style={styles.profilePictureContainer}>
        {profilePicture ? (
          <TouchableOpacity onPress={handleImagePicker}>
            <Image
              source={{ uri: profilePicture }}
              style={styles.profilePicture}
            />
            <View style={styles.editOverlay}>
              <Ionicons name="camera" size={24} color="white" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleImagePicker}
            style={styles.profilePicturePlaceholder}
          >
            <Ionicons name="person" size={40} color="gray" />
            <Text style={styles.placeholderText}>Upload Photo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    color: Colors.PRIMARY,
    textAlign: "center",
    marginBottom: 5,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginVertical: 15,
    color: Colors.PRIMARY,
  },
  profilePictureContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editOverlay: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: Colors.PRIMARY,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "lightgray",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "gray",
    borderStyle: "dashed",
  },
  placeholderText: {
    color: "gray",
    fontSize: 14,
    marginTop: 5,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default ProfileHeader;
