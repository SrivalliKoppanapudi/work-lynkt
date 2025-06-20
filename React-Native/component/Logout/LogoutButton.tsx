import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constant/Colors';
import { supabase } from '../../lib/Superbase';

interface LogoutButtonProps {
  style?: object;
  textStyle?: object;
  onLogout?: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ style, textStyle, onLogout }) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Clear stored session
      await SecureStore.deleteItemAsync('supabase_session');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Use custom logout handler if provided, otherwise redirect to login screen
      if (onLogout) {
        onLogout();
      } else {
        router.replace('/auth/SignIn');
      }
    } catch (error) {
      console.log('Error during logout:', error);
      Alert.alert('Logout Error', 'An error occurred during logout.');
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={handleLogout}
    >
        <MaterialIcons name="logout" size={20} color="red" />
      <Text style={[styles.buttonText, textStyle]}>Logout</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
    marginRight:160,
  },
});

export default LogoutButton;