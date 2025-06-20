import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
} from "react-native";
import * as SecureStore from 'expo-secure-store';
import Colors from "./../../constant/Colors";
import { Link, useRouter } from "expo-router";
import { supabase } from "./../../lib/Superbase";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";
import Checkbox from "expo-checkbox";

const SignIn = () => {
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check for existing session on component mount
  useEffect(() => {
    checkForExistingSession();
  }, []);

  // Function to check if user has a stored session
  const checkForExistingSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      
      if (session && !error) {
        // Valid session exists, navigate to home
        router.replace('/(screens)/Home');
        return;
      }

      // Check for stored credentials if no active session
      const storedSession = await SecureStore.getItemAsync('supabase_session');
      if (storedSession) {
        const { access_token, refresh_token } = JSON.parse(storedSession);
        
        // Try to refresh the session
        const { data, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token
        });
        
        if (data?.session && !refreshError) {
          router.replace('/(screens)/Home');
          return;
        } else {
          // Clear invalid stored session
          await SecureStore.deleteItemAsync('supabase_session');
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
      // Clear potentially corrupted session data
      await SecureStore.deleteItemAsync('supabase_session');
    }
    
    setIsLoading(false);
  };

  const handleSignIn = async (values) => {
    const { email, password } = values;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      Alert.alert(
        "Sign In Failed",
        error.message || "Invalid email or password. Please try again."
      );
      return;
    }

    if (data?.session) {
      if (rememberMe) {
        try {
          await SecureStore.setItemAsync(
            'supabase_session',
            JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_at: data.session.expires_at
            })
          );
        } catch (error) {
          console.error('Error storing session:', error);
        }
      }
      
      router.replace("/(screens)/Home");
    }
  };
  
  const validationSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  
  // Function to handle user logout
  const handleLogout = async () => {
    try {
      // Clear stored session
      await SecureStore.deleteItemAsync('supabase_session');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Redirect to login screen
      router.replace('/auth/SignIn');
    } catch (error) {
      console.log('Error during logout:', error);
      Alert.alert('Logout Error', 'An error occurred during logout.');
    }
  };

  const handleSocialSignIn = (provider: string) => {
    Alert.alert(
      "Social Sign In",
      `Sign in with ${provider} is not implemented yet.`
    );
  };

  const handleForgotAccount = () => {
    router.push('/auth/accountRecovery');
  };

  // If still checking for session, you could show a loading indicator
  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
  return (
    <Formik
      initialValues={{ email: "", password: "" }}
      validationSchema={validationSchema}
      onSubmit={handleSignIn}
    >
      {({
        handleChange,
        handleBlur,
        handleSubmit,
        values,
        errors,
        touched,
      }) => (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            paddingTop: 100,
            padding: 25,
          }}
        >
          <Image
            source={require("./../../assets/images/Lynkt.png")}
            style={{ width: 180, height: 180, resizeMode: "contain" }}
          />
          <Text style={styles.title}>Sign In to Your Account</Text>

          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            placeholder="Enter your email address"
            placeholderTextColor="#666"
            style={styles.textInput}
            onChangeText={handleChange("email")}
            onBlur={handleBlur("email")}
            value={values.email}
          />
          {touched.email && typeof errors.email === "string" && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor="#666"
            secureTextEntry
            style={styles.textInput}
            onChangeText={handleChange("password")}
            onBlur={handleBlur("password")}
            value={values.password}
          />
          {touched.password && typeof errors.password === "string" && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          <View style={styles.optionsContainer}>
            <View style={styles.checkboxContainer}>
              <Checkbox
                value={rememberMe}
                onValueChange={setRememberMe}
                color={rememberMe ? Colors.PRIMARY : undefined}
              />
              <Text style={styles.checkboxLabel}>Remember Me</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/auth/forgotPassword")}
            >
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => handleSubmit()}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
          <View>
          <Text>
            Don't Have an Account?{" "}
            <Link href="/auth/SignUp" style={{ color: Colors.PRIMARY }}>
              Sign up
            </Link>
          </Text>
          </View>

          <View style={{marginTop: 10}}>
          <Text>
            Recover your account{" "}
            <Link href="/auth/accountRecovery" style={{ color: Colors.PRIMARY }}>here</Link>
          </Text>
          </View>

          <Text style={{ marginVertical: 15, fontSize: 16 }}>
            Or sign in with
          </Text>
          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialSignIn("Google")}
            >
              <AntDesign name="google" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialSignIn("Facebook")}
            >
              <FontAwesome name="facebook" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialSignIn("LinkedIn")}
            >
              <AntDesign name="linkedin-square" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Formik>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "outfit-Regular",
  },
  textInput: {
    borderWidth: 1,
    width: "100%",
    padding: 10,
    fontSize: 18,
    marginTop: 5,
    borderRadius: 15,
  },
  button: {
    padding: 15,
    backgroundColor: Colors.PRIMARY,
    width: "100%",
    marginTop: 20,
    marginBottom: 5,
    borderRadius: 15,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: Colors.WHITE,
    textAlign: "center",
  },
  inputLabel: {
    alignSelf: "flex-start",
    fontSize: 16,
    fontFamily: "Outfit-Medium",
    marginTop: 15,
    color: "black",
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  checkboxContainer: { flexDirection: "row", alignItems: "center" },
  checkboxLabel: { marginLeft: 8, fontSize: 16 },
  forgotPassword: { color: Colors.PRIMARY, fontSize: 16 },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  socialButton: {
    padding: 10,
    backgroundColor: "#ddd",
    borderRadius: 10,
    marginHorizontal: 5,
  },
  errorText: { color: "red", fontSize: 14, marginTop: 5 },
  forgotText: { color: Colors.PRIMARY, fontSize: 16, marginTop: 10, },
 });

export default SignIn;
