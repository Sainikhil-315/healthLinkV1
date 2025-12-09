import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../utils/constants';

const Card = ({ 
  children, 
  style, 
  onPress, 
  elevated = true,
  padding = true 
}) => {
  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container
      style={[
        styles.card,
        elevated && styles.elevated,
        padding && styles.padding,
        style
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden'
  },
  elevated: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  padding: {
    padding: 16
  }
});

export default Card;