import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { Modal, Portal, TextInput, Button, Title, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constant/Colors';

interface InviteStudentsModalProps {
  visible: boolean;
  onDismiss: () => void;
  onInvite: (emails: string[], message: string) => void;
  loading: boolean;
}

const InviteStudentsModal: React.FC<InviteStudentsModalProps> = ({
  visible,
  onDismiss,
  onInvite,
  loading,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleAddEmail = () => {
    const trimmedEmail = emailInput.trim();
    if (!trimmedEmail) return;

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (emails.includes(trimmedEmail)) {
      setError('This email has already been added');
      return;
    }

    setEmails([...emails, trimmedEmail]);
    setEmailInput('');
    setError('');
  };

  const handleRemoveEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const handleSubmit = () => {
    if (emails.length === 0) {
      setError('Please add at least one email address');
      return;
    }

    onInvite(emails, message);
  };

  const handleDismiss = () => {
    setEmailInput('');
    setEmails([]);
    setMessage('');
    setError('');
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.container}
      >
        <Title style={styles.title}>Invite Students</Title>
        
        <ScrollView style={styles.content}>
          <View style={styles.inputContainer}>
            <TextInput
              label="Email Address"
              value={emailInput}
              onChangeText={setEmailInput}
              style={styles.input}
              mode="outlined"
              error={!!error}
              right={
                <TextInput.Icon
                  icon="plus"
                  color="red"
                  onPress={handleAddEmail}
                  disabled={!emailInput.trim()}
                />
              }
              onSubmitEditing={handleAddEmail}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {emails.length > 0 && (
            <View style={styles.emailChipsContainer}>
              {emails.map((email) => (
                <Chip
                  key={email}
                  style={styles.emailChip}
                  onClose={() => handleRemoveEmail(email)}
                  mode="outlined"
                >
                  {email}
                </Chip>
              ))}
            </View>
          )}

          <TextInput
            label="Message (Optional)"
            value={message}
            onChangeText={setMessage}
            style={styles.messageInput}
            mode="outlined"
            multiline
            numberOfLines={4}
          />
        </ScrollView>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={handleDismiss}
            textColor='black'
            style={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || emails.length === 0}
            style={[styles.inviteButton,{backgroundColor:Colors.PRIMARY}]}
            labelStyle={{color:'white'}}
            textColor='black'
          >
            Send Invitations
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.PRIMARY,
  },
  content: {
    maxHeight: 400,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    marginBottom: 5,
    backgroundColor: 'white',
  },
  errorText: {
    color: Colors.ERROR,
    fontSize: 12,
    marginTop: 5,
  },
  emailChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  emailChip: {
    margin: 4,
  },
  messageInput: {
    marginBottom: 20,
    backgroundColor: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    borderColor: Colors.PRIMARY,
  },
  inviteButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: Colors.PRIMARY,
  },
});

export default InviteStudentsModal;