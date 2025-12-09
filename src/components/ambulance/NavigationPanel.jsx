import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';
import Card from '../common/Card';

const NavigationPanel = ({ destination, currentLocation, eta, distance, onNavigate }) => {
  const handleOpenMaps = () => {
    if (!destination?.lat || !destination?.lng) return;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
    Linking.openURL(url).catch(err => console.error('Error opening maps:', err));
  };

  const formatDistance = (dist) => {
    if (!dist) return 'Calculating...';
    return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Icon name="navigate-circle" size={32} color={COLORS.primary} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Navigation</Text>
          <Text style={styles.subtitle}>to patient location</Text>
        </View>
      </View>

      {/* Destination Address */}
      <View style={styles.addressContainer}>
        <Icon name="location" size={20} color={COLORS.textSecondary} />
        <Text style={styles.address} numberOfLines={2}>
          {destination?.address || 'Loading address...'}
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Icon name="time-outline" size={24} color={COLORS.info} />
          <Text style={styles.statLabel}>ETA</Text>
          <Text style={styles.statValue}>{eta ? `${eta} min` : '--'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBox}>
          <Icon name="navigate-outline" size={24} color={COLORS.success} />
          <Text style={styles.statLabel}>Distance</Text>
          <Text style={styles.statValue}>{formatDistance(distance)}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={handleOpenMaps}
        >
          <Icon name="map" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Open in Maps</Text>
        </TouchableOpacity>

        {onNavigate && (
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={onNavigate}
          >
            <Icon name="call" size={20} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>Call Patient</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Traffic Info */}
      <View style={styles.infoBox}>
        <Icon name="information-circle" size={16} color={COLORS.info} />
        <Text style={styles.infoText}>
          Keep your location services enabled for real-time tracking
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12
  },
  headerText: {
    flex: 1
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  addressContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  statBox: {
    flex: 1,
    alignItems: 'center'
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 4
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text
  },
  actions: {
    gap: 10,
    marginBottom: 12
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8
  },
  primaryButton: {
    backgroundColor: COLORS.primary
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600'
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info + '10',
    padding: 10,
    borderRadius: 8,
    gap: 8
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.info,
    lineHeight: 16
  }
});

export default NavigationPanel;