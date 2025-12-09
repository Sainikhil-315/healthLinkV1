import React from 'react';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';
import { MAP_CONFIG } from '../../utils/constants';

const CustomMapView = ({
  children,
  initialRegion,
  onRegionChange,
  showsUserLocation = true,
  showsMyLocationButton = true,
  style,
  ...props
}) => {
  const defaultRegion = initialRegion || MAP_CONFIG.DEFAULT_REGION;

  return (
    <View style={[styles.container, style]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={defaultRegion}
        onRegionChange={onRegionChange}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={showsMyLocationButton}
        showsTraffic={false}
        showsBuildings={true}
        {...props}
      >
        {children}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden'
  },
  map: {
    flex: 1
  }
});

export default CustomMapView;