import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';
import Card from '../common/Card';

const EmergencyRequestCard = ({ incident, onAccept, onDecline, onViewDetails }) => {
  const getSeverityColor = () => {
    const colors = {
      critical: COLORS.error,
      high: COLORS.warning,
      medium: COLORS.info,
      low: COLORS.success
    };
    return colors[incident.severity?.toLowerCase()] || COLORS.info;
  };

  const formatDistance = (distance) => {
    if (!distance) return 'Calculating...';
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  return (
    <Card style={styles.card}>
      {/* Header with Severity Badge */}
      <View style={styles.header}>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor() }]}>
          <Icon name="alert-circle" size={16} color="#FFFFFF" />
          <Text style={styles.severityText}>{incident.severity?.toUpperCase()}</Text>
        </View>
        <Text style={styles.timestamp}>
          {new Date(incident.sosTriggeredAt).toLocaleTimeString()}
        </Text>
      </View>

      {/* Location */}
      <View style={styles.infoRow}>
        <Icon name="location" size={20} color={COLORS.primary} />
        <Text style={styles.location} numberOfLines={2}>
          {incident.location?.address || 'Location unavailable'}
        </Text>
      </View>

      {/* Distance & ETA */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Icon name="navigate" size={18} color={COLORS.textSecondary} />
          <Text style={styles.statValue}>{formatDistance(incident.distance)}</Text>
        </View>
        <View style={styles.stat}>
          <Icon name="time" size={18} color={COLORS.textSecondary} />
          <Text style={styles.statValue}>
            {incident.eta ? `${incident.eta} min` : 'Calculating...'}
          </Text>
        </View>
      </View>

      {/* Patient Info */}
      {incident.patient && (
        <View style={styles.patientInfo}>
          <Text style={styles.patientLabel}>Patient:</Text>
          <Text style={styles.patientText}>
            {incident.patient.name || 'Unknown'} 
            {incident.patient.age && `, ${incident.patient.age} years`}
          </Text>
          {incident.patient.bloodType && (
            <View style={styles.bloodTypeBadge}>
              <Icon name="water" size={14} color={COLORS.error} />
              <Text style={styles.bloodTypeText}>{incident.patient.bloodType}</Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.button, styles.declineButton]}
          onPress={onDecline}
        >
          <Icon name="close-circle-outline" size={20} color={COLORS.error} />
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.acceptButton]}
          onPress={onAccept}
        >
          <Icon name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  severityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  severityText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  timestamp: { fontSize: 12, color: COLORS.textSecondary },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 8 },
  location: { flex: 1, fontSize: 14, color: COLORS.text, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  patientInfo: { backgroundColor: COLORS.background, padding: 12, borderRadius: 8, marginBottom: 12 },
  patientLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  patientText: { fontSize: 14, color: COLORS.text, fontWeight: '500', marginBottom: 6 },
  bloodTypeBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: COLORS.error + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  bloodTypeText: { fontSize: 12, color: COLORS.error, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  button: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 6 },
  declineButton: { backgroundColor: COLORS.error + '20', borderWidth: 1, borderColor: COLORS.error + '40' },
  declineText: { color: COLORS.error, fontSize: 14, fontWeight: '600' },
  acceptButton: { backgroundColor: COLORS.success },
  acceptText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' }
});

export default EmergencyRequestCard;