import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { supabase } from "../../lib/Superbase";
import { useAuth } from "../../Context/auth";
import GoalForm from "../../component/goals/GoalForm";
import GoalItem from "../../component/goals/GoalItem";
import { Goal } from "../../types/goalsTypes";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constant/Colors";
import { router } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function GoalsManagementPage() {
  const { session } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState<Goal>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    progress: 0,
    planSteps: [],
    status: "not_started",
  });
  const [newStep, setNewStep] = useState("");
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, [session]);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setGoals(
        data?.map((goal) => ({
          ...goal,
          planSteps: goal.plan_steps || [],
          startDate: goal.start_date,
          endDate: goal.end_date,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching goals:", error);
      Alert.alert("Error", "Failed to fetch goals");
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (steps: Goal["planSteps"]) => {
    if (steps.length === 0) return 0;
    const completedSteps = steps.filter((step) => step.completed).length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const handleSaveGoal = async () => {
    if (!goal.title || !goal.description || !goal.startDate || !goal.endDate) {
      Alert.alert("Missing Information", "Please fill in all required fields.");
      return;
    }

    const startDate = new Date(goal.startDate);
    const endDate = new Date(goal.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      Alert.alert(
        "Invalid Date",
        "Please enter valid dates in the format YYYY-MM-DD."
      );
      return;
    }

    if (startDate > endDate) {
      Alert.alert("Invalid Date Range", "Start date must be before end date.");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("goals").insert([
        {
          user_id: session?.user.id,
          title: goal.title,
          description: goal.description,
          start_date: goal.startDate,
          end_date: goal.endDate,
          progress: goal.progress,
          plan_steps: goal.planSteps,
          status: goal.status,
        },
      ]);

      if (error) throw error;

      Alert.alert("Success", "Goal saved successfully!");
      setGoal({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        progress: 0,
        planSteps: [],
        status: "not_started",
      });
      fetchGoals();
    } catch (error) {
      console.error("Error saving goal:", error);
      Alert.alert("Error", error.message || "Failed to save goal");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      const updateData: any = {};

      // Handle special cases for column mapping
      if ("startDate" in updates)
        updateData.start_date = new Date(updates.startDate)
          .toISOString()
          .split("T")[0];
      if ("endDate" in updates)
        updateData.end_date = new Date(updates.endDate)
          .toISOString()
          .split("T")[0];
      if ("planSteps" in updates) {
        updateData.plan_steps = updates.planSteps;
        updateData.progress = calculateProgress(updates.planSteps);
      }

      // Handle other fields
      if ("title" in updates) updateData.title = updates.title;
      if ("description" in updates)
        updateData.description = updates.description;
      if ("status" in updates) updateData.status = updates.status;

      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from("goals")
        .update(updateData)
        .eq("id", goalId);

      if (error) throw error;

      // Update local state with progress calculation
      setGoals(
        goals.map((g) => {
          if (g.id === goalId) {
            const updatedGoal = { ...g, ...updates };
            // If plan steps were updated, recalculate progress
            if ("planSteps" in updates) {
              updatedGoal.progress = calculateProgress(updatedGoal.planSteps);
            }
            return updatedGoal;
          }
          return g;
        })
      );
    } catch (error) {
      console.error("Error updating goal:", error);
      Alert.alert("Error", "Failed to update goal");
    }
  };

  const handleAddStep = () => {
    if (newStep.trim()) {
      setGoal((prev) => {
        const updatedPlanSteps = [
          ...prev.planSteps,
          {
            id: Math.random().toString(),
            description: newStep.trim(),
            completed: false,
          },
        ];
        return {
          ...prev,
          planSteps: updatedPlanSteps,
          progress: calculateProgress(updatedPlanSteps),
        };
      });
      setNewStep("");
    }
  };

  const handleRemoveStep = (stepId: string) => {
    setGoal((prev) => {
      const updatedPlanSteps = prev.planSteps.filter(
        (step) => step.id !== stepId
      );
      return {
        ...prev,
        planSteps: updatedPlanSteps,
        progress: calculateProgress(updatedPlanSteps),
      };
    });
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      // Confirm before deleting
      Alert.alert("Delete Goal", "Are you sure you want to delete this goal?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("goals")
              .delete()
              .eq("id", goalId);

            if (error) throw error;

            // Update local state
            setGoals(goals.filter((g) => g.id !== goalId));
            Alert.alert("Success", "Goal deleted successfully!");
          },
        },
      ]);
    } catch (error) {
      console.error("Error deleting goal:", error);
      Alert.alert("Error", "Failed to delete goal");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={{flexDirection:'row'}}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={Colors.PRIMARY}
          onPress={() => router.back()}
        />
        <Text style={styles.title}>Your Goals</Text>
        </View>

        {goals.length > 0 ? (
          goals.map((goal) => (
            <GoalItem
              key={goal.id}
              goal={goal}
              isExpanded={expandedGoal === goal.id}
              onToggleExpand={() =>
                setExpandedGoal(expandedGoal === goal.id ? null : goal.id)
              }
              onUpdate={(updates) => handleUpdateGoal(goal.id!, updates)}
              onDelete={() => handleDeleteGoal(goal.id!)}
            />
          ))
        ) : (
          <Text style={styles.noGoalsText}>
            No goals yet. Create your first goal!
          </Text>
        )}

        <GoalForm
          goal={goal}
          setGoal={setGoal}
          handleSaveGoal={handleSaveGoal}
          newStep={newStep}
          setNewStep={setNewStep}
          handleAddStep={handleAddStep}
          handleRemoveStep={handleRemoveStep}
          isSaving={isSaving}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
  },
  title: {
    flex:1,
    alignItems:'center',
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  noGoalsText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginVertical: 20,
  },
  button: {
    marginTop: 20,
  },
});
