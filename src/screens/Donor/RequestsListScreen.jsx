import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import donorService from '../../services/donorService';
import { COLORS } from '../../utils/constants';
import Loader from '../../components/common/Loader';
import DonationRequestCard from '../../components/donor/DonationRequestCard';

const RequestsListScreen = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      // In real app, fetch from API
      setRequests([]);
    } catch (error) {
      console.error('Load requests error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleAccept = async (requestId) => {
    const result = await donorService.acceptDonationRequest(requestId);
    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Request Accepted',
        text2: 'Please proceed to the hospital'
      });
      loadRequests();
    }
  };

  const handleDecline = async (requestId) => {
    const result = await donorService.declineDonationRequest(requestId, 'Not available');
    if (result.success) {
      Toast.show({ type: 'info', text1: 'Request Declined' });
      loadRequests();
    }
  };

  if (loading) {
    return <Loader fullScreen message="Loading requests..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Donation Requests</Text>
        <Text style={styles.subtitle}>{requests.length} active requests</Text>
      </View>

      <FlatList
        data={requests}
        renderItem={({ item }) => (
          <DonationRequestCard
            request={item}
            onAccept={() => handleAccept(item._id)}
            onDecline={() => handleDecline(item._id)}
          />
        )}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="notifications-off-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Active Requests</Text>
            <Text style={styles.emptyText}>You'll be notified when someone needs your blood type</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 16 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 }
});

export default RequestsListScreen;