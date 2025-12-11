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

const DashboardScreen = ({ navigation }) => {
  const { user, becomeDonor, becomeVolunteer, isLoading, loadStoredAuth } = useAuthStore();
  const { activeEmergency, getMyEmergencies, emergencies, isLoading: emergenciesLoading } = useEmergencyStore();
  
  const [refreshing, setRefreshing] = React.useState(false);
  
  // Donor state
  const [donorModalVisible, setDonorModalVisible] = React.useState(false);
  const [donorFormVisible, setDonorFormVisible] = React.useState(false);
  const [lastDonationDate, setLastDonationDate] = React.useState('');
  const [submittingDonor, setSubmittingDonor] = React.useState(false);
  
  // Volunteer state
  const [volunteerModalVisible, setVolunteerModalVisible] = React.useState(false);
  const [submittingVolunteer, setSubmittingVolunteer] = React.useState(false);

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
    console.log('User after refresh:', user);
    setRefreshing(false);
  };

  const handleBecomeDonor = async () => {
    if (!lastDonationDate.trim()) {
      Toast.show({ 
        type: 'error', 
        text1: 'Date Required', 
        text2: 'Please enter your last donation date' 
      });
      return;
    }

    setSubmittingDonor(true);
    const res = await becomeDonor({ lastDonationDate });
    setSubmittingDonor(false);
    
    if (res.success) {
      Toast.show({ type: 'success', text1: 'You are now a donor!' });
      setDonorFormVisible(false);
      setLastDonationDate('');
    } else {
      Toast.show({ 
        type: 'error', 
        text1: 'Error', 
        text2: res.error || 'Could not update donor status.' 
      });
    }
  };

  const handleBecomeVolunteer = async () => {
    setSubmittingVolunteer(true);
    const res = await becomeVolunteer();
    setSubmittingVolunteer(false);
    
    if (res.success) {
      Toast.show({ type: 'success', text1: 'Volunteer application submitted!' });
      setVolunteerModalVisible(false);
    } else {
      Toast.show({ 
        type: 'error', 
        text1: 'Error', 
        text2: res.error || 'Could not submit application.' 
      });
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
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Become a Donor</Text>
          
          <Text style={styles.inputLabel}>Last Blood Donation Date</Text>
          <Text style={styles.inputHint}>Format: DD/MM/YYYY (e.g., 15/03/2024)</Text>
          
          <TextInput
            style={styles.dateInput}
            value={lastDonationDate}
            onChangeText={setLastDonationDate}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setDonorFormVisible(false);
                setLastDonationDate('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.submitButton, 
                (!lastDonationDate.trim() || submittingDonor) && styles.submitButtonDisabled
              ]}
              onPress={handleBecomeDonor}
              disabled={!lastDonationDate.trim() || submittingDonor}
            >
              <Text style={styles.submitButtonText}>
                {submittingDonor ? 'Submitting...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Donor details modal
  const renderDonorDetailsModal = () => (
    <Modal
      visible={donorModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setDonorModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Donor Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Blood Type:</Text>
            <Text style={styles.detailValue}>
              {user?.healthProfile?.bloodType || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Donation:</Text>
            <Text style={styles.detailValue}>
              {user?.lastDonationDate ? new Date(user.lastDonationDate).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Weight:</Text>
            <Text style={styles.detailValue}>
              {user?.healthProfile?.weight || 'N/A'} kg
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Conditions:</Text>
            <Text style={styles.detailValue}>
              {user?.healthProfile?.chronicConditions?.join(', ') || 'None'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Medications:</Text>
            <Text style={styles.detailValue}>
              {user?.healthProfile?.currentMedications?.map(med => med.name).join(', ') || 'None'}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setDonorModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Volunteer application modal
  const renderVolunteerModal = () => (
    <Modal
      visible={volunteerModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setVolunteerModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Become a Volunteer</Text>
          
          <Text style={styles.modalDescription}>
            Apply to help in emergencies and community events. Your application will be reviewed by our team.
          </Text>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setVolunteerModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.submitButton, submittingVolunteer && styles.submitButtonDisabled]}
              onPress={handleBecomeVolunteer}
              disabled={submittingVolunteer}
            >
              <Text style={styles.submitButtonText}>
                {submittingVolunteer ? 'Submitting...' : 'Submit Application'}
              </Text>
            </TouchableOpacity>
          </View>
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

        {/* Become a Donor / View Donor Details */}
        {!user?.isDonor ? (
          <TouchableOpacity
            style={[styles.actionCard, { borderLeftColor: COLORS.success }]}
            onPress={() => setDonorFormVisible(true)}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <View style={[styles.iconContainer, { backgroundColor: COLORS.success + '20' }]}> 
              <Icon name="heart" size={28} color={COLORS.success} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>
                {isLoading ? 'Processing...' : 'Become a Donor'}
              </Text>
              <Text style={styles.actionDescription}>
                Help save lives by registering as a donor.
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionCard, { borderLeftColor: COLORS.success }]}
            onPress={() => setDonorModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: COLORS.success + '20' }]}> 
              <Icon name="information-circle" size={28} color={COLORS.success} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Donor Details</Text>
              <Text style={styles.actionDescription}>
                See your donor information.
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Become a Volunteer / Status */}
        {user?.volunteerStatus === 'none' && (
          <TouchableOpacity
            style={[styles.actionCard, { borderLeftColor: COLORS.info }]}
            onPress={() => setVolunteerModalVisible(true)}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <View style={[styles.iconContainer, { backgroundColor: COLORS.info + '20' }]}> 
              <Icon name="hand-left" size={28} color={COLORS.info} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>
                {isLoading ? 'Processing...' : 'Become a Volunteer'}
              </Text>
              <Text style={styles.actionDescription}>
                Apply to help in emergencies and events.
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}

        {user?.volunteerStatus === 'pending' && (
          <View style={[styles.actionCard, { borderLeftColor: COLORS.warning, opacity: 0.9 }]}> 
            <View style={[styles.iconContainer, { backgroundColor: COLORS.warning + '20' }]}> 
              <Icon name="time" size={28} color={COLORS.warning} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Volunteer Application Pending</Text>
              <Text style={styles.actionDescription}>
                Your application is under review.
              </Text>
            </View>
          </View>
        )}

        {user?.volunteerStatus === 'approved' && (
          <View style={[styles.actionCard, { borderLeftColor: COLORS.success }]}> 
            <View style={[styles.iconContainer, { backgroundColor: COLORS.success + '20' }]}> 
              <Icon name="checkmark-circle" size={28} color={COLORS.success} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Verified Volunteer</Text>
              <Text style={styles.actionDescription}>
                Thank you for volunteering!
              </Text>
            </View>
          </View>
        )}

        {user?.volunteerStatus === 'rejected' && (
          <View style={[styles.actionCard, { borderLeftColor: COLORS.error }]}> 
            <View style={[styles.iconContainer, { backgroundColor: COLORS.error + '20' }]}> 
              <Icon name="close-circle" size={28} color={COLORS.error} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Volunteer Application Rejected</Text>
              <Text style={styles.actionDescription}>
                Please contact support for details.
              </Text>
            </View>
          </View>
        )}

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

      {/* Modals */}
      {renderDonorFormModal()}
      {renderDonorDetailsModal()}
      {renderVolunteerModal()}
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
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.text
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 24,
    color: COLORS.textSecondary,
    lineHeight: 22
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4
  },
  inputHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8
  },
  dateInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 24
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600'
  },
  submitButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center'
  },
  submitButtonDisabled: {
    opacity: 0.5
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  detailLabel: {
    fontSize: 16,
    color: COLORS.textSecondary
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    textAlign: 'right'
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 24
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  }
});

export default DashboardScreen;