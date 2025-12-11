import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import hospitalService from '../../services/hospitalService';
import useGeolocation from '../../hooks/useGeolocation';
import { COLORS } from '../../utils/constants';
import Header from '../../components/common/Header';
import Loader from '../../components/common/Loader';
import Card from '../../components/common/Card';

const FindHospitalsScreen = ({ navigation }) => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { location, getCurrentLocation } = useGeolocation();

  useEffect(() => {
    loadHospitals();
  }, []);

  const loadHospitals = async () => {
    try {
      setLoading(true);

      // Get current location
      let currentLocation = location;
      if (!currentLocation) {
        currentLocation = await getCurrentLocation();
      }

      if (!currentLocation) {
        Toast.show({
          type: 'error',
          text1: 'Location Error',
          text2: 'Unable to get your location',
        });
        setLoading(false);
        return;
      }

      // Fetch nearby hospitals
      const result = await hospitalService.getAvailableHospitals({
        lat: currentLocation.lat,
        lng: currentLocation.lng,
      });

      if (result.success) {
        const hospitalsList = result.data.hospitals || [];
        hospitalsList.forEach(hospital => {
          if (hospital.location && hospital.location.coordinates) {
            const userLat = currentLocation.lat;
            const userLng = currentLocation.lng;
            const hospLat = hospital.location.coordinates[1];
            const hospLng = hospital.location.coordinates[0];
            // Haversine formula
            const toRad = value => (value * Math.PI) / 180;
            const R = 6371;
            const dLat = toRad(hospLat - userLat);
            const dLng = toRad(hospLng - userLng);
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(userLat)) *
                Math.cos(toRad(hospLat)) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            console.log(
              `[HOSPITAL DISTANCE] User (${userLat},${userLng}) <-> Hospital (${hospLat},${hospLng}): ${distance.toFixed(
                2,
              )} km`,
            );
          }
        });
        setHospitals(hospitalsList);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error,
        });
      }
    } catch (error) {
      console.error('Load hospitals error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load hospitals',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHospitals();
    setRefreshing(false);
  };

  const getBedAvailabilityColor = percentage => {
    if (percentage > 50) return COLORS.success;
    if (percentage > 20) return COLORS.warning;
    return COLORS.error;
  };

  const calculateTotalBeds = bedAvailability => {
    if (!bedAvailability) return { available: 0, total: 0 };

    const available =
      (bedAvailability.general?.available || 0) +
      (bedAvailability.icu?.available || 0) +
      (bedAvailability.emergency?.available || 0);

    const total =
      (bedAvailability.general?.total || 0) +
      (bedAvailability.icu?.total || 0) +
      (bedAvailability.emergency?.total || 0);

    return { available, total };
  };

  const handleCall = phone => {
    if (!phone) {
      Toast.show({
        type: 'error',
        text1: 'No Phone Number',
        text2: 'Hospital phone number not available.',
      });
      return;
    }
    const phoneNumber = `tel:${phone}`;
    Linking.openURL(phoneNumber).catch(() => {
      Toast.show({
        type: 'error',
        text1: 'Call Failed',
        text2: 'Unable to open dialer.',
      });
    });
  };

  const openMapsForNavigation = hospital => {
    if (!hospital.location || !hospital.location.coordinates) {
      Toast.show({
        type: 'error',
        text1: 'Location Error',
        text2: 'Hospital location not available',
      });
      return;
    }

    const lat = hospital.location.coordinates[1];
    const lng = hospital.location.coordinates[0];
    const label = encodeURIComponent(hospital.name);

    // Define map URLs
    const googleMapsUrl = Platform.select({
      ios: `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
      android: `google.navigation:q=${lat},${lng}&mode=d`,
    });

    const appleMapsUrl = `maps://app?daddr=${lat},${lng}&dirflg=d`;

    // Web fallback for both platforms
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${label}`;

    // For iOS: Give user choice between Google Maps and Apple Maps
    if (Platform.OS === 'ios') {
      Alert.alert('Open Navigation', 'Choose your preferred maps app', [
        {
          text: 'Google Maps',
          onPress: () => {
            Linking.canOpenURL(googleMapsUrl).then(supported => {
              if (supported) {
                Linking.openURL(googleMapsUrl);
              } else {
                // Google Maps not installed, open in browser
                Linking.openURL(webUrl);
              }
            });
          },
        },
        {
          text: 'Apple Maps',
          onPress: () => Linking.openURL(appleMapsUrl),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]);
    } else {
      // For Android: Try Google Maps, fallback to browser
      Linking.canOpenURL(googleMapsUrl)
        .then(supported => {
          if (supported) {
            Linking.openURL(googleMapsUrl);
          } else {
            Linking.openURL(webUrl);
          }
        })
        .catch(() => {
          Toast.show({
            type: 'error',
            text1: 'Navigation Error',
            text2: 'Unable to open maps',
          });
        });
    }
  };

  const renderHospitalItem = ({ item }) => {
    const beds = calculateTotalBeds(item.bedAvailability);
    const percentage = beds.total > 0 ? (beds.available / beds.total) * 100 : 0;

    return (
      <Card style={styles.hospitalCard}>
        <View style={styles.hospitalHeader}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: COLORS.info + '20' },
            ]}
          >
            <Icon name="business" size={28} color={COLORS.info} />
          </View>
          <View style={styles.hospitalInfo}>
            <Text style={styles.hospitalName}>{item.name}</Text>
            <Text style={styles.hospitalType}>{item.type} Hospital</Text>
            <View style={styles.distanceRow}>
              <Icon name="navigate" size={14} color={COLORS.textSecondary} />
              <Text style={styles.distance}>
                {item.distance
                  ? `${item.distance.toFixed(1)}km away`
                  : 'Distance unavailable'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bed Availability */}
        <View style={styles.bedsSection}>
          <Text style={styles.bedsTitle}>Bed Availability</Text>
          <View style={styles.bedsGrid}>
            <View style={styles.bedItem}>
              <Text style={styles.bedLabel}>General</Text>
              <Text style={styles.bedValue}>
                {item.bedAvailability?.general?.available || 0}
              </Text>
            </View>
            <View style={styles.bedItem}>
              <Text style={styles.bedLabel}>ICU</Text>
              <Text style={styles.bedValue}>
                {item.bedAvailability?.icu?.available || 0}
              </Text>
            </View>
            <View style={styles.bedItem}>
              <Text style={styles.bedLabel}>Emergency</Text>
              <Text style={styles.bedValue}>
                {item.bedAvailability?.emergency?.available || 0}
              </Text>
            </View>
          </View>

          <View style={styles.totalBeds}>
            <Text style={styles.totalBedsLabel}>Total Available:</Text>
            <Text
              style={[
                styles.totalBedsValue,
                { color: getBedAvailabilityColor(percentage) },
              ]}
            >
              {beds.available} / {beds.total}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleCall(item.phone || item.emergencyPhone)}
        >
          <Icon name="call" size={18} color={COLORS.primary} />
          <Text style={styles.actionText}>Call</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryAction]}
          onPress={() => openMapsForNavigation(item)}
        >
          <Icon name="navigate" size={18} color="#FFFFFF" />
          <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Directions</Text>
        </TouchableOpacity>
      </View>
      </Card>
    );
  };

  if (loading) {
    return <Loader fullScreen message="Finding nearby hospitals..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Nearby Hospitals"
        subtitle={`${hospitals.length} hospitals found`}
        onBackPress={() => navigation.goBack()}
      />

      <FlatList
        data={hospitals}
        renderItem={renderHospitalItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon
              name="business-outline"
              size={80}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyTitle}>No Hospitals Found</Text>
            <Text style={styles.emptyText}>
              Unable to find hospitals in your area
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 20 },
  hospitalCard: { marginBottom: 16 },
  hospitalHeader: { flexDirection: 'row', marginBottom: 12 },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hospitalInfo: { flex: 1 },
  hospitalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  hospitalType: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  distance: { fontSize: 13, color: COLORS.textSecondary },
  bedsSection: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  bedsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  bedsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  bedItem: { alignItems: 'center' },
  bedLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  bedValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  totalBeds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalBedsLabel: { fontSize: 14, color: COLORS.textSecondary },
  totalBedsValue: { fontSize: 18, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  primaryAction: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
});

export default FindHospitalsScreen;
