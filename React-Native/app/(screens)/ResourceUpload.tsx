import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import ResourceUploadForm from "../../component/knowledgeBase/ResourceUploadForm";
import { useRouter } from "expo-router";
import Colors from "../../constant/Colors";

export default function ResourceUpload() {
  const router = useRouter();

  const handleSuccess = () => {
    // Navigate back to the Knowledge Base Dashboard
    router.push("/KnowledgeBaseDashboard");
  };

  const handleCancel = () => {
    // Navigate back to the Knowledge Base Dashboard
    router.push("/KnowledgeBaseDashboard");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ResourceUploadForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
});