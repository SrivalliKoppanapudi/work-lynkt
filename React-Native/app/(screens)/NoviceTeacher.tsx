// app/(screens)/NoviceTeacher.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import LogoutButton from "../../component/Logout/LogoutButton";
import Colors from "../../constant/Colors";
import { useRouter } from "expo-router";

const NoviceTeacher = () => {
    const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Novice Teacher Dashboard</Text>
      <Text style={styles.subtitle}>Welcome! Start your teaching journey here.</Text>
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

export default NoviceTeacher;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
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
