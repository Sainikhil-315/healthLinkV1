import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import { COLORS } from '../../utils/constants';
import Card from '../common/Card';
import Modal from '../common/Modal';
import Button from '../common/Button';

const BedAvailabilityCard = ({ bedAvailability, onUpdate }) => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedBedType, setSelectedBedType] = useState('general');
  const [updateMode, setUpdateMode] = useState('direct'); // 'direct', 'admit', 'discharge', 'add_capacity'
  const [bedCount, setBedCount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const occupied = beds.total - beds.available;

    return (
      <Card style={styles.bedCard}>
        <View style={styles.bedHeader}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Icon name={icon} size={24} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bedLabel}>{label}</Text>
            <Text style={styles.occupiedText}>
              {occupied} occupied • {beds.available} free
            </Text>
          </View>
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
      </Card>
    );
  };

  const getModeConfig = () => {
    const currentBeds = bedAvailability[selectedBedType] || { available: 0, total: 0 };
    
    switch (updateMode) {
      case 'direct':
        return {
          title: 'Set Available Beds',
          placeholder: `Enter available beds (max: ${currentBeds.total})`,
          description: 'Directly set the number of available beds',
          icon: 'create-outline',
          color: COLORS.primary
        };
      case 'admit':
        return {
          title: 'Admit Patients',
          placeholder: `Enter number of patients (max: ${currentBeds.available})`,
          description: 'Reduce available beds when patients are admitted',
          icon: 'person-add-outline',
          color: COLORS.error
        };
      case 'discharge':
        return {
          title: 'Discharge Patients',
          placeholder: `Enter number of patients (max: ${currentBeds.total - currentBeds.available})`,
          description: 'Increase available beds when patients are discharged',
          icon: 'person-remove-outline',
          color: COLORS.success
        };
      case 'add_capacity':
        return {
          title: 'Add Bed Capacity',
          placeholder: 'Enter number of beds to add',
          description: 'Increase total hospital capacity (adds new beds)',
          icon: 'add-circle-outline',
          color: COLORS.warning
        };
      default:
        return {};
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const config = getModeConfig();
    const currentBeds = bedAvailability[selectedBedType] || { available: 0, total: 0 };

    // Validate input
    if (!bedCount || bedCount.trim() === '') {
      Toast.show({ 
        type: 'error', 
        text1: 'Invalid input', 
        text2: 'Please enter a number' 
      });
      return;
    }

    const count = parseInt(bedCount, 10);
    if (isNaN(count) || count < 1) {
      Toast.show({ 
        type: 'error', 
        text1: 'Invalid input', 
        text2: 'Enter a valid positive number' 
      });
      return;
    }

    let newAvailable, newTotal;

    // Calculate new values based on mode
    switch (updateMode) {
      case 'direct':
        if (count > currentBeds.total) {
          Toast.show({ 
            type: 'error', 
            text1: 'Invalid count', 
            text2: `Cannot exceed total capacity of ${currentBeds.total} beds` 
          });
          return;
        }
        newAvailable = count;
        newTotal = currentBeds.total;
        break;

      case 'admit':
        if (count > currentBeds.available) {
          Toast.show({ 
            type: 'error', 
            text1: 'Insufficient beds', 
            text2: `Only ${currentBeds.available} beds available` 
          });
          return;
        }
        newAvailable = currentBeds.available - count;
        newTotal = currentBeds.total;
        break;

      case 'discharge':
        const occupied = currentBeds.total - currentBeds.available;
        if (count > occupied) {
          Toast.show({ 
            type: 'error', 
            text1: 'Invalid count', 
            text2: `Only ${occupied} beds are occupied` 
          });
          return;
        }
        newAvailable = currentBeds.available + count;
        newTotal = currentBeds.total;
        break;

      case 'add_capacity':
        newAvailable = currentBeds.available + count;
        newTotal = currentBeds.total + count;
        break;

      default:
        return;
    }

    console.log('=== Bed Update Debug ===');
    console.log('Mode:', updateMode);
    console.log('Bed type:', selectedBedType);
    console.log('Input count:', count);
    console.log('Current:', currentBeds);
    console.log('New available:', newAvailable);
    console.log('New total:', newTotal);
    console.log('========================');

    try {
      setIsSubmitting(true);
      await onUpdate(selectedBedType, newAvailable, newTotal);
      
      setShowUpdateModal(false);
      setBedCount('');
      setUpdateMode('direct');
      
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Toast.show({ 
        type: 'error', 
        text1: 'Update failed', 
        text2: 'An error occurred while updating beds' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    if (!isSubmitting) {
      setShowUpdateModal(false);
      setBedCount('');
      setUpdateMode('direct');
    }
  };

  const config = getModeConfig();

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Bed Availability</Text>
          <Text style={styles.subtitle}>
            Last updated: {new Date(bedAvailability.lastUpdated).toLocaleTimeString()}
          </Text>
        </View>

        {/* Update Beds Button */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Button
            title="Manage Beds"
            onPress={() => setShowUpdateModal(true)}
            style={{ width: 180 }}
          />
        </View>

        <View style={styles.grid}>
          <BedTypeCard type="general" label="General Beds" icon="bed-outline" />
          <BedTypeCard type="icu" label="ICU Beds" icon="pulse-outline" />
          <BedTypeCard type="emergency" label="Emergency Beds" icon="alert-circle-outline" />
        </View>
      </View>

      {/* Modal for Bed Management */}
      <Modal visible={showUpdateModal} onClose={handleModalClose}>
        <View style={{ padding: 20, maxWidth: 400 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: COLORS.text }}>
            Manage Beds
          </Text>
          
          {/* Bed Type Selection */}
          <Text style={styles.label}>Bed Type:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedBedType}
              onValueChange={itemValue => setSelectedBedType(itemValue)}
              style={{ height: 48, width: '100%' }}
              enabled={!isSubmitting}
            >
              <Picker.Item label="General Beds" value="general" />
              <Picker.Item label="ICU Beds" value="icu" />
              <Picker.Item label="Emergency Beds" value="emergency" />
            </Picker>
          </View>

          {/* Update Mode Selection */}
          <Text style={styles.label}>Action:</Text>
          <View style={styles.modeGrid}>
            <TouchableOpacity
              style={[styles.modeButton, updateMode === 'direct' && styles.modeButtonActive]}
              onPress={() => setUpdateMode('direct')}
              disabled={isSubmitting}
            >
              <Icon name="create-outline" size={24} color={updateMode === 'direct' ? COLORS.primary : COLORS.textSecondary} />
              <Text style={[styles.modeButtonText, updateMode === 'direct' && styles.modeButtonTextActive]}>
                Set Direct
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, updateMode === 'admit' && styles.modeButtonActive]}
              onPress={() => setUpdateMode('admit')}
              disabled={isSubmitting}
            >
              <Icon name="person-add-outline" size={24} color={updateMode === 'admit' ? COLORS.error : COLORS.textSecondary} />
              <Text style={[styles.modeButtonText, updateMode === 'admit' && styles.modeButtonTextActive]}>
                Admit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, updateMode === 'discharge' && styles.modeButtonActive]}
              onPress={() => setUpdateMode('discharge')}
              disabled={isSubmitting}
            >
              <Icon name="person-remove-outline" size={24} color={updateMode === 'discharge' ? COLORS.success : COLORS.textSecondary} />
              <Text style={[styles.modeButtonText, updateMode === 'discharge' && styles.modeButtonTextActive]}>
                Discharge
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, updateMode === 'add_capacity' && styles.modeButtonActive]}
              onPress={() => setUpdateMode('add_capacity')}
              disabled={isSubmitting}
            >
              <Icon name="add-circle-outline" size={24} color={updateMode === 'add_capacity' ? COLORS.warning : COLORS.textSecondary} />
              <Text style={[styles.modeButtonText, updateMode === 'add_capacity' && styles.modeButtonTextActive]}>
                Add Beds
              </Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={[styles.descriptionBox, { backgroundColor: config.color + '15', borderColor: config.color + '40' }]}>
            <Icon name={config.icon} size={20} color={config.color} />
            <Text style={[styles.descriptionText, { color: config.color }]}>
              {config.description}
            </Text>
          </View>

          {/* Number Input */}
          <Text style={styles.label}>{config.title}:</Text>
          <View style={{ marginBottom: 20 }}>
            <TextInput
              value={bedCount}
              onChangeText={setBedCount}
              keyboardType="numeric"
              placeholder={config.placeholder}
              editable={!isSubmitting}
              style={styles.input}
            />
          </View>
          
          <Button
            title={isSubmitting ? "Updating..." : "Submit"}
            onPress={handleSubmit}
            disabled={isSubmitting}
          />
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
  bedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  bedLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  occupiedText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  bedStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bedCount: { fontSize: 28, fontWeight: 'bold' },
  available: { fontSize: 32 },
  total: { fontSize: 20, color: COLORS.textSecondary },
  statusText: { fontSize: 14, fontWeight: '600' },
  progressBar: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 4 },
  pickerContainer: { 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 8,
    backgroundColor: COLORS.surface
  },
  modeGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10, 
    marginBottom: 16 
  },
  modeButton: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface
  },
  modeButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10'
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary
  },
  modeButtonTextActive: {
    color: COLORS.primary
  },
  descriptionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1
  },
  descriptionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500'
  },
  input: { 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16, 
    width: '100%',
    backgroundColor: COLORS.surface,
    color: COLORS.text
  }
});

export default BedAvailabilityCard;