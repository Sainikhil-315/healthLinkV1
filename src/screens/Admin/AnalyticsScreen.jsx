import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';

import { COLORS, API_URL } from '../../utils/constants';
import Header from '../../components/common/Header';
import Loader from '../../components/common/Loader';
import Card from '../../components/common/Card';

const { width } = Dimensions.get('window');

const AnalyticsScreen = ({ navigation }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('week'); // week, month, year

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/analytics`, {
        params: { timeframe }
      });

      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Load analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const StatCard = ({ title, value, change, icon, color }) => (
    <Card style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <Icon name={icon} size={24} color={color} />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statValue}>{value}</Text>
          {change !== undefined && (
            <View style={styles.changeContainer}>
              <Icon 
                name={change >= 0 ? 'trending-up' : 'trending-down'} 
                size={14} 
                color={change >= 0 ? COLORS.success : COLORS.error} 
              />
              <Text style={[
                styles.changeText,
                { color: change >= 0 ? COLORS.success : COLORS.error }
              ]}>
                {Math.abs(change)}%
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );

  const TimeframeButton = ({ value, label }) => (
    <TouchableOpacity
      style={[styles.timeframeButton, timeframe === value && styles.timeframeButtonActive]}
      onPress={() => setTimeframe(value)}
    >
      <Text style={[
        styles.timeframeText,
        timeframe === value && styles.timeframeTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <Loader fullScreen message="Loading analytics..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Analytics Dashboard"
        subtitle="System performance metrics"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.timeframeContainer}>
        <TimeframeButton value="week" label="Week" />
        <TimeframeButton value="month" label="Month" />
        <TimeframeButton value="year" label="Year" />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <StatCard
            title="Total Emergencies"
            value={analytics?.emergencies?.total || 0}
            change={analytics?.emergencies?.change}
            icon="alert-circle"
            color={COLORS.error}
          />
          <StatCard
            title="Successful Resolutions"
            value={analytics?.emergencies?.resolved || 0}
            change={analytics?.emergencies?.resolvedChange}
            icon="checkmark-circle"
            color={COLORS.success}
          />
          <StatCard
            title="Average Response Time"
            value={`${analytics?.performance?.avgResponseTime || 0} min`}
            change={analytics?.performance?.responseTimeChange}
            icon="time"
            color={COLORS.info}
          />
          <StatCard
            title="Active Users"
            value={analytics?.users?.active || 0}
            change={analytics?.users?.activeChange}
            icon="people"
            color={COLORS.primary}
          />
        </View>

        {/* Resource Utilization */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resource Utilization</Text>
          
          <Card style={styles.resourceCard}>
            <View style={styles.resourceHeader}>
              <Text style={styles.resourceTitle}>Ambulances</Text>
              <Text style={styles.resourceValue}>
                {analytics?.resources?.ambulances?.utilized || 0} / {analytics?.resources?.ambulances?.total || 0}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                { 
                  width: `${(analytics?.resources?.ambulances?.utilized / analytics?.resources?.ambulances?.total) * 100 || 0}%`,
                  backgroundColor: COLORS.warning
                }
              ]} />
            </View>
            <Text style={styles.resourcePercentage}>
              {Math.round((analytics?.resources?.ambulances?.utilized / analytics?.resources?.ambulances?.total) * 100 || 0)}% Utilization
            </Text>
          </Card>

          <Card style={styles.resourceCard}>
            <View style={styles.resourceHeader}>
              <Text style={styles.resourceTitle}>Hospital Beds</Text>
              <Text style={styles.resourceValue}>
                {analytics?.resources?.beds?.occupied || 0} / {analytics?.resources?.beds?.total || 0}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                { 
                  width: `${(analytics?.resources?.beds?.occupied / analytics?.resources?.beds?.total) * 100 || 0}%`,
                  backgroundColor: COLORS.info
                }
              ]} />
            </View>
            <Text style={styles.resourcePercentage}>
              {Math.round((analytics?.resources?.beds?.occupied / analytics?.resources?.beds?.total) * 100 || 0)}% Occupancy
            </Text>
          </Card>

          <Card style={styles.resourceCard}>
            <View style={styles.resourceHeader}>
              <Text style={styles.resourceTitle}>Active Volunteers</Text>
              <Text style={styles.resourceValue}>
                {analytics?.resources?.volunteers?.active || 0} / {analytics?.resources?.volunteers?.total || 0}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                { 
                  width: `${(analytics?.resources?.volunteers?.active / analytics?.resources?.volunteers?.total) * 100 || 0}%`,
                  backgroundColor: COLORS.secondary
                }
              ]} />
            </View>
            <Text style={styles.resourcePercentage}>
              {Math.round((analytics?.resources?.volunteers?.active / analytics?.resources?.volunteers?.total) * 100 || 0)}% Available
            </Text>
          </Card>
        </View>

        {/* Geographic Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Locations</Text>
          {analytics?.locations?.map((location, index) => (
            <Card key={index} style={styles.locationCard}>
              <View style={styles.locationRank}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <View style={styles.locationContent}>
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationCount}>{location.count} emergencies</Text>
              </View>
            </Card>
          ))}
        </View>

        {/* Severity Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Severity</Text>
          <Card style={styles.severityCard}>
            {analytics?.severity?.map((item, index) => (
              <View key={index} style={styles.severityRow}>
                <View style={styles.severityLeft}>
                  <View style={[
                    styles.severityDot,
                    { backgroundColor: COLORS[item.level.toLowerCase()] || COLORS.textSecondary }
                  ]} />
                  <Text style={styles.severityLabel}>{item.level}</Text>
                </View>
                <Text style={styles.severityCount}>{item.count}</Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Average Pickup Time</Text>
            <Text style={styles.metricValue}>
              {analytics?.performance?.avgPickupTime || 0} minutes
            </Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Average Hospital Transfer Time</Text>
            <Text style={styles.metricValue}>
              {analytics?.performance?.avgTransferTime || 0} minutes
            </Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Success Rate</Text>
            <Text style={[styles.metricValue, { color: COLORS.success }]}>
              {analytics?.performance?.successRate || 0}%
            </Text>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: 20 },
  timeframeContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  timeframeButton: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.surface, alignItems: 'center' },
  timeframeButtonActive: { backgroundColor: COLORS.primary },
  timeframeText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  timeframeTextActive: { color: '#FFFFFF' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  statCard: { marginBottom: 12 },
  statHeader: { flexDirection: 'row', alignItems: 'center' },
  statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statContent: { flex: 1 },
  statTitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  changeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changeText: { fontSize: 12, fontWeight: '600' },
  resourceCard: { marginBottom: 12 },
  resourceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  resourceTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  resourceValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  progressBar: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 4 },
  resourcePercentage: { fontSize: 12, color: COLORS.textSecondary },
  locationCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  locationRank: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankText: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
  locationContent: { flex: 1 },
  locationName: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  locationCount: { fontSize: 13, color: COLORS.textSecondary },
  severityCard: { padding: 16 },
  severityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  severityLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  severityDot: { width: 12, height: 12, borderRadius: 6 },
  severityLabel: { fontSize: 15, fontWeight: '500', color: COLORS.text },
  severityCount: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  metricCard: { marginBottom: 12, padding: 16 },
  metricLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 },
  metricValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.text }
});

export default AnalyticsScreen;