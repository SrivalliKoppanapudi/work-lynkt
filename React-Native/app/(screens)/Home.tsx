import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  FlatList,
  TouchableWithoutFeedback,
  Alert, // Add FlatList
  RefreshControl, // Add RefreshControl import
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import Colors from "../../constant/Colors";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../../lib/Superbase";
import CourseCard from "../../component/CourseCard";
import Header from "../../component/Home/Header";
import QuickAccessLinks from "../../component/dashboard/QuickAccessLink";
import LogoutButton from "../../component/Logout/LogoutButton";


const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.7;


export default function HomePage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const [userData, setUserData] = useState({
    name: "Enter your name",
    email: " ",
    profilePicture: null,
    isVerified: false,
    
  });
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]); // State to store courses
  const [refreshing, setRefreshing] = useState(false); // Add refreshing state

  useEffect(() => {
    fetchUserData();
    fetchCourses();
  }, []);

  useEffect(() => {
    setLoading(true)
  const initialize = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;

      if (user) {
        const role = user.user_metadata?.role;

        if (!role) {
          Alert.alert("Error", "User role not found.");
          return;
        }

        // Role-based routing
        switch (role) {
          case "teacher":
            
            break;
          case "noviceTeacher":
            router.replace("/(screens)/NoviceTeacher");
            break;
          case "admin":
            router.replace("/(screens)/AdminDashboard");
            break;
          case "experiencedTeacher":
            router.replace("/(screens)/ExperiencedTeacher")
            break;
          case "guestTeacher":
            router.replace("/(screens)/GuestTeacher")
            break;
          default:
            Alert.alert("Unauthorized", "Unknown user role.");
            break;
        }
      }
    } catch (err) {
      console.error("Error during role-based navigation:", err);
      Alert.alert("Error", "Failed to load user info.");
    }
  };

  initialize();
  setLoading(false)
}, []);


  // Add refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Clear existing data first to ensure we see the refresh
      setCourses([]);
      setUserData({
        name: "Loading...",
        email: "Loading...",
        profilePicture: null,
        isVerified: false,
       
      });
      
      // Fetch new data
      await fetchUserData();
      await fetchCourses();
      
      // Add a small delay to make the refresh more noticeable
      setTimeout(() => {
        setRefreshing(false);
      }, 500);
    } catch (error) {
      console.error("Error refreshing data:", error);
      Alert.alert("Error", "Failed to refresh data. Please try again.");
      setRefreshing(false);
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;

      if (user) {
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select(
            "name, profilePicture, address, phoneNumber, occupation, education, workExperience, goals, isVerified"
          )
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        if (data) {
          setUserData({
            name: data.name || "User Name",
            email: user.email || "user@example.com",
            profilePicture: data.profilePicture,
            isVerified: data.isVerified || false,
            
            
          });

          const fields = [
            data.name,
            data.address,
            data.phoneNumber,
            data.occupation,
            data.education,
            data.workExperience,
            data.goals,
            data.profilePicture,
          ];
          const filledFields = fields.filter((field) => field).length;
          const completeness = (filledFields / fields.length) * 100;
          setProfileCompleteness(completeness);
          
        }
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setCourses(data); // Store fetched courses in state
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const toggleDrawer = () => {
    const toValue = drawerOpen ? -DRAWER_WIDTH : 0;
    Animated.timing(translateX, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setDrawerOpen(!drawerOpen);
  };

  const closeDrawer = () => {
    Animated.timing(translateX, {
      toValue: -DRAWER_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setDrawerOpen(false);
  };

  const navigationItems = [
    { title: "Home", icon: "home-outline", route: "/Home" },
    { title: "Knowledge Base", icon: "library-outline", route: "/KnowledgeBaseDashboard" },
    { title: "Courses", icon: "book-outline", route: "/courses" },
    { title: "Profile", icon: "person-outline", route: "/Profile" },
    { title: "Goals", icon: "trophy-outline", route: "/goals" },
    {title: "Account Settings",
      icon: "settings-outline",
      route: "/AccountSetting",
    }, 
    
  {
  title: "Social Media",
  icon: "chatbubble-ellipses-outline",
  route: "/SocialMediaDashboard",
}

  ];

  return (
    <View style={styles.container}>
      {/* Drawer Overlay */}
      {drawerOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeDrawer}
        />
      )}

      {/* Side Menu Drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        <View style={styles.drawerHeader}>
          <View style={styles.profileImageContainer}>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.PRIMARY} />
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => {
                    router.push("/(screens)/Profile");
                  }}
                >
                  <View style={styles.profileImageWrapper}>
                    <Image
                      source={
                        userData.profilePicture
                          ? { uri: userData.profilePicture }
                          : require("../../assets/images/default.png")
                      }
                      style={styles.profileImage}
                    />
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.nameContainer}>
            <Text
              style={styles.profileName}
              onPress={() => {
                router.push("/(screens)/Profile");
              }}
            >
              {userData.name}
            </Text>
            {userData.isVerified && (
              <MaterialIcons
                name="verified"
                size={24}
                color="green"
                style={styles.verificationBadge}
              />
            )}
          </View>

          <Text style={styles.profileEmail}>{userData.email}</Text>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${profileCompleteness}%`},
              ]}
            />
          </View>
          <Text style={styles.completenessText}>
            {Math.round(profileCompleteness)}% Complete
          </Text>
        </View>

        <ScrollView style={styles.drawerContent}>
          {navigationItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.drawerItem}
              onPress={() => {
                router.push(item.route as any);
                closeDrawer();
              }}
            >
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={24}
                color={Colors.PRIMARY}
              />
              <Text style={styles.drawerItemText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <LogoutButton
          style={styles.logoutButton}
          textStyle={[styles.drawerItemText, { color: Colors.ERROR }]}
          onLogout={() => {
            router.replace("/auth/SignIn");
            closeDrawer();
          }}
        />
      </Animated.View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton}>
            <Ionicons name="menu-outline" size={30} color={Colors.PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>LYNKT</Text>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons
              name="notifications-outline"
              size={24}
              color={Colors.PRIMARY}
            />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.PRIMARY]}
              tintColor={Colors.PRIMARY}
            />
          }
        >
          {/* Welcome Section */}
          <Header />
          <QuickAccessLinks/>

          {/* Display Courses Horizontally */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Your Courses</Text>
            {courses.length > 0 ? (
              <FlatList
                data={courses}
                renderItem={({ item }) => (
                  <CourseCard
                    key={item.id}
                    course={item} // Pass the course data to the CourseCard component
                  />
                )}
                keyExtractor={(item) => item.id}
                horizontal // Set horizontal to true
                showsHorizontalScrollIndicator={false} // Hide scroll indicator
                contentContainerStyle={{ paddingHorizontal: 8 }} // Add padding for better spacing
              />
            ) : (
              <Text style={styles.noCoursesText}>No courses available.</Text>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 1,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: -9,
    width: DRAWER_WIDTH,
    height: "100%",
    backgroundColor: Colors.WHITE,
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
  },
  profileImageContainer: {
    width: 90,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    position: "relative",
  },
  profileImageWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  profileImage: {
    width: 68,
    height: 68,
    resizeMode: "cover",
    borderRadius: 40,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.PRIMARY,
  },
  verificationBadge: {
    marginLeft: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  progressBarContainer: {
    width: "100%",
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    marginTop: 10,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.PRIMARY,
    borderRadius: 3,
  },
  completenessText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  drawerContent: {
    flex: 1,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  drawerItemText: {
    fontSize: 16,
    marginLeft: 15,
    color: Colors.PRIMARY,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.PRIMARY,
  },
  notificationButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 5,
    margin: -5,
  },
  welcomeSection: {
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.PRIMARY,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.PRIMARY,
    margin: 10,
  },
  noCoursesText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
  recentActivitiesContainer: {
    padding: 8,
  },
});