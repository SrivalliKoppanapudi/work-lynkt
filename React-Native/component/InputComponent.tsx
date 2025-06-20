import React from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from "react-native";
import Colors from "../constant/Colors";

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  multiline?: boolean;
  numberOfLines?: number;
  placeholder?: string;
  placeholderTextColor?: string;
  secureTextEntry?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
}

const InputComponent: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  error,
  keyboardType = "default",
  multiline = false,
  numberOfLines = 1,
  placeholder = "",
  placeholderTextColor = "gray",
  secureTextEntry = false,
  style,
  labelStyle,
  inputStyle,
  errorStyle,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      {/* Input Field */}
      <TextInput
        style={[styles.input, inputStyle, error ? styles.errorInput : null]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        secureTextEntry={secureTextEntry}
      />

      {/* Error Message */}
      {error && <Text style={[styles.errorText, errorStyle]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "black",
    fontFamily: "Outfit-Medium",
  },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "black",
    backgroundColor: Colors.WHITE,
  },
  errorInput: {
    borderColor: Colors.ERROR,
  },
  errorText: {
    color: Colors.ERROR,
    fontSize: 14,
    marginTop: 5,
    fontFamily: "Outfit-Regular",
  },
});

export default InputComponent;
