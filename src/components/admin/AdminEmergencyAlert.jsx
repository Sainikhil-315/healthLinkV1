import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';
import Card from '../common/Card';

const AdminEmergencyAlert = ({ incident, onViewDetails, onTakeAction }) => {
  const getSeverityColor = () => {
    const colors = {
      critical: COLORS.error,
      high: COLORS.warning,
      medium: COLORS.info,
      low: COLORS.success
    };
    return colors[incident.severity?.toLowerCase()] || COLORS.info;
  };

  const getStatusColor = () => {
    const colors = {
      pending: COLORS.warning,
      ambulance_dispatched: COLORS.info,
      en_route_hospital: COLORS.primary,
      reached_hospital: COLORS.success,
      resolved: COLORS.success,
      cancelled: COLORS.textSecondary
    };
    return colors[incident.status] || COLORS.textSecondary;
  };

  const formatStatus = (status) => {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor() }]}>
            <Icon name="alert-circle" size={14} color="#FFFFFF" />
            <Text style={styles.severityText}>{incident.severity?.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {formatStatus(incident.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.timestamp}>
          {new Date(incident.createdAt).toLocaleTimeString()}
        </Text>
      </View>

      {/* Patient Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Icon name="person" size={18} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>
            {incident.patient?.name || 'Unknown'} 
            {incident.patient?.age && ` • ${incident.patient.age}y`}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="location" size={18} color={COLORS.textSecondary} />
          <Text style={styles.infoText} numberOfLines={1}>
            {incident.location?.address || 'Location unavailable'}
          </Text>
        </View>

        {incident.type && (
          <View style={styles.infoRow}>
            <Icon 
              name={incident.type === 'self' ? 'person-circle' : 'people'} 
              size={18} 
              color={COLORS.textSecondary} 
            />
            <Text style={styles.infoText}>
              {incident.type === 'self' ? 'Self Emergency' : 'Bystander Report'}
            </Text>
          </View>
        )}
      </View>

      {/* Resources Assigned */}
      <View style={styles.resourcesSection}>
        <Text style={styles.resourcesTitle}>Assigned Resources</Text>
        <View style={styles.resourcesGrid}>
          <View style={styles.resourceItem}>
            <Icon 
              name="medical" 
              size={20} 
              color={incident.ambulance ? COLORS.success : COLORS.textSecondary} 
            />
            <Text style={styles.resourceLabel}>
              {incident.ambulance ? 'Ambulance' : 'No Ambulance'}
            </Text>
          </View>

          <View style={styles.resourceItem}>
            <Icon 
              name="business" 
              size={20} 
              color={incident.hospital ? COLORS.success : COLORS.textSecondary} 
            />
            <Text style={styles.resourceLabel}>
              {incident.hospital ? 'Hospital' : 'No Hospital'}
            </Text>
          </View>

          {incident.volunteer && (
            <View style={styles.resourceItem}>
              <Icon name="medkit" size={20} color={COLORS.secondary} />
              <Text style={styles.resourceLabel}>Volunteer</Text>
            </View>
          )}

          {incident.bloodRequired && (
            <View style={styles.resourceItem}>
              <Icon name="water" size={20} color={COLORS.error} />
              <Text style={styles.resourceLabel}>Blood Needed</Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={onViewDetails}
        >
          <Text style={styles.secondaryButtonText}>View Details</Text>
        </TouchableOpacity>

        {incident.status === 'pending' && (
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={onTakeAction}
          >
            <Icon name="flash" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Take Action</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  headerLeft: { flexDirection: 'row', gap: 8, flex: 1 },
  severityBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12, 
    gap: 4 
  },
  severityText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  timestamp: { fontSize: 11, color: COLORS.textSecondary },
  infoSection: { 
    backgroundColor: COLORS.background, 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 12, 
    gap: 8 
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { flex: 1, fontSize: 14, color: COLORS.text },
  resourcesSection: { 
    backgroundColor: COLORS.background, 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 12 
  },
  resourcesTitle: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: COLORS.textSecondary, 
    marginBottom: 8, 
    textTransform: 'uppercase' 
  },
  resourcesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  resourceItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resourceLabel: { fontSize: 12, color: COLORS.text },
  actions: { flexDirection: 'row', gap: 8 },
  button: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 8, 
    gap: 6 
  },
  secondaryButton: { 
    backgroundColor: COLORS.surface, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  secondaryButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  primaryButton: { backgroundColor: COLORS.primary },
  primaryButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' }
});

export default AdminEmergencyAlert;