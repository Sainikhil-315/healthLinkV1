import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import { apiService } from '../../services/api';
import useAuthStore from '../../store/authStore';
import { COLORS, BLOOD_GROUPS } from '../../utils/constants';
import Header from '../../components/common/Header';
import Loader from '../../components/common/Loader';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

const HealthProfileScreen = ({ navigation }) => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showBloodTypeModal, setShowBloodTypeModal] = useState(false);
  const [showAllergiesModal, setShowAllergiesModal] = useState(false);
  const [showConditionsModal, setShowConditionsModal] = useState(false);
  const [showMedicationsModal, setShowMedicationsModal] = useState(false);

  const [healthData, setHealthData] = useState({
    bloodType: '',
    height: '',
    weight: '',
    allergies: [],
    knownConditions: [],
    knownMedications: []
  });

  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    loadHealthProfile();
  }, []);

  const loadHealthProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserProfile();
      
      if (response.success && response.data.user.healthProfile) {
        setHealthData({
          bloodType: response.data.user.healthProfile.bloodType || '',
          height: response.data.user.healthProfile.height?.toString() || '',
          weight: response.data.user.healthProfile.weight?.toString() || '',
          allergies: response.data.user.healthProfile.allergies || [],
          knownConditions: response.data.user.healthProfile.knownConditions || [],
          knownMedications: response.data.user.healthProfile.knownMedications || []
        });
      }
    } catch (error) {
      console.error('Load health profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const profileData = {
        bloodType: healthData.bloodType,
        height: healthData.height ? parseFloat(healthData.height) : null,
        weight: healthData.weight ? parseFloat(healthData.weight) : null,
        allergies: healthData.allergies,
        knownConditions: healthData.knownConditions,
        knownMedications: healthData.knownMedications
      };

      const response = await apiService.updateHealthProfile(profileData);

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Profile Updated',
          text2: 'Health profile saved successfully'
        });
        
        updateUser({ healthProfile: profileData });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: response.data?.message
        });
      }
    } catch (error) {
      console.error('Save health profile error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save health profile'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddAllergy = () => {
    if (newItem.trim()) {
      setHealthData({
        ...healthData,
        allergies: [...healthData.allergies, newItem.trim()]
      });
      setNewItem('');
      setShowAllergiesModal(false);
    }
  };

  const handleAddCondition = () => {
    if (newItem.trim()) {
      setHealthData({
        ...healthData,
        knownConditions: [...healthData.knownConditions, newItem.trim()]
      });
      setNewItem('');
      setShowConditionsModal(false);
    }
  };

  const handleAddMedication = () => {
    if (newItem.trim()) {
      setHealthData({
        ...healthData,
        knownMedications: [...healthData.knownMedications, newItem.trim()]
      });
      setNewItem('');
      setShowMedicationsModal(false);
    }
  };

  const handleRemoveItem = (type, index) => {
    setHealthData({
      ...healthData,
      [type]: healthData[type].filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return <Loader fullScreen message="Loading health profile..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Health Profile"
        subtitle="Medical information for emergencies"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content}>
        {/* Info Box */}
        <View style={styles.infoBox}>
          <Icon name="shield-checkmark" size={24} color={COLORS.success} />
          <Text style={styles.infoText}>
            This information helps emergency responders provide better care
          </Text>
        </View>

        {/* Basic Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          {/* Blood Type */}
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setShowBloodTypeModal(true)}
          >
            <View style={styles.selectFieldLeft}>
              <Icon name="water" size={20} color={COLORS.error} />
              <Text style={styles.selectFieldLabel}>Blood Type</Text>
            </View>
            <View style={styles.selectFieldRight}>
              <Text style={styles.selectFieldValue}>
                {healthData.bloodType || 'Select'}
              </Text>
              <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>

          <View style={styles.row}>
            <Input
              label="Height (cm)"
              value={healthData.height}
              onChangeText={(text) => setHealthData({ ...healthData, height: text })}
              placeholder="170"
              keyboardType="numeric"
              leftIcon="resize-outline"
              style={{ flex: 1, marginRight: 8 }}
            />
            
            <Input
              label="Weight (kg)"
              value={healthData.weight}
              onChangeText={(text) => setHealthData({ ...healthData, weight: text })}
              placeholder="70"
              keyboardType="numeric"
              leftIcon="fitness-outline"
              style={{ flex: 1, marginLeft: 8 }}
            />
          </View>
        </Card>

        {/* Allergies */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Allergies</Text>
            <TouchableOpacity onPress={() => setShowAllergiesModal(true)}>
              <Icon name="add-circle" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          {healthData.allergies.length > 0 ? (
            healthData.allergies.map((allergy, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemText}>{allergy}</Text>
                <TouchableOpacity onPress={() => handleRemoveItem('allergies', index)}>
                  <Icon name="close-circle" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyListText}>No allergies listed</Text>
          )}
        </Card>

        {/* Known Conditions */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Medical Conditions</Text>
            <TouchableOpacity onPress={() => setShowConditionsModal(true)}>
              <Icon name="add-circle" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          {healthData.knownConditions.length > 0 ? (
            healthData.knownConditions.map((condition, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemText}>{condition}</Text>
                <TouchableOpacity onPress={() => handleRemoveItem('knownConditions', index)}>
                  <Icon name="close-circle" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyListText}>No conditions listed</Text>
          )}
        </Card>

        {/* Medications */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Medications</Text>
            <TouchableOpacity onPress={() => setShowMedicationsModal(true)}>
              <Icon name="add-circle" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          {healthData.knownMedications.length > 0 ? (
            healthData.knownMedications.map((medication, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemText}>{medication}</Text>
                <TouchableOpacity onPress={() => handleRemoveItem('knownMedications', index)}>
                  <Icon name="close-circle" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyListText}>No medications listed</Text>
          )}
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <Button
          title="Save Health Profile"
          onPress={handleSave}
          loading={saving}
        />
      </View>

      {/* Blood Type Modal */}
      <Modal
        visible={showBloodTypeModal}
        onClose={() => setShowBloodTypeModal(false)}
        title="Select Blood Type"
      >
        <View style={styles.bloodTypeGrid}>
          {BLOOD_GROUPS.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.bloodTypeButton,
                healthData.bloodType === type && styles.bloodTypeButtonSelected
              ]}
              onPress={() => {
                setHealthData({ ...healthData, bloodType: type });
                setShowBloodTypeModal(false);
              }}
            >
              <Text style={[
                styles.bloodTypeText,
                healthData.bloodType === type && styles.bloodTypeTextSelected
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Add Allergy Modal */}
      <Modal
        visible={showAllergiesModal}
        onClose={() => {
          setShowAllergiesModal(false);
          setNewItem('');
        }}
        title="Add Allergy"
        footer={
          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => {
                setShowAllergiesModal(false);
                setNewItem('');
              }}
              style={{ flex: 1 }}
            />
            <Button
              title="Add"
              onPress={handleAddAllergy}
              style={{ flex: 1 }}
            />
          </View>
        }
      >
        <Input
          label="Allergy Name"
          value={newItem}
          onChangeText={setNewItem}
          placeholder="e.g., Peanuts, Penicillin"
          autoFocus
        />
      </Modal>

      {/* Add Condition Modal */}
      <Modal
        visible={showConditionsModal}
        onClose={() => {
          setShowConditionsModal(false);
          setNewItem('');
        }}
        title="Add Medical Condition"
        footer={
          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => {
                setShowConditionsModal(false);
                setNewItem('');
              }}
              style={{ flex: 1 }}
            />
            <Button
              title="Add"
              onPress={handleAddCondition}
              style={{ flex: 1 }}
            />
          </View>
        }
      >
        <Input
          label="Condition Name"
          value={newItem}
          onChangeText={setNewItem}
          placeholder="e.g., Diabetes, Asthma"
          autoFocus
        />
      </Modal>

      {/* Add Medication Modal */}
      <Modal
        visible={showMedicationsModal}
        onClose={() => {
          setShowMedicationsModal(false);
          setNewItem('');
        }}
        title="Add Medication"
        footer={
          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => {
                setShowMedicationsModal(false);
                setNewItem('');
              }}
              style={{ flex: 1 }}
            />
            <Button
              title="Add"
              onPress={handleAddMedication}
              style={{ flex: 1 }}
            />
          </View>
        }
      >
        <Input
          label="Medication Name"
          value={newItem}
          onChangeText={setNewItem}
          placeholder="e.g., Aspirin 100mg"
          autoFocus
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: 20 },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.success + '10', padding: 12, borderRadius: 8, marginBottom: 20, gap: 12 },
  infoText: { flex: 1, fontSize: 13, color: COLORS.success, lineHeight: 18 },
  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  selectField: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background, padding: 16, borderRadius: 8, marginBottom: 16 },
  selectFieldLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectFieldLabel: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  selectFieldRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectFieldValue: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  row: { flexDirection: 'row' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background, padding: 12, borderRadius: 8, marginBottom: 8 },
  listItemText: { flex: 1, fontSize: 14, color: COLORS.text },
  emptyListText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 16 },
  bloodTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 10 },
  bloodTypeButton: { width: '22%', paddingVertical: 16, borderRadius: 8, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center' },
  bloodTypeButtonSelected: { backgroundColor: COLORS.error, borderColor: COLORS.error },
  bloodTypeText: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  bloodTypeTextSelected: { color: '#FFFFFF' },
  saveButtonContainer: { padding: 20, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.border },
  modalActions: { flexDirection: 'row', gap: 12 }
});

export default HealthProfileScreen;