import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';

const AcceptMissionButton = ({ onAccept, disabled = false }) => {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    await onAccept();
    setLoading(false);
  };

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <Icon name="medkit" size={20} color="#FFFFFF" />
          <Text style={styles.text}>Accept Mission</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  disabled: {
    backgroundColor: COLORS.disabled,
    opacity: 0.6
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  }
});

export default AcceptMissionButton;