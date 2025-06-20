import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import Colors from "../../constant/Colors";

interface SectionTabsProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
  isPersonalCompleted: boolean;
}

const sections = [
  { id: "personal", label: "Personal" },
  { id: "professional", label: "Professional" },
  { id: "goals", label: "Goals" },
  { id: "account", label: "Account" },
];

const SectionTabs: React.FC<SectionTabsProps> = ({
  currentSection,
  onSectionChange,
  isPersonalCompleted,
}) => {
  return (
    <View style={styles.tabContainer}>
      {sections.map((section) => (
        <TouchableOpacity
          key={section.id}
          style={[
            styles.tab,
            currentSection === section.id && styles.activeTab,
            !isPersonalCompleted &&
              section.id !== "personal" &&
              styles.disabledTab,
          ]}
          onPress={() => onSectionChange(section.id)}
          disabled={!isPersonalCompleted && section.id !== "personal"}
        >
          <Text
            style={[
              styles.tabText,
              currentSection === section.id && styles.activeTabText,
              !isPersonalCompleted &&
                section.id !== "personal" &&
                styles.disabledTabText,
            ]}
          >
            {section.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    marginBottom: 15,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    gap: 2,
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  
  },
  activeTab: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 6,
  },
  disabledTab: {
    opacity: 0.6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "white",
  },
  disabledTabText: {
    color: "#999",
  },
});

export default SectionTabs;
