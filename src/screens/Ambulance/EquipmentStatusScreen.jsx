import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import ambulanceService from '../../services/ambulanceService';
import { COLORS } from '../../utils/constants';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const EquipmentStatusScreen = ({ route, navigation }) => {
  const [equipment, setEquipment] = useState({
    oxygen: false,
    defibrillator: false,
    ventilator: false,
    ecgMachine: false,
    stretcher: false,
    firstAidKit: false,
    fireExtinguisher: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route.params?.profile?.equipment) {
      setEquipment(route.params.profile.equipment);
    }
  }, [route.params]);

  const toggleEquipment = (key) => {
    setEquipment(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    const result = await ambulanceService.updateProfile({ equipment });
    if (result.success) {
      // Update parent state via callback if provided
      if (route.params?.onEquipmentUpdate) {
        route.params.onEquipmentUpdate(equipment);
      }
      Toast.show({
        type: 'success',
        text1: 'Equipment Status Updated',
        text2: 'Your equipment availability has been updated'
      });
      navigation.goBack();
    } else {
      Toast.show({
        type: 'error',
      text1: 'Update Failed',
        text2: result.error
      });
    }
    setLoading(false);
  };

  const equipmentList = [
    { key: 'oxygen', label: 'Oxygen Cylinder', icon: 'flask-outline', critical: true },
    { key: 'stretcher', label: 'Stretcher', icon: 'bed-outline', critical: true },
    { key: 'firstAidKit', label: 'First Aid Kit', icon: 'medical-outline', critical: true },
    { key: 'defibrillator', label: 'Defibrillator', icon: 'pulse-outline', critical: false },
    { key: 'ventilator', label: 'Ventilator', icon: 'speedometer-outline', critical: false },
    { key: 'ecgMachine', label: 'ECG Machine', icon: 'fitness-outline', critical: false },
    { key: 'fireExtinguisher', label: 'Fire Extinguisher', icon: 'flame-outline', critical: true }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Equipment Status</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="information-circle" size={20} color={COLORS.info} />
            <Text style={styles.infoText}>
              Keep your equipment status updated to ensure proper emergency response
            </Text>
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Essential Equipment</Text>
          {equipmentList.filter(e => e.critical).map((item) => (
            <Card key={item.key} style={styles.equipmentCard}>
              <View style={styles.equipmentRow}>
                <View style={styles.equipmentInfo}>
                  <Icon name={item.icon} size={24} color={COLORS.primary} />
                  <Text style={styles.equipmentLabel}>{item.label}</Text>
                </View>
                <Switch
                  value={equipment[item.key]}
                  onValueChange={() => toggleEquipment(item.key)}
                  trackColor={{ false: COLORS.disabled, true: COLORS.success }}
                  thumbColor={equipment[item.key] ? '#FFFFFF' : '#f4f3f4'}
                />
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Equipment</Text>
          {equipmentList.filter(e => !e.critical).map((item) => (
            <Card key={item.key} style={styles.equipmentCard}>
              <View style={styles.equipmentRow}>
                <View style={styles.equipmentInfo}>
                  <Icon name={item.icon} size={24} color={COLORS.secondary} />
                  <Text style={styles.equipmentLabel}>{item.label}</Text>
                </View>
                <Switch
                  value={equipment[item.key]}
                  onValueChange={() => toggleEquipment(item.key)}
                  trackColor={{ false: COLORS.disabled, true: COLORS.success }}
                  thumbColor={equipment[item.key] ? '#FFFFFF' : '#f4f3f4'}
                />
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={loading ? 'Saving...' : 'Save Equipment Status'}
            onPress={handleSave}
            disabled={loading}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.background
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  content: { flex: 1, paddingHorizontal: 20 },
  infoCard: { marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoText: { flex: 1, fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase'
  },
  equipmentCard: { marginBottom: 12 },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  equipmentInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  equipmentLabel: { fontSize: 16, fontWeight: '500', color: COLORS.text },
  buttonContainer: { marginVertical: 20 },
  saveButton: { width: '100%' }
});

export default EquipmentStatusScreen;