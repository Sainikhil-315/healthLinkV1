import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';

import useEmergencyStore from '../../store/emergencyStore';
import socketService from '../../services/socketService';
import { COLORS, MAP_CONFIG } from '../../utils/constants';

const TrackAmbulanceScreen = ({ navigation }) => {
  const { activeEmergency, tracking, getEmergencyTracking, updateTracking } = useEmergencyStore();
  const [mapRegion, setMapRegion] = useState(MAP_CONFIG.DEFAULT_REGION);
  
  useEffect(() => {
    if (activeEmergency) {
      loadTracking();
      setupRealtimeTracking();
    }

    return () => {
      if (activeEmergency) {
        socketService.leaveIncidentRoom(activeEmergency.id);
      }
    };
  }, [activeEmergency]);

  const loadTracking = async () => {
    if (activeEmergency) {
      await getEmergencyTracking(activeEmergency.id);
      
      if (activeEmergency.location) {
        setMapRegion({
          latitude: activeEmergency.location.lat,
          longitude: activeEmergency.location.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05
        });
      }
    }
  };

  const setupRealtimeTracking = () => {
    if (!activeEmergency) return;

    socketService.joinIncidentRoom(activeEmergency.id);
    
    const unsubscribeLocation = socketService.on('ambulanceLocation', (data) => {
      updateTracking(data);
    });

    const unsubscribeStatus = socketService.on('emergencyUpdated', (data) => {
      if (data.incidentId === activeEmergency.id) {
        // Update emergency status
      }
    });

    return () => {
      unsubscribeLocation();
      unsubscribeStatus();
    };
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: COLORS.warning,
      ambulance_dispatched: COLORS.info,
      ambulance_arrived: COLORS.success,
      patient_picked_up: COLORS.primary,
      en_route_hospital: COLORS.primary,
      reached_hospital: COLORS.success
    };
    return colors[status] || COLORS.textSecondary;
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Dispatching ambulance...',
      ambulance_dispatched: 'Ambulance on the way',
      ambulance_arrived: 'Ambulance arrived at location',
      patient_picked_up: 'Patient picked up',
      en_route_hospital: 'Heading to hospital',
      reached_hospital: 'Reached hospital safely'
    };
    return texts[status] || status;
  };

  if (!activeEmergency) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Track Emergency</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Icon name="locate-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyStateText}>No active emergency</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Patient Location */}
        {activeEmergency.location && (
          <Marker
            coordinate={{
              latitude: activeEmergency.location.lat,
              longitude: activeEmergency.location.lng
            }}
            title="Your Location"
            pinColor={COLORS.primary}
          />
        )}

        {/* Ambulance Location */}
        {tracking?.ambulance && (
          <Marker
            coordinate={{
              latitude: tracking.ambulance.lat,
              longitude: tracking.ambulance.lng
            }}
            title="Ambulance"
          >
            <View style={styles.ambulanceMarker}>
              <Icon name="medical" size={24} color="#FFFFFF" />
            </View>
          </Marker>
        )}

        {/* Hospital Location */}
        {tracking?.hospital && (
          <Marker
            coordinate={{
              latitude: tracking.hospital.lat,
              longitude: tracking.hospital.lng
            }}
            title={tracking.hospital.name}
          >
            <View style={styles.hospitalMarker}>
              <Icon name="business" size={24} color="#FFFFFF" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(activeEmergency.status) }]} />
          <Text style={styles.statusText}>{getStatusText(activeEmergency.status)}</Text>
        </View>

        <ScrollView style={styles.infoContainer}>
          {/* Severity */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Severity</Text>
            <View style={[styles.severityBadge, { backgroundColor: COLORS[activeEmergency.severity] }]}>
              <Text style={styles.severityText}>{activeEmergency.severity}</Text>
            </View>
          </View>

          {/* ETA */}
          {activeEmergency.ambulanceETA && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ambulance ETA</Text>
              <Text style={styles.infoValue}>{activeEmergency.ambulanceETA} min</Text>
            </View>
          )}

          {/* Hospital */}
          {activeEmergency.hospitalName && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hospital</Text>
              <Text style={styles.infoValue}>{activeEmergency.hospitalName}</Text>
            </View>
          )}

          {/* Emergency Contacts Notified */}
          <View style={styles.contactsNotified}>
            <Icon name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.contactsNotifiedText}>
              Emergency contacts have been notified
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="call" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Call Ambulance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="share-social" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Share Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 10,
    elevation: 4
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text
  },
  map: {
    flex: 1
  },
  ambulanceMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF'
  },
  hospitalMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.info,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF'
  },
  statusCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '50%',
    elevation: 8
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text
  },
  infoContainer: {
    marginBottom: 16
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
  contactsNotified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 12
  },
  contactsNotifiedText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
    flex: 1
  },
  actions: {
    flexDirection: 'row',
    gap: 12
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyStateText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginTop: 16
  }
});

export default TrackAmbulanceScreen;