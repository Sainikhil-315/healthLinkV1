import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Toast from 'react-native-toast-message';
import useAuthStore from '../../store/authStore';
import { apiService } from '../../services/api';
import { COLORS } from '../../utils/constants';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const EditProfileScreen = ({ navigation }) => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
      setProfileImage(user.profilePicture || null);
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePickImage = async () => {
    Alert.alert('Profile Picture', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: () => pickImage('camera'),
      },
      {
        text: 'Choose from Library',
        onPress: () => pickImage('library'),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const pickImage = async source => {
    try {
      let result;

      if (source === 'camera') {
        // Request camera permission
        const cameraPermission =
          Platform.OS === 'ios'
            ? PERMISSIONS.IOS.CAMERA
            : PERMISSIONS.ANDROID.CAMERA;

        const status = await request(cameraPermission);
        if (status !== RESULTS.GRANTED) {
          Toast.show({
            type: 'error',
            text1: 'Camera permission required',
          });
          return;
        }

        // Launch camera
        result = await launchCamera({
          mediaType: 'photo',
          includeBase64: false,
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.8,
        });
      } else {
        // Request gallery/media permission
        const galleryPermission =
          Platform.OS === 'ios'
            ? PERMISSIONS.IOS.PHOTO_LIBRARY
            : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;

        const status = await request(galleryPermission);
        if (status !== RESULTS.GRANTED) {
          Toast.show({
            type: 'error',
            text1: 'Gallery permission required',
          });
          return;
        }

        // Launch image library
        result = await launchImageLibrary({
          mediaType: 'photo',
          includeBase64: false,
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.8,
        });
      }

      // Handle result
      if (result && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setProfileImage(uri);
        await uploadProfilePicture(uri);
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to pick image',
      });
    }
  };

  const uploadProfilePicture = async uri => {
    try {
      const formData = new FormData();
      formData.append('profilePicture', {
        uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });

      await apiService.uploadProfilePicture(formData);
      Toast.show({
        type: 'success',
        text1: 'Profile picture updated',
      });
    } catch (error) {
      console.error('Upload error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to upload picture',
      });
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await apiService.updateUserProfile(formData);

      if (response.data) {
        updateUser(response.data.user);
        Toast.show({
          type: 'success',
          text1: 'Profile updated successfully',
        });
        navigation.goBack();
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to update profile',
        text2: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Edit Profile"
        subtitle="Update your personal information"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content}>
        {/* Profile Picture */}
        <View style={styles.profilePictureSection}>
          <TouchableOpacity
            style={styles.profilePictureContainer}
            onPress={handlePickImage}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={styles.profilePlaceholderText}>
                  {formData.name.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Icon name="camera" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.profilePictureHint}>
            Tap to change profile picture
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Full Name"
            value={formData.name}
            onChangeText={text => setFormData({ ...formData, name: text })}
            placeholder="John Doe"
            leftIcon="person-outline"
            error={errors.name}
          />

          <Input
            label="Email"
            value={formData.email}
            onChangeText={text => setFormData({ ...formData, email: text })}
            placeholder="your.email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={errors.email}
          />

          <Input
            label="Phone Number"
            value={formData.phone}
            onChangeText={text => setFormData({ ...formData, phone: text })}
            placeholder="9876543210"
            keyboardType="phone-pad"
            leftIcon="call-outline"
            maxLength={10}
            error={errors.phone}
          />

          <Input
            label="Address (Optional)"
            value={formData.address}
            onChangeText={text => setFormData({ ...formData, address: text })}
            placeholder="Enter your address"
            leftIcon="location-outline"
            multiline
            numberOfLines={3}
          />

          {/* Info Note */}
          <View style={styles.infoNote}>
            <Icon name="information-circle" size={20} color={COLORS.info} />
            <Text style={styles.infoText}>
              Your email and phone number are used for account verification and
              emergency notifications
            </Text>
          </View>

          {/* Save Button */}
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1 },
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.surface,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profilePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  profilePictureHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  form: { padding: 20 },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.info + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.info,
    lineHeight: 18,
  },
  saveButton: { marginTop: 8 },
});

export default EditProfileScreen;
