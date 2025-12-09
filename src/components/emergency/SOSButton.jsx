import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';

const SOSButton = ({ onPress, disabled = false }) => {
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.outerRing,
          {
            transform: [{ scale: pulseAnim }],
            opacity: pulseAnim.interpolate({
              inputRange: [1, 1.1],
              outputRange: [0.3, 0]
            })
          }
        ]}
      />
      
      <TouchableOpacity
        style={[styles.button, disabled && styles.disabled]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Icon name="alert-circle" size={64} color="#FFFFFF" />
        </View>
        <Text style={styles.buttonText}>EMERGENCY</Text>
        <Text style={styles.subText}>Tap for help</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  outerRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: COLORS.primary,
    zIndex: 0
  },
  button: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    zIndex: 1
  },
  disabled: {
    backgroundColor: COLORS.disabled,
    opacity: 0.6
  },
  iconContainer: {
    marginBottom: 8
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4
  },
  subText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4
  }
});

export default SOSButton;