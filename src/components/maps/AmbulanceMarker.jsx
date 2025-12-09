import React from 'react';
import { Marker } from 'react-native-maps';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';

const AmbulanceMarker = ({ 
  coordinate, 
  title = 'Ambulance', 
  description,
  onPress 
}) => {
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      onPress={onPress}
    >
      <View style={styles.marker}>
        <View style={styles.innerCircle}>
          <Icon name="medical" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.shadow} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  marker: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  innerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  shadow: {
    position: 'absolute',
    bottom: -5,
    width: 30,
    height: 5,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.2)'
  }
});

export default AmbulanceMarker;