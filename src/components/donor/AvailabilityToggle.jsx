import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';
import Card from '../common/Card';

const AvailabilityToggle = ({ isAvailable, onToggle, lastDonationDate, daysUntilEligible }) => {
  const [loading, setLoading] = useState(false);

  const handleToggle = async (value) => {
    setLoading(true);
    await onToggle(value);
    setLoading(false);
  };

  const getStatusColor = () => {
    return isAvailable ? COLORS.success : COLORS.textSecondary;
  };

  const getStatusText = () => {
    if (daysUntilEligible > 0) {
      return `Not eligible for ${daysUntilEligible} days`;
    }
    return isAvailable ? 'Available for donation' : 'Currently unavailable';
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: getStatusColor() + '20' }]}>
            <Icon 
              name={isAvailable ? "water" : "water-outline"} 
              size={28} 
              color={getStatusColor()} 
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Donation Status</Text>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>
        <Switch
          value={isAvailable}
          onValueChange={handleToggle}
          disabled={loading || daysUntilEligible > 0}
          trackColor={{ false: COLORS.disabled, true: COLORS.success }}
          thumbColor={isAvailable ? '#FFFFFF' : '#f4f3f4'}
        />
      </View>

      {lastDonationDate && (
        <View style={styles.infoBox}>
          <Icon name="calendar-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>
            Last donation: {new Date(lastDonationDate).toLocaleDateString()}
          </Text>
        </View>
      )}

      {daysUntilEligible > 0 && (
        <View style={[styles.infoBox, { backgroundColor: COLORS.warning + '10' }]}>
          <Icon name="time-outline" size={16} color={COLORS.warning} />
          <Text style={[styles.infoText, { color: COLORS.warning }]}>
            You can donate again after {daysUntilEligible} days (90-day gap required)
          </Text>
        </View>
      )}

      {isAvailable && daysUntilEligible === 0 && (
        <View style={[styles.infoBox, { backgroundColor: COLORS.success + '10' }]}>
          <Icon name="checkmark-circle" size={16} color={COLORS.success} />
          <Text style={[styles.infoText, { color: COLORS.success }]}>
            You're eligible and available for blood donation requests
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500'
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18
  }
});

export default AvailabilityToggle;