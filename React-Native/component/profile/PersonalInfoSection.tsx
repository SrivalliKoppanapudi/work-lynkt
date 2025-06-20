import React from "react";
import { View, Text, StyleSheet } from "react-native";
import InputComponent from "../../component/InputComponent";
import ButtonComponent from "../../component/ButtonComponent";
import { Profile, ProfileErrors } from "../../types/profileTypes";
import Colors from "../../constant/Colors";

interface PersonalInfoSectionProps {
  profileData: Partial<Profile>;
  errors: ProfileErrors;
  loading: boolean;
  onUpdateProfile: (field: string, value: string) => void;
  onSave: () => void;
}

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  profileData,
  errors,
  loading,
  onUpdateProfile,
  onSave,
}) => {
  return (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>Personal Information</Text>
      <InputComponent
        label="Name"
        value={profileData.name || ""}
        onChangeText={(value) => onUpdateProfile("name", value)}
        error={errors.name}
      />
      <InputComponent
        label="Address"
        value={profileData.address || ""}
        onChangeText={(value) => onUpdateProfile("address", value)}
        error={errors.address}
      />
      <InputComponent
        label="Phone Number"
        value={profileData.phoneNumber || ""}
        onChangeText={(value) => onUpdateProfile("phoneNumber", value)}
        keyboardType="phone-pad"
        error={errors.phoneNumber}
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

export default PersonalInfoSection;