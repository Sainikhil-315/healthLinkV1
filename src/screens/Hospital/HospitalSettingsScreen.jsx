import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import useAuthStore from '../../store/authStore';
import { COLORS } from '../../utils/constants';
import Card from '../../components/common/Card';

const HospitalSettingsScreen = ({ navigation }) => {
  const { logout, user } = useAuthStore();
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel'
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              setLogoutLoading(true);
              await logout();
              Toast.show({
                type: 'success',
                text1: 'Logged out successfully',
                text2: 'See you next time!'
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Logout failed',
                text2: error.message || 'Please try again'
              });
            } finally {
              setLogoutLoading(false);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <Card style={styles.accountCard}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Hospital:</Text>
            <Text style={styles.value}>{user?.name || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user?.email || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{user?.phone || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Role:</Text>
            <Text style={[styles.value, { textTransform: 'capitalize' }]}>
              {user?.role || 'N/A'}
            </Text>
          </View>
          {user?.isVerified !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Status:</Text>
              <View style={[styles.statusBadge, { backgroundColor: user.isVerified ? COLORS.success : COLORS.warning }]}>
                <Text style={styles.statusText}>
                  {user.isVerified ? 'Verified' : 'Pending'}
                </Text>
              </View>
            </View>
          )}
        </Card>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <TouchableOpacity 
          style={styles.settingCard}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <View style={styles.settingLeft}>
            <Icon name="person-outline" size={24} color={COLORS.primary} />
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Edit Profile</Text>
              <Text style={styles.settingSubtitle}>Update hospital information</Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingCard}
          onPress={() => {}}
        >
          <View style={styles.settingLeft}>
            <Icon name="notifications-outline" size={24} color={COLORS.info} />
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingSubtitle}>Manage notification preferences</Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingCard}
          onPress={() => {}}
        >
          <View style={styles.settingLeft}>
            <Icon name="lock-closed-outline" size={24} color={COLORS.warning} />
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Change Password</Text>
              <Text style={styles.settingSubtitle}>Update your password</Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity 
          style={styles.settingCard}
          onPress={() => {}}
        >
          <View style={styles.settingLeft}>
            <Icon name="help-circle-outline" size={24} color={COLORS.secondary} />
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Help & Support</Text>
              <Text style={styles.settingSubtitle}>FAQs and contact support</Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingCard}
          onPress={() => {}}
        >
          <View style={styles.settingLeft}>
            <Icon name="information-circle-outline" size={24} color={COLORS.textSecondary} />
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>About HealthLink</Text>
              <Text style={styles.settingSubtitle}>Version 1.0.0</Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.logoutButton, logoutLoading && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={logoutLoading}
        >
          <Icon name="log-out-outline" size={24} color="#FFFFFF" />
          <Text style={styles.logoutText}>
            {logoutLoading ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12
  },
  accountCard: {
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500'
  },
  value: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600'
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    justifyContent: 'space-between'
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12
  },
  settingContent: {
    flex: 1
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2
  },
  settingSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginVertical: 12
  },
  logoutButtonDisabled: {
    opacity: 0.6
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default HospitalSettingsScreen;
