import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import donorService from '../../services/donorService';
import { COLORS } from '../../utils/constants';
import Loader from '../../components/common/Loader';
import AvailabilityToggle from '../../components/donor/AvailabilityToggle';
import Card from '../../components/common/Card';

const DonorDashboardScreen = () => {
  const [donor, setDonor] = useState(null);
  const [stats, setStats] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, statsRes, eligibilityRes] = await Promise.all([
        donorService.getDonorProfile(),
        donorService.getStats(),
        donorService.checkEligibility()
      ]);

      if (profileRes.success) setDonor(profileRes.data.donor);
      if (statsRes.success) setStats(statsRes.data.stats);
      if (eligibilityRes.success) setEligibility(eligibilityRes.data);
    } catch (error) {
      console.error('Load donor data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleAvailability = async (isAvailable) => {
    const status = isAvailable ? 'available' : 'offline';
    const result = await donorService.updateStatus(status);

    if (result.success) {
      Toast.show({
        type: 'success',
        text1: isAvailable ? 'You are now available' : 'You are now offline',
        text2: isAvailable ? 'You will receive donation requests' : 'You won\'t receive requests'
      });
      setDonor(prev => ({ ...prev, status }));
    } else {
      Toast.show({
        type: 'error',
        text1: 'Failed to update status'
      });
    }
  };

  if (loading) {
    return <Loader fullScreen message="Loading dashboard..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Blood Donor</Text>
          <Text style={styles.name}>{donor?.fullName || 'Donor'}</Text>
          <View style={styles.bloodTypeBadge}>
            <Icon name="water" size={16} color={COLORS.error} />
            <Text style={styles.bloodTypeText}>{donor?.bloodType || 'O+'}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Availability Toggle */}
        <AvailabilityToggle
          isAvailable={donor?.status === 'available'}
          onToggle={handleToggleAvailability}
          lastDonationDate={donor?.lastDonationDate}
          daysUntilEligible={eligibility?.daysUntilEligible || 0}
        />

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.error + '20' }]}>
              <Icon name="heart" size={28} color={COLORS.error} />
            </View>
            <Text style={styles.statValue}>{stats?.totalDonations || 0}</Text>
            <Text style={styles.statLabel}>Total Donations</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.success + '20' }]}>
              <Icon name="people" size={28} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>{stats?.livesSaved || 0}</Text>
            <Text style={styles.statLabel}>Lives Saved</Text>
          </Card>
        </View>

        {/* Eligibility Info */}
        {eligibility && (
          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>Donation Eligibility</Text>
            
            <View style={styles.infoRow}>
              <Icon 
                name={eligibility.isEligible ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={eligibility.isEligible ? COLORS.success : COLORS.error} 
              />
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={[styles.infoValue, { color: eligibility.isEligible ? COLORS.success : COLORS.error }]}>
                {eligibility.isEligible ? 'Eligible' : 'Not Eligible'}
              </Text>
            </View>

            {eligibility.nextEligibleDate && (
              <View style={styles.infoRow}>
                <Icon name="calendar" size={20} color={COLORS.textSecondary} />
                <Text style={styles.infoLabel}>Next Eligible:</Text>
                <Text style={styles.infoValue}>
                  {new Date(eligibility.nextEligibleDate).toLocaleDateString()}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Icon name="fitness" size={20} color={COLORS.textSecondary} />
              <Text style={styles.infoLabel}>Weight:</Text>
              <Text style={styles.infoValue}>
                {eligibility.weight || 50}kg (min: {eligibility.minWeight}kg)
              </Text>
            </View>
          </Card>
        )}

        {/* Tips Card */}
        <Card style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Icon name="bulb" size={24} color={COLORS.warning} />
            <Text style={styles.tipsTitle}>Donation Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.tipText}>Stay hydrated before and after donation</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.tipText}>Eat a healthy meal before donating</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.tipText}>Wait 90 days between donations</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.tipText}>Carry a valid ID to the hospital</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  greeting: { fontSize: 14, color: COLORS.textSecondary },
  name: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginTop: 2 },
  bloodTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  bloodTypeText: { fontSize: 16, fontWeight: 'bold', color: COLORS.error },
  content: { flex: 1, paddingHorizontal: 20 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 20 },
  statIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
  infoCard: { marginBottom: 16 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  infoLabel: { fontSize: 14, color: COLORS.textSecondary, flex: 1 },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  tipsCard: { marginBottom: 20 },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  tipsTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  tipsList: { gap: 10 },
  tipItem: { flexDirection: 'row', gap: 8 },
  bullet: { fontSize: 16, color: COLORS.warning, fontWeight: 'bold' },
  tipText: { flex: 1, fontSize: 14, color: COLORS.text, lineHeight: 20 }
});

export default DonorDashboardScreen;