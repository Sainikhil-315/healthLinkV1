import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
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
  const [tripStatus, setTripStatus] = useState('en_route');
  
  const { on, off } = useSocket();

  useEffect(() => {
    loadCurrentTrip();
    
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
  const handleOpenInMaps = () => {
    if (!currentTrip?.location?.coordinates) {
      Toast.show({ type: 'error', text1: 'No location data' });
      return;
    }
    const [lng, lat] = currentTrip.location.coordinates;
    let url = '';
    if (Platform.OS === 'ios') {
      url = `http://maps.apple.com/?daddr=${lat},${lng}`;
    } else {
      // Prefer Google Maps navigation intent if available
      url = `google.navigation:q=${lat},${lng}`;
    }
    Linking.openURL(url).catch(() => {
      Toast.show({ type: 'error', text1: 'Failed to open maps' });
    });
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
            if (!currentTrip?._id) return;
            const result = await ambulanceService.arriveAtIncident(currentTrip._id);
            if (result.success) {
              setTripStatus('arrived');
              Toast.show({
                type: 'success',
                text1: 'Status Updated',
                text2: 'Marked as arrived at scene'
              });
            } else {
              Toast.show({
                type: 'error',
                text1: 'Failed to mark as arrived',
                text2: result.error
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
          <View style={{gap: 14, flexDirection: 'row', justifyContent: 'center'}}>
            <TouchableOpacity 
              style={[styles.actionButton, {flex: 1, backgroundColor: COLORS.primary}]}
              onPress={handleOpenInMaps}
              activeOpacity={0.8}
            >
              <Icon name="map" size={22} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Open in Maps</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, {flex: 1, backgroundColor: '#FF9500'}]}
              onPress={handleArrived}
              activeOpacity={0.8}
            >
              <Icon name="location" size={22} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Mark as Arrived</Text>
            </TouchableOpacity>
          </View>
        );
      case 'arrived':
        return (
          <TouchableOpacity 
            style={[styles.actionButton, styles.arrivedButton]}
            onPress={handlePickup}
            activeOpacity={0.8}
          >
            <Icon name="person-add" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Patient Picked Up</Text>
          </TouchableOpacity>
        );
      case 'picked_up':
      case 'transporting':
        return (
          <TouchableOpacity 
            style={[styles.actionButton, styles.completeButton]}
            onPress={handleComplete}
            activeOpacity={0.8}
          >
            <Icon name="checkmark-circle" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Complete Trip</Text>
          </TouchableOpacity>
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
          <View style={styles.emptyIconContainer}>
            <Icon name="car-outline" size={80} color={COLORS.textSecondary} />
          </View>
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
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Active Emergency</Text>
          <View style={styles.statusBadge}>
            <View style={styles.pulseIndicator} />
            <Text style={styles.statusBadgeText}>LIVE</Text>
          </View>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Timeline */}
        <View style={styles.timelineCard}>
          <View style={styles.statusTimeline}>
            <View style={styles.timelineItemWrapper}>
              <View style={[styles.timelineItem, tripStatus !== 'en_route' && styles.completed]}>
                <View style={[styles.timelineIcon, tripStatus !== 'en_route' && styles.completedIcon]}>
                  <Icon name="navigate" size={18} color="#FFFFFF" />
                </View>
              </View>
              <Text style={[styles.timelineText, tripStatus !== 'en_route' && styles.completedText]}>En Route</Text>
            </View>
            
            <View style={[styles.timelineLine, ['arrived', 'picked_up', 'transporting', 'completed'].includes(tripStatus) && styles.completedLine]} />
            
            <View style={styles.timelineItemWrapper}>
              <View style={[styles.timelineItem, ['arrived', 'picked_up', 'transporting', 'completed'].includes(tripStatus) && styles.completed]}>
                <View style={[styles.timelineIcon, ['arrived', 'picked_up', 'transporting', 'completed'].includes(tripStatus) && styles.completedIcon]}>
                  <Icon name="location" size={18} color="#FFFFFF" />
                </View>
              </View>
              <Text style={[styles.timelineText, ['arrived', 'picked_up', 'transporting', 'completed'].includes(tripStatus) && styles.completedText]}>Arrived</Text>
            </View>
            
            <View style={[styles.timelineLine, ['picked_up', 'transporting', 'completed'].includes(tripStatus) && styles.completedLine]} />
            
            <View style={styles.timelineItemWrapper}>
              <View style={[styles.timelineItem, ['picked_up', 'transporting', 'completed'].includes(tripStatus) && styles.completed]}>
                <View style={[styles.timelineIcon, ['picked_up', 'transporting', 'completed'].includes(tripStatus) && styles.completedIcon]}>
                  <Icon name="person" size={18} color="#FFFFFF" />
                </View>
              </View>
              <Text style={[styles.timelineText, ['picked_up', 'transporting', 'completed'].includes(tripStatus) && styles.completedText]}>Picked Up</Text>
            </View>
            
            <View style={[styles.timelineLine, tripStatus === 'completed' && styles.completedLine]} />
            
            <View style={styles.timelineItemWrapper}>
              <View style={[styles.timelineItem, tripStatus === 'completed' && styles.completed]}>
                <View style={[styles.timelineIcon, tripStatus === 'completed' && styles.completedIcon]}>
                  <Icon name="checkmark" size={18} color="#FFFFFF" />
                </View>
              </View>
              <Text style={[styles.timelineText, tripStatus === 'completed' && styles.completedText]}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Navigation Panel */}
        <NavigationPanel
          destination={currentTrip.location}
          eta={currentTrip.estimatedTimes?.ambulanceETA}
          distance={currentTrip.distance}
        />

        {/* Distance Info */}
        {typeof currentTrip.distance === 'number' && (
          <View style={styles.distanceCard}>
            <Icon name="navigate-circle" size={22} color={COLORS.primary} />
            <Text style={styles.distanceText}>
              {currentTrip.distance.toFixed(2)} km away
            </Text>
          </View>
        )}

        {/* Patient Details */}
        <PatientDetails
          patient={currentTrip.patient}
          triage={currentTrip.triage}
          bloodRequired={currentTrip.bloodRequired}
        />

        {/* Hospital Info */}
        {currentTrip.hospital && (
          <View style={styles.hospitalCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconWrapper}>
                <Icon name="medical" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Destination Hospital</Text>
            </View>
            <View style={styles.hospitalInfo}>
              <Text style={styles.hospitalName}>{currentTrip.hospital.name}</Text>
              <Text style={styles.hospitalAddress}>{currentTrip.hospital.address}</Text>
            </View>
          </View>
        )}

        {/* Emergency Contacts */}
        {currentTrip.contactsNotified && currentTrip.contactsNotified.length > 0 && (
          <View style={styles.contactsCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconWrapper}>
                <Icon name="people" size={20} color={COLORS.success} />
              </View>
              <Text style={styles.cardTitle}>Emergency Contacts</Text>
            </View>
            {currentTrip.contactsNotified.map((contact, index) => (
              <View key={index} style={styles.contactItem}>
                <View style={styles.contactInfo}>
                  <Icon name="person-circle" size={32} color={COLORS.primary} />
                  <Text style={styles.contactName}>{contact.name}</Text>
                </View>
                <TouchableOpacity style={styles.callButton}>
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
  container: { 
    flex: 1, 
    backgroundColor: '#F5F7FA' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: COLORS.text 
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  pulseIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statusTimeline: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineItemWrapper: {
    alignItems: 'center',
  },
  timelineItem: { 
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#E8ECF1', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  completedIcon: {
    backgroundColor: COLORS.primary,
  },
  timelineText: { 
    fontSize: 11, 
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  completedText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  completed: { 
    opacity: 1 
  },
  timelineLine: { 
    flex: 1, 
    height: 3, 
    backgroundColor: '#E8ECF1',
    marginHorizontal: 8,
    borderRadius: 2,
  },
  completedLine: {
    backgroundColor: COLORS.primary,
  },
  distanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  distanceText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '700',
  },
  hospitalCard: { 
    backgroundColor: '#FFFFFF', 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hospitalInfo: {
    gap: 6,
  },
  hospitalName: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: COLORS.text,
  },
  hospitalAddress: { 
    fontSize: 14, 
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  contactsCard: { 
    backgroundColor: '#FFFFFF', 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  contactItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  contactName: { 
    fontSize: 15, 
    color: COLORS.text,
    fontWeight: '600',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContainer: { 
    marginVertical: 24,
    marginBottom: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  arrivedButton: {
    backgroundColor: '#FF9500',
  },
  completeButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: { 
    flex: 1, 
    backgroundColor: '#F5F7FA' 
  },
  emptyContent: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 40 
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: { 
    fontSize: 26, 
    fontWeight: '700', 
    color: COLORS.text, 
    marginBottom: 12,
  },
  emptySubtitle: { 
    fontSize: 16, 
    color: COLORS.textSecondary, 
    textAlign: 'center', 
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: { 
    paddingHorizontal: 40 
  }
});

export default ActiveEmergencyScreen;