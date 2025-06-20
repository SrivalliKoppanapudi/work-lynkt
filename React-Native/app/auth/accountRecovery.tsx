import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/Superbase';
import InputComponent from '../../component/InputComponent';
import ButtonComponent from '../../component/ButtonComponent';
import Colors from '../../constant/Colors';
import { Ionicons } from '@expo/vector-icons';

// Step types for the recovery flow
type RecoveryStep = 'initial' | 'verification' | 'security' | 'id_upload' | 'support' | 'success';

// Verification method types
type VerificationMethod = 'email' | 'phone' | 'security_questions';

export default function AccountRecovery() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<RecoveryStep>('initial');
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  
  // Form states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  // Error states
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');

  // Handle sending OTP
  const handleSendOTP = async () => {
    // Reset errors
    setEmailError('');
    
    // Validate email
    if (!email) {
      setEmailError('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Send OTP via email using Supabase's password reset or OTP feature
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'lynkt://account-recovery', // Optional: Redirect URL after verification
        },
      });
      
      if (error) throw error;
      
      Alert.alert('OTP Sent', 'A verification code has been sent to your email');
      setOtpSent(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async () => {
    if (!otp) {
      setOtpError('Please enter the verification code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Verify the OTP using Supabase's verifyOtp method
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email', // Use 'email' for email OTP verification
      });
      
      if (error) throw error;
      
      Alert.alert('Success', 'Email verified successfully');
      setCurrentStep('security'); // Proceed to the next step
    } catch (error: any) {
      setOtpError('Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle support request submission
  const handleSupportRequest = async () => {
    if (!supportMessage) {
      Alert.alert('Error', 'Please describe your issue');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate support request submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Support Request Sent', 'Your support request has been submitted successfully');
      setCurrentStep('success');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit support request');
    } finally {
      setIsLoading(false);
    }
  };

  // Render the initial step
  const renderInitialStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Account Recovery</Text>
      <Text style={styles.stepDescription}>
        Select a verification method to recover your account
      </Text>
      
      <TouchableOpacity 
        style={[styles.methodCard, verificationMethod === 'email' && styles.selectedMethod]}
        onPress={() => setVerificationMethod('email')}
      >
        <Ionicons name="mail-outline" size={24} color={Colors.PRIMARY} />
        <Text style={styles.methodText}>Recover with Email</Text>
      </TouchableOpacity>
      
      <ButtonComponent 
        title="Continue" 
        onPress={() => setCurrentStep('verification')}
        style={styles.button}
      />
      
      <TouchableOpacity 
        style={styles.supportLink}
        onPress={() => setCurrentStep('support')}
      >
        <Text style={styles.supportLinkText}>Contact Support</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push('/auth/SignIn')}>
        <Text style={styles.backLink}>Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  );

  // Render the verification step
  const renderVerificationStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Email Verification</Text>
      
      <InputComponent
        label="Email Address"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email address"
        keyboardType="email-address"
        error={emailError}
      />
      
      {!otpSent ? (
        <ButtonComponent 
          title="Send Verification Code" 
          onPress={handleSendOTP}
          loading={isLoading}
          style={styles.button}
        />
      ) : (
        <>
          <InputComponent
            label="Verification Code"
            value={otp}
            onChangeText={setOtp}
            placeholder="Enter the code sent to you"
            keyboardType="numeric"
            error={otpError}
          />
          <ButtonComponent 
            title="Verify" 
            onPress={handleVerifyOTP}
            loading={isLoading}
            style={styles.button}
          />
        </>
      )}
      
      <TouchableOpacity onPress={() => setCurrentStep('initial')}>
        <Text style={styles.backLink}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  // Render the support step
  const renderSupportStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Contact Support</Text>
      <Text style={styles.stepDescription}>
        Please describe your issue and our support team will assist you
      </Text>
      
      <InputComponent
        label="Describe your issue"
        value={supportMessage}
        onChangeText={setSupportMessage}
        placeholder="Please discribe your issue here"
        multiline
        numberOfLines={10}
      />
      
      <ButtonComponent 
        title="Submit" 
        onPress={handleSupportRequest}
        loading={isLoading}
        style={styles.button}
      />
      
      <TouchableOpacity onPress={() => setCurrentStep('initial')}>
        <Text style={styles.backLink}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  // Render the success step
  const renderSuccessStep = () => (
    <View style={styles.stepContainer}>
      <Ionicons name="checkmark-circle" size={80} color={Colors.PRIMARY} style={styles.successIcon} />
      
      <Text style={styles.stepTitle}>Recovery Successful</Text>
      <Text style={styles.stepDescription}>
        Your account has been recovered successfully. You can now sign in with your new credentials.
      </Text>
      
      <ButtonComponent 
        title="Continue to Login" 
        onPress={() => router.push('/auth/SignIn')}
        style={styles.button}
      />
    </View>
  );

  // Render the appropriate step
  const renderStep = () => {
    switch (currentStep) {
      case 'initial':
        return renderInitialStep();
      case 'verification':
        return renderVerificationStep();
      case 'support':
        return renderSupportStep();
      case 'success':
        return renderSuccessStep();
      default:
        return renderInitialStep();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image 
        source={require('../../assets/images/Lynkt.png')} 
        style={styles.logo} 
      />
      
      {renderStep()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: Colors.WHITE,
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Outfit-Bold',
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    color: '#666',
    fontFamily: 'Outfit-Regular',
    
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#F9F9F9',
  },
  selectedMethod: {
    borderColor: Colors.PRIMARY,
    backgroundColor: '#F0F8FF',
  },
  methodText: {
    fontSize: 16,
    marginLeft: 15,
    fontFamily: 'Outfit-Medium',
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    marginTop: 20,
  },
  supportLink: {
    marginTop: 30,
    padding: 10,
  },
  supportLinkText: {
    color: Colors.PRIMARY,
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
  },
  backLink: {
    marginTop: 20,
    color: '#666',
    fontSize: 16,
    fontFamily: 'Outfit-Regular',
  },
  successIcon: {
    marginBottom: 20,
  }
});