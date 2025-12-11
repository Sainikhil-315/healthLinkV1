import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import useAuthStore from '../../store/authStore';
import ambulanceService from '../../services/ambulanceService';
import { COLORS } from '../../utils/constants';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';

const ProfileSettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    driverName: '',
    driverPhone: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const result = await ambulanceService.getAmbulanceProfile();
      
      if (result.success) {
        setProfile(result.data.ambulance);
        setFormData({
          driverName: result.data.ambulance.driver.name,
          driverPhone: result.data.ambulance.driver.phone
        });
      }
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.driverName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Name is required'
      });
      return;
    }

    const result = await ambulanceService.updateProfile(formData);
    
    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile has been updated successfully'
      });
      setEditing(false);
      loadProfile();
    } else {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: result.error
      });
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  const SettingItem = ({ icon, label, value, onPress, showChevron = true }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Icon name={icon} size={20} color={COLORS.primary} />
        </View>
        <View>
          <Text style={styles.settingLabel}>{label}</Text>
          {value && <Text style={styles.settingValue}>{value}</Text>}
        </View>
      </View>
      {showChevron && onPress && (
        <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return <Loader fullScreen message="Loading profile..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="log-out-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Icon name="person" size={48} color={COLORS.primary} />
            </View>
            <TouchableOpacity style={styles.editBadge}>
              <Icon name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.profileName}>{profile?.driver?.name}</Text>
          <Text style={styles.profileEmail}>{profile?.driver?.email}</Text>
          
          <View style={styles.vehicleNumberBadge}>
            <Icon name="car" size={16} color={COLORS.primary} />
            <Text style={styles.vehicleNumberText}>{profile?.vehicleNumber}</Text>
          </View>
        </Card>

        {/* Edit Profile Section */}
        {editing ? (
          <Card style={styles.editCard}>
            <Text style={styles.cardTitle}>Edit Profile</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Driver Name</Text>
              <TextInput
                style={styles.input}
                value={formData.driverName}
                onChangeText={(text) => setFormData({ ...formData, driverName: text })}
                placeholder="Enter driver name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.driverPhone}
                onChangeText={(text) => setFormData({ ...formData, driverPhone: text })}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <View style={styles.buttonRow}>
              <Button
                title="Cancel"
                onPress={() => setEditing(false)}
                variant="outline"
                style={styles.halfButton}
              />
              <Button
                title="Save"
                onPress={handleSave}
                style={styles.halfButton}
              />
            </View>
          </Card>
        ) : (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Personal Information</Text>
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Icon name="pencil" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            
            <SettingItem
              icon="person-outline"
              label="Driver Name"
              value={profile?.driver?.name}
              showChevron={false}
            />
            <SettingItem
              icon="call-outline"
              label="Phone Number"
              value={profile?.driver?.phone}
              showChevron={false}
            />
            <SettingItem
              icon="mail-outline"
              label="Email"
              value={profile?.driver?.email}
              showChevron={false}
            />
            <SettingItem
              icon="card-outline"
              label="License Number"
              value={profile?.driver?.licenseNumber}
              showChevron={false}
            />
          </Card>
        )}

        {/* Ambulance Details */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Ambulance Details</Text>
          
          <SettingItem
            icon="car-outline"
            label="Vehicle Number"
            value={profile?.vehicleNumber}
            showChevron={false}
          />
          <SettingItem
            icon="medical-outline"
            label="Ambulance Type"
            value={profile?.type}
            showChevron={false}
          />
          <SettingItem
            icon="business-outline"
            label="Base Hospital"
            value={profile?.baseHospital?.name || 'Not assigned'}
            showChevron={false}
          />
          <SettingItem
            icon={profile?.isVerified ? 'checkmark-circle' : 'time-outline'}
            label="Verification Status"
            value={profile?.isVerified ? 'Verified' : 'Pending'}
            showChevron={false}
          />
        </Card>

        {/* App Settings */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>App Settings</Text>
          
          <SettingItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => Toast.show({ type: 'info', text1: 'Coming soon!' })}
          />
          <SettingItem
            icon="language-outline"
            label="Language"
            value="English"
            onPress={() => Toast.show({ type: 'info', text1: 'Coming soon!' })}
          />
          <SettingItem
            icon="shield-checkmark-outline"
            label="Privacy & Security"
            onPress={() => Toast.show({ type: 'info', text1: 'Coming soon!' })}
          />
        </Card>

        {/* Support */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Support</Text>
          
          <SettingItem
            icon="help-circle-outline"
            label="Help & FAQs"
            onPress={() => Toast.show({ type: 'info', text1: 'Coming soon!' })}
          />
          <SettingItem
            icon="mail-outline"
            label="Contact Support"
            onPress={() => Toast.show({ type: 'info', text1: 'Coming soon!' })}
          />
          <SettingItem
            icon="information-circle-outline"
            label="About"
            onPress={() => Toast.show({ type: 'info', text1: 'HealthLink v1.0.0' })}
          />
        </Card>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
          <Icon name="log-out-outline" size={24} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.background
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  logoutButton: { padding: 8, backgroundColor: COLORS.error + '10', borderRadius: 8 },
  content: { flex: 1, paddingHorizontal: 20 },
  profileCard: { alignItems: 'center', paddingVertical: 30, marginBottom: 20 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center'
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface
  },
  profileName: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  profileEmail: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  vehicleNumberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  vehicleNumberText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  card: { marginBottom: 16 },
  editCard: { marginBottom: 16 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center'
  },
  settingLabel: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 2 },
  settingValue: { fontSize: 16, fontWeight: '500', color: COLORS.text },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.surface
  },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  halfButton: { flex: 1 },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: COLORS.error + '10',
    padding: 16,
    borderRadius: 12,
    marginTop: 8
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: COLORS.error }
});

export default ProfileSettingsScreen;