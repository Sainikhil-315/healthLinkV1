import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import { COLORS } from '../../utils/constants';
import Card from '../common/Card';
import Modal from '../common/Modal';
import Button from '../common/Button';

const BedAvailabilityCard = ({ bedAvailability, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editType, setEditType] = useState(null);
  const [tempValue, setTempValue] = useState(0);

  const handleEdit = (type) => {
    setEditType(type);
    setTempValue(bedAvailability[type]?.available || 0);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (tempValue < 0 || tempValue > bedAvailability[editType]?.total) {
      Toast.show({
        type: 'error',
        text1: 'Invalid value',
        text2: `Must be between 0 and ${bedAvailability[editType]?.total}`
      });
      return;
    }

    await onUpdate(editType, tempValue);
    setShowModal(false);
    setEditType(null);
  };

  const getBedStatus = (available, total) => {
    const percentage = (available / total) * 100;
    if (percentage > 50) return { color: COLORS.success, status: 'Available' };
    if (percentage > 20) return { color: COLORS.warning, status: 'Limited' };
    return { color: COLORS.error, status: 'Critical' };
  };

  const BedTypeCard = ({ type, label, icon }) => {
    const beds = bedAvailability[type] || { available: 0, total: 0 };
    const { color, status } = getBedStatus(beds.available, beds.total);
    const percentage = beds.total > 0 ? (beds.available / beds.total) * 100 : 0;

    return (
      <Card style={styles.bedCard}>
        <View style={styles.bedHeader}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Icon name={icon} size={24} color={color} />
          </View>
          <Text style={styles.bedLabel}>{label}</Text>
        </View>

        <View style={styles.bedStats}>
          <Text style={styles.bedCount}>
            <Text style={[styles.available, { color }]}>{beds.available}</Text>
            <Text style={styles.total}> / {beds.total}</Text>
          </Text>
          <Text style={[styles.statusText, { color }]}>{status}</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>

        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEdit(type)}
        >
          <Icon name="create-outline" size={16} color={COLORS.primary} />
          <Text style={styles.editText}>Update</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Bed Availability</Text>
          <Text style={styles.subtitle}>
            Last updated: {new Date(bedAvailability.lastUpdated).toLocaleTimeString()}
          </Text>
        </View>

        <View style={styles.grid}>
          <BedTypeCard type="general" label="General Beds" icon="bed-outline" />
          <BedTypeCard type="icu" label="ICU Beds" icon="pulse-outline" />
          <BedTypeCard type="emergency" label="Emergency Beds" icon="alert-circle-outline" />
        </View>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title={`Update ${editType?.toUpperCase()} Beds`}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalLabel}>Available Beds</Text>
          <View style={styles.counterContainer}>
            <TouchableOpacity 
              style={styles.counterButton}
              onPress={() => setTempValue(Math.max(0, tempValue - 1))}
            >
              <Icon name="remove" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            
            <Text style={styles.counterValue}>{tempValue}</Text>
            
            <TouchableOpacity 
              style={styles.counterButton}
              onPress={() => setTempValue(Math.min(bedAvailability[editType]?.total || 0, tempValue + 1))}
            >
              <Icon name="add" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalHint}>
            Total capacity: {bedAvailability[editType]?.total || 0} beds
          </Text>

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowModal(false)}
              style={{ flex: 1 }}
            />
            <Button
              title="Save"
              onPress={handleSave}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  header: { marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 12, color: COLORS.textSecondary },
  grid: { gap: 12 },
  bedCard: { padding: 16 },
  bedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  bedLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  bedStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bedCount: { fontSize: 28, fontWeight: 'bold' },
  available: { fontSize: 32 },
  total: { fontSize: 20, color: COLORS.textSecondary },
  statusText: { fontSize: 14, fontWeight: '600' },
  progressBar: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', borderRadius: 4 },
  editButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, paddingVertical: 4 },
  editText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  modalContent: { paddingVertical: 10 },
  modalLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  counterContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 24 },
  counterButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  counterValue: { fontSize: 48, fontWeight: 'bold', color: COLORS.text, minWidth: 80, textAlign: 'center' },
  modalHint: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 }
});

export default BedAvailabilityCard;