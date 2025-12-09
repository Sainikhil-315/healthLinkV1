import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import hospitalService from '../../services/hospitalService';
import { COLORS } from '../../utils/constants';
import Header from '../../components/common/Header';
import Loader from '../../components/common/Loader';
import BedAvailabilityCard from '../../components/hospital/BedAvailabilityCard';

const ManageBedsScreen = ({ navigation }) => {
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await hospitalService.getHospitalProfile();
      
      if (result.success) {
        setHospital(result.data.hospital);
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
        text1: 'Updated successfully',
        text2: `${bedType} beds: ${newValue} available`
      });
      await loadData();
    } else {
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2: result.error
      });
    }
  };

  if (loading) {
    return <Loader fullScreen message="Loading bed information..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Manage Beds"
        subtitle="Update bed availability"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {hospital?.bedAvailability && (
          <BedAvailabilityCard
            bedAvailability={hospital.bedAvailability}
            onUpdate={handleBedUpdate}
          />
        )}

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Icon name="bulb-outline" size={24} color={COLORS.warning} />
            <Text style={styles.tipsTitle}>Tips for Accurate Reporting</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.tipText}>Update bed availability in real-time as patients are admitted or discharged</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.tipText}>Reserved beds should not be marked as available</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.tipText}>ICU and Emergency beds are prioritized for critical cases</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.tipText}>Maintain buffer capacity for unexpected emergencies</Text>
            </View>
          </View>
        </View>

        {/* Capacity Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Capacity Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>
                {hospital?.bedAvailability?.general?.available + 
                 hospital?.bedAvailability?.icu?.available + 
                 hospital?.bedAvailability?.emergency?.available || 0}
              </Text>
              <Text style={styles.overviewLabel}>Total Available</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>
                {hospital?.bedAvailability?.general?.total + 
                 hospital?.bedAvailability?.icu?.total + 
                 hospital?.bedAvailability?.emergency?.total || 0}
              </Text>
              <Text style={styles.overviewLabel}>Total Capacity</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: 20 },
  tipsCard: { backgroundColor: COLORS.warning + '10', padding: 16, borderRadius: 12, marginBottom: 20 },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  tipsTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  tipsList: { gap: 12 },
  tipItem: { flexDirection: 'row', gap: 8 },
  bulletPoint: { fontSize: 16, color: COLORS.warning, fontWeight: 'bold' },
  tipText: { flex: 1, fontSize: 14, color: COLORS.text, lineHeight: 20 },
  overviewCard: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 12, marginBottom: 20 },
  overviewTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  overviewGrid: { flexDirection: 'row', alignItems: 'center' },
  overviewItem: { flex: 1, alignItems: 'center' },
  overviewValue: { fontSize: 36, fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 },
  overviewLabel: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
  divider: { width: 1, height: 60, backgroundColor: COLORS.border }
});

export default ManageBedsScreen;