import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import useAuthStore from '../../store/authStore';
import { COLORS } from '../../utils/constants';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuthStore();

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
            Toast.show({
              type: 'success',
              text1: 'Logged out',
              text2: 'See you soon!'
            });
          }
        }
      ]
    );
  };

  const MenuItem = ({ icon, title, subtitle, onPress, color = COLORS.text }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.userPhone}>{user?.phone}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
           <MenuItem
            icon="person-outline"
            title="Edit Profile"
            subtitle="Update your personal information"
            color={COLORS.primary}
            onPress={() => navigation.navigate('EditProfile')}
          />

          <MenuItem
            icon="medical-outline"
            title="Health Profile"
            subtitle="Blood type, allergies, conditions"
            color={COLORS.secondary}
            onPress={() => navigation.navigate('HealthProfile')}
          />

          <MenuItem
            icon="people-outline"
            title="Emergency Contacts"
            subtitle="Manage your emergency contacts"
            color={COLORS.warning}
            onPress={() => navigation.navigate('EmergencyContacts')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency</Text>
          
          <MenuItem
            icon="time-outline"
            title="Emergency History"
            subtitle="View past emergencies"
            color={COLORS.info}
            onPress={() => {}}
          />

          <MenuItem
            icon="notifications-outline"
            title="Notifications"
            subtitle="Configure emergency alerts"
            color={COLORS.warning}
            onPress={() => {}}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <MenuItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="FAQs and contact support"
            color={COLORS.info}
            onPress={() => {}}
          />

          <MenuItem
            icon="document-text-outline"
            title="Terms & Privacy"
            subtitle="Read our policies"
            color={COLORS.textSecondary}
            onPress={() => {}}
          />

          <MenuItem
            icon="information-circle-outline"
            title="About HealthLink"
            subtitle="Version 1.0.0"
            color={COLORS.textSecondary}
            onPress={() => {}}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
    backgroundColor: COLORS.background
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text
  },
  content: {
    flex: 1
  },
  userCard: {
    backgroundColor: COLORS.surface,
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2
  },
  userPhone: {
    fontSize: 14,
    color: COLORS.textSecondary
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  menuContent: {
    flex: 1
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2
  },
  menuSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error + '20',
    marginHorizontal: 20,
    marginTop: 32,
    padding: 16,
    borderRadius: 12
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
    marginLeft: 8
  }
});

export default ProfileScreen;