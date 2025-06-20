import React from "react";
import { View, Text, StyleSheet } from "react-native";
import InputComponent from "../../component/InputComponent";
import ButtonComponent from "../../component/ButtonComponent";
import { Profile, ProfileErrors } from "../../types/profileTypes";
import Colors from "../../constant/Colors";

interface ProfessionalInfoSectionProps {
  profileData: Partial<Profile>;
  errors: ProfileErrors;
  loading: boolean;
  onUpdateProfile: (field: string, value: string) => void;
  onSave: () => void;
}

const ProfessionalInfoSection: React.FC<ProfessionalInfoSectionProps> = ({
  profileData,
  errors,
  loading,
  onUpdateProfile,
  onSave,
}) => {
  return (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>Professional Details</Text>
      <InputComponent
        label="Occupation"
        value={profileData.occupation || ""}
        onChangeText={(value) => onUpdateProfile("occupation", value)}
        error={errors.occupation}
      />
      <InputComponent
        label="Education"
        value={profileData.education || ""}
        onChangeText={(value) => onUpdateProfile("education", value)}
        error={errors.education}
      />
      <InputComponent
        label="Work Experience"
        value={profileData.workExperience || ""}
        onChangeText={(value) => onUpdateProfile("workExperience", value)}
        error={errors.workExperience}
        multiline
        numberOfLines={3}
      />
      <ButtonComponent
        title={loading ? "Saving..." : "Save Changes"}
        onPress={onSave}
        style={styles.saveButton}
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContent: {
    backgroundColor: "#fafafa",
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: "#eee",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginVertical: 15,
    color: Colors.PRIMARY,
  },
  saveButton: {
    marginVertical: 20,
  },
});

export default ProfessionalInfoSection;