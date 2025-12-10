import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';
import { apiService } from '../../services/api';
import AdminStatsCard from '../../components/admin/AdminStatsCard';
import AdminEmergencyAlert from '../../components/admin/AdminEmergencyAlert';
import Loader from '../../components/common/Loader';

const AdminDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, incidentsRes] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getAllIncidents({ status: 'pending', limit: 5 })
      ]);

      if (statsRes?.success) {
        console.log('Dashboard stats:', statsRes.data);
        setStats(statsRes.data);
      }

      if (incidentsRes?.success) {
        setActiveIncidents(incidentsRes.data.incidents);
      }
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return <Loader fullScreen message="Loading dashboard..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Panel</Text>
          <Text style={styles.title}>HealthLink Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Icon name="notifications-outline" size={24} color={COLORS.text} />
          {stats?.verification?.ambulances + stats?.verification?.hospitals + stats?.verification?.volunteers > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {stats.verification.ambulances + stats.verification.hospitals + stats.verification.volunteers}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* System Stats */}
        <Text style={styles.sectionTitle}>System Overview</Text>
        <View style={styles.statsGrid}>
          <AdminStatsCard
            icon="people-outline"
            label="Total Users"
            value={stats?.users?.total || 0}
            color={COLORS.primary}
          />
          <AdminStatsCard
            icon="alert-circle-outline"
            label="Active Emergencies"
            value={stats?.incidents?.active || 0}
            color={COLORS.error}
          />
          <AdminStatsCard
            icon="medical-outline"
            label="Ambulances"
            value={stats?.users?.ambulances || 0}
            color={COLORS.warning}
          />
          <AdminStatsCard
            icon="business-outline"
            label="Hospitals"
            value={stats?.users?.hospitals || 0}
            color={COLORS.info}
          />
        </View>

        {/* Ambulance Stats */}
        <View style={styles.statsRow}>
          <AdminStatsCard
            icon="car-sport-outline"
            label="Available Ambulances"
            value={stats?.ambulances?.available || 0}
            color={COLORS.success}
          />
          <AdminStatsCard
            icon="trending-up-outline"
            label="Utilization"
            value={`${stats?.ambulances?.utilization || 0}%`}
            color={COLORS.secondary}
          />
        </View>

        {/* Pending Verifications */}
        {(stats?.verification?.ambulances + stats?.verification?.hospitals + stats?.verification?.volunteers) > 0 && (
          <TouchableOpacity 
            style={styles.verificationAlert}
            onPress={() => navigation.navigate('VerifyVolunteers')}
          >
            <View style={styles.alertIcon}>
              <Icon name="warning" size={24} color={COLORS.warning} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Pending Verifications</Text>
              <Text style={styles.alertText}>
                {stats.verification.ambulances} ambulances, {stats.verification.hospitals} hospitals, {stats.verification.volunteers} volunteers
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Active Incidents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Incidents</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Analytics')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {activeIncidents.length > 0 ? (
            activeIncidents.map((incident) => (
              <AdminEmergencyAlert
                key={incident._id}
                incident={incident}
                onViewDetails={() => {}}
                onTakeAction={() => {}}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="checkmark-circle-outline" size={48} color={COLORS.success} />
              <Text style={styles.emptyText}>No active incidents</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('ManageHospitals')}
            >
              <Icon name="business" size={28} color={COLORS.info} />
              <Text style={styles.actionText}>Manage Hospitals</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('VerifyVolunteers')}
            >
              <Icon name="medkit" size={28} color={COLORS.secondary} />
              <Text style={styles.actionText}>Verify Volunteers</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Analytics')}
            >
              <Icon name="stats-chart" size={28} color={COLORS.success} />
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('BroadcastScreen')}
            >
              <Icon name="notifications" size={28} color={COLORS.warning} />
              <Text style={styles.actionText}>Broadcast</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.background
  },
  greeting: { fontSize: 14, color: COLORS.textSecondary },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginTop: 2 },
  notificationButton: { position: 'relative', padding: 8 },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  verificationAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning
  },
  alertIcon: { marginRight: 12 },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  alertText: { fontSize: 13, color: COLORS.textSecondary },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  viewAllText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 12 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    backgroundColor: COLORS.surface,
    width: '48%',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    elevation: 1
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
    textAlign: 'center'
  }
});

export default AdminDashboardScreen;