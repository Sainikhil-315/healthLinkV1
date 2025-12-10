import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';

import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import useAuthStore from '../../store/authStore';
import useGeolocation from '../../hooks/useGeolocation';
import { COLORS, PATTERNS, SCREENS, USER_ROLES } from '../../utils/constants';

// Role options for registration
const ROLE_OPTIONS = [
  { label: 'User', value: USER_ROLES.USER, icon: 'person' },
  { label: 'Hospital', value: USER_ROLES.HOSPITAL, icon: 'hospital' },
  { label: 'Ambulance', value: USER_ROLES.AMBULANCE, icon: 'car' },
  { label: 'Volunteer', value: USER_ROLES.VOLUNTEER, icon: 'heart' },
  { label: 'Donor', value: USER_ROLES.DONOR, icon: 'water' },
];

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.USER
  });
  const [errors, setErrors] = useState({});
  const [locationData, setLocationData] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const { register, isLoading } = useAuthStore();
  const { getCurrentLocation } = useGeolocation();

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!PATTERNS.EMAIL.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone is required';
    } else if (!PATTERNS.PHONE.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number (10 digits starting with 6-9)';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!PATTERNS.PASSWORD.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fix the errors in the form'
      });
      return;
    }

    // For hospital role, REQUIRE location
    if (formData.role === USER_ROLES.HOSPITAL) {
      if (!locationData) {
        Toast.show({
          type: 'error',
          text1: 'Location Required',
          text2: 'Hospitals must provide their location for verification'
        });
        return;
      }

      // Validate location is not [0, 0]
      if (locationData.latitude === 0 && locationData.longitude === 0) {
        Toast.show({
          type: 'error',
          text1: 'Invalid Location',
          text2: 'Please capture a valid location'
        });
        setLocationData(null);
        return;
      }
    }

    const registrationData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: formData.role
    };

    // Add location data for hospital - this is REQUIRED
    if (formData.role === USER_ROLES.HOSPITAL && locationData) {
      registrationData.location = {
        lat: locationData.latitude,
        lng: locationData.longitude
      };
      
      console.log('Sending hospital registration with location:', {
        lat: locationData.latitude,
        lng: locationData.longitude
      });
    }

    const result = await register(registrationData);
    console.log('Registration result:', result);
    
    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Account created!',
        text2: formData.role === USER_ROLES.HOSPITAL 
          ? 'Your hospital registration is pending admin verification'
          : 'Welcome to HealthLink'
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Registration failed',
        text2: result.error || 'Please try again'
      });
    }
  };

  const requestLocation = async () => {
    try {
      setGettingLocation(true);
      const position = await getCurrentLocation();
      
      // Validate the location
      if (!position || !position.lat || !position.lng) {
        throw new Error('Invalid location data received');
      }

      if (position.lat === 0 && position.lng === 0) {
        throw new Error('Unable to determine accurate location. Please try again.');
      }

      setLocationData(position);
      setGettingLocation(false);
      
      Toast.show({
        type: 'success',
        text1: 'Location Captured',
        text2: `Lat: ${position.lat.toFixed(6)}, Lng: ${position.lng.toFixed(6)}`
      });
    } catch (error) {
      setGettingLocation(false);
      setLocationData(null);
      
      Toast.show({
        type: 'error',
        text1: 'Location Error',
        text2: error.message || 'Failed to get location. Please enable location services.'
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join HealthLink today</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Role Selection */}
          <View style={styles.roleSection}>
            <Text style={styles.roleLabel}>Select Your Role</Text>
            <View style={styles.roleButtonsContainer}>
              {ROLE_OPTIONS.map(role => (
                <TouchableOpacity
                  key={role.value}
                  style={[
                    styles.roleButton,
                    formData.role === role.value && styles.roleButtonSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, role: role.value });
                    // Clear location if switching away from hospital
                    if (role.value !== USER_ROLES.HOSPITAL) {
                      setLocationData(null);
                    }
                  }}
                >
                  <Icon 
                    name={role.icon} 
                    size={24} 
                    color={formData.role === role.value ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text style={[
                    styles.roleButtonText,
                    formData.role === role.value && styles.roleButtonTextSelected
                  ]}>
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input
            label="Full Name"
            value={formData.name}
            onChangeText={(value) => updateField('name', value)}
            placeholder="John Doe"
            leftIcon="person-outline"
            error={errors.name}
          />

          <Input
            label="Email"
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            placeholder="your.email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={errors.email}
          />

          <Input
            label="Phone Number"
            value={formData.phone}
            onChangeText={(value) => updateField('phone', value)}
            placeholder="9876543210"
            keyboardType="phone-pad"
            leftIcon="call-outline"
            error={errors.phone}
          />

          <Input
            label="Password"
            value={formData.password}
            onChangeText={(value) => updateField('password', value)}
            placeholder="Create a strong password"
            secureTextEntry
            leftIcon="lock-closed-outline"
            error={errors.password}
          />

          <Input
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(value) => updateField('confirmPassword', value)}
            placeholder="Re-enter your password"
            secureTextEntry
            leftIcon="lock-closed-outline"
            error={errors.confirmPassword}
          />

          {/* Location permission for hospital - REQUIRED */}
          {formData.role === USER_ROLES.HOSPITAL && (
            <View style={styles.locationSection}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationLabel}>
                  📍 Location Verification
                </Text>
                <Text style={styles.locationRequired}>*Required</Text>
              </View>
              
              <View style={styles.locationInfo}>
                <Icon name="information-circle" size={16} color={COLORS.info} />
                <Text style={styles.locationInfoText}>
                  Your hospital's location is required for verification and to help patients find you during emergencies.
                </Text>
              </View>

              <TouchableOpacity 
                style={[
                  styles.locationButton,
                  locationData && styles.locationButtonActive
                ]}
                onPress={requestLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? (
                  <>
                    <ActivityIndicator color={COLORS.white} />
                    <Text style={styles.locationButtonText}>Getting Location...</Text>
                  </>
                ) : (
                  <>
                    <Icon 
                      name={locationData ? "checkmark-circle" : "location"} 
                      size={20} 
                      color={COLORS.white} 
                    />
                    <Text style={styles.locationButtonText}>
                      {locationData ? 'Location Captured ✓' : 'Tap to Capture Location'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {locationData && (
                <View style={styles.locationCaptured}>
                  <View style={styles.locationCoords}>
                    <Icon name="checkmark-circle" size={18} color={COLORS.success} />
                    <Text style={styles.locationCoordsText}>
                      Latitude: {locationData.lat?.toFixed(6) || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.locationCoords}>
                    <Icon name="checkmark-circle" size={18} color={COLORS.success} />
                    <Text style={styles.locationCoordsText}>
                      Longitude: {locationData.lng?.toFixed(6) || 'N/A'}
                    </Text>
                  </View>
                  {locationData.accuracy && (
                    <View style={styles.locationCoords}>
                      <Icon name="radio-button-on" size={18} color={COLORS.info} />
                      <Text style={styles.locationAccuracyText}>
                        Accuracy: ±{locationData.accuracy.toFixed(0)}m
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          <Button
            title={formData.role === USER_ROLES.HOSPITAL && !locationData 
              ? 'Capture Location First' 
              : 'Create Account'}
            onPress={handleRegister}
            loading={isLoading}
            disabled={formData.role === USER_ROLES.HOSPITAL && !locationData}
            style={styles.registerButton}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate(SCREENS.LOGIN)}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40
  },
  header: {
    marginBottom: 32
  },
  backButton: {
    marginBottom: 16
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.text
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary
  },
  formContainer: {
    flex: 1
  },
  roleSection: {
    marginBottom: 24
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12
  },
  roleButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  roleButton: {
    flex: 0.47,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  roleButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10'
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center'
  },
  roleButtonTextSelected: {
    color: COLORS.primary,
    fontWeight: '600'
  },
  locationSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '30'
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text
  },
  locationRequired: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.error
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.info + '10',
    borderRadius: 8,
    marginBottom: 12
  },
  locationInfoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8
  },
  locationButtonActive: {
    backgroundColor: COLORS.success
  },
  locationButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600'
  },
  locationCaptured: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.success + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.success + '30'
  },
  locationCoords: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  locationCoordsText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '500'
  },
  locationAccuracyText: {
    fontSize: 12,
    color: COLORS.info,
    fontWeight: '500'
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 24
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loginText: {
    fontSize: 14,
    color: COLORS.textSecondary
  },
  loginLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600'
  }
});

export default RegisterScreen;