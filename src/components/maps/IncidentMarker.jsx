import React from 'react';
import { Marker } from 'react-native-maps';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';

const IncidentMarker = ({ 
  coordinate, 
  severity = 'medium',
  title = 'Emergency Location',
  description,
  onPress 
}) => {
  const getSeverityColor = () => {
    const colors = {
      critical: COLORS.error,
      high: COLORS.warning,
      medium: COLORS.info,
      low: COLORS.success
    };
    return colors[severity.toLowerCase()] || COLORS.primary;
  };

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      onPress={onPress}
    >
      <View style={styles.marker}>
        <View style={[styles.pulse, { backgroundColor: getSeverityColor() }]} />
        <View style={[styles.innerCircle, { backgroundColor: getSeverityColor() }]}>
          <Icon name="alert-circle" size={28} color="#FFFFFF" />
        </View>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  marker: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  pulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.3
  },
  innerCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4
  }
});

export default IncidentMarker;