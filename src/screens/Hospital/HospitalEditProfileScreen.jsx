import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import useAuthStore from '../../store/authStore';
import { apiService } from '../../services/api';
import HospitalProfileForm from '../../components/hospital/HospitalProfileForm';
import { COLORS } from '../../utils/constants';

const HospitalEditProfileScreen = () => {
  const navigation = useNavigation();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const response = await apiService.updateHospitalProfile(formData);
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Profile updated',
          text2: 'Your hospital profile has been updated.'
        });
        updateUser(response.data.hospital);
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Update failed',
          text2: response.message || 'Please try again.'
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2: error.message || 'Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Prepare initial values for the form
  const initialValues = {
    name: user?.name || '',
    phone: user?.phone || '',
    address: {
      street: user?.location?.address || '',
      city: user?.location?.city || '',
      state: user?.location?.state || '',
      pincode: user?.location?.pincode || ''
    },
    location: {
      lat: user?.location?.coordinates?.[1]?.toString() || '',
      lng: user?.location?.coordinates?.[0]?.toString() || ''
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Edit Hospital Profile</Text>
      <HospitalProfileForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 32,
    marginBottom: 8,
    alignSelf: 'center'
  }
});

export default HospitalEditProfileScreen;
