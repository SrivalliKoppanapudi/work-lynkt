import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/Superbase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ButtonComponent from "../../component/ButtonComponent";
import InputComponent from "../../component/InputComponent";
import Colors from "../../constant/Colors";
import {
  AntDesign,
  Ionicons,
  FontAwesome,
  MaterialIcons,
} from "@expo/vector-icons";


const AccountSettings = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  // Language settings
  const [language, setLanguage] = useState("english");
  const languages = ["english", "kannada ", "hindi", "telugu", "malayalam"];

  // Linked accounts
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);

  // Modal for account deletion confirmation
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  // Fetch user settings when component mounts
  useEffect(() => {
    fetchUserSettings();
  }, []);

  // Fetch user settings from Supabase
  const fetchUserSettings = async () => {
    setLoading(true);
    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (user) {
        setUserId(user.id);

        // Fetch user settings from the database
        const { data, error } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 means no rows returned
          throw error;
        }

        if (data) {
          // Update state with fetched settings
          setEmailNotifications(data.email_notifications ?? true);
          setInAppNotifications(data.in_app_notifications ?? true);
          setLanguage(data.language || "english");
        }

        // Fetch linked accounts
        const { data: linkedData, error: linkedError } = await supabase
          .from("linked_accounts")
          .select("*")
          .eq("user_id", user.id);

        if (linkedError) throw linkedError;

        if (linkedData) {
          setLinkedAccounts(linkedData);
        }

        // Load language preference from AsyncStorage as well
        const storedLanguage = await AsyncStorage.getItem("userLanguage");
        if (storedLanguage) {
          setLanguage(storedLanguage);
        }
      }
    } catch (err) {
      console.error("Error fetching user settings:", err);
      Alert.alert("Error", "Failed to load settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Save all settings
  const saveSettings = async () => {
    if (!userId) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    setLoading(true);
    try {
      // Save settings to Supabase
      const { error } = await supabase.from("user_settings").upsert({
        user_id: userId,
        email_notifications: emailNotifications,
        in_app_notifications: inAppNotifications,
        language: language,
        updated_at: new Date().toISOString(),
      });
      console.log("Settings saved successfully:", {
        emailNotifications,
        inAppNotifications,
        language,
      });
      if (error) throw error;

      // Save language preference to AsyncStorage for local persistence
      await AsyncStorage.setItem("userLanguage", language);

      Alert.alert("Success", "Settings saved successfully");
    } catch (err) {
      console.error("Error saving settings:", err);
      Alert.alert("Error", "Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Unlink an account
  const unlinkAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("linked_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;

      // Update the linked accounts list
      setLinkedAccounts(
        linkedAccounts.filter((account) => account.id !== accountId)
      );

      Alert.alert("Success", "Account unlinked successfully");
    } catch (err) {
      console.error("Error unlinking account:", err);
      Alert.alert("Error", "Failed to unlink account. Please try again.");
    }
  };

  // Deactivate account (temporary)
  const deactivateAccount = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: false })
        .eq("id", userId);

      if (error) throw error;

      Alert.alert(
        "Account Deactivated",
        "Your account has been deactivated. You can reactivate it by logging in again.",
        [
          {
            text: "OK",
            onPress: async () => {
              await supabase.auth.signOut();
              router.replace("/auth/SignIn");
            },
          },
        ]
      );
    } catch (err) {
      console.error("Error deactivating account:", err);
      Alert.alert("Error", "Failed to deactivate account. Please try again.");
    }
  };

  // Delete account (permanent)
  // const deleteAccount = async () => {
  //   if (!userId) return;

  //   setDeleteModalVisible(false);
  //   setLoading(true);

  //   try {
  //     // Delete user data from all related tables
  //     // This should be done in a transaction or with cascade delete in the database

  //     // Delete from user_settings
  //     await supabase.from("user_settings").delete().eq("user_id", userId);

  //     // Delete from linked_accounts
  //     await supabase.from("linked_accounts").delete().eq("user_id", userId);

  //     // Delete from profiles
  //     await supabase.from("profiles").delete().eq("id", userId);

  //     // Finally delete the user authentication record
  //     const { error } = await supabase.auth.admin.deleteUser(userId);

  //     if (error) {
  //       // If admin delete fails, at least sign out the user
  //       console.error("Error deleting user auth record:", error);
  //       await supabase.auth.signOut();
  //     }

  //     Alert.alert(
  //       "Account Deleted",
  //       "Your account has been permanently deleted.",
  //       [{ text: "OK", onPress: () => router.replace("/auth/SignUp") }]
  //     );
  //   } catch (err) {
  //     console.error("Error deleting account:", err);
  //     Alert.alert("Error", "Failed to delete account. Please try again.");
  //     setLoading(false);
  //   }
  // };
  const deleteAccount = async () => {
    if (!userId || !password) {
      setPasswordError("Please enter your password");
      return;
    }

    setLoading(true);

    try {
      // First verify the password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || "",
        password: password,
      });

      if (authError) {
        throw authError;
      }

      // If password is correct, proceed with deletion
      // Delete user data from all related tables

      // Delete from user_settings
      await supabase.from("user_settings").delete().eq("user_id", userId);

      // Delete from linked_accounts
      await supabase.from("linked_accounts").delete().eq("user_id", userId);

      // Delete from profiles
      await supabase.from("profiles").delete().eq("id", userId);

      // Finally delete the user authentication record
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        // If admin delete fails, at least sign out the user
        console.error("Error deleting user auth record:", error);
        await supabase.auth.signOut();
      }

      Alert.alert(
        "Account Deleted",
        "Your account has been permanently deleted.",
        [{ text: "OK", onPress: () => router.replace("/auth/SignUp") }]
      );
    } catch (err) {
      console.error("Error deleting account:", err);
      setPasswordError("Incorrect password. Please try again.");
      setLoading(false);
    }
  };
  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Handle social media login button click
  const handleSocialMediaLogin = (platform: string) => {
    Alert.alert("Info", `Implement ${platform} login will do later.`);
  };

  return (

    <ScrollView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
        </View>
      )}

      {!loading && (
        <View style={styles.content}>
          {/* Notification Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Settings</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: "#767577", true: Colors.PRIMARY }}
                thumbColor={emailNotifications ? "#f4f3f4" : "#f4f3f4"}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>In-App Notifications</Text>
              <Switch
                value={inAppNotifications}
                onValueChange={setInAppNotifications}
                trackColor={{ false: "#767577", true: Colors.PRIMARY }}
                thumbColor={inAppNotifications ? "#f4f3f4" : "#f4f3f4"}
              />
            </View>
          </View>

          {/* Language Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Language Settings</Text>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={language}
                onValueChange={(itemValue) => setLanguage(itemValue)}
                style={styles.picker}
              >
                {languages.map((lang) => (
                  <Picker.Item
                    key={lang}
                    label={lang.charAt(0).toUpperCase() + lang.slice(1)}
                    value={lang}
                  />
                ))}
              </Picker>
            </View>
          </View>

 

          {/* Linked Accounts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Linked Accounts</Text>

            {linkedAccounts.length === 0 ? (
              <Text style={styles.noAccountsText}>
                No linked accounts found
              </Text>
            ) : (
              linkedAccounts.map((account) => (
                <View key={account.id} style={styles.linkedAccountRow}>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountProvider}>
                      {account.provider}
                    </Text>
                    <Text style={styles.accountEmail}>
                      {account.email || account.username}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => unlinkAccount(account.id)}
                    style={styles.unlinkButton}
                  >
                    <Text style={styles.unlinkText}>Unlink</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Add Social Media Login Buttons */}
            <Text style={styles.linkAccountsLabel}>Link new account:</Text>
            <View style={styles.oauthContainer}>
              {/* Google Login Button */}
              <TouchableOpacity
                style={styles.oauthButton}
                onPress={() => handleSocialMediaLogin("Google")}
              >
                <FontAwesome name="google" size={24} color="#DB4437" />
                <Text style={styles.oauthText}></Text>
              </TouchableOpacity>

              {/* Facebook Login Button */}
              <TouchableOpacity
                style={styles.oauthButton}
                onPress={() => handleSocialMediaLogin("Facebook")}
              >
                <FontAwesome name="facebook" size={24} color="#1877F2" />
                <Text style={styles.oauthText}></Text>
              </TouchableOpacity>

              {/* LinkedIn Login Button */}
              <TouchableOpacity
                style={styles.oauthButton}
                onPress={() => handleSocialMediaLogin("LinkedIn")}
              >
                <FontAwesome name="linkedin" size={24} color="#0077B5" />
                <Text style={styles.oauthText}></Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Management Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Management</Text>
            <ButtonComponent
              title="Save Changes"
              onPress={saveSettings}
              style={styles.saveButton}
              loading={loading}
            />

            <ButtonComponent
              title="Deactivate Account"
              onPress={() => {
                Alert.alert(
                  "Deactivate Account",
                  "Are you sure you want to deactivate your account? You can reactivate it by logging in again.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Deactivate",
                      onPress: deactivateAccount,
                      style: "destructive",
                    },
                  ]
                );
              }}
              backgroundColor="#FFA500"
              style={styles.deactivateButton}
            />

            {/* <ButtonComponent
              title="Delete Account"
              onPress={() => setDeleteModalVisible(true)}
              backgroundColor={Colors.ERROR}
              style={styles.deleteButton}
            /> */}
            <ButtonComponent
              title="Delete Account"
              onPress={() => {
                Alert.alert(
                  "Delete Account",
                  "To delete your account, you will need to confirm your password.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Continue",
                      onPress: () => setDeleteModalVisible(true),
                      style: "destructive",
                    },
                  ]
                );
              }}
              backgroundColor={Colors.ERROR}
              style={styles.deleteButton}
            />
          </View>
        </View>
      )}

      {/* Delete Account Confirmation Modal */}
      {/* <Modal
        animationType="slide"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalText}>
              Are you sure you want to permanently delete your account? This
              action cannot be undone.
            </Text>
            <Text style={styles.modalWarning}>
              All your data will be permanently deleted, including profile
              information, settings, and linked accounts.
            </Text>

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={deleteAccount}
              >
                <Text style={styles.confirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal> */}

      <Modal
        animationType="slide"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => {
          setDeleteModalVisible(false);
          setPassword("");
          setPasswordError("");
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalText}>
              Are you sure you want to permanently delete your account? This
              action cannot be undone.
            </Text>
            <Text style={styles.modalWarning}>
              All your data will be permanently deleted, including profile
              information, settings, and linked accounts.
            </Text>

            {/* Password Input */}
            <View style={styles.passwordInputContainer}>
              <Text style={styles.passwordLabel}>
                Enter your password to confirm:
              </Text>
              <InputComponent
                secureTextEntry
                placeholder="Your password"
                value={password}
                label="Password"
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError("");
                }}
                error={passwordError}
              />
            </View>

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setPassword("");
                  setPasswordError("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={deleteAccount}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.WHITE} />
                ) : (
                  <Text style={styles.confirmButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 15,
    color: Colors.PRIMARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    padding: 15,
  },
  section: {
    marginBottom: 25,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: Colors.PRIMARY,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  settingLabel: {
    fontSize: 16,
    color: "#333",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 5,
    marginTop: 5,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  noAccountsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 15,
  },
  linkedAccountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  accountInfo: {
    flex: 1,
  },
  accountProvider: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  accountEmail: {
    fontSize: 14,
    color: "#666",
  },
  unlinkButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  unlinkText: {
    color: Colors.ERROR,
    fontSize: 14,
    fontWeight: "bold",
  },
  linkAccountsLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
  },
  oauthContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    overflow: "hidden",
  },
  oauthButton: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
    gap: 20,
  },
  oauthText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "bold",
  },
  saveButton: {
    marginBottom: 15,
  },
  deactivateButton: {
    marginBottom: 15,
  },
  deleteButton: {
    marginBottom: 10,
  },
  passwordInputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  passwordLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: Colors.WHITE,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: Colors.ERROR,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  modalWarning: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: Colors.ERROR,
  },
  themeToggleContainer: {
    marginVertical: 10,
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: "45%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  confirmButton: {
    backgroundColor: Colors.ERROR,
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "bold",
  },
  confirmButtonText: {
    color: Colors.WHITE,
    fontWeight: "bold",
  },
});

export default AccountSettings;
