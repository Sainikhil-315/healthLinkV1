import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import DonorDashboardScreen from '../screens/Donor/DonorDashboardScreen';
import RequestsListScreen from '../screens/Donor/RequestsListScreen';
import DonationLogScreen from '../screens/Donor/DonationLogScreen';
import ProfileScreen from '../screens/User/ProfileScreen';
import { COLORS } from '../utils/constants';

const Tab = createBottomTabNavigator();

const DonorNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Requests') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.error,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8
        }
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={DonorDashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Requests" 
        component={RequestsListScreen}
        options={{
          tabBarLabel: 'Requests',
          tabBarBadgeStyle: { backgroundColor: COLORS.error }
        }}
      />
      <Tab.Screen 
        name="History" 
        component={DonationLogScreen}
        options={{ tabBarLabel: 'Donations' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
};

export default DonorNavigator;