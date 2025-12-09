import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import volunteerService from '../../services/volunteerService';
import useSocket from '../../hooks/useSocket';
import { COLORS } from '../../utils/constants';
import Loader from '../../components/common/Loader';
import EmergencyAlert from '../../components/volunteer/EmergencyAlert';

const NearbyEmergenciesScreen = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { on } = useSocket();

  useEffect(() => {
    loadEmergencies();

    const unsubscribe = on('volunteerRequest', (data) => {
      setEmergencies(prev => [data, ...prev]);
      Toast.show({
        type: 'error',
        text1: '🚨 New Emergency!',
        text2: `${data.distance}m away - ${data.severity} severity`
      });
    });

    return () => unsubscribe();
  }, []);

  const loadEmergencies = async () => {
    try {
      setLoading(true);
      // In real app, fetch nearby emergencies
      setEmergencies([]);
    } catch (error) {
      console.error('Load emergencies error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEmergencies();
    setRefreshing(false);
  };

  const handleAccept = async (emergencyId) => {
    const result = await volunteerService.acceptMission(emergencyId);
    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Mission Accepted',
        text2: 'Navigate to the emergency location'
      });
      loadEmergencies();
    }
  };

  const handleDecline = async (emergencyId) => {
    const result = await volunteerService.declineMission(emergencyId, 'Not available');
    if (result.success) {
      setEmergencies(prev => prev.filter(e => e._id !== emergencyId));
    }
  };

  if (loading) {
    return <Loader fullScreen message="Loading emergencies..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Emergencies</Text>
        <Text style={styles.subtitle}>{emergencies.length} active alerts</Text>
      </View>

      <FlatList
        data={emergencies}
        renderItem={({ item }) => (
          <EmergencyAlert
            emergency={item}
            onAccept={() => handleAccept(item._id)}
            onDecline={() => handleDecline(item._id)}
          />
        )}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="shield-checkmark-outline" size={64} color={COLORS.success} />
            <Text style={styles.emptyTitle}>No Active Emergencies</Text>
            <Text style={styles.emptyText}>Great! There are no critical emergencies nearby</Text>
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

export default NearbyEmergenciesScreen;