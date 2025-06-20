import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import ButtonComponent from "../../component/ButtonComponent";
import InputComponent from "../../component/InputComponent";
import Colors from "../../constant/Colors";

interface AccountSectionProps {
  isVerified: boolean;
  privacyLevel: string;
  verificationPending: boolean;
  showPasswordSection: boolean;
  showPrivacySection: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  errors: any;
  loading: boolean;
  onRequestVerification: () => void;
  onTogglePasswordSection: () => void;
  onTogglePrivacySection: () => void;
  onPrivacyChange: (level: string) => void;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSave: () => void;
}

const AccountSection: React.FC<AccountSectionProps> = ({
  isVerified,
  privacyLevel,
  verificationPending,
  showPasswordSection,
  showPrivacySection,
  currentPassword,
  newPassword,
  confirmPassword,
  errors,
  loading,
  onRequestVerification,
  onTogglePasswordSection,
  onTogglePrivacySection,
  onPrivacyChange,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSave,
}) => {
  return (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>Account Status</Text>
      
      <VerificationStatus 
        isVerified={isVerified} 
        verificationPending={verificationPending}
        onRequestVerification={onRequestVerification}
      />

      <PrivacySettings
        showPrivacySection={showPrivacySection}
        privacyLevel={privacyLevel}
        onTogglePrivacySection={onTogglePrivacySection}
        onPrivacyChange={onPrivacyChange}
      />

      <PasswordChange
        showPasswordSection={showPasswordSection}
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        errors={errors}
        onTogglePasswordSection={onTogglePasswordSection}
        onCurrentPasswordChange={onCurrentPasswordChange}
        onNewPasswordChange={onNewPasswordChange}
        onConfirmPasswordChange={onConfirmPasswordChange}
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

const VerificationStatus: React.FC<{
  isVerified: boolean;
  verificationPending: boolean;
  onRequestVerification: () => void;
}> = ({ isVerified, verificationPending, onRequestVerification }) => (
  <View style={styles.accountStatusContainer}>
    <View style={styles.verificationStatus}>
      <Text style={styles.accountStatusLabel}>Account Verification:</Text>
      <View style={styles.statusIndicator}>
        {isVerified ? (
          <>
            <MaterialIcons name="verified" size={24} color="green" />
            <Text style={[styles.statusText, { color: "green" }]}>Verified</Text>
          </>
        ) : (
          <>
            <Ionicons name="alert-circle" size={24} color="orange" />
            <Text style={[styles.statusText, { color: "orange" }]}>Not Verified</Text>
          </>
        )}
      </View>
    </View>

    {!isVerified && (
      <ButtonComponent
        title={verificationPending ? "Processing..." : "Verify Account"}
        onPress={onRequestVerification}
        style={styles.verifyButton}
        disabled={verificationPending}
      />
    )}
  </View>
);

const PrivacySettings: React.FC<{
  showPrivacySection: boolean;
  privacyLevel: string;
  onTogglePrivacySection: () => void;
  onPrivacyChange: (level: string) => void;
}> = ({ showPrivacySection, privacyLevel, onTogglePrivacySection, onPrivacyChange }) => (
  <View style={styles.privacySection}>
    <TouchableOpacity
      style={styles.passwordToggle}
      onPress={onTogglePrivacySection}
    >
      <Text style={styles.passwordToggleText}>
        {showPrivacySection ? "Hide Privacy Settings" : "Privacy Settings"}
      </Text>
      <Ionicons
        name={showPrivacySection ? "chevron-up" : "chevron-down"}
        size={20}
        color={Colors.PRIMARY}
      />
    </TouchableOpacity>

    {showPrivacySection && (
      <View style={styles.privacyOptions}>
        <Text style={styles.privacyLabel}>Who can view your profile:</Text>

        {[
          { value: "public", icon: "globe-outline" as const, title: "Public", description: "Anyone can view your profile" },
          { value: "connections", icon: "people-outline" as const, title: "Friends Only", description: "Only your connections can view your profile" },
          { value: "private", icon: "lock-closed-outline" as const, title: "Private", description: "Only you can view your profile" },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.privacyOption,
              privacyLevel === option.value && styles.selectedPrivacyOption,
            ]}
            onPress={() => onPrivacyChange(option.value)}
          >
            <View style={styles.privacyOptionContent}>
              <Ionicons
                name={option.icon}
                size={22}
                color={privacyLevel === option.value ? Colors.PRIMARY : "#666"}
              />
              <View style={styles.privacyTextContainer}>
                <Text
                  style={[
                    styles.privacyOptionTitle,
                    privacyLevel === option.value && { color: Colors.PRIMARY },
                  ]}
                >
                  {option.title}
                </Text>
                <Text style={styles.privacyOptionDescription}>
                  {option.description}
                </Text>
              </View>
            </View>
            {privacyLevel === option.value && (
              <Ionicons name="checkmark-circle" size={22} color={Colors.PRIMARY} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
);

const PasswordChange: React.FC<{
  showPasswordSection: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  errors: any;
  onTogglePasswordSection: () => void;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
}> = ({
  showPasswordSection,
  currentPassword,
  newPassword,
  confirmPassword,
  errors,
  onTogglePasswordSection,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
}) => (
  <View style={styles.passwordSection}>
    <TouchableOpacity
      style={styles.passwordToggle}
      onPress={onTogglePasswordSection}
    >
      <Text style={styles.passwordToggleText}>
        {showPasswordSection ? "Hide Password Change" : "Change Password"}
      </Text>
      <Ionicons
        name={showPasswordSection ? "chevron-up" : "chevron-down"}
        size={20}
        color={Colors.PRIMARY}
      />
    </TouchableOpacity>

    {showPasswordSection && (
      <View style={styles.passwordFields}>
        <InputComponent
          label="Current Password"
          value={currentPassword}
          onChangeText={onCurrentPasswordChange}
          secureTextEntry
          error={errors.currentPassword}
        />
        <InputComponent
          label="New Password"
          value={newPassword}
          onChangeText={onNewPasswordChange}
          secureTextEntry
          error={errors.newPassword}
        />
        <InputComponent
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={onConfirmPasswordChange}
          secureTextEntry
          error={errors.confirmPassword}
        />
      </View>
    )}
  </View>
);

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
  accountStatusContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  verificationStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  accountStatusLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#444",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    marginLeft: 5,
    fontWeight: "500",
    fontSize: 16,
  },
  verifyButton: {
    marginBottom: 10,
  },
  passwordSection: {
    marginTop: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 15,
  },
  passwordToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  passwordToggleText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.PRIMARY,
  },
  passwordFields: {
    marginTop: 15,
  },
  privacySection: {
    marginTop: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  privacyOptions: {
    marginTop: 15,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#444",
    marginBottom: 10,
  },
  privacyOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedPrivacyOption: {
    borderColor: Colors.PRIMARY,
    backgroundColor: "#f0f8ff",
  },
  privacyOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  privacyTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#444",
  },
  privacyOptionDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  saveButton: {
    marginVertical: 20,
  },
});

export default AccountSection;