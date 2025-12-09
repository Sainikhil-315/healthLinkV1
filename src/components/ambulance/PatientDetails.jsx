import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';
import Card from '../common/Card';

const PatientDetails = ({ patient, triage, bloodRequired }) => {
  const renderInfoRow = (icon, label, value, color = COLORS.text) => (
    <View style={styles.infoRow}>
      <Icon name={icon} size={20} color={COLORS.textSecondary} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, { color }]}>{value || 'Not specified'}</Text>
      </View>
    </View>
  );

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Patient Information</Text>

      <ScrollView style={styles.content}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Details</Text>
          {renderInfoRow('person', 'Name', patient?.name)}
          {renderInfoRow('calendar', 'Age', patient?.age ? `${patient.age} years` : null)}
          {renderInfoRow('male-female', 'Gender', patient?.gender)}
          
          {patient?.bloodType && (
            <View style={styles.bloodTypeContainer}>
              <Icon name="water" size={20} color={COLORS.error} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Blood Type</Text>
                <View style={styles.bloodTypeBadge}>
                  <Text style={styles.bloodTypeText}>{patient.bloodType}</Text>
                  {bloodRequired && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentText}>NEEDED</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Medical History */}
        {(patient?.knownConditions?.length > 0 || patient?.knownMedications?.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical History</Text>
            
            {patient.knownConditions?.length > 0 && (
              <View style={styles.listContainer}>
                <Text style={styles.listLabel}>Known Conditions:</Text>
                {patient.knownConditions.map((condition, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listText}>{condition}</Text>
                  </View>
                ))}
              </View>
            )}

            {patient.knownMedications?.length > 0 && (
              <View style={styles.listContainer}>
                <Text style={styles.listLabel}>Current Medications:</Text>
                {patient.knownMedications.map((medication, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listText}>{medication}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Triage Assessment */}
        {triage && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scene Assessment</Text>
            <View style={styles.triageGrid}>
              <View style={styles.triageItem}>
                <View style={[styles.triageIcon, triage.isConscious ? styles.positive : styles.negative]}>
                  <Icon 
                    name={triage.isConscious ? "checkmark" : "close"} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </View>
                <Text style={styles.triageLabel}>Conscious</Text>
              </View>

              <View style={styles.triageItem}>
                <View style={[styles.triageIcon, triage.isBreathing ? styles.positive : styles.negative]}>
                  <Icon 
                    name={triage.isBreathing ? "checkmark" : "close"} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </View>
                <Text style={styles.triageLabel}>Breathing</Text>
              </View>

              <View style={styles.triageItem}>
                <View style={[styles.triageIcon, !triage.hasHeavyBleeding ? styles.positive : styles.negative]}>
                  <Icon 
                    name={!triage.hasHeavyBleeding ? "checkmark" : "close"} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </View>
                <Text style={styles.triageLabel}>No Heavy Bleeding</Text>
              </View>
            </View>
          </View>
        )}

        {/* Emergency Notes */}
        <View style={styles.warningBox}>
          <Icon name="warning" size={20} color={COLORS.warning} />
          <Text style={styles.warningText}>
            Ensure patient vitals are monitored continuously during transport
          </Text>
        </View>
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  content: { maxHeight: 400 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '500' },
  bloodTypeContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  bloodTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bloodTypeText: { fontSize: 18, fontWeight: 'bold', color: COLORS.error },
  urgentBadge: { backgroundColor: COLORS.error, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  urgentText: { fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' },
  listContainer: { marginBottom: 12 },
  listLabel: { fontSize: 13, fontWeight: '500', color: COLORS.text, marginBottom: 6 },
  listItem: { flexDirection: 'row', marginBottom: 4, paddingLeft: 8 },
  bullet: { fontSize: 14, color: COLORS.textSecondary, marginRight: 8 },
  listText: { flex: 1, fontSize: 14, color: COLORS.text },
  triageGrid: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: COLORS.background, padding: 16, borderRadius: 12 },
  triageItem: { alignItems: 'center', gap: 8 },
  triageIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  positive: { backgroundColor: COLORS.success },
  negative: { backgroundColor: COLORS.error },
  triageLabel: { fontSize: 12, color: COLORS.text, textAlign: 'center', maxWidth: 80 },
  warningBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.warning + '20', padding: 12, borderRadius: 8, gap: 10 },
  warningText: { flex: 1, fontSize: 13, color: COLORS.warning, lineHeight: 18 }
});

export default PatientDetails;