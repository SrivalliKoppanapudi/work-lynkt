import React from "react";
import { View, Text, StyleSheet } from "react-native";
import InputComponent from "../../component/InputComponent";
import ButtonComponent from "../../component/ButtonComponent";
import Colors from "../../constant/Colors";

interface GoalsSectionProps {
  goals: string;
  error?: string;
  loading: boolean;
  onGoalsChange: (value: string) => void;
  onSave: () => void;
}

const GoalsSection: React.FC<GoalsSectionProps> = ({
  goals,
  error,
  loading,
  onGoalsChange,
  onSave,
}) => {
  return (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>Goals and Objectives</Text>
      <InputComponent
        label="Goals"
        value={goals}
        onChangeText={onGoalsChange}
        multiline={true}
        numberOfLines={4}
        error={error}
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

export default GoalsSection;