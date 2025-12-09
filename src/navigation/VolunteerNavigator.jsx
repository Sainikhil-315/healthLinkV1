import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import VolunteerDashboardScreen from '../screens/Volunteer/VolunteerDashboardScreen';
import NearbyEmergenciesScreen from '../screens/Volunteer/NearbyEmergenciesScreen';
import MissionHistoryScreen from '../screens/Volunteer/MissionHistoryScreen';
import ProfileScreen from '../screens/User/ProfileScreen';
import { COLORS } from '../utils/constants';

const Tab = createBottomTabNavigator();

const VolunteerNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Emergencies') {
            iconName = focused ? 'alert-circle' : 'alert-circle-outline';
          } else if (route.name === 'Missions') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.secondary,
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
        component={VolunteerDashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Emergencies" 
        component={NearbyEmergenciesScreen}
        options={{
          tabBarLabel: 'Nearby',
          tabBarBadgeStyle: { backgroundColor: COLORS.error }
        }}
      />
      <Tab.Screen 
        name="Missions" 
        component={MissionHistoryScreen}
        options={{ tabBarLabel: 'History' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
};

export default VolunteerNavigator;