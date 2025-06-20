import React, { useState } from 'react';
import { Text, View, Image, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import Colors from './../../constant/Colors';
import { useRouter } from 'expo-router';
import { supabase } from './../../lib/Superbase';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'lynkt://reset-password',
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        'Success', 
        'Password reset instructions have been sent to your email',
        [
          {
            text: 'OK',
            onPress: () => router.push('/auth/SignIn')
          }
        ]
      );
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', paddingTop: 100, padding: 25 }}>
      <Image source={require('./../../assets/images/Lynkt.png')} style={{ width: 180, height: 180, resizeMode: 'contain' }} />
      <Text style={{ fontSize: 30, fontWeight: 'bold', textAlign: 'center', fontFamily: 'outfit-Regular' }}>Reset Password</Text>
      
      <Text style={styles.description}>
        Enter your email address and we'll send you instructions to reset your password.
      </Text>

      <Text style={styles.inputLabel}>Email Address</Text>
      <TextInput 
        placeholder='Enter your email address' 
        placeholderTextColor="#666"
        value={email} 
        onChangeText={setEmail} 
        style={styles.textInput} 
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity onPress={handleResetPassword} style={styles.button}>
        <Text style={styles.buttonText}>Send Reset Instructions</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backButton}>Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  textInput: { 
    borderWidth: 1, 
    width: '100%', 
    padding: 10, 
    fontSize: 18, 
    marginTop: 5, 
    borderRadius: 15 
  },
  button: { 
    padding: 15, 
    backgroundColor: Colors.PRIMARY, 
    width: '100%', 
    marginTop: 20, 
    borderRadius: 15 
  },
  buttonText: { 
    fontSize: 18, 
    fontFamily: 'Outfit-Bold', 
    color: Colors.WHITE, 
    textAlign: 'center' 
  },
  inputLabel: { 
    alignSelf: 'flex-start',
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
    marginTop: 15,
    color: Colors.PRIMARY,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    color: '#666',
    fontFamily: 'Outfit-Regular'
  },
  backButton: {
    color: Colors.PRIMARY,
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
    marginTop: 20,
    textAlign: 'center'
  }
}); 