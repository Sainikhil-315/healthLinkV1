import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';
import Card from '../common/Card';

const IncomingPatientAlert = ({ incident, onConfirmArrival, onViewDetails }) => {
  const getSeverityColor = () => {
    const colors = {
      critical: COLORS.error,
      high: COLORS.warning,
      medium: COLORS.info,
      low: COLORS.success
    };
    return colors[incident.severity?.toLowerCase()] || COLORS.info;
  };

  const getStatusText = () => {
    const statuses = {
      ambulance_dispatched: 'Ambulance dispatched',
      en_route_hospital: 'En route to hospital',
      ambulance_arrived: 'Ambulance at scene'
    };
    return statuses[incident.status] || incident.status;
  };

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.pulsingDot, { backgroundColor: getSeverityColor() }]} />
          <View>
            <Text style={styles.title}>Incoming Patient</Text>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor() }]}>
          <Text style={styles.severityText}>{incident.severity?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Patient Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Icon name="person" size={18} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>
            {incident.patient?.name || 'Unknown'} 
            {incident.patient?.age && `, ${incident.patient.age} years`}
          </Text>
        </View>

        {incident.patient?.bloodType && (
          <View style={styles.infoRow}>
            <Icon name="water" size={18} color={COLORS.error} />
            <Text style={styles.infoText}>Blood Type: {incident.patient.bloodType}</Text>
            {incident.bloodRequired && (
              <View style={styles.bloodBadge}>
                <Text style={styles.bloodBadgeText}>NEEDED</Text>
              </View>
            )}
          </View>
        )}

        {incident.ambulance && (
          <View style={styles.infoRow}>
            <Icon name="car" size={18} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              Ambulance: {incident.ambulance.vehicleNumber}
            </Text>
          </View>
        )}
      </View>

      {/* ETA */}
      {incident.estimatedTimes?.hospitalETA && (
        <View style={styles.etaContainer}>
          <View style={styles.etaContent}>
            <Icon name="time" size={24} color={COLORS.primary} />
            <View style={styles.etaText}>
              <Text style={styles.etaLabel}>Estimated Arrival</Text>
              <Text style={styles.etaValue}>{incident.estimatedTimes.hospitalETA} minutes</Text>
            </View>
          </View>
        </View>
      )}

      {/* Medical Info */}
      {(incident.patient?.knownConditions?.length > 0 || incident.triage) && (
        <View style={styles.medicalInfo}>
          <Text style={styles.medicalTitle}>Medical Info</Text>
          
          {incident.patient?.knownConditions?.length > 0 && (
            <View style={styles.conditionsContainer}>
              {incident.patient.knownConditions.slice(0, 2).map((condition, index) => (
                <View key={index} style={styles.conditionChip}>
                  <Text style={styles.conditionText}>{condition}</Text>
                </View>
              ))}
              {incident.patient.knownConditions.length > 2 && (
                <Text style={styles.moreText}>+{incident.patient.knownConditions.length - 2} more</Text>
              )}
            </View>
          )}

          {incident.triage && (
            <View style={styles.triageRow}>
              <View style={styles.triageItem}>
                <Icon 
                  name={incident.triage.isConscious ? "checkmark-circle" : "close-circle"} 
                  size={16} 
                  color={incident.triage.isConscious ? COLORS.success : COLORS.error} 
                />
                <Text style={styles.triageText}>Conscious</Text>
              </View>
              <View style={styles.triageItem}>
                <Icon 
                  name={incident.triage.isBreathing ? "checkmark-circle" : "close-circle"} 
                  size={16} 
                  color={incident.triage.isBreathing ? COLORS.success : COLORS.error} 
                />
                <Text style={styles.triageText}>Breathing</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {onViewDetails && (
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={onViewDetails}
          >
            <Text style={styles.secondaryButtonText}>View Details</Text>
          </TouchableOpacity>
        )}
        
        {incident.status === 'en_route_hospital' && onConfirmArrival && (
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={onConfirmArrival}
          >
            <Icon name="checkmark-circle" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Confirm Arrival</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  pulsingDot: { width: 12, height: 12, borderRadius: 6 },
  title: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  statusText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  severityText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  infoSection: { backgroundColor: COLORS.background, padding: 12, borderRadius: 8, marginBottom: 12, gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { flex: 1, fontSize: 14, color: COLORS.text },
  bloodBadge: { backgroundColor: COLORS.error, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  bloodBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' },
  etaContainer: { backgroundColor: COLORS.primary + '10', padding: 12, borderRadius: 8, marginBottom: 12 },
  etaContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  etaText: { flex: 1 },
  etaLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
  etaValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  medicalInfo: { backgroundColor: COLORS.background, padding: 12, borderRadius: 8, marginBottom: 12 },
  medicalTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  conditionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  conditionChip: { backgroundColor: COLORS.warning + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  conditionText: { fontSize: 12, color: COLORS.warning, fontWeight: '500' },
  moreText: { fontSize: 12, color: COLORS.textSecondary, alignSelf: 'center' },
  triageRow: { flexDirection: 'row', gap: 16 },
  triageItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  triageText: { fontSize: 13, color: COLORS.text },
  actions: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 6 },
  secondaryButton: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  secondaryButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  primaryButton: { backgroundColor: COLORS.primary },
  primaryButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' }
});

export default IncomingPatientAlert;