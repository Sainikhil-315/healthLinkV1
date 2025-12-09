import React from 'react';
import { Polyline } from 'react-native-maps';
import { COLORS } from '../../utils/constants';

const RoutePolyline = ({ coordinates, strokeColor = COLORS.primary, strokeWidth = 4 }) => {
  if (!coordinates || coordinates.length < 2) {
    return null;
  }

  return (
    <Polyline
      coordinates={coordinates}
      strokeColor={strokeColor}
      strokeWidth={strokeWidth}
      lineDashPattern={[1]}
    />
  );
};

export default RoutePolyline;