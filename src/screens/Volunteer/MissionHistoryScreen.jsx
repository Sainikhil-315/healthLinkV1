import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import volunteerService from '../../services/volunteerService';
import { COLORS } from '../../utils/constants';
import Loader from '../../components/common/Loader';
import Card from '../../components/common/Card';

const MissionHistoryScreen = () => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const result = await volunteerService.getMissionHistory({ limit: 50 });
      
      if (result.success) {
        setMissions(result.data.missions || []);
      }
    } catch (error) {
      console.error('Load missions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMissions();
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

  const getStatusColor = (status) => {
    const colors = {
      completed: COLORS.success,
      cancelled: COLORS.error,
      declined: COLORS.textSecondary
    };
    return colors[status?.toLowerCase()] || COLORS.textSecondary;
  };

  const renderMissionItem = ({ item }) => (
    <Card style={styles.missionCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
            <Text style={styles.severityText}>{item.severity?.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status?.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Location */}
      <View style={styles.infoRow}>
        <Icon name="location" size={16} color={COLORS.textSecondary} />
        <Text style={styles.locationText} numberOfLines={2}>
          {item.location?.address || 'Location unavailable'}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Icon name="navigate" size={16} color={COLORS.textSecondary} />
          <Text style={styles.statText}>
            {item.distance ? `${item.distance.toFixed(1)}km` : '--'}
          </Text>
        </View>

        <View style={styles.stat}>
          <Icon name="time" size={16} color={COLORS.textSecondary} />
          <Text style={styles.statText}>
            {item.responseTime ? `${item.responseTime}min` : '--'}
          </Text>
        </View>

        {item.ratings?.volunteer?.rating && (
          <View style={styles.stat}>
            <Icon name="star" size={16} color={COLORS.warning} />
            <Text style={styles.statText}>
              {item.ratings.volunteer.rating.toFixed(1)}
            </Text>
          </View>
        )}
      </View>

      {/* Triage Info */}
      {item.triage && (
        <View style={styles.triageContainer}>
          <Text style={styles.triageTitle}>Patient Condition:</Text>
          <View style={styles.triageGrid}>
            <View style={styles.triageItem}>
              <Icon 
                name={item.triage.isConscious ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={item.triage.isConscious ? COLORS.success : COLORS.error} 
              />
              <Text style={styles.triageText}>Conscious</Text>
            </View>
            <View style={styles.triageItem}>
              <Icon 
                name={item.triage.isBreathing ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={item.triage.isBreathing ? COLORS.success : COLORS.error} 
              />
              <Text style={styles.triageText}>Breathing</Text>
            </View>
          </View>
        </View>
      )}

      {/* Notes */}
      {item.volunteerNotes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{item.volunteerNotes}</Text>
        </View>
      )}
    </Card>
  );

  if (loading) {
    return <Loader fullScreen message="Loading mission history..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mission History</Text>
        <Text style={styles.headerSubtitle}>
          {missions.length} completed mission{missions.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={missions}
        renderItem={renderMissionItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="clipboard-outline" size={80} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Mission History</Text>
            <Text style={styles.emptyText}>
              Your completed missions will appear here
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
  missionCard: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', gap: 6, flex: 1 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  severityText: { fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' },
  dateText: { fontSize: 12, color: COLORS.textSecondary },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  locationText: { flex: 1, fontSize: 14, color: COLORS.text },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  triageContainer: { backgroundColor: COLORS.background, padding: 12, borderRadius: 8, marginBottom: 12 },
  triageTitle: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  triageGrid: { flexDirection: 'row', gap: 16 },
  triageItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  triageText: { fontSize: 13, color: COLORS.text },
  notesContainer: { backgroundColor: COLORS.info + '10', padding: 12, borderRadius: 8 },
  notesLabel: { fontSize: 12, fontWeight: '600', color: COLORS.info, marginBottom: 4 },
  notesText: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' }
});

export default MissionHistoryScreen;