import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';

const Header = ({ 
  title, 
  subtitle,
  onBackPress, 
  rightIcon, 
  onRightPress,
  backgroundColor = COLORS.background,
  showBack = true
}) => {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.leftSection}>
        {showBack && onBackPress && (
          <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
            <Icon name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.centerSection}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        )}
      </View>

      <View style={styles.rightSection}>
        {rightIcon && onRightPress && (
          <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
            <Icon name={rightIcon} size={24} color={COLORS.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start'
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end'
  },
  iconButton: {
    padding: 8
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2
  }
});

export default Header;