  // Volunteer application modal
  const [volunteerModalVisible, setVolunteerModalVisible] = React.useState(false);
  const [submittingVolunteer, setSubmittingVolunteer] = React.useState(false);

  const handleBecomeVolunteer = async () => {
    setSubmittingVolunteer(true);
    const res = await becomeVolunteer();
    setSubmittingVolunteer(false);
    if (res.success) {
      Toast.show({ type: 'success', text1: 'Volunteer application submitted!' });
      setVolunteerModalVisible(false);
    } else {
      Toast.show({ type: 'error', text1: 'Error', text2: res.error || 'Could not submit application.' });
    }
  };

  const renderVolunteerModal = () => (
    <Modal
      visible={volunteerModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setVolunteerModalVisible(false)}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '85%' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: COLORS.info }}>Become a Volunteer</Text>
          <Text style={{ fontSize: 16, marginBottom: 16 }}>Apply to help in emergencies and community events. Your application will be reviewed by our team.</Text>
          <TouchableOpacity
            style={{ backgroundColor: COLORS.info, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32, alignSelf: 'center' }}
            onPress={handleBecomeVolunteer}
            disabled={submittingVolunteer}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{submittingVolunteer ? 'Submitting...' : 'Submit Application'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 16, alignSelf: 'center' }} onPress={() => setVolunteerModalVisible(false)}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Linking } from 'react-native'; 
import Toast from 'react-native-toast-message';
import useAuthStore from '../../store/authStore';
import useEmergencyStore from '../../store/emergencyStore';
import { COLORS, SCREENS } from '../../utils/constants';
import DateTimePicker from '@react-native-community/datetimepicker';

