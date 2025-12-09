import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';
import Card from '../common/Card';

const AdminStatsCard = ({ icon, label, value, trend, trendValue, color = COLORS.primary }) => {
  return (
    <Card style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={28} color={color} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
        
        {trend && (
          <View style={styles.trendContainer}>
            <Icon 
              name={trend === 'up' ? 'trending-up' : 'trending-down'} 
              size={14} 
              color={trend === 'up' ? COLORS.success : COLORS.error} 
            />
            <Text style={[
              styles.trendText, 
              { color: trend === 'up' ? COLORS.success : COLORS.error }
            ]}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { 
    alignItems: 'center', 
    paddingVertical: 20,
    flex: 1,
    minWidth: 150
  },
  iconContainer: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  content: { alignItems: 'center' },
  value: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: COLORS.text, 
    marginBottom: 4 
  },
  label: { 
    fontSize: 13, 
    color: COLORS.textSecondary, 
    textAlign: 'center' 
  },
  trendContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    marginTop: 6 
  },
  trendText: { fontSize: 12, fontWeight: '600' }
});

export default AdminStatsCard;