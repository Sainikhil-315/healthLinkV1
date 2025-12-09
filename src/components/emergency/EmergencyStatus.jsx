import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';

const EmergencyStatus = ({ status, severity, timestamp }) => {
  const getStatusConfig = () => {
    const configs = {
      pending: {
        icon: 'hourglass-outline',
        color: COLORS.warning,
        label: 'Dispatching ambulance...'
      },
      ambulance_dispatched: {
        icon: 'car-outline',
        color: COLORS.info,
        label: 'Ambulance on the way'
      },
      ambulance_arrived: {
        icon: 'checkmark-circle-outline',
        color: COLORS.success,
        label: 'Ambulance arrived'
      },
      patient_picked_up: {
        icon: 'person-outline',
        color: COLORS.primary,
        label: 'Patient picked up'
      },
      en_route_hospital: {
        icon: 'navigate-outline',
        color: COLORS.primary,
        label: 'Heading to hospital'
      },
      reached_hospital: {
        icon: 'medical-outline',
        color: COLORS.success,
        label: 'Reached hospital'
      }
    };

    return configs[status] || configs.pending;
  };

  const getSeverityColor = () => {
    const colors = {
      critical: COLORS.error,
      high: COLORS.warning,
      medium: COLORS.info,
      low: COLORS.success
    };
    return colors[severity?.toLowerCase()] || COLORS.textSecondary;
  };

  const config = getStatusConfig();

  return (
    <View style={styles.container}>
      <View style={[styles.statusBar, { backgroundColor: config.color }]} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: config.color + '20' }]}>
            <Icon name={config.icon} size={24} color={config.color} />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.statusLabel}>{config.label}</Text>
            {timestamp && (
              <Text style={styles.timestamp}>
                {new Date(timestamp).toLocaleTimeString()}
              </Text>
            )}
          </View>
        </View>

        {severity && (
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor() }]}>
            <Text style={styles.severityText}>{severity}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2
  },
  statusBar: {
    height: 4
  },
  content: {
    padding: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  textContainer: {
    flex: 1
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textSecondary
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase'
  }
});

export default EmergencyStatus;