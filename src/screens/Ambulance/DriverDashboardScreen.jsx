import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import useAuthStore from '../../store/authStore';
import ambulanceService from '../../services/ambulanceService';
import useGeolocation from '../../hooks/useGeolocation';
import useBackgroundLocation from '../../hooks/useBackgroundLocation';
import { COLORS } from '../../utils/constants';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';

const DriverDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const { location, getCurrentLocation, startTracking, stopTracking } =
    useGeolocation();
  const { isTracking, startBackgroundTracking, stopBackgroundTracking } =
    useBackgroundLocation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileResult, statsResult] = await Promise.all([
        ambulanceService.getAmbulanceProfile(),
        ambulanceService.getStats(),
      ]);

      if (profileResult.success) {
        setProfile(profileResult.data.ambulance);
        setIsOnDuty(
          profileResult.data.ambulance.status === 'available' ||
            profileResult.data.ambulance.status === 'on_duty',
        );
      }

      if (statsResult.success) {
        setStats(statsResult.data.stats);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleDuty = async () => {
    const newStatus = isOnDuty ? 'offline' : 'available';

    const result = await ambulanceService.updateStatus(newStatus);

    if (result.success) {
      setIsOnDuty(!isOnDuty);

      if (!isOnDuty) {
        await startBackgroundTracking();
        Toast.show({
          type: 'success',
          text1: 'You are now on duty',
          text2: 'Location tracking enabled',
        });
      } else {
        await stopBackgroundTracking();
        Toast.show({
          type: 'info',
          text1: 'You are now off duty',
          text2: 'Location tracking disabled',
        });
      }
    } else {
      Toast.show({
        type: 'error',
        text1: 'Failed to update status',
        text2: result.error,
      });
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          Toast.show({
            type: 'success',
            text1: 'Logged out successfully',
          });
        },
      },
    ]);
  };

  const handleUpdateLocation = async () => {
    try {
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        const result = await ambulanceService.updateLocation(currentLocation);
        if (result.success) {
          Toast.show({
            type: 'success',
            text1: 'Location Updated',
            text2: 'Your current location has been updated',
          });
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to update location',
      });
    }
  };

  const handleEquipmentStatus = () => {
    navigation.navigate('EquipmentStatus', {
      profile,
      onEquipmentUpdate: (updatedEquipment) => {
        setProfile((prev) => ({ ...prev, equipment: updatedEquipment }));
      }
    });
  };

  const handleTripHistory = () => {
    navigation.navigate('Trips');
  };

  const StatCard = ({ icon, label, value, color }) => (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={28} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );

  if (loading) {
    return <Loader fullScreen message="Loading dashboard..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header with Logout */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.driverName}>
            {profile?.driver?.name || 'Driver'}
          </Text>
          <Text style={styles.vehicleNumber}>{profile?.vehicleNumber}</Text>
        </View>
        <View style={styles.headerRight}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isOnDuty
                  ? COLORS.success
                  : COLORS.textSecondary,
              },
            ]}
          >
            <Text style={styles.statusText}>
              {isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Icon name="log-out-outline" size={24} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Duty Toggle */}
        <Card style={styles.dutyCard}>
          <View style={styles.dutyHeader}>
            <View>
              <Text style={styles.dutyTitle}>Duty Status</Text>
              <Text style={styles.dutySubtitle}>
                {isOnDuty
                  ? 'Available for emergencies'
                  : 'Not accepting requests'}
              </Text>
            </View>
            <Switch
              value={isOnDuty}
              onValueChange={handleToggleDuty}
              trackColor={{ false: COLORS.disabled, true: COLORS.success }}
              thumbColor={isOnDuty ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
          {isTracking && (
            <View style={styles.trackingIndicator}>
              <View style={styles.pulsingDot} />
              <Text style={styles.trackingText}>Location tracking active</Text>
            </View>
          )}
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="car-outline"
            label="Total Trips"
            value={stats?.totalTrips || 0}
            color={COLORS.primary}
          />
          <StatCard
            icon="checkmark-circle-outline"
            label="Completed"
            value={stats?.completedTrips || 0}
            color={COLORS.success}
          />
          <StatCard
            icon="time-outline"
            label="Avg Response"
            value={
              stats?.averageResponseTime
                ? `${stats.averageResponseTime}m`
                : '--'
            }
            color={COLORS.info}
          />
          <StatCard
            icon="star-outline"
            label="Rating"
            value={stats?.averageRating ? stats.averageRating.toFixed(1) : '--'}
            color={COLORS.warning}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleUpdateLocation}
          >
            <Icon name="location-outline" size={24} color={COLORS.info} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Update Location</Text>
              <Text style={styles.actionSubtitle}>
                Refresh your current position
              </Text>
            </View>
            <Icon
              name="chevron-forward"
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleEquipmentStatus}
          >
            <Icon name="construct-outline" size={24} color={COLORS.warning} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Equipment Status</Text>
              <Text style={styles.actionSubtitle}>
                Update available equipment
              </Text>
            </View>
            <Icon
              name="chevron-forward"
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleTripHistory}
          >
            <Icon name="list-outline" size={24} color={COLORS.secondary} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Trip History</Text>
              <Text style={styles.actionSubtitle}>View completed trips</Text>
            </View>
            <Icon
              name="chevron-forward"
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Ambulance Info */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Ambulance Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{profile?.type || 'Basic'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Base Hospital:</Text>
            <Text style={styles.infoValue}>
              {profile?.baseHospital?.name || 'Not assigned'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text
              style={[
                styles.infoValue,
                { color: isOnDuty ? COLORS.success : COLORS.textSecondary },
              ]}
            >
              {profile?.status || 'Offline'}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
  },
  headerRight: { alignItems: 'flex-end', gap: 8 },
  greeting: { fontSize: 14, color: COLORS.textSecondary },
  driverName: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  vehicleNumber: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  logoutButton: {
    padding: 8,
    backgroundColor: COLORS.error + '10',
    borderRadius: 8,
  },
  content: { flex: 1, paddingHorizontal: 20 },
  dutyCard: { marginBottom: 20 },
  dutyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dutyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  dutySubtitle: { fontSize: 13, color: COLORS.textSecondary },
  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  trackingText: { fontSize: 12, color: COLORS.success },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: { width: '48%', alignItems: 'center', paddingVertical: 20 },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: COLORS.textSecondary },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  actionContent: { flex: 1 },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  actionSubtitle: { fontSize: 13, color: COLORS.textSecondary },
  infoCard: { marginBottom: 20 },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: { fontSize: 14, color: COLORS.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '500', color: COLORS.text },
});

export default DriverDashboardScreen;