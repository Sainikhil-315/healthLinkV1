import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import ambulanceService from '../../services/ambulanceService';
import { COLORS } from '../../utils/constants';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';

const CompletedTripsScreen = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const result = await ambulanceService.getTripHistory({ page: 1, limit: 20 });
      
      if (result.success) {
        setTrips(result.data.trips || []);
      }
    } catch (error) {
      console.error('Load trips error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: COLORS.error,
      high: COLORS.warning,
      medium: COLORS.info,
      low: COLORS.success
    };
    return colors[severity?.toLowerCase()] || COLORS.info;
  };

  const renderTripItem = ({ item }) => (
    <Card style={styles.tripCard}>
      <View style={styles.tripHeader}>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>{item.severity?.toUpperCase()}</Text>
        </View>
        <Text style={styles.tripDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.tripInfo}>
        <View style={styles.infoRow}>
          <Icon name="location" size={16} color={COLORS.textSecondary} />
          <Text style={styles.location} numberOfLines={1}>
            {item.location?.address || 'Location unavailable'}
          </Text>
        </View>

        {item.hospital && (
          <View style={styles.infoRow}>
            <Icon name="medical" size={16} color={COLORS.textSecondary} />
            <Text style={styles.hospitalName} numberOfLines={1}>
              {item.hospital.name}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.tripStats}>
        <View style={styles.stat}>
          <Icon name="time" size={16} color={COLORS.textSecondary} />
          <Text style={styles.statText}>
            {item.responseTimes?.totalResponseTime 
              ? `${Math.round(item.responseTimes.totalResponseTime / 60)}min`
              : '--'}
          </Text>
        </View>
        
        {item.ratings?.ambulance?.rating && (
          <View style={styles.stat}>
            <Icon name="star" size={16} color={COLORS.warning} />
            <Text style={styles.statText}>{item.ratings.ambulance.rating.toFixed(1)}</Text>
          </View>
        )}

        <View style={styles.statusBadge}>
          <Icon 
            name={item.status === 'resolved' ? 'checkmark-circle' : 'close-circle'} 
            size={16} 
            color={item.status === 'resolved' ? COLORS.success : COLORS.error} 
          />
          <Text style={[styles.statusText, { color: item.status === 'resolved' ? COLORS.success : COLORS.error }]}>
            {item.status === 'resolved' ? 'Completed' : 'Cancelled'}
          </Text>
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return <Loader fullScreen message="Loading trip history..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trip History</Text>
        <Text style={styles.headerSubtitle}>{trips.length} completed trips</Text>
      </View>

      <FlatList
        data={trips}
        renderItem={renderTripItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="document-text-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No trip history yet</Text>
            <Text style={styles.emptySubtext}>
              Completed trips will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: COLORS.background },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  tripCard: { marginBottom: 12 },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  severityText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  tripDate: { fontSize: 12, color: COLORS.textSecondary },
  tripInfo: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  location: { flex: 1, fontSize: 14, color: COLORS.text },
  hospitalName: { flex: 1, fontSize: 13, color: COLORS.textSecondary },
  tripStats: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', gap: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center' }
});

export default CompletedTripsScreen;