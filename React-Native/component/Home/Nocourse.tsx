import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import ButtonComponent from '../ButtonComponent';
import { useRouter } from 'expo-router';
import Colors from '../../constant/Colors';

export default function Nocourse() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        You don't have any course yet
      </Text>

      <ButtonComponent
        style={styles.createButton}
        title="+ Create New Course"
        onPress={() => { router.push('/') }} // Update the route as needed
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    display: 'flex',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    color: Colors.PRIMARY, // Use your theme color
  },
  createButton: {
    backgroundColor: Colors.PRIMARY, // Use your theme color
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});