const DashboardScreen = ({ navigation }) => {
  const { user, becomeDonor, isLoading, loadStoredAuth } = useAuthStore();
  const { activeEmergency, getMyEmergencies, emergencies, isLoading: emergenciesLoading } = useEmergencyStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [donorModalVisible, setDonorModalVisible] = React.useState(false);
  const [donorFormVisible, setDonorFormVisible] = React.useState(false);
  const [lastDonationDate, setLastDonationDate] = React.useState('');
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [submittingDonor, setSubmittingDonor] = React.useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await getMyEmergencies();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStoredAuth();
    await loadData();
    // Debug: log user state after refresh
    console.log('User after refresh:', user);
    setRefreshing(false);
  };

  const handleBecomeDonor = async () => {
    const res = await becomeDonor();
    if (res.success) {
      Toast.show({ type: 'success', text1: 'You are now a donor!' });
    } else {
      Toast.show({ type: 'error', text1: 'Error', text2: res.error || 'Could not update donor status.' });
    }
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

  // Donor registration form modal
  const renderDonorFormModal = () => (
    <Modal
      visible={donorFormVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setDonorFormVisible(false)}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '85%' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: COLORS.success }}>Become a Donor</Text>
          <Text style={{ fontSize: 16, marginBottom: 8 }}>When was your last blood donation?</Text>
          <TouchableOpacity
            style={{ borderWidth: 1, borderColor: COLORS.textSecondary, borderRadius: 8, padding: 10, marginBottom: 16 }}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: lastDonationDate ? COLORS.text : COLORS.textSecondary }}>
              {lastDonationDate ? new Date(lastDonationDate).toLocaleDateString() : 'Select Date'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={lastDonationDate ? new Date(lastDonationDate) : new Date()}
              mode="date"
              display="calendar"
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setLastDonationDate(selectedDate.toISOString());
                }
              }}
            />
          )}
          <TouchableOpacity
            style={{ backgroundColor: COLORS.success, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32, alignSelf: 'center' }}
            onPress={async () => {
              setSubmittingDonor(true);
              const res = await becomeDonor({ lastDonationDate });
              setSubmittingDonor(false);
              if (res.success) {
                Toast.show({ type: 'success', text1: 'You are now a donor!' });
                setDonorFormVisible(false);
              } else {
                Toast.show({ type: 'error', text1: 'Error', text2: res.error || 'Could not update donor status.' });
              }
            }}
            disabled={submittingDonor || !lastDonationDate}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{submittingDonor ? 'Submitting...' : 'Submit'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 16, alignSelf: 'center' }} onPress={() => setDonorFormVisible(false)}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Donor details modal content
  const renderDonorDetailsModal = () => (
    <Modal
      visible={donorModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setDonorModalVisible(false)}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '85%' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: COLORS.success }}>Donor Details</Text>
          <Text style={{ fontSize: 16, marginBottom: 8 }}>Blood Type: <Text style={{ fontWeight: 'bold' }}>{user?.healthProfile?.bloodType || 'N/A'}</Text></Text>
          <Text style={{ fontSize: 16, marginBottom: 8 }}>Last Donation Date: <Text style={{ fontWeight: 'bold' }}>{user?.lastDonationDate ? new Date(user.lastDonationDate).toLocaleDateString() : 'N/A'}</Text></Text>
          <Text style={{ fontSize: 16, marginBottom: 8 }}>Weight: <Text style={{ fontWeight: 'bold' }}>{user?.healthProfile?.weight || 'N/A'} kg</Text></Text>
          <Text style={{ fontSize: 16, marginBottom: 8 }}>Chronic Conditions: <Text style={{ fontWeight: 'bold' }}>{user?.healthProfile?.chronicConditions?.join(', ') || 'None'}</Text></Text>
          <Text style={{ fontSize: 16, marginBottom: 8 }}>Current Medications: <Text style={{ fontWeight: 'bold' }}>{user?.healthProfile?.currentMedications?.map(med => med.name).join(', ') || 'None'}</Text></Text>
          <TouchableOpacity style={{ marginTop: 24, alignSelf: 'center', backgroundColor: COLORS.success, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32 }} onPress={() => setDonorModalVisible(false)}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{user?.fullName || user?.name || 'User'}</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
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

        {/* Become a Donor Button or View Donor Details Button */}
        {!user?.isDonor && (
          <TouchableOpacity
            style={[styles.actionCard, { borderLeftColor: COLORS.success }]}
            onPress={() => setDonorFormVisible(true)}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <View style={[styles.iconContainer, { backgroundColor: COLORS.success + '20' }]}> 
              <Icon name="heart" size={28} color={COLORS.success} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{isLoading ? 'Processing...' : 'Become a Donor'}</Text>
              <Text style={styles.actionDescription}>Help save lives by registering as a donor.</Text>
            </View>
          </TouchableOpacity>
        )}
        {user?.isDonor && (
          <TouchableOpacity
            style={[styles.actionCard, { borderLeftColor: COLORS.success }]}
            onPress={() => setDonorModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: COLORS.success + '20' }]}> 
              <Icon name="information-circle" size={28} color={COLORS.success} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Donor Details</Text>
              <Text style={styles.actionDescription}>See your donor information.</Text>
            </View>
          </TouchableOpacity>
        )}

        {renderDonorFormModal()}
        {renderDonorDetailsModal()}
        {/* Become a Volunteer Button or Status */}
        {user?.volunteerStatus === 'none' && (
          <TouchableOpacity
            style={[styles.actionCard, { borderLeftColor: COLORS.info }]}
            onPress={() => setVolunteerModalVisible(true)}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <View style={[styles.iconContainer, { backgroundColor: COLORS.info + '20' }]}> 
              <Icon name="hand-left" size={28} color={COLORS.info} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{isLoading ? 'Processing...' : 'Become a Volunteer'}</Text>
              <Text style={styles.actionDescription}>Apply to help in emergencies and events.</Text>
            </View>
          </TouchableOpacity>
        )}
        {user?.volunteerStatus === 'pending' && (
          <View style={[styles.actionCard, { borderLeftColor: COLORS.info, opacity: 0.7 }]}> 
            <View style={[styles.iconContainer, { backgroundColor: COLORS.info + '20' }]}> 
              <Icon name="time" size={28} color={COLORS.info} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Volunteer Application Pending</Text>
              <Text style={styles.actionDescription}>Your application is under review.</Text>
            </View>
          </View>
        )}
        {user?.volunteerStatus === 'approved' && (
          <View style={[styles.actionCard, { borderLeftColor: COLORS.info }]}> 
            <View style={[styles.iconContainer, { backgroundColor: COLORS.info + '20' }]}> 
              <Icon name="checkmark-circle" size={28} color={COLORS.info} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Verified Volunteer</Text>
              <Text style={styles.actionDescription}>Thank you for volunteering!</Text>
            </View>
          </View>
        )}
        {user?.volunteerStatus === 'rejected' && (
          <View style={[styles.actionCard, { borderLeftColor: COLORS.danger }]}> 
            <View style={[styles.iconContainer, { backgroundColor: COLORS.danger + '20' }]}> 
              <Icon name="close-circle" size={28} color={COLORS.danger} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Volunteer Application Rejected</Text>
              <Text style={styles.actionDescription}>Please contact support for details.</Text>
            </View>
          </View>
        )}
        {renderVolunteerModal()}

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