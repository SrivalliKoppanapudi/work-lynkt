// app/(screens)/AdminDashboard.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import LogoutButton from "../../component/Logout/LogoutButton";
import Colors from "../../constant/Colors";
import { useRouter } from "expo-router";
const AdminDashboard = () => {
    const router=useRouter()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>Manage users, content, and reports here.</Text>
      <LogoutButton
                style={styles.logoutButton}
                textStyle={[ { color: Colors.ERROR }]}
                onLogout={() => {
                  router.replace("/auth/SignIn");
                  
                }}
              />
    </View>
  );
};

export default AdminDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    color: "#666",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
});
