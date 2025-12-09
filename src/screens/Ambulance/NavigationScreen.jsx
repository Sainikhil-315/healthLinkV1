import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';

import useGeolocation from '../../hooks/useGeolocation';
import { COLORS, MAP_CONFIG } from '../../utils/constants';
import AmbulanceMarker from '../../components/maps/AmbulanceMarker';
import IncidentMarker from '../../components/maps/IncidentMarker';

const NavigationScreen = ({ route, navigation }) => {
  const { incident } = route.params || {};
  const { location, startTracking, stopTracking } = useGeolocation(true);
  const [mapRegion, setMapRegion] = useState(MAP_CONFIG.DEFAULT_REGION);

  useEffect(() => {
    if (incident?.location) {
      setMapRegion({
        latitude: incident.location.lat,
        longitude: incident.location.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05
      });
    }

    startTracking();

    return () => {
      stopTracking();
    };
  }, [incident]);

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Incident Marker */}
        {incident?.location && (
          <IncidentMarker
            coordinate={{
              latitude: incident.location.lat,
              longitude: incident.location.lng
            }}
            severity={incident.severity}
            title="Patient Location"
          />
        )}

        {/* Ambulance Marker (Current Location) */}
        {location && (
          <AmbulanceMarker
            coordinate={{
              latitude: location.lat,
              longitude: location.lng
            }}
            title="Your Location"
          />
        )}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Navigation</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Icon name="navigate" size={20} color={COLORS.primary} />
            <Text style={styles.infoValue}>
              {incident?.distance ? `${incident.distance.toFixed(1)}km` : '--'}
            </Text>
            <Text style={styles.infoLabel}>Distance</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoItem}>
            <Icon name="time" size={20} color={COLORS.success} />
            <Text style={styles.infoValue}>
              {incident?.eta ? `${incident.eta}min` : '--'}
            </Text>
            <Text style={styles.infoLabel}>ETA</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  header: { position: 'absolute', top: 60, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'rgba(255,255,255,0.95)', marginHorizontal: 20, borderRadius: 12, elevation: 4 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  infoCard: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, elevation: 8 },
  infoRow: { flexDirection: 'row' },
  infoItem: { flex: 1, alignItems: 'center' },
  infoValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginTop: 8 },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  divider: { width: 1, backgroundColor: COLORS.border, marginHorizontal: 20 }
});

export default NavigationScreen;