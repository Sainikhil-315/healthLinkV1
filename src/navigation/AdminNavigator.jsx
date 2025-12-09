import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';

import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import VerifyVolunteersScreen from '../screens/Admin/VerifyVolunteersScreen';
import ManageHospitalsScreen from '../screens/Admin/ManageHospitalsScreen';
import AnalyticsScreen from '../screens/Admin/AnalyticsScreen';
import { COLORS } from '../utils/constants';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={AdminDashboardScreen} />
    <Stack.Screen name="VerifyVolunteers" component={VerifyVolunteersScreen} />
    <Stack.Screen name="ManageHospitals" component={ManageHospitalsScreen} />
  </Stack.Navigator>
);

const AdminNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Verify') {
            iconName = focused ? 'checkmark-done-circle' : 'checkmark-done-circle-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
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
        component={DashboardStack}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Verify" 
        component={VerifyVolunteersScreen}
        options={{
          tabBarLabel: 'Verify',
          tabBarBadgeStyle: { backgroundColor: COLORS.warning }
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
      />
    </Tab.Navigator>
  );
};

export default AdminNavigator;