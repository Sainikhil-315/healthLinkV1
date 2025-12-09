import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import usePermissions from '../../hooks/usePermissions';
import { COLORS } from '../../utils/constants';

const PermissionsScreen = ({ navigation, route }) => {
  const { onComplete } = route.params || {};
  const { 
    permissions, 
    requestLocation, 
    requestNotification,
    requestAll 
  } = usePermissions();
  
  const [currentStep, setCurrentStep] = useState(0);

  const permissionSteps = [
    {
      id: 'location',
      title: 'Location Access',
      description: 'We need your location to send ambulances to you during emergencies and find nearby hospitals.',
      icon: 'location',
      color: COLORS.primary,
      request: requestLocation
    },
    {
      id: 'notification',
      title: 'Notifications',
      description: 'Get instant alerts when ambulance is dispatched, status updates, and emergency notifications.',
      icon: 'notifications',
      color: COLORS.warning,
      request: requestNotification
    }
  ];

  const currentPermission = permissionSteps[currentStep];

  const handleAllow = async () => {
    const granted = await currentPermission.request();
    
    if (granted || currentStep < permissionSteps.length - 1) {
      if (currentStep < permissionSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handleSkip = () => {
    if (currentStep < permissionSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    } else {
      navigation.replace('Main');
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {permissionSteps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index <= currentStep && styles.progressDotActive
            ]}
          />
        ))}
      </View>

      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: currentPermission.color + '20' }]}>
        <Icon 
          name={currentPermission.icon} 
          size={80} 
          color={currentPermission.color} 
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{currentPermission.title}</Text>
        <Text style={styles.description}>{currentPermission.description}</Text>

        {/* Why we need this */}
        <View style={styles.reasonsContainer}>
          <Text style={styles.reasonsTitle}>Why we need this:</Text>
          {currentPermission.id === 'location' ? (
            <>
              <View style={styles.reasonItem}>
                <Icon name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.reasonText}>Send ambulance to your exact location</Text>
              </View>
              <View style={styles.reasonItem}>
                <Icon name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.reasonText}>Find nearest hospitals with available beds</Text>
              </View>
              <View style={styles.reasonItem}>
                <Icon name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.reasonText}>Connect you with nearby CPR-trained volunteers</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.reasonItem}>
                <Icon name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.reasonText}>Real-time ambulance status updates</Text>
              </View>
              <View style={styles.reasonItem}>
                <Icon name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.reasonText}>Emergency alerts and critical notifications</Text>
              </View>
              <View style={styles.reasonItem}>
                <Icon name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.reasonText}>Important health updates</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.allowButton}
          onPress={handleAllow}
        >
          <Text style={styles.allowButtonText}>Allow</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipButtonText}>
            {currentStep < permissionSteps.length - 1 ? 'Skip' : 'Maybe Later'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Privacy Note */}
      <View style={styles.privacyNote}>
        <Icon name="shield-checkmark" size={16} color={COLORS.success} />
        <Text style={styles.privacyText}>
          Your privacy is protected. We only use this when you need emergency help.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border
  },
  progressDotActive: {
    width: 24,
    backgroundColor: COLORS.primary
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 40
  },
  content: {
    flex: 1
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32
  },
  reasonsContainer: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16
  },
  reasonsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20
  },
  actions: {
    gap: 12,
    marginBottom: 16
  },
  allowButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  allowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center'
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center'
  }
});

export default PermissionsScreen;