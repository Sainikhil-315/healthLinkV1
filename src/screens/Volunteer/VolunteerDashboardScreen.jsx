import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import volunteerService from '../../services/volunteerService';
import { COLORS } from '../../utils/constants';
import Loader from '../../components/common/Loader';
import Card from '../../components/common/Card';
import VolunteerStats from '../../components/volunteer/VolunteerStats';

const VolunteerDashboardScreen = () => {
  const [volunteer, setVolunteer] = useState(null);
  const [stats, setStats] = useState(null);
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, statsRes] = await Promise.all([
        volunteerService.getVolunteerProfile(),
        volunteerService.getStats()
      ]);

      if (profileRes.success) {
        setVolunteer(profileRes.data.volunteer);
        setIsOnDuty(profileRes.data.volunteer.status === 'available');
      }
      if (statsRes.success) setStats(statsRes.data.stats);
    } catch (error) {
      console.error('Load volunteer data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleDuty = async (value) => {
    const status = value ? 'available' : 'offline';
    const result = await volunteerService.updateStatus(status);

    if (result.success) {
      setIsOnDuty(value);
      Toast.show({
        type: 'success',
        text1: value ? 'You are now on duty' : 'You are now off duty',
        text2: value ? 'You will receive emergency alerts' : 'You won\'t receive alerts'
      });
    }
  };

  if (loading) {
    return <Loader fullScreen message="Loading dashboard..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Volunteer</Text>
          <Text style={styles.name}>{volunteer?.fullName || 'Volunteer'}</Text>
          {volunteer?.verificationStatus === 'verified' && (
            <View style={styles.verifiedBadge}>
              <Icon name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.verifiedText}>Verified CPR</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Card style={styles.dutyCard}>
          <View style={styles.dutyHeader}>
            <View style={styles.dutyLeft}>
              <View style={[styles.dutyIcon, { backgroundColor: isOnDuty ? COLORS.success + '20' : COLORS.textSecondary + '20' }]}>
                <Icon name="medkit" size={28} color={isOnDuty ? COLORS.success : COLORS.textSecondary} />
              </View>
              <View>
                <Text style={styles.dutyTitle}>Duty Status</Text>
                <Text style={styles.dutySubtitle}>
                  {isOnDuty ? 'Available for emergencies' : 'Currently off duty'}
                </Text>
              </View>
            </View>
            <Switch
              value={isOnDuty}
              onValueChange={handleToggleDuty}
              trackColor={{ false: COLORS.disabled, true: COLORS.success }}
              thumbColor={isOnDuty ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </Card>

        <VolunteerStats stats={stats} badges={volunteer?.badges} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  greeting: { fontSize: 14, color: COLORS.textSecondary },
  name: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginTop: 2 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  verifiedText: { fontSize: 14, fontWeight: '600', color: COLORS.success },
  content: { flex: 1, paddingHorizontal: 20 },
  dutyCard: { marginBottom: 20 },
  dutyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dutyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  dutyIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  dutyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  dutySubtitle: { fontSize: 14, color: COLORS.textSecondary }
});

export default VolunteerDashboardScreen;