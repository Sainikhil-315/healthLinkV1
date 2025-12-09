import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import ambulanceService from '../../services/ambulanceService';
import useSocket from '../../hooks/useSocket';
import { COLORS } from '../../utils/constants';
import Loader from '../../components/common/Loader';
import NavigationPanel from '../../components/ambulance/NavigationPanel';
import PatientDetails from '../../components/ambulance/PatientDetails';
import Button from '../../components/common/Button';

const ActiveEmergencyScreen = ({ navigation }) => {
  const [currentTrip, setCurrentTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tripStatus, setTripStatus] = useState('en_route'); // en_route, arrived, picked_up, transporting
  
  const { on, off } = useSocket();

  useEffect(() => {
    loadCurrentTrip();
    
    // Listen for real-time updates
    const unsubscribe = on('emergency:updated', handleEmergencyUpdate);
    
    return () => {
      unsubscribe();
    };
  }, []);

  const loadCurrentTrip = async () => {
    try {
      setLoading(true);
      const result = await ambulanceService.getCurrentTrip();
      
      if (result.success && result.data.trip) {
        setCurrentTrip(result.data.trip);
        determineTripStatus(result.data.trip);
      }
    } catch (error) {
      console.error('Load current trip error:', error);
    } finally {
      setLoading(false);
    }
  };

  const determineTripStatus = (trip) => {
    if (trip.status === 'reached_hospital') {
      setTripStatus('completed');
    } else if (trip.status === 'en_route_hospital') {
      setTripStatus('transporting');
    } else if (trip.status === 'patient_picked_up') {
      setTripStatus('picked_up');
    } else if (trip.status === 'ambulance_arrived') {
      setTripStatus('arrived');
    } else {
      setTripStatus('en_route');
    }
  };

  const handleEmergencyUpdate = (data) => {
    if (currentTrip && data.incidentId === currentTrip._id) {
      setCurrentTrip(prev => ({ ...prev, ...data }));
      determineTripStatus(data);
    }
  };

  const handleArrived = async () => {
    Alert.alert(
      'Confirm Arrival',
      'Have you arrived at the patient location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Arrived',
          onPress: async () => {
            const result = await ambulanceService.updateStatus('ambulance_arrived');
            if (result.success) {
              setTripStatus('arrived');
              Toast.show({
                type: 'success',
                text1: 'Status Updated',
                text2: 'Marked as arrived at scene'
              });
            }
          }
        }
      ]
    );
  };

  const handlePickup = async () => {
    Alert.alert(
      'Confirm Pickup',
      'Have you picked up the patient?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Patient Onboard',
          onPress: async () => {
            const result = await ambulanceService.startTrip(currentTrip._id);
            if (result.success) {
              setTripStatus('picked_up');
              Toast.show({
                type: 'success',
                text1: 'Patient Picked Up',
                text2: 'Heading to hospital'
              });
            }
          }
        }
      ]
    );
  };

  const handleComplete = async () => {
    Alert.alert(
      'Complete Trip',
      'Have you reached the hospital and handed over the patient?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Complete Trip',
          onPress: async () => {
            const result = await ambulanceService.completeTrip(currentTrip._id);
            if (result.success) {
              Toast.show({
                type: 'success',
                text1: 'Trip Completed',
                text2: 'Great job! Stay safe.'
              });
              navigation.goBack();
            } else {
              Toast.show({
                type: 'error',
                text1: 'Failed to complete trip',
                text2: result.error
              });
            }
          }
        }
      ]
    );
  };

  const renderActionButton = () => {
    switch (tripStatus) {
      case 'en_route':
        return (
          <Button
            title="Mark as Arrived"
            onPress={handleArrived}
            icon={<Icon name="location" size={20} color="#FFFFFF" />}
          />
        );
      case 'arrived':
        return (
          <Button
            title="Patient Picked Up"
            onPress={handlePickup}
            icon={<Icon name="person" size={20} color="#FFFFFF" />}
          />
        );
      case 'picked_up':
      case 'transporting':
        return (
          <Button
            title="Complete Trip"
            onPress={handleComplete}
            variant="success"
            icon={<Icon name="checkmark-circle" size={20} color="#FFFFFF" />}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <Loader fullScreen message="Loading active trip..." />;
  }

  if (!currentTrip) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <Icon name="car-outline" size={80} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No Active Trip</Text>
          <Text style={styles.emptySubtitle}>
            You don't have any active emergency trips at the moment
          </Text>
          <Button
            title="Go to Dashboard"
            onPress={() => navigation.navigate('Home')}
            style={styles.emptyButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Emergency</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Status Timeline */}
        <View style={styles.statusTimeline}>
          <View style={[styles.timelineItem, tripStatus !== 'en_route' && styles.completed]}>
            <View style={styles.timelineIcon}>
              <Icon name="navigate" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.timelineText}>En Route</Text>
          </View>
          
          <View style={styles.timelineLine} />
          
          <View style={[styles.timelineItem, ['arrived', 'picked_up', 'transporting', 'completed'].includes(tripStatus) && styles.completed]}>
            <View style={styles.timelineIcon}>
              <Icon name="location" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.timelineText}>Arrived</Text>
          </View>
          
          <View style={styles.timelineLine} />
          
          <View style={[styles.timelineItem, ['picked_up', 'transporting', 'completed'].includes(tripStatus) && styles.completed]}>
            <View style={styles.timelineIcon}>
              <Icon name="person" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.timelineText}>Picked Up</Text>
          </View>
          
          <View style={styles.timelineLine} />
          
          <View style={[styles.timelineItem, tripStatus === 'completed' && styles.completed]}>
            <View style={styles.timelineIcon}>
              <Icon name="checkmark" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.timelineText}>Completed</Text>
          </View>
        </View>

        {/* Navigation Panel */}
        <NavigationPanel
          destination={currentTrip.location}
          eta={currentTrip.estimatedTimes?.ambulanceETA}
          distance={currentTrip.distance}
        />

        {/* Patient Details */}
        <PatientDetails
          patient={currentTrip.patient}
          triage={currentTrip.triage}
          bloodRequired={currentTrip.bloodRequired}
        />

        {/* Hospital Info */}
        {currentTrip.hospital && (
          <View style={styles.hospitalCard}>
            <View style={styles.hospitalHeader}>
              <Icon name="medical" size={24} color={COLORS.info} />
              <Text style={styles.hospitalTitle}>Destination Hospital</Text>
            </View>
            <Text style={styles.hospitalName}>{currentTrip.hospital.name}</Text>
            <Text style={styles.hospitalAddress}>{currentTrip.hospital.address}</Text>
          </View>
        )}

        {/* Emergency Contacts */}
        {currentTrip.contactsNotified && currentTrip.contactsNotified.length > 0 && (
          <View style={styles.contactsCard}>
            <Text style={styles.contactsTitle}>Emergency Contacts Notified</Text>
            {currentTrip.contactsNotified.map((contact, index) => (
              <View key={index} style={styles.contactItem}>
                <Icon name="person-circle" size={20} color={COLORS.textSecondary} />
                <Text style={styles.contactName}>{contact.name}</Text>
                <TouchableOpacity>
                  <Icon name="call" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Action Button */}
        <View style={styles.actionContainer}>
          {renderActionButton()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: COLORS.background },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  content: { flex: 1, paddingHorizontal: 20 },
  statusTimeline: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingVertical: 16 },
  timelineItem: { alignItems: 'center' },
  timelineIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.disabled, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  timelineText: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },
  completed: { opacity: 1 },
  timelineLine: { flex: 1, height: 2, backgroundColor: COLORS.border, marginHorizontal: 4 },
  hospitalCard: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, marginBottom: 16 },
  hospitalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  hospitalTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase' },
  hospitalName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  hospitalAddress: { fontSize: 14, color: COLORS.textSecondary },
  contactsCard: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, marginBottom: 16 },
  contactsTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  contactItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  contactName: { flex: 1, fontSize: 14, color: COLORS.text },
  actionContainer: { marginVertical: 20 },
  emptyContainer: { flex: 1, backgroundColor: COLORS.background },
  emptyContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginTop: 20, marginBottom: 8 },
  emptySubtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 30 },
  emptyButton: { paddingHorizontal: 40 }
});

export default ActiveEmergencyScreen;