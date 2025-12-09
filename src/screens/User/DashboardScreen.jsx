import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Linking } from 'react-native'; 
import useAuthStore from '../../store/authStore';
import useEmergencyStore from '../../store/emergencyStore';
import { COLORS, SCREENS } from '../../utils/constants';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const { activeEmergency, getMyEmergencies, emergencies, isLoading } = useEmergencyStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await getMyEmergencies();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const QuickActionCard = ({ icon, title, description, color, onPress }) => (
    <TouchableOpacity
      style={[styles.actionCard, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={28} color={color} />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => {}}
        >
          <Icon name="notifications-outline" size={24} color={COLORS.text} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Active Emergency Alert */}
        {activeEmergency && (
          <TouchableOpacity
            style={styles.activeEmergency}
            onPress={() => navigation.navigate(SCREENS.TRACK_AMBULANCE)}
          >
            <View style={styles.emergencyHeader}>
              <View style={styles.pulsingDot} />
              <Text style={styles.emergencyTitle}>Active Emergency</Text>
            </View>
            <Text style={styles.emergencyStatus}>
              Status: {activeEmergency.status}
            </Text>
            <Text style={styles.emergencyDetails}>
              Tap to track ambulance →
            </Text>
          </TouchableOpacity>
        )}

        {/* Emergency SOS Button */}
        <TouchableOpacity
          style={styles.sosButton}
          onPress={() => navigation.navigate(SCREENS.EMERGENCY_SOS)}
          activeOpacity={0.8}
        >
          <View style={styles.sosIcon}>
            <Icon name="alert-circle" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.sosText}>Emergency SOS</Text>
          <Text style={styles.sosSubtext}>Tap for immediate help</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <QuickActionCard
            icon="call-outline"
            title="Call 108"
            description="Direct emergency hotline"
            color={COLORS.primary}
            onPress={() => Linking.openURL('tel:108')}
          />

          <QuickActionCard
            icon="hospital-outline"
            title="Find Hospitals"
            description="Nearby hospitals with beds"
            color={COLORS.info}
            onPress={() => navigation.navigate('FindHospitals')}
          />

          <QuickActionCard
            icon="person-add-outline"
            title="Emergency Contacts"
            description="Manage your contacts"
            color={COLORS.secondary}
            onPress={() => navigation.navigate('EmergencyContacts')}
          />

          <QuickActionCard
            icon="medical-outline"
            title="Health Profile"
            description="Update medical information"
            color={COLORS.warning}
            onPress={() => navigation.navigate('HealthProfile')}
          />
        </View>

        {/* Recent Emergencies */}
        {emergencies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Emergencies</Text>
            {emergencies.slice(0, 3).map((emergency, index) => (
              <View key={index} style={styles.emergencyCard}>
                <View style={styles.emergencyCardHeader}>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: COLORS[emergency.severity] || COLORS.info }
                    ]}
                  >
                    <Text style={styles.severityText}>
                      {emergency.severity}
                    </Text>
                  </View>
                  <Text style={styles.emergencyDate}>
                    {new Date(emergency.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.emergencyLocation}>
                  {emergency.location?.address || 'Location unavailable'}
                </Text>
              </View>
            ))}
          </View>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.background
  },
  greeting: {
    fontSize: 16,
    color: COLORS.textSecondary
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text
  },
  notificationButton: {
    position: 'relative',
    padding: 8
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold'
  },
  content: {
    flex: 1,
    paddingHorizontal: 20
  },
  activeEmergency: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginRight: 8
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  emergencyStatus: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4
  },
  emergencyDetails: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600'
  },
  sosButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  sosIcon: {
    marginBottom: 12
  },
  sosText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4
  },
  sosSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  actionContent: {
    flex: 1
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4
  },
  actionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary
  },
  emergencyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  emergencyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600'
  },
  emergencyDate: {
    fontSize: 12,
    color: COLORS.textSecondary
  },
  emergencyLocation: {
    fontSize: 14,
    color: COLORS.text
  }
});

export default DashboardScreen;