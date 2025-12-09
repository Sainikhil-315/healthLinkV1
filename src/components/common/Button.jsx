import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/constants';

const Button = ({ 
  title, 
  onPress, 
  loading = false, 
  disabled = false, 
  variant = 'primary',
  size = 'medium',
  icon,
  style,
  textStyle
}) => {
  const getBackgroundColor = () => {
    if (disabled) return COLORS.disabled;
    
    switch (variant) {
      case 'primary':
        return COLORS.primary;
      case 'secondary':
        return COLORS.secondary;
      case 'danger':
        return COLORS.error;
      case 'outline':
        return 'transparent';
      default:
        return COLORS.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return COLORS.textSecondary;
    return variant === 'outline' ? COLORS.primary : '#FFFFFF';
  };

  const getBorderStyle = () => {
    if (variant === 'outline') {
      return {
        borderWidth: 2,
        borderColor: disabled ? COLORS.disabled : COLORS.primary
      };
    }
    return {};
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 32 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24 };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        getBorderStyle(),
        getSizeStyle(),
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
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
    borderRadius: 8,
    minHeight: 48
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
  icon: {
    marginRight: 8,
    fontSize: 20
  }
});

export default Button;