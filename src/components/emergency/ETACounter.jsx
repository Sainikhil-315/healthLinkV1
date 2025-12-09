import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';

const ETACounter = ({ initialETA, label = 'Ambulance arriving in', icon = 'time-outline' }) => {
  const [eta, setEta] = useState(initialETA);

  useEffect(() => {
    if (!eta || eta <= 0) return;

    const interval = setInterval(() => {
      setEta(prev => {
        const newEta = prev - 1;
        return newEta > 0 ? newEta : 0;
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [eta]);

  useEffect(() => {
    setEta(initialETA);
  }, [initialETA]);

  const formatETA = (minutes) => {
    if (minutes === 0) return 'Arriving soon';
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = () => {
    if (eta <= 5) return COLORS.success;
    if (eta <= 15) return COLORS.warning;
    return COLORS.info;
  };

  return (
    <View style={[styles.container, { borderLeftColor: getStatusColor() }]}>
      <View style={styles.iconContainer}>
        <Icon name={icon} size={32} color={getStatusColor()} />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.eta, { color: getStatusColor() }]}>
          {formatETA(eta)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2
  },
  iconContainer: {
    marginRight: 16
  },
  textContainer: {
    flex: 1
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4
  },
  eta: {
    fontSize: 24,
    fontWeight: 'bold'
  }
});

export default ETACounter;e