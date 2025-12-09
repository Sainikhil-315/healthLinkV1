import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';
import Card from '../common/Card';

const EmergencyAlert = ({ emergency, onAccept, onDecline }) => {
  const getSeverityColor = () => {
    const colors = {
      critical: COLORS.error,
      high: COLORS.warning,
      medium: COLORS.info,
      low: COLORS.success
    };
    return colors[emergency.severity?.toLowerCase()] || COLORS.error;
  };

  const formatDistance = (distance) => {
    if (!distance) return 'Calculating...';
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  return (
    <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: getSeverityColor() }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor() }]}>
          <Icon name="alert-circle" size={16} color="#FFFFFF" />
          <Text style={styles.severityText}>{emergency.severity?.toUpperCase()}</Text>
        </View>
        <View style={styles.pulsingDot} />
      </View>

      {/* Location */}
      <View style={styles.locationContainer}>
        <Icon name="location" size={24} color={COLORS.error} />
        <View style={styles.locationText}>
          <Text style={styles.locationTitle}>Emergency Location</Text>
          <Text style={styles.locationAddress} numberOfLines={2}>
            {emergency.location?.address || 'Location unavailable'}
          </Text>
        </View>
      </View>

      {/* Distance & Time */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Icon name="navigate" size={20} color={COLORS.primary} />
          <Text style={styles.statValue}>{formatDistance(emergency.distance)}</Text>
          <Text style={styles.statLabel}>Away</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <Icon name="time" size={20} color={COLORS.warning} />
          <Text style={styles.statValue}>~{emergency.eta || 3} min</Text>
          <Text style={styles.statLabel}>ETA</Text>
        </View>
      </View>

      {/* Victim Info */}
      {emergency.triage && (
        <View style={styles.triageBox}>
          <Text style={styles.triageTitle}>Victim Status</Text>
          <View style={styles.triageGrid}>
            <View style={styles.triageItem}>
              <Icon 
                name={emergency.triage.isConscious ? "checkmark-circle" : "close-circle"} 
                size={18} 
                color={emergency.triage.isConscious ? COLORS.success : COLORS.error} 
              />
              <Text style={styles.triageText}>Conscious</Text>
            </View>
            <View style={styles.triageItem}>
              <Icon 
                name={emergency.triage.isBreathing ? "checkmark-circle" : "close-circle"} 
                size={18} 
                color={emergency.triage.isBreathing ? COLORS.success : COLORS.error} 
              />
              <Text style={styles.triageText}>Breathing</Text>
            </View>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.button, styles.declineButton]}
          onPress={onDecline}
        >
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.acceptButton]}
          onPress={onAccept}
        >
          <Icon name="medkit" size={20} color="#FFFFFF" />
          <Text style={styles.acceptText}>Respond</Text>
        </TouchableOpacity>
      </View>

      {/* Warning */}
      <View style={styles.warningBox}>
        <Icon name="information-circle" size={16} color={COLORS.warning} />
        <Text style={styles.warningText}>
          CPR may be required. Ambulance is also dispatched.
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  severityBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12, 
    gap: 4 
  },
  severityText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  pulsingDot: { 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    backgroundColor: COLORS.error 
  },
  locationContainer: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.background, 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 12, 
    gap: 12 
  },
  locationText: { flex: 1 },
  locationTitle: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: COLORS.textSecondary, 
    marginBottom: 4 
  },
  locationAddress: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  statsRow: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.background, 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12 
  },
  statBox: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: COLORS.border, marginHorizontal: 16 },
  statValue: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: COLORS.text, 
    marginTop: 6, 
    marginBottom: 2 
  },
  statLabel: { fontSize: 11, color: COLORS.textSecondary },
  triageBox: { 
    backgroundColor: COLORS.warning + '10', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 12 
  },
  triageTitle: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: COLORS.text, 
    marginBottom: 10 
  },
  triageGrid: { flexDirection: 'row', gap: 20 },
  triageItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  triageText: { fontSize: 13, color: COLORS.text },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  button: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 14, 
    borderRadius: 10, 
    gap: 6 
  },
  declineButton: { 
    backgroundColor: COLORS.surface, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  declineText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  acceptButton: { backgroundColor: COLORS.secondary, flex: 2 },
  acceptText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  warningBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.warning + '10', 
    padding: 10, 
    borderRadius: 8, 
    gap: 8 
  },
  warningText: { 
    flex: 1, 
    fontSize: 12, 
    color: COLORS.warning, 
    lineHeight: 16 
  }
});

export default EmergencyAlert;