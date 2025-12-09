import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import useAuthStore from '../../store/authStore';
import hospitalService from '../../services/hospitalService';
import { COLORS } from '../../utils/constants';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import BedAvailabilityCard from '../../components/hospital/BedAvailabilityCard';
import HospitalStats from '../../components/hospital/HospitalStats';

const HospitalDashboardScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const [hospital, setHospital] = useState(null);
  const [stats, setStats] = useState(null);
  const [acceptingEmergencies, setAcceptingEmergencies] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileResult, statsResult] = await Promise.all([
        hospitalService.getHospitalProfile(),
        hospitalService.getStats()
      ]);

      if (profileResult.success) {
        setHospital(profileResult.data.hospital);
        setAcceptingEmergencies(profileResult.data.hospital.acceptingEmergencies);
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

  const handleBedUpdate = async (bedType, newValue) => {
    const result = await hospitalService.updateBedAvailability({
      [bedType]: { available: newValue }
    });

    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Bed availability updated',
        text2: `${bedType} beds: ${newValue}`
      });
      await loadData();
    } else {
      Toast.show({
        type: 'error',
        text1: 'Failed to update',
        text2: result.error
      });
    }
  };

  const handleToggleEmergencies = async () => {
    const result = await hospitalService.updateProfile({
      acceptingEmergencies: !acceptingEmergencies
    });

    if (result.success) {
      setAcceptingEmergencies(!acceptingEmergencies);
      Toast.show({
        type: 'success',
        text1: acceptingEmergencies ? 'Emergency intake paused' : 'Emergency intake resumed',
        text2: acceptingEmergencies ? 'Not accepting new patients' : 'Now accepting emergencies'
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Failed to update status',
        text2: result.error
      });
    }
  };

  if (loading) {
    return <Loader fullScreen message="Loading hospital dashboard..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome,</Text>
          <Text style={styles.hospitalName}>{hospital?.name || 'Hospital'}</Text>
          <View style={styles.verificationBadge}>
            {hospital?.isVerified ? (
              <>
                <Icon name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </>
            ) : (
              <Text style={styles.pendingText}>Pending Verification</Text>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Icon name="settings-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Emergency Status Toggle */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusLeft}>
              <Icon 
                name={acceptingEmergencies ? "checkmark-circle" : "close-circle"} 
                size={32} 
                color={acceptingEmergencies ? COLORS.success : COLORS.error} 
              />
              <View>
                <Text style={styles.statusTitle}>Emergency Intake</Text>
                <Text style={styles.statusSubtitle}>
                  {acceptingEmergencies ? 'Accepting new patients' : 'Currently paused'}
                </Text>
              </View>
            </View>
            <Switch
              value={acceptingEmergencies}
              onValueChange={handleToggleEmergencies}
              trackColor={{ false: COLORS.disabled, true: COLORS.success }}
              thumbColor={acceptingEmergencies ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </Card>

        {/* Bed Availability */}
        {hospital?.bedAvailability && (
          <BedAvailabilityCard 
            bedAvailability={hospital.bedAvailability}
            onUpdate={handleBedUpdate}
          />
        )}

        {/* Stats */}
        <HospitalStats stats={stats} />

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Incoming')}
          >
            <Icon name="notifications-outline" size={24} color={COLORS.primary} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Incoming Patients</Text>
              <Text style={styles.actionSubtitle}>View ambulances en route</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('ManageBeds')}
          >
            <Icon name="bed-outline" size={24} color={COLORS.info} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Beds</Text>
              <Text style={styles.actionSubtitle}>Update bed availability</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('History')}
          >
            <Icon name="time-outline" size={24} color={COLORS.secondary} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Patient History</Text>
              <Text style={styles.actionSubtitle}>View past admissions</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Hospital Info */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Hospital Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{hospital?.type || '--'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Emergency Phone:</Text>
            <Text style={styles.infoValue}>{hospital?.emergencyPhone || '--'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
              {hospital?.location?.address || '--'}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  greeting: { fontSize: 14, color: COLORS.textSecondary },
  hospitalName: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginTop: 2 },
  verificationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  verifiedText: { fontSize: 12, color: COLORS.success, fontWeight: '600' },
  pendingText: { fontSize: 12, color: COLORS.warning, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 20 },
  statusCard: { marginBottom: 20 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  statusTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  statusSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 10, gap: 12 },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  actionSubtitle: { fontSize: 13, color: COLORS.textSecondary },
  infoCard: { marginBottom: 20 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { fontSize: 14, color: COLORS.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '500', color: COLORS.text }
});

export default HospitalDashboardScreen;