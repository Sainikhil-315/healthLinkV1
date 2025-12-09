import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';
import Card from '../common/Card';

const DonationRequestCard = ({ request, onAccept, onDecline }) => {
  const formatDistance = (distance) => {
    if (!distance) return 'Calculating...';
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.bloodTypeBadge}>
          <Icon name="water" size={20} color="#FFFFFF" />
          <Text style={styles.bloodTypeText}>{request.patient?.bloodType || 'Unknown'}</Text>
        </View>
        <Text style={styles.urgentText}>URGENT</Text>
      </View>

      {/* Patient Info */}
      <View style={styles.patientInfo}>
        <View style={styles.infoRow}>
          <Icon name="person" size={18} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>
            {request.patient?.name || 'Patient'} 
            {request.patient?.age && `, ${request.patient.age} years`}
          </Text>
        </View>

        {request.severity && (
          <View style={styles.infoRow}>
            <Icon name="alert-circle" size={18} color={COLORS.error} />
            <Text style={[styles.infoText, { color: COLORS.error, fontWeight: '600' }]}>
              {request.severity} severity
            </Text>
          </View>
        )}
      </View>

      {/* Hospital */}
      {request.hospital && (
        <View style={styles.hospitalSection}>
          <View style={styles.infoRow}>
            <Icon name="business" size={18} color={COLORS.primary} />
            <Text style={styles.hospitalName}>{request.hospital.name}</Text>
          </View>
          {request.hospital.location?.address && (
            <Text style={styles.hospitalAddress} numberOfLines={2}>
              {request.hospital.location.address}
            </Text>
          )}
        </View>
      )}

      {/* Distance */}
      <View style={styles.distanceContainer}>
        <Icon name="navigate" size={20} color={COLORS.success} />
        <Text style={styles.distanceText}>
          {formatDistance(request.distance)} away
        </Text>
      </View>

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
          <Icon name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.acceptText}>Accept Request</Text>
        </TouchableOpacity>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Icon name="information-circle" size={16} color={COLORS.info} />
        <Text style={styles.infoBoxText}>
          You'll be directed to the hospital. Please carry a valid ID.
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
  bloodTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6
  },
  bloodTypeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  urgentText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.error,
    backgroundColor: COLORS.error + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  patientInfo: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 10
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text
  },
  hospitalSection: {
    backgroundColor: COLORS.primary + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  hospitalName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text
  },
  hospitalAddress: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
    marginLeft: 28
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8
  },
  distanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12
  },
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
  declineText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text
  },
  acceptButton: {
    backgroundColor: COLORS.success,
    flex: 2
  },
  acceptText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info + '10',
    padding: 10,
    borderRadius: 8,
    gap: 8
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.info,
    lineHeight: 16
  }
});

export default DonationRequestCard;