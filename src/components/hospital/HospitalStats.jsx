import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';
import Card from '../common/Card';

const HospitalStats = ({ stats }) => {
  const StatCard = ({ icon, label, value, color, trend }) => (
    <Card style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={28} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {trend && (
        <View style={styles.trendContainer}>
          <Icon 
            name={trend > 0 ? "trending-up" : "trending-down"} 
            size={14} 
            color={trend > 0 ? COLORS.success : COLORS.error} 
          />
          <Text style={[styles.trendText, { color: trend > 0 ? COLORS.success : COLORS.error }]}>
            {Math.abs(trend)}%
          </Text>
        </View>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Statistics</Text>
      
      <View style={styles.grid}>
        <StatCard
          icon="people-outline"
          label="Total Patients"
          value={stats?.totalPatientsHandled || 0}
          color={COLORS.primary}
        />
        
        <StatCard
          icon="timer-outline"
          label="Avg Response"
          value={stats?.averageResponseTime ? `${stats.averageResponseTime}m` : '--'}
          color={COLORS.info}
        />
        
        <StatCard
          icon="calendar-outline"
          label="Today"
          value={stats?.todayAdmissions || 0}
          color={COLORS.success}
          trend={stats?.admissionTrend}
        />
        
        <StatCard
          icon="bed-outline"
          label="Occupancy"
          value={stats?.occupancyRate ? `${stats.occupancyRate}%` : '--'}
          color={COLORS.warning}
        />
      </View>

      {/* Additional Info */}
      {stats && (
        <View style={styles.additionalInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Emergency Cases (24h):</Text>
            <Text style={styles.infoValue}>{stats.emergencyCases24h || 0}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Critical Patients:</Text>
            <Text style={[styles.infoValue, { color: COLORS.error }]}>
              {stats.criticalPatients || 0}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Available Staff:</Text>
            <Text style={styles.infoValue}>{stats.availableStaff || '--'}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { width: '48%', alignItems: 'center', paddingVertical: 20 },
  iconContainer: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary },
  trendContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  trendText: { fontSize: 12, fontWeight: '600' },
  additionalInfo: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 14, color: COLORS.textSecondary },
  infoValue: { fontSize: 16, fontWeight: '600', color: COLORS.text }
});

export default HospitalStats;