import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { supabase } from "../../lib/Superbase";
import Colors from "../../constant/Colors";

type ProfileSummaryProps = {
  name?: string;
  goals?: string;
  objectives?: string;
  isLoading: boolean;
};

const ProfileSummary = ({
  name,
  goals,
  objectives,
  isLoading,
}: ProfileSummaryProps) => {
  const [profileData, setProfileData] = useState<{
    name?: string;
    goals?: string;
    objectives?: string;
  }>({
    name: "",
    goals: "",
    objectives: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;

      if (user) {
        const userRole = user.user_metadata?.role || "";
        setRole(userRole);

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("name, goals, objectives")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;
        setProfileData(data || { name: "", goals: "", objectives: "" });
      }
    } catch (err: any) {
      setError(err.message || "Unknown error occurred");
      console.error("Error fetching profile data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const goalsArray = profileData?.goals
    ? String(profileData.goals)
        .split(",")
        .map((goal) => goal.trim())
        .filter((goal) => goal)
    : [];

  const objectivesArray = profileData?.objectives
    ? String(profileData.objectives)
        .split(",")
        .map((objective) => objective.trim())
        .filter((objective) => objective)
    : [];

  if (loading || isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile Summary</Text>
        {role && <Text style={styles.roleText}>Role: {role}</Text>}
      </View>

      <View style={styles.content}>
        {goalsArray.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goals</Text>
            {goalsArray.slice(0, 2).map((goal, index) => (
              <Text key={index} style={styles.itemText}>
                • {goal}
              </Text>
            ))}
            {goalsArray.length > 2 && (
              <Text style={styles.moreText}>+{goalsArray.length - 2} more</Text>
            )}
          </View>
        )}

        {objectivesArray.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Objectives</Text>
            {objectivesArray.slice(0, 2).map((objective, index) => (
              <Text key={index} style={styles.itemText}>
                • {objective}
              </Text>
            ))}
            {objectivesArray.length > 2 && (
              <Text style={styles.moreText}>
                +{objectivesArray.length - 2} more
              </Text>
            )}
          </View>
        )}

        {goalsArray.length === 0 && objectivesArray.length === 0 && (
          <Text style={styles.emptyText}>No goals or objectives set yet</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WHITE,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
  },
  roleText: {
    fontSize: 14,
    color: "#8E8E93",
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8E8E93",
    marginBottom: 8,
  },
  itemText: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 4,
  },
  moreText: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    color: Colors.ERROR,
    textAlign: "center",
    padding: 16,
  },
});

export default ProfileSummary;
