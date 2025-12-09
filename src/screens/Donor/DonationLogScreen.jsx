import React, { useEffect, useState } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import donorService from '../../services/donorService';
import { COLORS } from '../../utils/constants';
import Loader from '../../components/common/Loader';
import DonationHistory from '../../components/donor/DonationHistory';
import Header from '../../components/common/Header';

const DonationLogScreen = ({ navigation }) => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDonations();
  }, []);

  const loadDonations = async () => {
    try {
      setLoading(true);
      const result = await donorService.getDonationHistory();
      if (result.success) {
        setDonations(result.data.donations || []);
      }
    } catch (error) {
      console.error('Load donations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDonations();
    setRefreshing(false);
  };

  if (loading) {
    return <Loader fullScreen message="Loading donation history..." />;
  }

  return (
    <View style={styles.container}>
      <Header title="Donation History" subtitle={`${donations.length} total donations`} />
      <View style={styles.content}>
        <DonationHistory donations={donations} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: 20 }
});

export default DonationLogScreen;