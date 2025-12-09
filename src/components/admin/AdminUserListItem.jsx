import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';
import Card from '../common/Card';

const AdminUserListItem = ({ user, onPress, onToggleStatus }) => {
  const getRoleIcon = (role) => {
    const icons = {
      user: 'person',
      ambulance: 'medical',
      hospital: 'business',
      volunteer: 'medkit',
      donor: 'water',
      admin: 'shield-checkmark'
    };
    return icons[role] || 'person';
  };

  const getRoleColor = (role) => {
    const colors = {
      user: COLORS.primary,
      ambulance: COLORS.error,
      hospital: COLORS.info,
      volunteer: COLORS.secondary,
      donor: COLORS.warning,
      admin: COLORS.text
    };
    return colors[role] || COLORS.primary;
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: getRoleColor(user.role) + '20' }]}>
          <Icon name={getRoleIcon(user.role)} size={24} color={getRoleColor(user.role)} />
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{user.fullName || user.name}</Text>
          <Text style={styles.contact}>{user.email}</Text>
          <Text style={styles.contact}>{user.phone}</Text>
          
          <View style={styles.badges}>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
              <Text style={styles.roleText}>{user.role?.toUpperCase()}</Text>
            </View>
            
            {user.isVerified && (
              <View style={[styles.badge, { backgroundColor: COLORS.success }]}>
                <Icon name="checkmark-circle" size={12} color="#FFFFFF" />
                <Text style={styles.badgeText}>Verified</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: user.isActive ? COLORS.success : COLORS.error }
          ]} />
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              onToggleStatus();
            }}
            style={styles.iconButton}
          >
            <Icon 
              name={user.isActive ? 'pause-circle' : 'play-circle'} 
              size={24} 
              color={user.isActive ? COLORS.warning : COLORS.success} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  content: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  contact: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
  badges: { flexDirection: 'row', gap: 6, marginTop: 6 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  roleText: { fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 10, gap: 3 },
  badgeText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF' },
  actions: { alignItems: 'center', gap: 8 },
  statusIndicator: { width: 10, height: 10, borderRadius: 5 },
  iconButton: { padding: 4 }
});

export default AdminUserListItem;