import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { COLORS } from '../../utils/constants';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';

const PatientHistoryScreen = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, today, week, month

  useEffect(() => {
    loadPatients();
  }, [filter]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call
      // const result = await hospitalService.getPatientHistory({ filter });
      
      // Mock data for now
      setPatients([
        {
          _id: '1',
          patient: { name: 'John Doe', age: 45, bloodType: 'O+' },
          severity: 'high',
          admittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'admitted',
          bedType: 'icu'
        },
        {
          _id: '2',
          patient: { name: 'Jane Smith', age: 32, bloodType: 'A+' },
          severity: 'medium',
          admittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          status: 'discharged',
          bedType: 'general'
        }
      ]);
    } catch (error) {
      console.error('Load patients error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatients();
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
      admitted: COLORS.primary,
      discharged: COLORS.success,
      transferred: COLORS.info
    };
    return colors[status?.toLowerCase()] || COLORS.textSecondary;
  };

  const renderPatientItem = ({ item }) => (
    <Card style={styles.patientCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.patientName}>{item.patient.name}</Text>
          <Text style={styles.patientInfo}>
            {item.patient.age} years • {item.patient.bloodType}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Icon name="alert-circle" size={16} color={getSeverityColor(item.severity)} />
          <Text style={styles.detailText}>{item.severity}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Icon name="bed" size={16} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>{item.bedType?.toUpperCase()}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Icon name="time" size={16} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>
            {new Date(item.admittedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </Card>
  );

  const FilterButton = ({ value, label }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <Loader fullScreen message="Loading patient history..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Patient History</Text>
        <Text style={styles.headerSubtitle}>{patients.length} records</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <FilterButton value="all" label="All" />
        <FilterButton value="today" label="Today" />
        <FilterButton value="week" label="This Week" />
        <FilterButton value="month" label="This Month" />
      </View>

      <FlatList
        data={patients}
        renderItem={renderPatientItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="document-text-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No patient records</Text>
            <Text style={styles.emptySubtext}>
              Patient admission history will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: COLORS.background },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  filterTextActive: { color: '#FFFFFF' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  patientCard: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerLeft: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  patientInfo: { fontSize: 13, color: COLORS.textSecondary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold', color: '#FFFFFF', textTransform: 'uppercase' },
  detailsRow: { flexDirection: 'row', gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center' }
});

export default PatientHistoryScreen;