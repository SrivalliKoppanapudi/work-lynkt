import React, { useState, useEffect } from "react";
import { ScrollView, View, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/Superbase";
import Colors from "../../constant/Colors";
import { Profile, ProfileErrors } from "../../types/profileTypes";
import ProfileHeader from "../../component/profile/ProfileHeader";
import SectionTabs from "../../component/profile/SectionTab";
import PersonalInfoSection from "../../component/profile/PersonalInfoSection";
import ProfessionalInfoSection from "../../component/profile/ProfessionalInfoSection";
import GoalsSection from "../../component/profile/GoalsSection";
import AccountSection from "../../component/profile/AccountSection";

const ProfileSetupPage = () => {
  const router = useRouter();
  const [profileData, setProfileData] = useState<Partial<Profile>>({
    name: "",
    address: "",
    phoneNumber: "",
    occupation: "",
    education: "",
    workExperience: "",
    goals: "",
    profilePicture: null,
    isVerified: false,
    privacyLevel: "public",
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPrivacySection, setShowPrivacySection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [currentSection, setCurrentSection] = useState("personal");
  const [verificationPending, setVerificationPending] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;

      if (user) {
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        setProfileData({
          name: data.name || "",
          address: data.address || "",
          phoneNumber: data.phoneNumber || "",
          occupation: data.occupation || "",
          education: data.education || "",
          workExperience: data.workExperience || "",
          goals: data.goals || "",
          profilePicture: data.profilePicture || null,
          isVerified: data.isVerified || false,
          privacyLevel: data.privacyLevel || "public",
        });
      }
    } catch (err) {
      console.error("Error fetching profile data:", err);
      Alert.alert("Error", "Failed to fetch profile data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (section: string) => {
    if (!validateFields(section)) {
      Alert.alert("Validation Error", "Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;

      if (user) {
        const updateData = { id: user.id };

        switch (section) {
          case "personal":
            Object.assign(updateData, {
              name: profileData.name,
              address: profileData.address,
              phoneNumber: profileData.phoneNumber,
            });
            break;
          case "professional":
            Object.assign(updateData, {
              occupation: profileData.occupation,
              education: profileData.education,
              workExperience: profileData.workExperience,
            });
            break;
          case "goals":
            Object.assign(updateData, { goals: profileData.goals });
            break;
          case "account":
            Object.assign(updateData, {
              isVerified: profileData.isVerified,
              privacyLevel: profileData.privacyLevel,
            });
            break;
          default:
            break;
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(updateData);

        if (profileError) throw profileError;

        if (
          section === "account" &&
          showPasswordSection &&
          currentPassword &&
          newPassword &&
          newPassword === confirmPassword
        ) {
          const { error: passwordError } = await supabase.auth.updateUser({
            password: newPassword,
          });

          if (passwordError) throw passwordError;

          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setShowPasswordSection(false);
        }

        Alert.alert("Success", "Profile updated successfully!");
        navigateToNextSection(section);
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const navigateToNextSection = (section: string) => {
    switch (section) {
      case "personal":
        setCurrentSection("professional");
        break;
      case "professional":
        setCurrentSection("goals");
        break;
      case "goals":
        setCurrentSection("account");
        break;
      default:
        break;
    }
  };

  const validateFields = (section: string) => {
    const newErrors: ProfileErrors = {};

    switch (section) {
      case "personal":
        if (!profileData.name) newErrors.name = "Name is required";
        if (!profileData.address) newErrors.address = "Address is required";
        if (!profileData.phoneNumber)
          newErrors.phoneNumber = "Phone number is required";
        break;
      case "professional":
        if (!profileData.occupation)
          newErrors.occupation = "Occupation is required";
        if (!profileData.education)
          newErrors.education = "Education is required";
        if (!profileData.workExperience)
          newErrors.workExperience = "Work experience is required";
        break;
      case "goals":
        if (!profileData.goals) newErrors.goals = "Goals are required";
        break;
      case "account":
        if (showPasswordSection) {
          if (!currentPassword)
            newErrors.currentPassword = "Current password is required";
          if (!newPassword)
            newErrors.newPassword = "New password is required";
          if (!confirmPassword)
            newErrors.confirmPassword = "Please confirm your new password";
          if (newPassword && confirmPassword && newPassword !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateProgress = () => {
    const fields = [
      profileData.name,
      profileData.address,
      profileData.phoneNumber,
      profileData.occupation,
      profileData.education,
      profileData.workExperience,
      profileData.goals,
      profileData.profilePicture,
    ];
    const filledFields = fields.filter((field) => field).length;
    return (filledFields / fields.length) * 100;
  };

  const requestVerification = async () => {
    setVerificationPending(true);
    try {
      setTimeout(() => {
        setProfileData(prev => ({ ...prev, isVerified: true }));
        setVerificationPending(false);
        Alert.alert("Success", "Your account has been verified!");
      }, 2000);
    } catch (err) {
      console.error("Error requesting verification:", err);
      Alert.alert("Error", "Failed to request verification. Please try again.");
      setVerificationPending(false);
    }
  };

  const isSectionCompleted = (section: string) => {
    switch (section) {
      case "personal":
        return !!profileData.name && !!profileData.address && !!profileData.phoneNumber;
      case "professional":
        return !!profileData.occupation && !!profileData.education && !!profileData.workExperience;
      case "goals":
        return !!profileData.goals;
      case "account":
        return !showPasswordSection || (!!currentPassword && !!newPassword && !!confirmPassword);
      default:
        return false;
    }
  };

  const handleSectionChange = (section: string) => {
    if (section !== "personal" && !isSectionCompleted("personal")) {
      Alert.alert(
        "Complete Personal Information",
        "Please complete the personal information section first.",
        [{ text: "OK" }]
      );
      return;
    }
    setCurrentSection(section);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <ProfileHeader
          profilePicture={profileData.profilePicture}
          progress={calculateProgress()}
          onImagePick={(uri) => setProfileData(prev => ({ ...prev, profilePicture: uri }))}
        />

        <SectionTabs
          currentSection={currentSection}
          onSectionChange={handleSectionChange}
          isPersonalCompleted={isSectionCompleted("personal")}
        />

        {currentSection === "personal" && (
          <PersonalInfoSection
            profileData={profileData}
            errors={errors}
            loading={loading}
            onUpdateProfile={(field, value) => setProfileData(prev => ({ ...prev, [field]: value }))}
            onSave={() => handleSaveProfile("personal")}
          />
        )}

        {currentSection === "professional" && isSectionCompleted("personal") && (
          <ProfessionalInfoSection
            profileData={profileData}
            errors={errors}
            loading={loading}
            onUpdateProfile={(field, value) => setProfileData(prev => ({ ...prev, [field]: value }))}
            onSave={() => handleSaveProfile("professional")}
          />
        )}

        {currentSection === "goals" && isSectionCompleted("personal") && (
          <GoalsSection
            goals={profileData.goals || ""}
            error={errors.goals}
            loading={loading}
            onGoalsChange={(value) => setProfileData(prev => ({ ...prev, goals: value }))}
            onSave={() => handleSaveProfile("goals")}
          />
        )}

        {currentSection === "account" && isSectionCompleted("personal") && (
          <AccountSection
            isVerified={profileData.isVerified || false}
            privacyLevel={profileData.privacyLevel || "public"}
            verificationPending={verificationPending}
            showPasswordSection={showPasswordSection}
            showPrivacySection={showPrivacySection}
            currentPassword={currentPassword}
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            errors={errors}
            loading={loading}
            onRequestVerification={requestVerification}
            onTogglePasswordSection={() => setShowPasswordSection(!showPasswordSection)}
            onTogglePrivacySection={() => setShowPrivacySection(!showPrivacySection)}
            onPrivacyChange={(level: "public" | "connections" | "private") => setProfileData(prev => ({ ...prev, privacyLevel: level }))}
            onCurrentPasswordChange={setCurrentPassword}
            onNewPasswordChange={setNewPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onSave={() => handleSaveProfile("account")}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = {
  scrollContainer: {
    paddingVertical: 20,
    backgroundColor: Colors.WHITE,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
};

export default ProfileSetupPage;