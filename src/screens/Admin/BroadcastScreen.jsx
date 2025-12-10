import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '../../utils/constants';
import { apiService } from '../../services/api';
import Header from '../../components/common/Header';

const BroadcastScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState('user');
  const [loading, setLoading] = useState(false);

  const roleMap = {
    user: 'Users',
    hospital: 'Hospitals',
    ambulance: 'Ambulances',
    volunteer: 'Volunteers',
    donor: 'Donors'
  };

  const handleSend = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title cannot be empty');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Error', 'Message cannot be empty');
      return;
    }
    
    setLoading(true);
    try {
      // Map role to backend enum - CRITICAL FIX
      let recipientModel = 'User'; // Default
      switch (targetRole) {
        case 'user': 
          recipientModel = 'User'; 
          break;
        case 'hospital': 
          recipientModel = 'Hospital'; 
          break;
        case 'ambulance': 
          recipientModel = 'Ambulance'; 
          break;
        case 'volunteer': 
          recipientModel = 'Volunteer'; 
          break;
        case 'donor': 
          recipientModel = 'Donor'; 
          break;
        default: 
          recipientModel = 'User';
      }
      
      const payload = {
        title,
        message,
        recipientModel,  // ✅ Send recipientModel, not targetRole
        type: 'system_update'
      };
      
      console.log('📤 Sending payload:', payload);
      
      const response = await apiService.sendBulkNotification(payload);
      
      if (response.success) {
        Alert.alert('Success', `Broadcast sent to ${roleMap[targetRole]}`, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
        setTitle('');
        setMessage('');
      } else {
        Alert.alert('Error', response.message || 'Failed to send broadcast');
      }
    } catch (error) {
      console.error('Broadcast error:', error);
      Alert.alert('Error', error.message || 'Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Broadcast Message" onBackPress={() => navigation.goBack()} />
      
      <Text style={styles.label}>Title:</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter broadcast title..."
        placeholderTextColor={COLORS.textSecondary}
      />
      
      <Text style={styles.label}>Message:</Text>
      <TextInput
        style={[styles.input, styles.messageInput]}
        value={message}
        onChangeText={setMessage}
        placeholder="Type your message here..."
        placeholderTextColor={COLORS.textSecondary}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
      
      <Text style={styles.label}>Target Audience:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={targetRole}
          onValueChange={setTargetRole}
          style={styles.picker}
        >
          <Picker.Item label="Users" value="user" />
          <Picker.Item label="Hospitals" value="hospital" />
          <Picker.Item label="Ambulances" value="ambulance" />
          <Picker.Item label="Volunteers" value="volunteer" />
          <Picker.Item label="Donors" value="donor" />
        </Picker>
      </View>
      
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSend}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Send Broadcast'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background, 
    padding: 20 
  },
  label: { 
    fontSize: 16, 
    color: COLORS.text, 
    marginBottom: 8,
    fontWeight: '600'
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    marginBottom: 20
  },
  messageInput: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: COLORS.surface
  },
  picker: {
    height: 50,
    width: '100%',
    color: COLORS.text
  }
});

export default BroadcastScreen;