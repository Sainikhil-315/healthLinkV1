import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import Button from '../../components/common/Button';
import useEmergencyStore from '../../store/emergencyStore';
import locationService from '../../services/locationService';
import {
  COLORS,
  EMERGENCY_TYPES,
  TRIAGE_QUESTIONS,
  SCREENS,
} from '../../utils/constants';

const EmergencySOSScreen = ({ navigation }) => {
  const [emergencyType, setEmergencyType] = useState(null);
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [triageAnswers, setTriageAnswers] = useState({});
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { createEmergency, isCreating, activeEmergency } = useEmergencyStore();

  useEffect(() => {
    if (activeEmergency) {
      navigation.navigate(SCREENS.TRACK_AMBULANCE);
    }
  }, [activeEmergency]);

  const handleSelfEmergency = () => {
    Alert.alert(
      'Confirm Emergency',
      'Are you sure you need immediate medical assistance?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, I need help',
          onPress: () => triggerEmergency(EMERGENCY_TYPES.SELF),
        },
      ],
    );
  };

  const handleBystanderEmergency = () => {
    setEmergencyType(EMERGENCY_TYPES.BYSTANDER);
    setShowTriageModal(true);
  };

  const triggerEmergency = async (type, triage = null) => {
    try {
      setIsGettingLocation(true);

      // Get current location
      const location = await locationService.getCurrentLocation();
      const address = await locationService.getAddressFromCoords(
        location.lat,
        location.lng,
      );

      const emergencyData = {
        type,
        location,
        address: address?.formattedAddress || 'Unknown location',
      };

      if (type === EMERGENCY_TYPES.BYSTANDER && triage) {
        emergencyData.triage = {
          isConscious: triage.conscious,
          isBreathing: triage.breathing,
          isBleeding: triage.bleeding,
        };
      }

      setIsGettingLocation(false);

      const result = await createEmergency(emergencyData);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: '🚨 Emergency Alert Sent',
          text2: 'Ambulance is being dispatched',
        });
        navigation.navigate(SCREENS.TRACK_AMBULANCE);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to create emergency',
          text2: result.error,
        });
      }
    } catch (error) {
      setIsGettingLocation(false);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
      console.error('Emergency creation error:', error);
    }
  };

  const handleTriageSubmit = () => {
    const allAnswered = TRIAGE_QUESTIONS.every(q =>
      triageAnswers.hasOwnProperty(q.id),
    );

    if (!allAnswered) {
      Alert.alert('Incomplete', 'Please answer all questions');
      return;
    }

    setShowTriageModal(false);
    triggerEmergency(EMERGENCY_TYPES.BYSTANDER, triageAnswers);
  };

  const TriageModal = () => (
    <Modal
      visible={showTriageModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowTriageModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Emergency Assessment</Text>
            <TouchableOpacity onPress={() => setShowTriageModal(false)}>
              <Icon name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Answer these questions about the victim:
            </Text>

            {TRIAGE_QUESTIONS.map(question => (
              <View key={question.id} style={styles.questionContainer}>
                <Text style={styles.questionText}>{question.question}</Text>
                <View style={styles.answerButtons}>
                  <TouchableOpacity
                    style={[
                      styles.answerButton,
                      triageAnswers[question.id] === true &&
                        styles.answerButtonSelected,
                    ]}
                    onPress={() =>
                      setTriageAnswers(prev => ({
                        ...prev,
                        [question.id]: true,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.answerButtonText,
                        triageAnswers[question.id] === true &&
                          styles.answerButtonTextSelected,
                      ]}
                    >
                      Yes
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.answerButton,
                      triageAnswers[question.id] === false &&
                        styles.answerButtonSelected,
                    ]}
                    onPress={() =>
                      setTriageAnswers(prev => ({
                        ...prev,
                        [question.id]: false,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.answerButtonText,
                        triageAnswers[question.id] === false &&
                          styles.answerButtonTextSelected,
                      ]}
                    >
                      No
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <Button
              title="Submit & Call Ambulance"
              onPress={handleTriageSubmit}
              style={styles.submitButton}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency SOS</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.warningBox}>
          <Icon name="warning" size={32} color={COLORS.warning} />
          <Text style={styles.warningText}>
            Emergency services will be contacted immediately.{'\n'}
            Only use for real emergencies.
          </Text>
        </View>

        {/* Self Emergency */}
        <TouchableOpacity
          style={styles.emergencyCard}
          onPress={handleSelfEmergency}
          disabled={isCreating || isGettingLocation}
        >
          <View
            style={[
              styles.emergencyIcon,
              { backgroundColor: COLORS.primary + '20' },
            ]}
          >
            <Icon name="person" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.emergencyTitle}>I Need Help</Text>
          <Text style={styles.emergencyDescription}>
            You are experiencing a medical emergency
          </Text>
        </TouchableOpacity>

        {/* Bystander Emergency */}
        <TouchableOpacity
          style={styles.emergencyCard}
          onPress={handleBystanderEmergency}
          disabled={isCreating || isGettingLocation}
        >
          <View
            style={[
              styles.emergencyIcon,
              { backgroundColor: COLORS.warning + '20' },
            ]}
          >
            <Icon name="people" size={48} color={COLORS.warning} />
          </View>
          <Text style={styles.emergencyTitle}>Report Emergency</Text>
          <Text style={styles.emergencyDescription}>
            Someone else needs medical assistance
          </Text>
        </TouchableOpacity>

        {/* Quick Emergency Contacts */}
        <View style={styles.quickContacts}>
          <Text style={styles.quickContactsTitle}>
            Quick Emergency Contacts
          </Text>

          <TouchableOpacity style={styles.contactButton}>
            <Icon name="call" size={24} color={COLORS.primary} />
            <Text style={styles.contactText}>Call 108 (Ambulance)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactButton}>
            <Icon name="call" size={24} color={COLORS.primary} />
            <Text style={styles.contactText}>Call 100 (Police)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactButton}>
            <Icon name="call" size={24} color={COLORS.primary} />
            <Text style={styles.contactText}>Call 101 (Fire)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TriageModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    padding: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  emergencyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
  },
  emergencyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emergencyDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  quickContacts: {
    marginTop: 24,
  },
  quickContactsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contactText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalContent: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  answerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  answerButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  answerButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  answerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  answerButtonTextSelected: {
    color: '#FFFFFF',
  },
  submitButton: {
    marginTop: 8,
  },
});

export default EmergencySOSScreen;
