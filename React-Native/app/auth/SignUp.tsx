import React, { useState } from "react";
import {
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import Colors from "./../../constant/Colors";
import { Link, useRouter } from "expo-router";
import { supabase } from "./../../lib/Superbase";
import { Picker } from "@react-native-picker/picker";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BetterPicker from "../../component/courses/BetterPicker";

interface SignUpValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  agreeTerms: boolean;
}

const SignUp = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
      .matches(/[0-9]/, "Password must contain at least one number")
      .matches(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character"
      )
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords must match")
      .required("Confirm Password is required"),
    role: Yup.string().required("Role is required"),
    agreeTerms: Yup.boolean().oneOf(
      [true],
      "You must agree to the Terms and Conditions"
    ),
  });

  const handleSignUp = async (values: SignUpValues) => {
    try {
      setLoading(true);
      const { name, email, password, role } = values;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: name,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // Store that this is a new user who needs to complete diagnostic
        await AsyncStorage.setItem("@new_user", "true");

        // Navigate to Diagnostic Tool instead of Home
        router.push("/(screens)/DiagnosticTool");
      }
    } catch (error) {
      Alert.alert("Sign Up Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignUp = (platform: "Google" | "Facebook" | "LinkedIn") => {
    Alert.alert(
      "Social Sign Up",
      `Signing up with ${platform} is not implemented yet`
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Formik
        initialValues={{
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "teacher",
          agreeTerms: false,
        }}
        validationSchema={validationSchema}
        onSubmit={handleSignUp}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
          setFieldValue,
        }) => (
          <View style={styles.container}>
            <Image
              source={require("./../../assets/images/Lynkt.png")}
              style={styles.logo}
            />
            <Text style={styles.title}>Create a New Account</Text>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              placeholder="Enter your full name"
              placeholderTextColor="#666"
              style={styles.textInput}
              onChangeText={handleChange("name")}
              onBlur={handleBlur("name")}
              value={values.name}
              autoCapitalize="words"
            />
            {touched.name && errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              placeholder="Enter your email address"
              placeholderTextColor="#666"
              style={styles.textInput}
              onChangeText={handleChange("email")}
              onBlur={handleBlur("email")}
              value={values.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {touched.email && errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              placeholder="Create a password (min 8 chars)"
              placeholderTextColor="#666"
              secureTextEntry
              style={styles.textInput}
              onChangeText={handleChange("password")}
              onBlur={(e) => {
                handleBlur("password")(e);
                setIsPasswordFocused(false);
              }}
              onFocus={() => setIsPasswordFocused(true)}
              value={values.password}
            />
            {touched.password && errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            {(isPasswordFocused || values.password) && (
              <View style={styles.passwordCriteria}>
                <Text style={styles.criteriaText}>Password must contain:</Text>
                <Text
                  style={
                    values.password.length >= 8
                      ? styles.criteriaMet
                      : styles.criteriaUnmet
                  }
                >
                  • At least 8 characters
                </Text>
                <Text
                  style={
                    /[A-Z]/.test(values.password)
                      ? styles.criteriaMet
                      : styles.criteriaUnmet
                  }
                >
                  • At least one uppercase letter
                </Text>
                <Text
                  style={
                    /[0-9]/.test(values.password)
                      ? styles.criteriaMet
                      : styles.criteriaUnmet
                  }
                >
                  • At least one number
                </Text>
                <Text
                  style={
                    /[!@#$%^&*(),.?":{}|<>]/.test(values.password)
                      ? styles.criteriaMet
                      : styles.criteriaUnmet
                  }
                >
                  • At least one special character
                </Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              placeholder="Confirm your password"
              placeholderTextColor="#666"
              secureTextEntry
              style={styles.textInput}
              onChangeText={handleChange("confirmPassword")}
              onBlur={handleBlur("confirmPassword")}
              value={values.confirmPassword}
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}

            <Text style={styles.inputLabel}>Role</Text>
            <View style={styles.pickerContainer}>
              <BetterPicker
                value={values.role}
                onValueChange={(value) => setFieldValue("role", value)}
                items={[
                  { label: "Teacher", value: "teacher" },
                  { label: "Novice Teacher", value: "noviceTeacher" },
                  { label: "Experienced Teacher", value: "experiencedTeacher" },
                  { label: "Guest Teacher", value: "guestTeacher" },
                  { label: "Admin", value: "admin" },
                ]}
              />
            </View>
            {touched.role && errors.role && (
              <Text style={styles.errorText}>{errors.role}</Text>
            )}

            <TouchableOpacity
              onPress={() => setFieldValue("agreeTerms", !values.agreeTerms)}
              style={styles.checkboxWrapper}
            >
              <View
                style={[
                  styles.checkbox,
                  values.agreeTerms && styles.checkedCheckbox,
                ]}
              />
              <Text style={styles.checkboxLabel}>
                I agree to the Terms and Conditions
              </Text>
            </TouchableOpacity>
            {touched.agreeTerms && errors.agreeTerms && (
              <Text style={styles.errorText}>{errors.agreeTerms}</Text>
            )}

            <TouchableOpacity
              onPress={() => handleSubmit()}
              style={styles.button}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.WHITE} />
              ) : (
                <Text style={styles.buttonText}>Create An Account</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.loginText}>
              Already Have an Account?{" "}
              <Link href="/auth/SignIn" style={styles.loginLink}>
                Sign In
              </Link>
            </Text>

            <Text style={styles.socialText}>Or sign up with</Text>
            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialSignUp("Google")}
              >
                <AntDesign name="google" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialSignUp("Facebook")}
              >
                <FontAwesome name="facebook" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialSignUp("LinkedIn")}
              >
                <AntDesign name="linkedin-square" size={24} color="black" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  container: {
    flex: 1,
    alignItems: "center",
    padding: 25,
    paddingTop: 10,
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: "contain",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "outfit-Regular",
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    width: "100%",
    padding: 15,
    fontSize: 16,
    marginTop: 5,
    borderRadius: 15,
    borderColor: "#ccc",
  },
  button: {
    padding: 15,
    backgroundColor: Colors.PRIMARY,
    width: "100%",
    marginTop: 20,
    marginBottom: 15,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    height: 50,
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
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 15,
    width: "100%",
    marginTop: 5,
    overflow: "hidden",
    borderColor: "gray",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  checkboxWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    width: "100%",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "#666",
    justifyContent: "center",
    alignItems: "center",
  },
  checkedCheckbox: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    flex: 1,
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
    gap: 15,
  },
  socialButton: {
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginTop: 5,
    alignSelf: "flex-start",
  },
  loginText: {
    marginTop: 10,
    fontSize: 16,
  },
  loginLink: {
    color: Colors.PRIMARY,
    fontWeight: "bold",
  },
  socialText: {
    marginVertical: 15,
    fontSize: 16,
    color: "#666",
  },
  passwordCriteria: {
    alignSelf: "flex-start",
    marginTop: 5,
    marginBottom: 10,
  },
  criteriaText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  criteriaMet: {
    fontSize: 12,
    color: "green",
    marginLeft: 10,
  },
  criteriaUnmet: {
    fontSize: 12,
    color: "#666",
    marginLeft: 10,
  },
});

export default SignUp;
