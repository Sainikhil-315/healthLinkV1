import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';
import Card from '../common/Card';

const AdminVerificationCard = ({ item, type, onApprove, onReject, onViewCertificate }) => {
  const getTypeIcon = () => {
    const icons = {
      volunteer: 'medkit',
      ambulance: 'medical',
      hospital: 'business'
    };
    return icons[type] || 'document';
  };

  const getTypeColor = () => {
    const colors = {
      volunteer: COLORS.secondary,
      ambulance: COLORS.error,
      hospital: COLORS.info
    };
    return colors[type] || COLORS.primary;
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: getTypeColor() + '20' }]}>
          <Icon name={getTypeIcon()} size={28} color={getTypeColor()} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>
            {item.fullName || item.name || item.driver?.name}
          </Text>
          <Text style={styles.contact}>{item.email}</Text>
          <Text style={styles.contact}>{item.phone || item.driver?.phone}</Text>
        </View>
      </View>

      {/* Specific Info Based on Type */}
      {type === 'volunteer' && item.certification && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>CPR Certification</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Organization:</Text>
            <Text style={styles.infoValue}>{item.certification.organization}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Certificate #:</Text>
            <Text style={styles.infoValue}>{item.certification.certificateNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expires:</Text>
            <Text style={[
              styles.infoValue,
              new Date(item.certification.expiryDate) < new Date() && { color: COLORS.error }
            ]}>
              {new Date(item.certification.expiryDate).toLocaleDateString()}
            </Text>
          </View>
          
          {item.certification.certificateImage && (
            <TouchableOpacity 
              style={styles.viewButton}
              onPress={onViewCertificate}
            >
              <Icon name="document-text" size={16} color={COLORS.primary} />
              <Text style={styles.viewButtonText}>View Certificate</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {type === 'ambulance' && (
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vehicle:</Text>
            <Text style={styles.infoValue}>{item.vehicleNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{item.type}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>License:</Text>
            <Text style={styles.infoValue}>{item.driver?.licenseNumber}</Text>
          </View>
        </View>
      )}

      {type === 'hospital' && (
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registration:</Text>
            <Text style={styles.infoValue}>{item.registrationNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{item.type}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {item.location?.city}, {item.location?.state}
            </Text>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]}
          onPress={onReject}
        >
          <Icon name="close-circle" size={20} color={COLORS.error} />
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.approveButton]}
          onPress={onApprove}
        >
          <Icon name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.approveText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  headerInfo: { flex: 1 },
  name: { fontSize: 17, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  contact: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
  infoSection: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary },
  infoValue: { fontSize: 13, fontWeight: '500', color: COLORS.text, flex: 1, textAlign: 'right' },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
    gap: 6
  },
  viewButtonText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  actions: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6
  },
  rejectButton: {
    backgroundColor: COLORS.error + '20',
    borderWidth: 1,
    borderColor: COLORS.error
  },
  rejectText: { fontSize: 14, fontWeight: '600', color: COLORS.error },
  approveButton: { backgroundColor: COLORS.success },
  approveText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' }
});

export default AdminVerificationCard;