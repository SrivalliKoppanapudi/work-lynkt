import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Colors from "../constant/Colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  backgroundColor?: string;
  textColor?: string;
  style?: any;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

const ButtonComponent = ({
  title,
  onPress,
  backgroundColor = Colors.PRIMARY,
  textColor = "#ffffff",
  style,
  loading = false,
  icon,
  disabled = false,
}: ButtonProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: disabled ? "#ccc" : backgroundColor },
        style,
      ]}
      onPress={disabled || loading ? () => {} : onPress}
    >
      {loading ? (
        <Text style={[styles.buttonText, { color: textColor }]}>
          Loading...
        </Text>
      ) : (
        <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ButtonComponent;
